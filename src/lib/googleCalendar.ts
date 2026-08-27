import { google } from 'googleapis';
import { ClientProfile } from './types/cooking-ops';
import { getWeekBounds, getParisDateTimeInfo } from './dateUtils';

export interface CalendarBookingMatch {
    gcalEventId: string;
    eventTitle: string;
    startDateTime: string;
    dateIso: string; // "YYYY-MM-DD" in local Paris time
    dayLabel: string; // e.g. "Lundi", "Mardi"
    dayNumber: number; // e.g. 17, 18
    monthName: string; // e.g. "août"
    timeSlot: 'Matin' | 'Après-midi';
    formattedSlot: string; // e.g. "Lundi Matin", "Mardi Après-midi"
    weekOffset: number; // offset in weeks
    extractedName: string | null;
    extractedQuota: number | null;
    extractedPeopleCount: number | null;
    matchedClient: ClientProfile | null;
    isNewClientDetected: boolean;
    isAnonymousSession: boolean;
    isBlockIgnored: boolean;
}

/**
 * Normalizes text for robust matching (lowercase, removes accents, punctuation, extra spaces).
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Checks if an event is strictly an internal calendar block (e.g. "Bloc", "Indispo", "Vacances").
 * Non-aggressive: Never blocks bookings like "Rencontre Chef à Domicile" or events with client names.
 */
export function isInternalBlock(title: string): boolean {
    if (!title) return false;
    const clean = normalizeString(title);

    // Only block strictly personal blocks or unavailability
    const strictBlockKeywords = [
        'bloc', 'bloque', 'indispo', 'indisponible', 
        'vacances', 'conges', 'fermeture', 'non dispo', 'off'
    ];

    // 1. Exact match
    if (strictBlockKeywords.includes(clean)) return true;

    // 2. Starts with block keyword (e.g. "Bloc - Perso", "Indispo toute la journée")
    const startsWithBlock = strictBlockKeywords.some(kw => 
        clean.startsWith(`${kw} `) || clean.startsWith(`${kw}:`) || clean.startsWith(`${kw}-`)
    );
    if (startsWithBlock) return true;

    return false;
}

/**
 * Extracts dish count / quota from text like "5 recettes, 2 personnes", "4 plats", "5p", "4r".
 */
export function extractQuotaFromText(text: string): number | null {
    if (!text) return null;

    // 1. Explicit keyword match e.g. "5 recettes", "4 plats", "5 repas", "5 portions"
    const match = text.match(/(\d+)\s*(recettes?|plats?|repas|portions?)/i);
    if (match && match[1]) {
        const count = parseInt(match[1], 10);
        if (count >= 1 && count <= 8) return count;
    }

    // 2. Short suffix match e.g. "5r" (5 recettes)
    const matchShortR = text.match(/\b(\d+)\s*r\b/i);
    if (matchShortR && matchShortR[1]) {
        const count = parseInt(matchShortR[1], 10);
        if (count >= 1 && count <= 8) return count;
    }

    return null;
}

/**
 * Extracts household person count from text like "2 personnes", "4 pers", "1 personne", "4pax", "2p".
 */
export function extractPeopleCountFromText(text: string): number | null {
    if (!text) return null;

    // 1. Explicit keyword match e.g. "2 personnes", "4 pers", "4 pax"
    const match = text.match(/(\d+)\s*(personnes?|pers|pax)/i);
    if (match && match[1]) {
        const count = parseInt(match[1], 10);
        if (count >= 1 && count <= 12) return count;
    }

    // 2. Short suffix match e.g. "4p"
    const matchShortP = text.match(/\b(\d+)\s*p\b/i);
    if (matchShortP && matchShortP[1]) {
        const count = parseInt(matchShortP[1], 10);
        if (count >= 1 && count <= 12) return count;
    }

    return null;
}

/**
 * Extracts client name from event title like:
 * - "Rencontre Chef à Domicile (Adrien Mikaeloff)" -> "Adrien Mikaeloff"
 * - "Thibault 5 recettes, 2 personnes" -> "Thibault"
 * - "Romain & Amélie 14h" -> "Romain & Amélie"
 */
export function extractClientNameFromTitle(title: string): string | null {
    if (!title || isInternalBlock(title)) return null;

    const cleaned = title
        // Remove common event prefixes (including automation prefixes)
        .replace(/rencontre\s*chef\s*(\u00e0|a)?\s*domicile/gi, '')
        .replace(/rencontre\s*chef/gi, '')
        .replace(/s\u00e9ance\s*d\u00e9couverte/gi, '')
        .replace(/seance\s*decouverte/gi, '')
        .replace(/r\u00e9servation/gi, '')
        .replace(/reservation/gi, '')
        .replace(/rendez-vous/gi, '')
        .replace(/rdv/gi, '')
        .replace(/prestation/gi, '')
        .replace(/batch\s*cooking/gi, '')
        .replace(/s\u00e9ance/gi, '')
        .replace(/seance/gi, '')
        .replace(/cuisine\s*chez/gi, '')
        .replace(/chez/gi, '')
        // Remove quotas & quantities (longer words FIRST to prevent substring chopping!)
        .replace(/\d+\s*(personnes?|portions?|recettes?|plats?|repas|pax|\bpers\b|\bp\b|\br\b)/gi, '')
        .replace(/\d+h\d*/gi, '') // Removes "14h" or "14h30"
        // Remove punctuation, parentheses, brackets, etc.
        .replace(/[\(\)\[\]\,\-\:\;\/\&\|\@]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned || /^[\d\s]+$/.test(cleaned) || cleaned.length < 2) {
        return null;
    }

    return cleaned
        .split(' ')
        .filter(w => w.length > 0)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Robust hierarchical matching between a calendar event summary and existing client profiles.
 * 1. Exact full name match
 * 2. Multi-token match
 * 3. First name + Last initial match
 * 4. Unique First Name match (e.g. "Quentin" -> finds Quentin, "Lucas" -> finds Lucas or disambiguates)
 */
export function matchEventToClient(summary: string, clients: ClientProfile[] = []): ClientProfile | null {
    if (!summary || isInternalBlock(summary) || !Array.isArray(clients) || clients.length === 0) {
        return null;
    }

    const cleanSummary = normalizeString(summary);
    const extractedName = extractClientNameFromTitle(summary);
    const cleanExtracted = extractedName ? normalizeString(extractedName) : '';

    // 1. Exact Full Name Match (e.g. "Adrien Mikaeloff" === "Adrien Mikaeloff")
    for (const client of clients) {
        const clientClean = normalizeString(client.name);
        if (cleanExtracted && clientClean === cleanExtracted) {
            return client;
        }
        if (cleanSummary === clientClean || 
            cleanSummary.includes(` ${clientClean} `) || 
            cleanSummary.startsWith(`${clientClean} `) || 
            cleanSummary.endsWith(` ${clientClean}`)) {
            return client;
        }
    }

    // 2. Multi-word Token Match (e.g. "Thomas & Julie Laurent" matching "Thomas Laurent")
    if (cleanExtracted && cleanExtracted.includes(' ')) {
        const extractedTokens = cleanExtracted.split(' ').filter(t => t.length >= 3);
        for (const client of clients) {
            const clientTokens = normalizeString(client.name).split(' ').filter(t => t.length >= 3);
            const allMatch = extractedTokens.every(t => clientTokens.includes(t));
            if (allMatch && extractedTokens.length > 0) {
                return client;
            }
        }
    }

    // 3. First Name + Last Name Initial Match (e.g. "Lucas D" -> "Lucas Dupont")
    for (const client of clients) {
        const parts = client.name.trim().split(/\s+/);
        if (parts.length >= 2) {
            const firstName = normalizeString(parts[0]);
            const lastNameInitial = normalizeString(parts[parts.length - 1][0]);
            const pattern = new RegExp(`\\b${firstName}\\s+${lastNameInitial}\\b`, 'i');
            if (pattern.test(cleanSummary) || (cleanExtracted && pattern.test(cleanExtracted))) {
                return client;
            }
        }
    }

    // 4. Single First Name Match (with disambiguation)
    if (cleanExtracted) {
        const searchFirst = cleanExtracted.split(' ')[0];
        if (searchFirst.length >= 3) {
            // Find all clients sharing this first name
            const matchingClients = clients.filter(c => {
                const cFirst = normalizeString(c.name.split(/\s+/)[0]);
                return cFirst === searchFirst;
            });

            if (matchingClients.length === 1) {
                // Exactly 1 client matches -> return them!
                return matchingClients[0];
            } else if (matchingClients.length > 1) {
                // Multiple clients share this first name: check if any last name matches
                const best = matchingClients.find(c => {
                    const cTokens = normalizeString(c.name).split(/\s+/);
                    return cTokens.every(t => cleanSummary.includes(t));
                });
                if (best) return best;
                // Otherwise return the first matched client
                return matchingClients[0];
            }
        }
    }

    // 5. Fallback: Search across whole summary for client first name
    for (const client of clients) {
        const firstName = normalizeString(client.name.split(/\s+/)[0]);
        if (firstName.length >= 3) {
            const pattern = new RegExp(`\\b${firstName}\\b`, 'i');
            if (pattern.test(cleanSummary)) {
                return client;
            }
        }
    }

    return null;
}

function getGoogleCalendarClient() {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        return null;
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: (process.env.GOOGLE_PRIVATE_KEY || '')
                .replace(/^["']|["']$/g, '')
                .replace(/\\n/g, '\n'),
        },
        scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ],
    });

    return google.calendar({ version: 'v3', auth });
}

/**
 * 1. PULL: Fetches Google Calendar events for the target week with Paris timezone safety.
 */
export async function getUpcomingCalendarBookings(
    clients: ClientProfile[] = [], 
    offsetWeeks = 0
): Promise<{
    matches: CalendarBookingMatch[];
    weekLabel: string;
    validBookingsCount: number;
    ignoredBlocksCount: number;
}> {
    try {
        const calendar = getGoogleCalendarClient();
        if (!calendar) {
            console.warn('[GoogleCalendar] Missing service account credentials in .env.local');
            return { matches: [], weekLabel: '', validBookingsCount: 0, ignoredBlocksCount: 0 };
        }

        const { startIso, endIso, weekLabel } = getWeekBounds(offsetWeeks);
        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

        // Query with timezone 'Europe/Paris' bounds
        const timeMin = `${startIso}T00:00:00+02:00`;
        const timeMax = `${endIso}T23:59:59+02:00`;

        const response = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            timeZone: 'Europe/Paris'
        });

        const events = response.data.items || [];
        const results: CalendarBookingMatch[] = [];

        let validBookingsCount = 0;
        let ignoredBlocksCount = 0;

        for (const event of events) {
            const title = event.summary || 'Réservation sans titre';
            const description = event.description || '';
            const combinedText = `${title} ${description}`;
            
            const startRaw = event.start?.dateTime || event.start?.date;
            if (!startRaw) continue;

            const isBlock = isInternalBlock(title);
            if (isBlock) {
                ignoredBlocksCount++;
                continue;
            }

            validBookingsCount++;

            // Extract Paris date info (never shifts days or slots)
            const dateInfo = getParisDateTimeInfo(startRaw);
            const { isoDate, dayName, dayNumber, monthName, timeSlot } = dateInfo;
            const formattedSlot = `${dayName} ${timeSlot}`;

            const matchedClient = matchEventToClient(combinedText, clients);
            const extractedName = extractClientNameFromTitle(title) || (matchedClient ? matchedClient.name : null);
            const extractedQuota = extractQuotaFromText(combinedText) || (matchedClient ? matchedClient.defaultDishCount : 4);
            const extractedPeopleCount = extractPeopleCountFromText(combinedText) || (matchedClient ? matchedClient.personCount : 2);

            const isAnonymousSession = !matchedClient && !extractedName;
            const isNewClientDetected = !matchedClient && !!extractedName;

            results.push({
                gcalEventId: event.id || '',
                eventTitle: title,
                startDateTime: typeof startRaw === 'string' ? startRaw : new Date(startRaw).toISOString(),
                dateIso: dateInfo.isoDate,
                dayLabel: dateInfo.dayName,
                dayNumber: dateInfo.dayNumber,
                monthName: dateInfo.monthName,
                timeSlot: dateInfo.timeSlot,
                formattedSlot,
                weekOffset: offsetWeeks,
                extractedName: extractedName || (isAnonymousSession ? `Client (${formattedSlot})` : 'Séance'),
                extractedQuota,
                extractedPeopleCount,
                matchedClient,
                isNewClientDetected,
                isAnonymousSession,
                isBlockIgnored: false
            });
        }

        return {
            matches: results,
            weekLabel,
            validBookingsCount,
            ignoredBlocksCount
        };
    } catch (error) {
        console.error('[GoogleCalendar] Error fetching events:', error);
        return { matches: [], weekLabel: '', validBookingsCount: 0, ignoredBlocksCount: 0 };
    }
}

/**
 * 2. PUSH: Creates a booking event on Elisa's Google Calendar from the Admin portal.
 */
export async function createGoogleCalendarEvent(session: {
    clientName: string;
    dateIso: string; // "YYYY-MM-DD"
    timeSlot: 'Matin' | 'Après-midi';
    dishCount: number;
    personCount?: number;
    notes?: string;
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
        const calendar = getGoogleCalendarClient();
        if (!calendar) {
            return { success: false, error: 'Compte de service Google non configuré dans .env.local' };
        }

        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
        
        // Slot Hours: Morning (09:00 - 12:00) | Afternoon (14:00 - 17:00)
        const isMorning = session.timeSlot === 'Matin';
        const startHour = isMorning ? '09:00:00' : '14:00:00';
        const endHour = isMorning ? '12:00:00' : '17:00:00';

        const startDateTime = `${session.dateIso}T${startHour}+02:00`;
        const endDateTime = `${session.dateIso}T${endHour}+02:00`;

        const personTag = session.personCount ? `, ${session.personCount} personnes` : '';
        const summary = `${session.clientName} ${session.dishCount} recettes${personTag}`;
        const description = session.notes ? `Notes: ${session.notes}\nCréé depuis Elisa Batch Cooking Admin` : 'Créé depuis Elisa Batch Cooking Admin';

        const response = await calendar.events.insert({
            calendarId,
            requestBody: {
                summary,
                description,
                colorId: '5', // Yellow (Banana in Google Calendar)
                start: {
                    dateTime: startDateTime,
                    timeZone: 'Europe/Paris',
                },
                end: {
                    dateTime: endDateTime,
                    timeZone: 'Europe/Paris',
                },
            },
        });

        return { success: true, eventId: response.data.id || undefined };
    } catch (error: any) {
        console.error('[GoogleCalendar] Error creating event:', error?.response?.data || error);
        const gcalMsg = error?.response?.data?.error?.message || error?.message || 'Erreur Google Calendar';
        return { success: false, error: gcalMsg };
    }
}

import { google } from 'googleapis';
import { ClientProfile } from './types/cooking-ops';
import { getWeekBounds, FRENCH_DAYS, formatLocalDateToIso } from './dateUtils';

export interface CalendarBookingMatch {
    gcalEventId: string;
    eventTitle: string;
    startDateTime: string;
    dateIso: string; // "YYYY-MM-DD" in local time
    dayLabel: string; // e.g. "Lundi", "Mardi"
    dayNumber: number; // e.g. 17, 18
    monthName: string; // e.g. "août"
    timeSlot: 'Matin' | 'Après-midi';
    formattedSlot: string; // e.g. "Lundi Matin", "Mardi Après-midi"
    weekOffset: number; // 0 for current week, 1 for next week
    extractedName: string | null;
    extractedQuota: number | null;
    extractedPeopleCount: number | null;
    matchedClient: ClientProfile | null;
    isNewClientDetected: boolean;
    isAnonymousSession: boolean;
    isBlockIgnored: boolean;
}

const BLOCK_KEYWORDS = [
    'bloc', 'bloque', 'bloqué', 'indispo', 'indisponible', 
    'perso', 'personnel', 'vacances', 'off', 'pause', 'ferme', 'fermé', 'conges', 'congés',
    'rencontre chef'
];

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
 * Checks if an event is an internal calendar block or background template (e.g. "Bloc", "Rencontre Chef").
 */
export function isInternalBlock(title: string): boolean {
    if (!title) return false;
    const clean = normalizeString(title);
    return BLOCK_KEYWORDS.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(clean);
    });
}

/**
 * Extracts dish count / quota from text like "5 recettes, 2 personnes" or "4 plats".
 */
export function extractQuotaFromText(text: string): number | null {
    if (!text) return null;
    const match = text.match(/(\d+)\s*(recettes?|plats?|repas)/i);
    if (match && match[1]) {
        const count = parseInt(match[1], 10);
        if (count >= 1 && count <= 8) return count;
    }
    return null;
}

/**
 * Extracts household person count from text like "2 personnes", "4 pers", "1 personne".
 */
export function extractPeopleCountFromText(text: string): number | null {
    if (!text) return null;
    const match = text.match(/(\d+)\s*(personnes?|pers|pax)/i);
    if (match && match[1]) {
        const count = parseInt(match[1], 10);
        if (count >= 1 && count <= 12) return count;
    }
    return null;
}

/**
 * Extracts client name from event title like "Thibault 5 recettes, 2 personnes" or "Romain & Amélie 14h".
 */
export function extractClientNameFromTitle(title: string): string | null {
    if (!title || isInternalBlock(title)) return null;

    let cleaned = title
        .replace(/\d+\s*recettes?/gi, '')
        .replace(/\d+\s*plats?/gi, '')
        .replace(/\d+\s*repas/gi, '')
        .replace(/\d+\s*personnes?/gi, '')
        .replace(/\d+\s*pers/gi, '')
        .replace(/\d+\s*pax/gi, '')
        .replace(/\d+h\d*/gi, '') // Removes "14h" or "14h30"
        .replace(/batch\s*cooking/gi, '')
        .replace(/séance/gi, '')
        .replace(/seance/gi, '')
        .replace(/cuisine\s*chez/gi, '')
        .replace(/chez/gi, '')
        .replace(/[\(\)\,\-\:\;\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned || /^[\d\s]+$/.test(cleaned) || cleaned.length < 2) {
        return null;
    }

    return cleaned
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Robust matching between a calendar event summary and existing client profiles.
 */
export function matchEventToClient(summary: string, clients: ClientProfile[]): ClientProfile | null {
    if (!summary || isInternalBlock(summary)) return null;
    const cleanSummary = normalizeString(summary);

    // 1. Exact Full Name Match
    for (const client of clients) {
        const cleanName = normalizeString(client.name);
        if (cleanSummary.includes(cleanName)) {
            return client;
        }
    }

    // 2. Token Matching
    for (const client of clients) {
        const nameParts = normalizeString(client.name).split(' ').filter(p => p.length >= 3);
        const allPartsMatch = nameParts.length > 0 && nameParts.every(part => cleanSummary.includes(part));
        if (allPartsMatch) {
            return client;
        }
    }

    // 3. First Name + Initial Match
    for (const client of clients) {
        const parts = client.name.trim().split(' ');
        if (parts.length >= 2) {
            const firstName = normalizeString(parts[0]);
            const lastInitial = normalizeString(parts[1][0]);
            const pattern = new RegExp(`\\b${firstName}\\s+${lastInitial}\\b`, 'i');
            if (pattern.test(cleanSummary)) {
                return client;
            }
        }
    }

    // 4. First Name Match
    for (const client of clients) {
        const firstName = normalizeString(client.name.split(' ')[0]);
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
 * 1. PULL: Fetches Google Calendar events for the target week.
 */
export async function getUpcomingCalendarBookings(
    clients: ClientProfile[], 
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

        const { start, end, weekLabel } = getWeekBounds(offsetWeeks);
        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

        const response = await calendar.events.list({
            calendarId,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
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

            const startDate = new Date(startRaw);
            const dateIso = formatLocalDateToIso(startDate); // Local YYYY-MM-DD
            const dayName = FRENCH_DAYS[startDate.getDay()];
            const dayNumber = startDate.getDate();
            const monthName = startDate.toLocaleDateString('fr-FR', { month: 'short' });
            const hour = startDate.getHours();
            
            // Format time slot: Morning (< 12:30) vs Afternoon (>= 12:30)
            const timeSlot: 'Matin' | 'Après-midi' = hour < 12.5 ? 'Matin' : 'Après-midi';
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
                startDateTime: startDate.toISOString(),
                dateIso,
                dayLabel: dayName,
                dayNumber,
                monthName,
                timeSlot,
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
}): Promise<string | null> {
    try {
        const calendar = getGoogleCalendarClient();
        if (!calendar) return null;

        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
        
        // Slot Hours: Morning (09:00 - 13:00) | Afternoon (14:00 - 18:00)
        const isMorning = session.timeSlot === 'Matin';
        const startHour = isMorning ? '09:00:00' : '14:00:00';
        const endHour = isMorning ? '13:00:00' : '18:00:00';

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
                start: { dateTime: startDateTime, timeZone: 'Europe/Paris' },
                end: { dateTime: endDateTime, timeZone: 'Europe/Paris' },
            }
        });

        return response.data.id || null;
    } catch (err) {
        console.error('[GoogleCalendar] Error creating event on Google Calendar:', err);
        return null;
    }
}

/**
 * 3. DELETE: Deletes an event from Google Calendar if removed in the admin.
 */
export async function deleteGoogleCalendarEvent(gcalEventId: string): Promise<boolean> {
    try {
        const calendar = getGoogleCalendarClient();
        if (!calendar || !gcalEventId) return false;

        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
        await calendar.events.delete({
            calendarId,
            eventId: gcalEventId,
        });

        return true;
    } catch (err) {
        console.warn('[GoogleCalendar] Error deleting event:', err);
        return false;
    }
}

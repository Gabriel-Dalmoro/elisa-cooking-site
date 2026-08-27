import { NextRequest, NextResponse } from 'next/server';
import { 
    getAllClientsAsync,
    saveClient, 
    upsertBookingSession, 
    clearSessionsForDateRange, 
    getSessionsForWeek,
    getActiveWeeklyMenu 
} from '@/lib/cookingOpsStore';
import { getUpcomingCalendarBookings, matchEventToClient } from '@/lib/googleCalendar';
import { getWeekBounds } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const offsetParam = searchParams.get('offset') ?? searchParams.get('week');
        let offsetWeeks = 0;
        if (offsetParam === 'next') {
            offsetWeeks = 1;
        } else if (offsetParam === 'current') {
            offsetWeeks = 0;
        } else if (offsetParam !== null && offsetParam !== undefined) {
            const parsed = parseInt(offsetParam, 10);
            offsetWeeks = isNaN(parsed) ? 0 : parsed;
        }

        const { daysWithDates, weekLabel } = getWeekBounds(offsetWeeks);
        const startIso = daysWithDates[0].isoDate;
        const endIso = daysWithDates[daysWithDates.length - 1].isoDate;

        // Fetch latest clients directly from Supabase / store
        const clients = await getAllClientsAsync();
        const { matches, validBookingsCount, ignoredBlocksCount } = await getUpcomingCalendarBookings(clients, offsetWeeks);

        // Clear existing sessions strictly for this week's date range to prevent stale data
        clearSessionsForDateRange(startIso, endIso);

        let createdCount = 0;
        let updatedCount = 0;

        for (const match of matches) {
            let targetClient = match.matchedClient || (match.extractedName ? matchEventToClient(match.extractedName, clients) : null);

            if (!targetClient && match.extractedName) {
                // Only create new client if no match exists anywhere in Supabase / clients table
                targetClient = saveClient({
                    name: match.extractedName,
                    defaultDishCount: match.extractedQuota || 4,
                    personCount: match.extractedPeopleCount || 2,
                    notes: `Créé depuis Google Calendar (${match.dayLabel} ${match.dayNumber} ${match.monthName})`
                });
                clients.push(targetClient);
                createdCount++;
            } else if (!targetClient && match.isAnonymousSession) {
                // Create placeholder client for anonymous booking
                targetClient = saveClient({
                    name: `Client (${match.formattedSlot})`,
                    defaultDishCount: match.extractedQuota || 3,
                    personCount: match.extractedPeopleCount || 2,
                    notes: `Réservation sans nom sur Google Calendar ("${match.eventTitle}")`
                });
                clients.push(targetClient);
                createdCount++;
            } else if (targetClient) {
                updatedCount++;
            }

            if (targetClient) {
                upsertBookingSession({
                    clientId: targetClient.id,
                    clientName: targetClient.name,
                    dateIso: match.dateIso,
                    dayName: match.dayLabel,
                    timeSlot: match.timeSlot,
                    dishCount: match.extractedQuota || targetClient.defaultDishCount || 4,
                    personCount: match.extractedPeopleCount || targetClient.personCount || 2,
                    gcalEventId: match.gcalEventId,
                    notes: match.eventTitle
                });
            }
        }

        const weekMenu = await getActiveWeeklyMenu();
        const slotStatuses = getSessionsForWeek(startIso, endIso);

        return NextResponse.json({
            success: true,
            weekLabel,
            startIso,
            endIso,
            validBookingsCount,
            ignoredBlocksCount,
            createdCount,
            updatedCount,
            slotStatuses,
            weekMenu
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

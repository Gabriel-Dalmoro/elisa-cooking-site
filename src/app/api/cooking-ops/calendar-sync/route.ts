import { NextRequest, NextResponse } from 'next/server';
import { 
    getAllClients, 
    saveClient, 
    upsertBookingSession, 
    clearSessionsForDateRange, 
    getSessionsForWeek,
    getActiveWeeklyMenu 
} from '@/lib/cookingOpsStore';
import { getUpcomingCalendarBookings } from '@/lib/googleCalendar';
import { getWeekBounds } from '@/lib/dateUtils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const weekParam = searchParams.get('week'); // 'current' or 'next'
        const offsetWeeks = weekParam === 'next' ? 1 : 0;

        const { daysWithDates, weekLabel } = getWeekBounds(offsetWeeks);
        const startIso = daysWithDates[0].isoDate;
        const endIso = daysWithDates[daysWithDates.length - 1].isoDate;

        const clients = getAllClients();
        const { matches, validBookingsCount, ignoredBlocksCount } = await getUpcomingCalendarBookings(clients, offsetWeeks);

        // Clear existing sessions strictly for this week's date range to prevent stale data
        clearSessionsForDateRange(startIso, endIso);

        let createdCount = 0;
        let updatedCount = 0;

        for (const match of matches) {
            let targetClientId = match.matchedClient ? match.matchedClient.id : '';

            if (!targetClientId && match.extractedName) {
                // Auto-create new client profile with personCount
                const newClient = saveClient({
                    name: match.extractedName,
                    defaultDishCount: match.extractedQuota || 4,
                    personCount: match.extractedPeopleCount || 2,
                    notes: `Créé depuis Google Calendar (${match.dayLabel} ${match.dayNumber} ${match.monthName})`
                });
                targetClientId = newClient.id;
                createdCount++;
            } else if (!targetClientId && match.isAnonymousSession) {
                // Create placeholder client for anonymous booking
                const anonClient = saveClient({
                    name: `Client (${match.formattedSlot})`,
                    defaultDishCount: match.extractedQuota || 3,
                    personCount: match.extractedPeopleCount || 2,
                    notes: `Réservation sans nom sur Google Calendar ("${match.eventTitle}")`
                });
                targetClientId = anonClient.id;
                createdCount++;
            } else if (match.matchedClient) {
                updatedCount++;
            }

            if (targetClientId) {
                upsertBookingSession({
                    clientId: targetClientId,
                    clientName: match.extractedName || match.matchedClient?.name || 'Client',
                    dateIso: match.dateIso,
                    dayName: match.dayLabel,
                    timeSlot: match.timeSlot,
                    dishCount: match.extractedQuota || 4,
                    personCount: match.extractedPeopleCount || match.matchedClient?.personCount || 2,
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

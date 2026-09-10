import { NextRequest, NextResponse } from 'next/server';
import {
    upsertBookingSession,
    clearSessionsForDateRange,
    getSessionsForWeek,
    getActiveWeeklyMenu
} from '@/lib/cookingOpsStore';
import { listClients } from '@/lib/db/clients';
import { getUpcomingCalendarBookings, matchEventToClient } from '@/lib/googleCalendar';
import { getWeekBounds } from '@/lib/dateUtils';
import { requireOwner } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

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

        const clients = await listClients();
        const { matches, validBookingsCount, ignoredBlocksCount } = await getUpcomingCalendarBookings(clients, offsetWeeks);

        // Clear existing sessions strictly for this week's date range to prevent stale data
        clearSessionsForDateRange(startIso, endIso);

        let matchedCount = 0;
        let unmatchedCount = 0;

        for (const match of matches) {
            const targetClient = match.matchedClient || (match.extractedName ? matchEventToClient(match.extractedName, clients) : null);

            // Unmatched events are shown with the name from the calendar, but no client record is created.
            // Elisa creates the client herself from the planning if it is a real booking.
            if (targetClient) {
                matchedCount++;
            } else {
                unmatchedCount++;
            }

            upsertBookingSession({
                clientId: targetClient?.id || '',
                clientName: targetClient?.name || match.extractedName || `Client (${match.formattedSlot})`,
                dateIso: match.dateIso,
                dayName: match.dayLabel,
                timeSlot: match.timeSlot,
                dishCount: match.extractedQuota || targetClient?.defaultDishCount || 4,
                personCount: match.extractedPeopleCount || targetClient?.personCount || 2,
                gcalEventId: match.gcalEventId,
                notes: match.eventTitle
            });
        }

        const weekMenu = await getActiveWeeklyMenu();
        const slotStatuses = getSessionsForWeek(startIso, endIso, clients);

        return NextResponse.json({
            success: true,
            weekLabel,
            startIso,
            endIso,
            validBookingsCount,
            ignoredBlocksCount,
            matchedCount,
            unmatchedCount,
            slotStatuses,
            weekMenu
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

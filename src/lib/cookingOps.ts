import { BookingSession, ClientProfile, ClientSelection, SlotSessionStatus } from './types/cooking-ops';
import { getWeekBounds } from './dateUtils';
import { listClients } from './db/clients';
import { getMenu } from './db/menus';
import { getSelectionsForWeek } from './db/selections';
import { listSessions, replaceSessionsForRange, SessionInput } from './db/sessions';
import { ensureSeriesSessions, listSeries, SessionSeries } from './db/series';
import { getUpcomingCalendarBookings, matchEventToClient } from './googleCalendar';

/**
 * Week-level operations shared by the planning, today and kitchen screens.
 * Everything is read from Supabase — nothing is kept in server memory.
 */

function placeholderClient(session: BookingSession): ClientProfile {
    return {
        id: '',
        token: '',
        name: session.clientName,
        phone: '',
        allergies: [],
        defaultDishCount: session.dishCount,
        personCount: session.personCount,
        createdAt: session.createdAt
    };
}

export function buildSlotStatuses(
    sessions: BookingSession[],
    clients: ClientProfile[],
    selections: ClientSelection[]
): SlotSessionStatus[] {
    const clientById = new Map(clients.map(c => [c.id, c]));
    const selectionByClient = new Map(selections.map(s => [s.clientId, s]));

    return sessions.map(session => {
        const client = session.clientId ? clientById.get(session.clientId) : undefined;
        if (!client) {
            // Calendar event without a client record: shown, never turned into a client automatically
            return { session, client: placeholderClient(session), isUnmatchedClient: true, selection: null, isSubmitted: false, selectedCount: 0 };
        }
        const selection = selectionByClient.get(client.id) || null;
        // A custom dish the client wrote counts as one of their dishes
        const selectedCount = selection ? selection.selectedDishIds.length + (selection.customDish ? 1 : 0) : 0;
        return { session, client, selection, isSubmitted: selectedCount > 0, selectedCount };
    });
}

/**
 * Everything the planning screens need for one week (offset 0 = this week, in Paris time).
 * Sessions cover Monday–Sunday; the planning grid shows Monday–Friday.
 * For a chef (chefId): only the sessions assigned to them, and only their clients plus the clients
 * of those sessions — never private notes.
 */
export async function loadWeekOverview(offsetWeeks: number, chefId?: string) {
    const { startIso, endIso, weekLabel } = getWeekBounds(offsetWeeks);
    const allClients = await listClients();
    // Recurring sessions are created up to the week being looked at (never blocks the planning)
    let series: SessionSeries[] = [];
    try {
        await ensureSeriesSessions(endIso, allClients);
        series = await listSeries(false);
    } catch (error) {
        console.warn('Recurring sessions unavailable:', error instanceof Error ? error.message : error);
    }
    const [sessions, selections, weekMenu] = await Promise.all([
        listSessions(startIso, endIso, chefId),
        getSelectionsForWeek(startIso),
        getMenu(startIso)
    ]);

    let clients = allClients;
    if (chefId) {
        const sessionClientIds = new Set(sessions.map(s => s.clientId).filter(Boolean));
        clients = allClients
            .filter(c => c.chefId === chefId || sessionClientIds.has(c.id))
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(({ privateNotes, ...c }) => c);
    }
    const visibleIds = new Set(clients.map(c => c.id));

    return {
        weekLabel,
        startIso,
        endIso,
        weekMenu,
        clients,
        // The series behind this week's sessions (how often, until when)
        series: series.filter(sr => sessions.some(s => s.seriesId === sr.id)),
        slotStatuses: buildSlotStatuses(sessions, clients, selections.filter(s => visibleIds.has(s.clientId)))
    };
}

/**
 * Pulls the week from Google Calendar into the sessions table.
 * If Google can't be reached, the stored sessions are left untouched.
 */
export async function syncWeekFromCalendar(offsetWeeks: number) {
    const { startIso, endIso } = getWeekBounds(offsetWeeks);
    const clients = await listClients();
    const result = await getUpcomingCalendarBookings(clients, offsetWeeks);

    if (!result.ok) {
        return { ok: false as const, error: result.error || 'Google Calendar injoignable', matchedCount: 0, unmatchedCount: 0, validBookingsCount: 0, ignoredBlocksCount: 0 };
    }

    let matchedCount = 0;
    let unmatchedCount = 0;
    const sessions: SessionInput[] = [];

    for (const match of result.matches) {
        if (!match.gcalEventId) continue;
        const client = match.matchedClient || (match.extractedName ? matchEventToClient(match.extractedName, clients) : null);
        if (client) matchedCount++; else unmatchedCount++;

        sessions.push({
            gcalEventId: match.gcalEventId,
            clientId: client?.id || null,
            calendarTitle: match.eventTitle,
            displayName: client?.name || match.extractedName || `Client (${match.formattedSlot})`,
            dateIso: match.dateIso,
            timeSlot: match.timeSlot,
            startsAt: match.startsAt,
            endsAt: match.endsAt,
            dishCount: match.extractedQuota || client?.defaultDishCount || 4,
            personCount: match.extractedPeopleCount || client?.personCount || 2
        });
    }

    await replaceSessionsForRange(startIso, endIso, sessions);

    return {
        ok: true as const,
        matchedCount,
        unmatchedCount,
        validBookingsCount: result.validBookingsCount,
        ignoredBlocksCount: result.ignoredBlocksCount
    };
}

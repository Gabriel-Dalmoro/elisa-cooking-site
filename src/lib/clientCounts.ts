import type { BookingSession, ClientProfile } from './types/cooking-ops';

/**
 * How many people and how many dishes for a session:
 * 1. what Elisa set for THIS session only (guests one week…), if anything;
 * 2. otherwise the client's profile — the one source of truth.
 * A session also keeps its own copy (read from the Google Calendar event, or copied when it was
 * created), but that copy goes stale as soon as Elisa edits the client, so it only counts for a
 * calendar event that matches no client yet.
 */
export function withClientCounts<T extends BookingSession>(session: T, client: Pick<ClientProfile, 'personCount' | 'defaultDishCount'> | null | undefined): T {
    return {
        ...session,
        personCount: session.personCountOverride || client?.personCount || session.personCount,
        dishCount: session.dishCountOverride || client?.defaultDishCount || session.dishCount
    };
}

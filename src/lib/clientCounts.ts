import type { BookingSession, ClientProfile } from './types/cooking-ops';

/**
 * How many people and how many dishes: the client's profile is the one source of truth.
 * A session keeps its own copy (read from the Google Calendar event, or copied when it was
 * created), but that copy goes stale as soon as Elisa edits the client — so wherever a session
 * belongs to a client, the profile's numbers are used. The session's own numbers only count for
 * a calendar event that matches no client yet.
 */
export function withClientCounts<T extends BookingSession>(session: T, client: Pick<ClientProfile, 'personCount' | 'defaultDishCount'> | null | undefined): T {
    if (!client) return session;
    return { ...session, personCount: client.personCount, dishCount: client.defaultDishCount };
}

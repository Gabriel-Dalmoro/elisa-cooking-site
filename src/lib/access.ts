import { NextResponse } from 'next/server';
import type { CurrentStaff } from './auth';
import type { BookingSession, ClientProfile } from './types/cooking-ops';
import { withoutOwnerFields } from './db/clients';

/**
 * What each member of the team may see and change. Every rule is enforced on the server:
 * hiding a button is only for comfort, these checks are what keep data safe.
 *
 *   owner (Elisa) → everything
 *   chef          → the clients assigned to them (chef_id) and the sessions assigned to them (assigned_to)
 */

export const isOwner = (staff: CurrentStaff) => staff.role === 'owner';

export function canAccessClient(staff: CurrentStaff, client: Pick<ClientProfile, 'chefId'> | null | undefined): boolean {
    if (!client) return false;
    return isOwner(staff) || (Boolean(client.chefId) && client.chefId === staff.userId);
}

export function canAccessSession(staff: CurrentStaff, session: Pick<BookingSession, 'assignedTo'> | null | undefined): boolean {
    if (!session) return false;
    return isOwner(staff) || (Boolean(session.assignedTo) && session.assignedTo === staff.userId);
}

/** A client as a chef may see it: no private notes (billing, family situation…), no pricing. */
export function clientForStaff(staff: CurrentStaff, client: ClientProfile): ClientProfile {
    return isOwner(staff) ? client : withoutOwnerFields(client);
}

export const forbidden = (message = 'Accès refusé') => NextResponse.json({ error: message }, { status: 403 });
export const notFound = (message = 'Introuvable') => NextResponse.json({ error: message }, { status: 404 });

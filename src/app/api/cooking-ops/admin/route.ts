import { NextRequest, NextResponse } from 'next/server';
import { loadWeekOverview } from '@/lib/cookingOps';
import { listClients, getClientById, createClient, updateClient, deleteClient, ClientInput, CHEF_EDITABLE_FIELDS } from '@/lib/db/clients';
import { createAppSession, listClientSessionsInSlot, upsertSession } from '@/lib/db/sessions';
import { getStaffMember } from '@/lib/db/staff';
import { addDaysIso, createSeries, ensureSeriesSessions } from '@/lib/db/series';
import { createGoogleCalendarEvent } from '@/lib/googleCalendar';
import { getParisUtcOffset } from '@/lib/dateUtils';
import { requireOwner, requireStaff } from '@/lib/auth';
import { canAccessClient, clientForStaff, forbidden, isOwner } from '@/lib/access';
import { isBillingPlan } from '@/lib/remuneration';

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

// Only keys actually sent by the form are written (a missing field is left untouched)
function pickClientInput(body: Record<string, unknown>): ClientInput {
    const input: ClientInput = {};
    if (typeof body.name === 'string') input.name = body.name;
    if (typeof body.phone === 'string') input.phone = body.phone;
    if (typeof body.email === 'string') input.email = body.email;
    if (typeof body.address === 'string') input.address = body.address;
    if (typeof body.accessCode === 'string') input.accessCode = body.accessCode;
    if (Array.isArray(body.allergies)) input.allergies = body.allergies.filter((a): a is string => typeof a === 'string');
    if (typeof body.dislikes === 'string') input.dislikes = body.dislikes;
    if (typeof body.notes === 'string') input.notes = body.notes;
    if (typeof body.privateNotes === 'string') input.privateNotes = body.privateNotes;
    if (body.defaultDishCount !== undefined) input.defaultDishCount = Number(body.defaultDishCount) || 4;
    if (body.personCount !== undefined) input.personCount = Number(body.personCount) || 2;
    if (body.chefId !== undefined) input.chefId = typeof body.chefId === 'string' && body.chefId ? body.chefId : null;
    if (isBillingPlan(body.billingPlan)) input.billingPlan = body.billingPlan;
    if (body.customPrice !== undefined) {
        const price = Number(body.customPrice);
        input.customPrice = body.customPrice !== null && body.customPrice !== '' && price > 0 ? Math.round(price * 100) / 100 : null;
    }
    return input;
}

// A chef may only touch these fields on their own clients
function onlyChefFields(input: ClientInput): ClientInput {
    const out: ClientInput = {};
    for (const key of CHEF_EDITABLE_FIELDS) {
        if (input[key] !== undefined) (out as Record<string, unknown>)[key] = input[key];
    }
    return out;
}

// A chef id sent by Elisa must be a real, active chef
async function validChefId(id: string | null | undefined): Promise<string | null | 'invalid'> {
    if (!id) return null;
    const member = await getStaffMember(id).catch(() => null);
    return member && member.role === 'chef' && member.active ? id : 'invalid';
}

export async function GET(req: NextRequest) {
    const { staff, denied } = await requireStaff();
    if (denied) return denied;

    try {
        const { searchParams } = new URL(req.url);
        const offsetParam = searchParams.get('offset');
        const offsetWeeks = offsetParam ? parseInt(offsetParam, 10) || 0 : 0;
        // A chef only gets their own sessions and clients
        return NextResponse.json(await loadWeekOverview(offsetWeeks, isOwner(staff) ? undefined : staff.userId));
    } catch (error) {
        console.error('Error fetching admin cooking overview:', error);
        return NextResponse.json({ error: errorMessage(error, 'Erreur serveur') }, { status: 500 });
    }
}

/**
 * POST body shapes:
 * - { existingClientId, bookingDateIso, timeSlot, dayName } → book an existing client (profile untouched)
 * - { id, ...fields }  → update that client (only the fields sent)
 * - { name, ...fields } → create a new client
 * Any of these can carry bookingDateIso + timeSlot to also book a session, and `assignedTo`
 * (a chef id) to give that session to a chef. Elisa's own sessions go to her Google Calendar;
 * a chef's sessions live only in the app.
 *
 * A chef can: update allergies / dislikes / kitchen notes / number of people of their own clients,
 * and book their own clients (always in their own calendar). Nothing else.
 */
export async function POST(req: NextRequest) {
    const { staff, denied } = await requireStaff();
    if (denied) return denied;

    try {
        const body = await req.json();
        const owner = isOwner(staff);
        let input = pickClientInput(body);

        if (owner && input.chefId !== undefined) {
            const chef = await validChefId(input.chefId);
            if (chef === 'invalid') return NextResponse.json({ error: 'Chef introuvable ou désactivé' }, { status: 400 });
            input.chefId = chef;
        }

        let savedClient;
        if (body.existingClientId) {
            savedClient = await getClientById(String(body.existingClientId));
            if (!savedClient) {
                return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
            }
            if (!canAccessClient(staff, savedClient)) return forbidden('Ce client ne vous est pas attribué');
        } else if (body.id) {
            if (!owner) {
                const current = await getClientById(String(body.id));
                if (!canAccessClient(staff, current)) return forbidden('Ce client ne vous est pas attribué');
                input = onlyChefFields(input);
            }
            savedClient = await updateClient(String(body.id), input);
        } else if (!owner) {
            return forbidden('Seule Elisa peut créer une fiche client');
        } else {
            if (!input.name || !input.name.trim()) {
                return NextResponse.json({ error: 'Le nom du client est requis' }, { status: 400 });
            }
            savedClient = await createClient({ ...input, name: input.name });
        }

        let gcalEventId: string | undefined = body.gcalEventId;
        let gcalSyncResult: { success: boolean; error?: string } = { success: true };

        // Who cooks it: a chef always books in their own calendar; Elisa picks (empty = herself)
        let assignedTo: string | null = null;
        if (body.bookingDateIso && body.timeSlot) {
            if (!owner) {
                assignedTo = staff.userId;
            } else {
                const chef = await validChefId(typeof body.assignedTo === 'string' ? body.assignedTo : null);
                if (chef === 'invalid') return NextResponse.json({ error: 'Chef introuvable ou désactivé' }, { status: 400 });
                assignedTo = chef;
            }
        }

        // A chef's session: stored in the app only, never in Elisa's Google Calendar
        if (body.bookingDateIso && body.timeSlot && assignedTo) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.bookingDateIso)) || !['Matin', 'Après-midi'].includes(body.timeSlot)) {
                return NextResponse.json({ error: 'Créneau invalide' }, { status: 400 });
            }
            // Same client already booked on this slot (often Elisa's Google booking): give that one to the chef instead
            const existing = await listClientSessionsInSlot(savedClient.id, body.bookingDateIso, body.timeSlot);
            if (existing.length > 0) {
                const where = existing[0].gcalEventId ? 'dans votre Google Calendar' : 'dans le planning';
                return NextResponse.json(
                    { error: `${savedClient.name} a déjà une séance ${where} à ce créneau. Ouvrez-la et choisissez « Cuisiné par » plutôt que d’en créer une deuxième.` },
                    { status: 409 }
                );
            }

            // Elisa: the same slot every 1, 2 or 4 weeks (sessions are created ahead of time)
            const everyWeeks = Number(body.repeatEveryWeeks);
            if (owner && [1, 2, 4].includes(everyWeeks)) {
                const endDate = typeof body.repeatUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.repeatUntil) ? body.repeatUntil : null;
                if (endDate && endDate < body.bookingDateIso) {
                    return NextResponse.json({ error: 'La date de fin est avant la première séance' }, { status: 400 });
                }
                const series = await createSeries({
                    clientId: savedClient.id,
                    assignedTo,
                    timeSlot: body.timeSlot,
                    everyWeeks: everyWeeks as 1 | 2 | 4,
                    startDate: body.bookingDateIso,
                    endDate
                });
                await ensureSeriesSessions(addDaysIso(body.bookingDateIso, 7 * 8), [savedClient]);
                return NextResponse.json({ success: true, client: clientForStaff(staff, savedClient), series, gcalSyncResult });
            }
            const session = await createAppSession({
                clientId: savedClient.id,
                displayName: savedClient.name,
                dateIso: body.bookingDateIso,
                timeSlot: body.timeSlot,
                dishCount: savedClient.defaultDishCount,
                personCount: savedClient.personCount,
                assignedTo
            });
            return NextResponse.json({ success: true, client: clientForStaff(staff, savedClient), session, gcalSyncResult });
        }

        // Elisa's booking → create the Google Calendar event, then store the session.
        // Google Calendar is the source of truth: if the event can't be created, no session is stored.
        if (body.bookingDateIso && body.timeSlot) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.bookingDateIso)) || !['Matin', 'Après-midi'].includes(body.timeSlot)) {
                return NextResponse.json({ error: 'Créneau invalide' }, { status: 400 });
            }

            if (!gcalEventId) {
                const gcalRes = await createGoogleCalendarEvent({
                    clientName: savedClient.name,
                    dateIso: body.bookingDateIso,
                    timeSlot: body.timeSlot,
                    dishCount: savedClient.defaultDishCount,
                    personCount: savedClient.personCount,
                    notes: savedClient.notes
                });

                if (gcalRes.success && gcalRes.eventId) {
                    gcalEventId = gcalRes.eventId;
                } else if (!gcalRes.success) {
                    gcalSyncResult = { success: false, error: gcalRes.error };
                }
            }

            if (gcalEventId) {
                // Same hours as the Google Calendar event (09:00–12:00 / 14:00–17:00, Paris)
                const offset = getParisUtcOffset(body.bookingDateIso);
                const [startHour, endHour] = body.timeSlot === 'Matin' ? ['09:00', '12:00'] : ['14:00', '17:00'];
                await upsertSession({
                    gcalEventId,
                    clientId: savedClient.id,
                    calendarTitle: savedClient.name,
                    displayName: savedClient.name,
                    dateIso: body.bookingDateIso,
                    timeSlot: body.timeSlot,
                    startsAt: `${body.bookingDateIso}T${startHour}:00${offset}`,
                    endsAt: `${body.bookingDateIso}T${endHour}:00${offset}`,
                    dishCount: savedClient.defaultDishCount,
                    personCount: savedClient.personCount
                });
            }
        }

        return NextResponse.json({
            success: true,
            client: clientForStaff(staff, savedClient),
            gcalEventId,
            gcalSyncResult
        });
    } catch (error) {
        console.error('Error saving client in admin:', error);
        return NextResponse.json({ error: errorMessage(error, 'Erreur lors de l’enregistrement du client') }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('id');
        if (!clientId) {
            return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        }
        await deleteClient(clientId);
        const clients = await listClients();
        return NextResponse.json({ success: true, clients });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: errorMessage(error, 'Erreur suppression') }, { status: 500 });
    }
}

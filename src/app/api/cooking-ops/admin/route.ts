import { NextRequest, NextResponse } from 'next/server';
import { loadWeekOverview } from '@/lib/cookingOps';
import { listClients, getClientById, createClient, updateClient, deleteClient, ClientInput } from '@/lib/db/clients';
import { upsertSession } from '@/lib/db/sessions';
import { createGoogleCalendarEvent } from '@/lib/googleCalendar';
import { getParisUtcOffset } from '@/lib/dateUtils';
import { requireOwner } from '@/lib/auth';

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
    return input;
}

export async function GET(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { searchParams } = new URL(req.url);
        const offsetParam = searchParams.get('offset');
        const offsetWeeks = offsetParam ? parseInt(offsetParam, 10) || 0 : 0;
        return NextResponse.json(await loadWeekOverview(offsetWeeks));
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
 * Any of these can carry bookingDateIso + timeSlot to also create the Google Calendar event.
 */
export async function POST(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const body = await req.json();
        const input = pickClientInput(body);

        let savedClient;
        if (body.existingClientId) {
            savedClient = await getClientById(String(body.existingClientId));
            if (!savedClient) {
                return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
            }
        } else if (body.id) {
            savedClient = await updateClient(String(body.id), input);
        } else {
            if (!input.name || !input.name.trim()) {
                return NextResponse.json({ error: 'Le nom du client est requis' }, { status: 400 });
            }
            savedClient = await createClient({ ...input, name: input.name });
        }

        let gcalEventId: string | undefined = body.gcalEventId;
        let gcalSyncResult: { success: boolean; error?: string } = { success: true };

        // Booking a specific date & slot → create the Google Calendar event, then store the session.
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
            client: savedClient,
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

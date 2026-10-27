import { NextRequest, NextResponse } from 'next/server';
import { addDaysIso, createSeries, ensureSeriesSessions, getSeries, linkSessionToSeries, reassignSeries, stopSeries } from '@/lib/db/series';
import { getSession } from '@/lib/db/sessions';
import { getClientById } from '@/lib/db/clients';
import { getStaffMember } from '@/lib/db/staff';
import { requireOwner } from '@/lib/auth';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Turns a session already booked for a chef into a recurring one (Elisa only):
 * POST { sessionId, everyWeeks: 1 | 2 | 4, until?: 'YYYY-MM-DD' }
 * The session becomes the series' first week; the next ones are planned from it.
 */
export async function POST(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const body = await req.json();
        const session = typeof body.sessionId === 'string' ? await getSession(body.sessionId) : null;
        if (!session) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });
        if (session.seriesId) return NextResponse.json({ error: 'Cette séance est déjà récurrente' }, { status: 409 });
        if (!session.assignedTo) {
            return NextResponse.json({ error: 'Confiez d’abord cette séance à un chef (« Cuisiné par »).' }, { status: 400 });
        }
        const client = session.clientId ? await getClientById(session.clientId) : null;
        if (!client) return NextResponse.json({ error: 'Aucune fiche client liée à cette séance' }, { status: 400 });

        const everyWeeks = Number(body.everyWeeks);
        if (![1, 2, 4].includes(everyWeeks)) return NextResponse.json({ error: 'Fréquence invalide' }, { status: 400 });
        const until = typeof body.until === 'string' && ISO_DATE.test(body.until) ? body.until : null;
        if (until && until < session.dateIso) {
            return NextResponse.json({ error: 'La date de fin est avant cette séance' }, { status: 400 });
        }

        const series = await createSeries({
            clientId: client.id,
            assignedTo: session.assignedTo,
            timeSlot: session.timeSlot,
            everyWeeks: everyWeeks as 1 | 2 | 4,
            startDate: session.dateIso,
            endDate: until
        });
        // An app session joins the series as its first week. A Google Calendar one stays as it is:
        // that week is already booked, so the series simply starts planning from the next one.
        if (!session.gcalEventId) await linkSessionToSeries(session.id, series.id, session.dateIso);
        await ensureSeriesSessions(addDaysIso(session.dateIso, 7 * 8), [client]);
        return NextResponse.json({ success: true, series });
    } catch (error) {
        console.error('Error creating series from session:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * Recurring sessions (Elisa only). Series are created with a booking (POST /api/cooking-ops/admin
 * with repeatEveryWeeks) or from a booked session (POST above); this route changes them:
 * PATCH { id, stopFrom: 'YYYY-MM-DD' } → no more sessions from that date (earlier ones are kept)
 * PATCH { id, assignedTo: chefId, from: 'YYYY-MM-DD' } → another chef cooks it from that date
 */
export async function PATCH(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const body = await req.json();
        const id = typeof body.id === 'string' ? body.id : '';
        if (!id || !(await getSeries(id))) return NextResponse.json({ error: 'Récurrence introuvable' }, { status: 404 });

        if (typeof body.stopFrom === 'string' && ISO_DATE.test(body.stopFrom)) {
            await stopSeries(id, body.stopFrom);
            return NextResponse.json({ success: true });
        }

        if (typeof body.assignedTo === 'string' && typeof body.from === 'string' && ISO_DATE.test(body.from)) {
            const chef = await getStaffMember(body.assignedTo).catch(() => null);
            if (!chef || chef.role !== 'chef' || !chef.active) {
                return NextResponse.json({ error: 'Chef introuvable ou désactivé' }, { status: 400 });
            }
            await reassignSeries(id, chef.userId, body.from);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    } catch (error) {
        console.error('Error updating series:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSeries, reassignSeries, stopSeries } from '@/lib/db/series';
import { getStaffMember } from '@/lib/db/staff';
import { requireOwner } from '@/lib/auth';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Recurring sessions (Elisa only). Series are created with a booking (POST /api/cooking-ops/admin
 * with repeatEveryWeeks); this route changes them:
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

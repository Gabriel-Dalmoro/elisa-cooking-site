import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { getClientById } from '@/lib/db/clients';
import { setLinkSent } from '@/lib/db/linkSends';
import { canAccessClient, forbidden } from '@/lib/access';

/** POST { clientId, weekStart, sent } → ticks / unticks « Lien envoyé » for that client and week. */
export async function POST(req: NextRequest) {
    const { staff, denied } = await requireStaff();
    if (denied) return denied;
    try {
        const body = await req.json();
        if (typeof body.clientId !== 'string' || typeof body.weekStart !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.weekStart) || typeof body.sent !== 'boolean') {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }
        const client = await getClientById(body.clientId);
        if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
        // A chef only for their own clients
        if (!canAccessClient(staff, client)) return forbidden('Ce client ne vous est pas attribué');
        await setLinkSent(client.id, body.weekStart, body.sent, staff.userId === 'preview' ? null : staff.userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 400 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { setSessionsSkipped } from '@/lib/db/invoicing';

/** POST { clientId, sessionIds, skip } → « ne pas facturer » (gift card, free session…), or undo. */
export async function POST(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const body = await req.json();
        if (typeof body.clientId !== 'string' || !Array.isArray(body.sessionIds) || body.sessionIds.length === 0 || typeof body.skip !== 'boolean') {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }
        await setSessionsSkipped(body.clientId, body.sessionIds.map(String).slice(0, 100), body.skip);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 400 });
    }
}

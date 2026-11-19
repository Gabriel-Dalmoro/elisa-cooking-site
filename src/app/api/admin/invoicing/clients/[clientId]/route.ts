import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { getClientById } from '@/lib/db/clients';
import { getClientBilling, listSkipped, saveClientBilling } from '@/lib/db/invoicing';
import { isBillingPlan, isBillingRhythm } from '@/lib/invoicing/types';

type Params = { params: Promise<{ clientId: string }> };

/** GET → how this client is billed + the sessions marked « ne pas facturer ». */
export async function GET(_req: NextRequest, { params }: Params) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const { clientId } = await params;
        const [billing, skipped] = await Promise.all([getClientBilling(clientId), listSkipped(clientId)]);
        return NextResponse.json({ billing, skipped });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

/** PUT { rhythm?, plan?, customPriceCents? } → the client's billing rhythm and price plan. */
export async function PUT(req: NextRequest, { params }: Params) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const { clientId } = await params;
        if (!(await getClientById(clientId))) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
        const body = await req.json();
        const patch: Parameters<typeof saveClientBilling>[1] = {};
        if (body.rhythm !== undefined) {
            if (!isBillingRhythm(body.rhythm)) return NextResponse.json({ error: 'Rythme invalide' }, { status: 400 });
            patch.rhythm = body.rhythm;
        }
        if (body.plan !== undefined) {
            if (!isBillingPlan(body.plan)) return NextResponse.json({ error: 'Tarif invalide' }, { status: 400 });
            patch.plan = body.plan;
        }
        if (body.customPriceCents !== undefined) {
            const cents = body.customPriceCents === null || body.customPriceCents === '' ? null : Number(body.customPriceCents);
            if (cents !== null && (!Number.isInteger(cents) || cents < 0 || cents > 10_000_00)) {
                return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
            }
            patch.customPriceCents = cents;
        }
        return NextResponse.json({ success: true, billing: await saveClientBilling(clientId, patch) });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

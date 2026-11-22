import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { createInvoice, listInvoices } from '@/lib/db/invoicing';
import { isInvoiceStatus } from '@/lib/invoicing/logic';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const errorResponse = (error: unknown, status = 500) =>
    NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status });

/** GET ?status=&clientId=&from=&to= → invoice history (Elisa only). */
export async function GET(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const p = new URL(req.url).searchParams;
        const status = p.get('status');
        const from = p.get('from');
        const to = p.get('to');
        const invoices = await listInvoices({
            status: isInvoiceStatus(status) ? status : undefined,
            clientId: p.get('clientId') || undefined,
            from: from && ISO_DATE.test(from) ? from : undefined,
            to: to && ISO_DATE.test(to) ? to : undefined
        });
        return NextResponse.json({ invoices });
    } catch (error) {
        return errorResponse(error);
    }
}

/** POST { clientId, items: [{ sessionId, priceCents, label? }], notes? } → groups sessions into one invoice. */
export async function POST(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const body = await req.json();
        if (typeof body.clientId !== 'string' || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }
        const items = body.items.map((i: { sessionId?: unknown; priceCents?: unknown; label?: unknown }) => ({
            sessionId: String(i.sessionId || ''),
            priceCents: Number(i.priceCents),
            label: typeof i.label === 'string' ? i.label : undefined
        }));
        const invoice = await createInvoice({ clientId: body.clientId, items, notes: typeof body.notes === 'string' ? body.notes : '' });
        return NextResponse.json({ success: true, invoice });
    } catch (error) {
        return errorResponse(error, 400);
    }
}

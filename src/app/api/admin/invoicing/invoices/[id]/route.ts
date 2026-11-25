import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { updateInvoice, type InvoiceAction } from '@/lib/db/invoicing';

type Params = { params: Promise<{ id: string }> };
const ACTIONS: InvoiceAction[] = ['mark_invoiced', 'mark_paid', 'undo_paid', 'undo_invoiced', 'cancel', 'edit'];

/**
 * PATCH { action, externalNumber?, date?, notes? }
 *   mark_invoiced (« Facturé », with the invoice number) · mark_paid (« Payé ») · undo_paid · undo_invoiced
 *   cancel (sessions go back to « À facturer ») · edit (number / note only)
 */
export async function PATCH(req: NextRequest, { params }: Params) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const { id } = await params;
        const body = await req.json();
        if (!ACTIONS.includes(body.action)) return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
        const invoice = await updateInvoice(id, body.action, {
            externalNumber: typeof body.externalNumber === 'string' || body.externalNumber === null ? body.externalNumber : undefined,
            date: typeof body.date === 'string' ? body.date : null,
            notes: typeof body.notes === 'string' || body.notes === null ? body.notes : undefined
        });
        return NextResponse.json({ success: true, invoice });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 400 });
    }
}

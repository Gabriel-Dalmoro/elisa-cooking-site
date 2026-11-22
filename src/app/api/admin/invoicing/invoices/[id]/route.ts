import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { resendInvoice, updateInvoice, type InvoiceAction } from '@/lib/db/invoicing';

type Params = { params: Promise<{ id: string }> };
const ACTIONS: InvoiceAction[] = ['mark_invoiced', 'mark_paid', 'undo_paid', 'undo_invoiced', 'cancel', 'edit'];

/**
 * PATCH { action, externalNumber?, date?, notes? }
 *   mark_invoiced (« Facturé », with the Abby number) · mark_paid (« Payé ») · undo_paid · undo_invoiced
 *   cancel (sessions go back to « À facturer ») · edit (number / note only)
 *   resend (Abby connection only: sends the invoice to Abby again, reusing any draft already made)
 */
export async function PATCH(req: NextRequest, { params }: Params) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const { id } = await params;
        const body = await req.json();
        if (body.action === 'resend') return NextResponse.json({ success: true, invoice: await resendInvoice(id) });
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

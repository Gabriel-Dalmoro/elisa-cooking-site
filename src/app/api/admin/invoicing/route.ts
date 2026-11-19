import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { loadBillingOverview } from '@/lib/db/invoicing';
import { getInvoicingProvider } from '@/lib/invoicing/providers';

/**
 * Facturation overview (Elisa only): sessions waiting to be invoiced, grouped by client with
 * their due date, plus open invoices. Prices never leave owner-only routes.
 */
export async function GET() {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const [overview, provider] = await Promise.all([loadBillingOverview(), getInvoicingProvider()]);
        return NextResponse.json({
            ...overview,
            provider: { id: provider.id, label: provider.label, createsInvoices: provider.createsInvoices }
        });
    } catch (error) {
        console.error('Invoicing overview failed:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

import type { ClientProfile } from '../../types/cooking-ops';
import type { ClientBilling, Invoice, SyncStatus } from '../types';

/**
 * Where invoices are really issued. The app groups sessions into an invoice and tracks it;
 * a provider is what (optionally) mirrors that invoice into an invoicing tool.
 *
 *   manual (default) → nothing is sent anywhere: Elisa creates the invoice in Abby herself and
 *                      marks it « Facturé » / « Payé » in the app.
 *   abby (future)    → the app creates the invoice in Abby through its API. Switched on only by
 *                      INVOICING_PROVIDER=abby + ABBY_API_KEY (see docs/abby-integration.md).
 */

export type InvoicingProviderId = 'manual' | 'abby';

export interface ProviderContext {
    invoice: Invoice;
    client: ClientProfile | null; // null if the client was deleted since
    billing: ClientBilling;
}

/** What a provider reports back; saved on the invoice (and the client's Abby id on client_billing). */
export interface ProviderResult {
    syncStatus: SyncStatus;
    abbyInvoiceId?: string;
    abbyState?: string; // Abby's own state: draft, finalized, paid…
    abbyPaymentRequestStatus?: string; // URSSAF avance immédiate status
    abbyContactId?: string;
    externalNumber?: string; // the invoice number in the tool
    paidAt?: string; // ISO date-time, when the tool says it is paid
    error?: string;
}

export interface InvoicingProvider {
    id: InvoicingProviderId;
    label: string;
    /** True when the provider creates invoices itself (the page then hides « créer dans Abby » steps). */
    createsInvoices: boolean;
    /** Called right after Elisa groups sessions into an invoice. */
    pushInvoice(ctx: ProviderContext): Promise<ProviderResult>;
    /** Reads the invoice's state in the tool (paid?). null = nothing to read. */
    refreshInvoice(ctx: ProviderContext): Promise<ProviderResult | null>;
    /** Elisa marked the invoice paid in the app: mirror it in the tool if possible. */
    recordPayment(ctx: ProviderContext, paidAtIso: string): Promise<ProviderResult | null>;
    /** Elisa cancelled the invoice in the app. */
    cancelInvoice(ctx: ProviderContext): Promise<ProviderResult | null>;
}

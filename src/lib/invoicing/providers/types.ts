import type { ClientProfile } from '../../types/cooking-ops';
import type { ClientBilling, Invoice, SyncStatus } from '../types';
import type { AbbyContactCandidate } from '../abbyMatch';

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

/** The tool's client list, to link each of our clients to ONE contact there (Abby only). */
export interface ContactDirectory {
    /** Contacts that could be this client (searched by name; the tool can't search by e-mail). */
    search(client: ClientProfile, query?: string): Promise<AbbyContactCandidate[]>;
    /** One contact by id; null if it doesn't exist any more. */
    get(id: string): Promise<AbbyContactCandidate | null>;
    /** Creates the contact. Only ever called when Elisa clicks « Créer dans Abby ». */
    create(client: ClientProfile): Promise<AbbyContactCandidate>;
}

export interface InvoicingProvider {
    /** Present when the provider has its own client list (Abby). */
    contacts?: ContactDirectory;
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

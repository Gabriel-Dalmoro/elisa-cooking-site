/**
 * Facturation: billing tracked per session, invoices grouped in the app.
 * Every amount is in cents (integers) so totals add up exactly. Owner-only data:
 * nothing here is ever sent to a chef (server routes check the owner role, and the tables
 * are owner-only in Supabase RLS — migration 010).
 */

export type BillingRhythm = 'per_session' | 'weekly' | 'biweekly' | 'monthly';
export type BillingPlan = 'abonnement' | 'ponctuel' | 'carte_cadeau' | 'prix_libre';

export const BILLING_RHYTHMS: { id: BillingRhythm; label: string; hint: string }[] = [
    { id: 'per_session', label: 'Après chaque séance', hint: 'Facture le lendemain de chaque séance' },
    { id: 'weekly', label: 'Chaque semaine', hint: 'Facture le lundi pour la semaine écoulée' },
    { id: 'biweekly', label: 'Toutes les 2 semaines', hint: 'Facture un lundi sur deux pour les 2 semaines écoulées' },
    { id: 'monthly', label: 'Chaque mois', hint: 'Facture le 1er du mois pour le mois écoulé' }
];

export const BILLING_PLANS: { id: BillingPlan; label: string; hint: string }[] = [
    { id: 'abonnement', label: 'Abonnement', hint: 'Prix du catalogue −15 %' },
    { id: 'ponctuel', label: 'Ponctuel', hint: 'Prix du catalogue' },
    { id: 'carte_cadeau', label: 'Carte cadeau', hint: 'Déjà payé : rien à facturer' },
    { id: 'prix_libre', label: 'Prix libre', hint: 'Un prix par séance fixé à la main' }
];

export const isBillingRhythm = (v: unknown): v is BillingRhythm => BILLING_RHYTHMS.some(r => r.id === v);
export const isBillingPlan = (v: unknown): v is BillingPlan => BILLING_PLANS.some(p => p.id === v);

export interface ClientBilling {
    clientId: string;
    rhythm: BillingRhythm;
    plan: BillingPlan;
    customPriceCents: number | null;
    abbyContactId: string | null; // future Abby connection
}

export const DEFAULT_CLIENT_BILLING: Omit<ClientBilling, 'clientId'> = {
    rhythm: 'monthly',
    plan: 'abonnement',
    customPriceCents: null,
    abbyContactId: null
};

/** Status of one session's billing. « À facturer » covers both « not grouped yet » and « in a draft invoice ». */
export type SessionBillingStatus = 'to_invoice' | 'invoiced' | 'paid' | 'skipped';

/** draft = grouped here, to create in Abby · invoiced = « Facturé » · paid = « Payé » · cancelled */
export type InvoiceStatus = 'draft' | 'invoiced' | 'paid' | 'cancelled';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    draft: 'À créer dans Abby',
    invoiced: 'Facturé',
    paid: 'Payé',
    cancelled: 'Annulée'
};

export type SyncStatus = 'not_synced' | 'pending' | 'synced' | 'error';

/** One line of an invoice: one session (snapshot taken when the invoice was grouped). */
export interface InvoiceLine {
    sessionId: string | null;
    date: string; // YYYY-MM-DD
    timeSlot: string | null;
    dishCount: number | null;
    personCount: number | null;
    label: string;
    priceCents: number;
}

export interface Invoice {
    id: string;
    clientId: string | null;
    clientName: string;
    status: InvoiceStatus;
    totalCents: number;
    lines: InvoiceLine[];
    periodStart: string | null;
    periodEnd: string | null;
    notes: string;
    externalNumber: string | null;
    invoicedAt: string | null;
    paidAt: string | null;
    cancelledAt: string | null;
    provider: 'manual' | 'abby';
    abbyInvoiceId: string | null;
    abbyState: string | null;
    abbyPaymentRequestStatus: string | null;
    syncStatus: SyncStatus;
    syncError: string | null;
    createdAt: string;
}

/** A session that can be invoiced (not grouped yet), with its suggested price. */
export interface BillableSession {
    sessionId: string;
    date: string; // YYYY-MM-DD
    dayName: string;
    timeSlot: string;
    dishCount: number;
    personCount: number;
    completed: boolean; // the session has taken place
    label: string;
    suggestedPriceCents: number; // from the client's plan and the catalogue
    priceIsEstimate: boolean; // no catalogue price for this dish count: worked out at 40 €/dish
}

export type DueState = 'overdue' | 'due_today' | 'upcoming' | 'none';

export interface ClientBillingGroup {
    clientId: string;
    clientName: string;
    billing: ClientBilling;
    completed: BillableSession[]; // done, not invoiced yet
    upcoming: BillableSession[]; // booked, not done yet (can be invoiced in advance)
    completedTotalCents: number;
    dueDate: string | null; // when the next invoice is due, from the client's rhythm
    dueState: DueState;
    openInvoices: Invoice[]; // draft or invoiced, not paid yet
}

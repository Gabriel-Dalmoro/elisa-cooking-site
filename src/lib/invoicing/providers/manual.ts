import type { InvoicingProvider } from './types';

/**
 * Manual invoicing (the default): the app does the maths and tracks the status;
 * Elisa creates each invoice in Abby herself from the summary, then marks it Facturé / Payé.
 * Never makes a network call.
 */
export const manualProvider: InvoicingProvider = {
    id: 'manual',
    label: 'Manuel (Elisa crée la facture dans Abby)',
    createsInvoices: false,
    async pushInvoice() {
        return { syncStatus: 'not_synced' };
    },
    async refreshInvoice() {
        return null;
    },
    async recordPayment() {
        return null;
    },
    async cancelInvoice() {
        return null;
    }
};

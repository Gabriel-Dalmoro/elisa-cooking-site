import type { ClientProfile } from '../../types/cooking-ops';
import type { InvoicingProvider, ProviderContext, ProviderResult } from './types';

/**
 * Abby provider — WRITTEN, NOT ENABLED. Nothing imports this file unless INVOICING_PROVIDER=abby
 * (see ./index.ts), and every call re-checks that switch and the key, so with the default
 * (manual) no code path can reach the Abby API.
 *
 * Built from what already works in the n8n « Elisa Booking Workflow » and from Abby's official
 * docs (https://docs.abby.fr/llms.txt). Every endpoint below is listed with its source and
 * confidence in docs/abby-integration.md — read it before switching on.
 *
 * Scope on purpose: the app creates a DRAFT invoice in Abby (contact, lines, online payment on).
 * Elisa finalises it in Abby herself: for an avance immédiate client, finalising sends the
 * payment request to URSSAF and the invoice can no longer be changed
 * (https://aide.abby.fr/fr/articles/6657420), and the public API documents no avance immédiate
 * option — so that step stays a deliberate click in Abby.
 */

// n8n calls api.app-abby.com successfully; the OpenAPI blocks in the docs list api.abby.fr.
const DEFAULT_BASE_URL = 'https://api.app-abby.com';

interface AbbyConfig {
    baseUrl: string;
    apiKey: string;
    userAgent: string;
    quantityUnit: string;
}

/** The only place the key is read. Throws unless the Abby provider is explicitly switched on. */
function abbyConfig(): AbbyConfig {
    if ((process.env.INVOICING_PROVIDER || '').trim().toLowerCase() !== 'abby') {
        throw new Error('La connexion Abby est désactivée (INVOICING_PROVIDER n’est pas « abby »).');
    }
    const apiKey = (process.env.ABBY_API_KEY || '').trim();
    if (!apiKey) throw new Error('ABBY_API_KEY manquant : impossible d’appeler Abby.');
    return {
        baseUrl: (process.env.ABBY_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
        apiKey,
        // n8n had to send a browser User-Agent; configurable in case Abby still requires it
        userAgent: process.env.ABBY_USER_AGENT || 'ElisaBatchCooking/1.0 (+https://elisabatchcooking.com)',
        // Abby's ProductUnit for a « forfait » line is not confirmed in the docs (see the integration doc)
        quantityUnit: process.env.ABBY_QUANTITY_UNIT || 'unit'
    };
}

class AbbyError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
    }
}

async function abbyRequest<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT', path: string, body?: unknown): Promise<T> {
    const config = abbyConfig();
    const res = await fetch(`${config.baseUrl}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${config.apiKey}`, // https://docs.abby.fr/api/authentification.md
            Accept: 'application/json',
            'User-Agent': config.userAgent,
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000)
    });
    const text = await res.text();
    if (!res.ok) {
        // Error shape: { type, code, message, param } — https://docs.abby.fr/api/erreurs.md
        let message = text.slice(0, 300);
        try { message = (JSON.parse(text) as { message?: string }).message || message; } catch { /* keep the text */ }
        throw new AbbyError(`Abby ${method} ${path} → ${res.status} : ${message}`, res.status);
    }
    return (text ? JSON.parse(text) : {}) as T;
}

// ---------------------------------------------------------------- mapping

interface AbbyContactInput {
    firstname: string;
    lastname: string;
    emails?: string[];
    phone?: string;
    billingAddress?: { address: string; zipCode: string; city: string; country: string };
}

/** Our client → Abby contact (individual). Same rules as the n8n workflow, without its fallbacks to Annecy. */
export function toAbbyContact(client: ClientProfile): AbbyContactInput {
    const parts = client.name.trim().split(/\s+/);
    const firstname = parts[0] || client.name;
    const lastname = parts.slice(1).join(' ') || firstname; // POST /contact requires both
    const contact: AbbyContactInput = { firstname, lastname };
    if (client.email) contact.emails = [client.email];
    if (client.phone) contact.phone = client.phone;
    const zip = client.address?.match(/\b(\d{5})\b/);
    if (client.address && zip) {
        const city = client.address.slice((zip.index || 0) + 5).replace(/^[\s,]+/, '').split(/[,(]/)[0].trim();
        const street = client.address.slice(0, zip.index).replace(/[\s,]+$/, '');
        if (street && city) contact.billingAddress = { address: street, zipCode: zip[1], city, country: 'FR' };
    }
    return contact;
}

/** One session → one Abby line. unitPrice is in cents; FR_00HT + service_delivery as in n8n. */
export function toAbbyLines(ctx: ProviderContext, quantityUnit: string) {
    return ctx.invoice.lines.map(line => ({
        designation: `${line.label} — séance du ${line.date.split('-').reverse().join('/')}`,
        quantity: 1,
        quantityUnit,
        unitPrice: line.priceCents,
        vatCode: 'FR_00HT',
        type: 'service_delivery'
    }));
}

interface AbbyContactListItem { id: string; fullname?: string; emails?: string[] }
interface AbbyInvoice { id: string; number?: string; state?: string; customer?: { id?: string }; paymentRequest?: { statut?: string } }

/** The client's Abby contact: the saved id, else found by e-mail / exact name, else created. */
async function ensureContact(ctx: ProviderContext): Promise<string> {
    if (ctx.billing.abbyContactId) return ctx.billing.abbyContactId;
    if (!ctx.client) throw new AbbyError('Client supprimé : impossible de créer son contact Abby.');
    const client = ctx.client;
    const search = client.email || client.name;
    const found = await abbyRequest<{ docs?: AbbyContactListItem[] }>(
        'GET', `/contacts?search=${encodeURIComponent(search)}&page=1&limit=10`
    );
    const email = client.email?.trim().toLowerCase();
    const match = (found.docs || []).find(c =>
        (email && (c.emails || []).some(e => e.trim().toLowerCase() === email))
        || (c.fullname || '').trim().toLowerCase() === client.name.trim().toLowerCase()
    );
    if (match) return match.id;
    const created = await abbyRequest<{ id: string }>('POST', '/contact', toAbbyContact(client));
    return created.id;
}

export function createAbbyProvider(): InvoicingProvider {
    abbyConfig(); // refuse to build the provider at all unless switched on with a key
    return {
        id: 'abby',
        label: 'Abby (connexion API)',
        createsInvoices: true,

        async pushInvoice(ctx): Promise<ProviderResult> {
            try {
                const contactId = await ensureContact(ctx);
                // POST /v2/billing/invoice/{customerId} — no request body defined in the spec
                const draft = await abbyRequest<AbbyInvoice>('POST', `/v2/billing/invoice/${encodeURIComponent(contactId)}`, {});
                await abbyRequest('PATCH', `/v2/billing/${encodeURIComponent(draft.id)}/lines`, {
                    lines: toAbbyLines(ctx, abbyConfig().quantityUnit)
                });
                const withPayment = await abbyRequest<AbbyInvoice>(
                    'PATCH', `/v2/billing/invoice/${encodeURIComponent(draft.id)}/general-informations`,
                    { isOnlinePaymentActivated: true }
                );
                return {
                    syncStatus: 'synced',
                    abbyContactId: contactId,
                    abbyInvoiceId: draft.id,
                    abbyState: withPayment.state || draft.state || 'draft',
                    externalNumber: withPayment.number || draft.number
                };
            } catch (error) {
                return { syncStatus: 'error', error: error instanceof Error ? error.message : String(error) };
            }
        },

        async refreshInvoice() {
            // No « get one invoice » endpoint confirmed in the docs yet (see the integration doc):
            // nothing is read until it is.
            return null;
        },

        async recordPayment() {
            // POST /v2/accounting-billing/invoice/{invoiceId}/reconciliate (« Mark an invoice as paid »)
            // exists, but its body is not documented: payments stay marked in Abby by Elisa for now.
            return null;
        },

        async cancelInvoice(ctx) {
            // A finalised Abby invoice can only be cancelled with a credit note, in Abby.
            // A draft is simply left in Abby for Elisa to delete.
            return ctx.invoice.abbyInvoiceId ? { syncStatus: 'synced' } : null;
        }
    };
}

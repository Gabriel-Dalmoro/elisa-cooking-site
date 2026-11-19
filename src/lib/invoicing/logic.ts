import { PRICING_CONFIG } from '../pricing';
import type { BillingPlan, BillingRhythm, DueState, InvoiceLine, InvoiceStatus } from './types';

/**
 * Invoicing rules, as pure functions (no database, no network): used by the server routes,
 * the Facturation page and the checks. Amounts are in cents.
 */

// ---------------------------------------------------------------- dates (plain YYYY-MM-DD)

const toUtc = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (iso: string, days: number) => fromUtc(toUtc(iso) + days * 86400000);

/** Today in Paris, YYYY-MM-DD. */
export function parisToday(now = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(now);
}

/** Monday of the week of a date. */
export function mondayOf(iso: string): string {
    const weekday = new Date(toUtc(iso)).getUTCDay(); // 0 = Sunday
    return addDays(iso, -((weekday + 6) % 7));
}

// Two-week periods all start on a Monday counted from this one, so they never drift
const BIWEEKLY_ANCHOR = '2026-01-05';

/**
 * When the invoice covering a session is due, from the client's rhythm:
 * - after each session: the day after
 * - weekly: the Monday after the session's week
 * - every 2 weeks: the Monday after the session's two-week period
 * - monthly: the 1st of the next month
 */
export function dueDateFor(rhythm: BillingRhythm, sessionDate: string): string {
    switch (rhythm) {
        case 'per_session':
            return addDays(sessionDate, 1);
        case 'weekly':
            return addDays(mondayOf(sessionDate), 7);
        case 'biweekly': {
            const days = Math.round((toUtc(sessionDate) - toUtc(BIWEEKLY_ANCHOR)) / 86400000);
            const period = Math.floor(days / 14);
            return addDays(BIWEEKLY_ANCHOR, (period + 1) * 14);
        }
        case 'monthly': {
            const [y, m] = sessionDate.split('-').map(Number);
            return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
        }
    }
}

/** Due date of a client's next invoice: driven by their oldest session not invoiced yet. */
export function clientDue(rhythm: BillingRhythm, uninvoicedDates: string[], today: string): { dueDate: string | null; dueState: DueState } {
    if (uninvoicedDates.length === 0) return { dueDate: null, dueState: 'none' };
    const oldest = [...uninvoicedDates].sort()[0];
    const dueDate = dueDateFor(rhythm, oldest);
    const dueState: DueState = dueDate < today ? 'overdue' : dueDate === today ? 'due_today' : 'upcoming';
    return { dueDate, dueState };
}

const DUE_ORDER: Record<DueState, number> = { overdue: 0, due_today: 1, upcoming: 2, none: 3 };

/** Overdue first (oldest due date first), then due today, then the rest. */
export function compareByDue(
    a: { dueState: DueState; dueDate: string | null; clientName: string },
    b: { dueState: DueState; dueDate: string | null; clientName: string }
): number {
    return DUE_ORDER[a.dueState] - DUE_ORDER[b.dueState]
        || (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
        || a.clientName.localeCompare(b.clientName, 'fr');
}

// ---------------------------------------------------------------- prices

// Every catalogue formula is 40 € per dish (3 → 120, 5 → 200, 6 → 240): used for other dish counts
const PER_DISH_EUROS = (() => {
    const tiers = Object.values(PRICING_CONFIG.TIERS);
    return Math.round(tiers.reduce((sum, t) => sum + t.basePrice / t.meals, 0) / tiers.length);
})();

/**
 * Suggested price of one session (before the 50 % tax credit), from the client's plan.
 * `estimate` = no catalogue formula for this dish count (worked out per dish) or an agreed price
 * not set yet: Elisa should check the amount.
 */
export function sessionPriceCents(input: {
    plan: BillingPlan;
    customPriceCents: number | null;
    dishCount: number;
    personCount: number;
}): { cents: number; estimate: boolean } {
    if (input.plan === 'carte_cadeau') return { cents: 0, estimate: false };
    if (input.plan === 'prix_libre' && input.customPriceCents != null) return { cents: input.customPriceCents, estimate: false };

    const tier = Object.values(PRICING_CONFIG.TIERS).find(t => t.meals === input.dishCount);
    const baseEuros = tier ? tier.basePrice : Math.max(1, input.dishCount) * PER_DISH_EUROS;
    const extraPeople = Math.max(0, input.personCount - 1) * PRICING_CONFIG.EXTRA_PERSON_FEE;
    const catalogueCents = (baseEuros + extraPeople) * 100;
    const cents = input.plan === 'abonnement'
        ? Math.round(catalogueCents * (1 - PRICING_CONFIG.SUB_DISCOUNT))
        : catalogueCents;
    return { cents, estimate: !tier || input.plan === 'prix_libre' };
}

// ---------------------------------------------------------------- wording

/** 1234567 → « 12 345,67 € » */
export function formatEuros(cents: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100).replace(/ | /g, ' ');
}

/** « 4 novembre 2026 » (or « mardi 4 novembre 2026 ») */
export function formatDateFr(iso: string, withDay = false): string {
    const date = new Date(`${iso}T12:00:00Z`);
    return new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'UTC',
        ...(withDay ? { weekday: 'long' as const } : {}),
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

/** The invoice line for one session, as it would read in Abby. */
export function sessionLabel(dishCount: number, personCount: number): string {
    return `Batch cooking à domicile — ${dishCount} recette${dishCount > 1 ? 's' : ''} pour ${personCount} personne${personCount > 1 ? 's' : ''}`;
}

/** « du 3 au 24 novembre 2026 », « le 4 novembre 2026 », « du 28 octobre au 4 novembre 2026 » */
export function formatPeriod(start: string | null, end: string | null): string {
    if (!start) return '';
    if (!end || end === start) return `le ${formatDateFr(start)}`;
    const [sy, sm] = start.split('-');
    const [ey, em] = end.split('-');
    const startText = sy !== ey
        ? formatDateFr(start)
        : sm !== em
            ? formatDateFr(start).replace(` ${sy}`, '')
            : String(Number(start.slice(8)));
    return `du ${startText} au ${formatDateFr(end)}`;
}

export function totalOf(lines: Pick<InvoiceLine, 'priceCents'>[]): number {
    return lines.reduce((sum, l) => sum + l.priceCents, 0);
}

/**
 * The summary Elisa copies into Abby: client, period, number of sessions, one line per session
 * with its amount, the total, and the avance immédiate split (URSSAF pays half).
 */
export function invoiceSummary(input: { clientName: string; lines: InvoiceLine[]; notes?: string }): string {
    const lines = [...input.lines].sort((a, b) => a.date.localeCompare(b.date));
    const total = totalOf(lines);
    const period = formatPeriod(lines[0]?.date || null, lines[lines.length - 1]?.date || null);
    const out = [
        `Client : ${input.clientName}`,
        `Période : ${period}`,
        `${lines.length} séance${lines.length > 1 ? 's' : ''}`,
        '',
        ...lines.map(l => {
            const date = formatDateFr(l.date, true);
            return `• ${date.charAt(0).toUpperCase()}${date.slice(1)} · ${l.label} : ${formatEuros(l.priceCents)}`;
        }),
        '',
        `Total : ${formatEuros(total)}`,
        `Avec l'avance immédiate : l'URSSAF règle ${formatEuros(Math.round(total / 2))}, le client ${formatEuros(total - Math.round(total / 2))}.`
    ];
    if (input.notes?.trim()) out.push('', `Note : ${input.notes.trim()}`);
    return out.join('\n');
}

// ---------------------------------------------------------------- CSV export

export interface CsvRow {
    date: string;
    clientName: string;
    timeSlot: string;
    dishCount: number | null;
    personCount: number | null;
    label: string;
    priceCents: number;
    status: 'to_invoice' | 'in_draft' | 'invoiced' | 'paid' | 'skipped';
    invoiceNumber: string;
    invoicedAt: string | null;
    paidAt: string | null;
}

export const CSV_STATUS_LABELS: Record<CsvRow['status'], string> = {
    to_invoice: 'À facturer',
    in_draft: 'À facturer (regroupée, à créer dans Abby)',
    invoiced: 'Facturé',
    paid: 'Payé',
    skipped: 'Ne pas facturer'
};

const csvCell = (value: string | number | null) => {
    const text = value == null ? '' : String(value);
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const csvAmount = (cents: number) => (cents / 100).toFixed(2).replace('.', ','); // French Excel
const csvDate = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');

/** Semicolon-separated with a BOM, so Excel in French opens it with accents and euros right. */
export function toCsv(rows: CsvRow[]): string {
    const header = ['Date séance', 'Client', 'Créneau', 'Recettes', 'Personnes', 'Libellé', 'Montant (€)', 'Statut', 'N° facture', 'Facturé le', 'Payé le'];
    const body = [...rows]
        .sort((a, b) => a.date.localeCompare(b.date) || a.clientName.localeCompare(b.clientName, 'fr'))
        .map(r => [
            csvDate(r.date), r.clientName, r.timeSlot, r.dishCount, r.personCount, r.label,
            csvAmount(r.priceCents), CSV_STATUS_LABELS[r.status], r.invoiceNumber, csvDate(r.invoicedAt), csvDate(r.paidAt)
        ].map(csvCell).join(';'));
    return '﻿' + [header.join(';'), ...body].join('\r\n') + '\r\n';
}

export const isInvoiceStatus = (v: unknown): v is InvoiceStatus =>
    v === 'draft' || v === 'invoiced' || v === 'paid' || v === 'cancelled';

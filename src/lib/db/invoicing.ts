import { getSupabaseAdmin } from '../supabase/admin';
import { listClients, getClientById } from './clients';
import { getSession, listSessions } from './sessions';
import { withClientCounts } from '../clientCounts';
import { getParisDateTimeInfo } from '../dateUtils';
import type { BookingSession, ClientProfile } from '../types/cooking-ops';
import {
    addDays, clientDue, compareByDue, parisToday, sessionLabel, sessionPriceCents, totalOf, type CsvRow
} from '../invoicing/logic';
import {
    DEFAULT_CLIENT_BILLING, isBillingPlan, isBillingRhythm,
    type BillableSession, type ClientBilling, type ClientBillingGroup, type Invoice, type InvoiceLine,
    type InvoiceStatus, type SessionBillingStatus
} from '../invoicing/types';
import { getInvoicingProvider, type ProviderResult } from '../invoicing/providers';
import { matchAbbyContact, type AbbyContactCandidate, type ContactMatch } from '../invoicing/abbyMatch';

/**
 * Facturation data (owner only — every route calling these checks the owner role, and the tables
 * are owner-only in Supabase RLS, migration 010).
 *
 * A session is « À facturer » once it has taken place, as long as it has no session_billing row.
 * Grouping sessions into an invoice takes a snapshot of each (date, counts, label, price) in
 * session_billing, so the history stays right even if the planning changes later.
 */

const DEFAULT_TRACKING_START = '2026-11-01';
// Upcoming sessions shown for invoicing in advance (e.g. a one-off client paying beforehand)
const UPCOMING_DAYS = 60;

const db = () => getSupabaseAdmin();
const missingTables = (message: string) => /client_billing|session_billing|invoices|billing_settings/.test(message) && /exist|schema cache/i.test(message);
const fail = (what: string, message: string): never => {
    throw new Error(missingTables(message)
        ? 'La facturation n’est pas encore activée : lancez la migration 010 dans Supabase.'
        : `${what} : ${message}`);
};

// ---------------------------------------------------------------- rows

interface ClientBillingRow {
    client_id: string;
    rhythm: string;
    plan: string;
    custom_price_cents: number | null;
    abby_contact_id: string | null;
}

interface InvoiceRow {
    id: string;
    client_id: string | null;
    client_name: string;
    status: InvoiceStatus;
    total_cents: number;
    lines: unknown;
    period_start: string | null;
    period_end: string | null;
    notes: string | null;
    external_number: string | null;
    invoiced_at: string | null;
    paid_at: string | null;
    cancelled_at: string | null;
    provider: 'manual' | 'abby';
    abby_invoice_id: string | null;
    abby_state: string | null;
    abby_payment_request_status: string | null;
    sync_status: Invoice['syncStatus'];
    sync_error: string | null;
    created_at: string;
}

interface SessionBillingRow {
    id: string;
    session_id: string | null;
    client_id: string | null;
    session_date: string;
    time_slot: string | null;
    dish_count: number | null;
    person_count: number | null;
    label: string;
    price_cents: number;
    status: SessionBillingStatus;
    invoice_id: string | null;
    invoiced_at: string | null;
    paid_at: string | null;
}

function rowToBilling(clientId: string, row?: ClientBillingRow | null): ClientBilling {
    if (!row) return { clientId, ...DEFAULT_CLIENT_BILLING };
    return {
        clientId,
        rhythm: isBillingRhythm(row.rhythm) ? row.rhythm : DEFAULT_CLIENT_BILLING.rhythm,
        plan: isBillingPlan(row.plan) ? row.plan : DEFAULT_CLIENT_BILLING.plan,
        customPriceCents: row.custom_price_cents,
        abbyContactId: row.abby_contact_id
    };
}

function rowToInvoice(row: InvoiceRow): Invoice {
    return {
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        status: row.status,
        totalCents: row.total_cents,
        lines: Array.isArray(row.lines) ? (row.lines as InvoiceLine[]) : [],
        periodStart: row.period_start,
        periodEnd: row.period_end,
        notes: row.notes || '',
        externalNumber: row.external_number,
        invoicedAt: row.invoiced_at,
        paidAt: row.paid_at,
        cancelledAt: row.cancelled_at,
        provider: row.provider,
        abbyInvoiceId: row.abby_invoice_id,
        abbyState: row.abby_state,
        abbyPaymentRequestStatus: row.abby_payment_request_status,
        syncStatus: row.sync_status,
        syncError: row.sync_error,
        createdAt: row.created_at
    };
}

// ---------------------------------------------------------------- settings

export async function getTrackingStart(): Promise<string> {
    const { data, error } = await db().from('billing_settings').select('value').eq('key', 'tracking_start').maybeSingle();
    if (error) fail('Lecture des réglages de facturation impossible', error.message);
    const value = (data as { value?: string } | null)?.value;
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : DEFAULT_TRACKING_START;
}

export async function setTrackingStart(dateIso: string): Promise<void> {
    const { error } = await db()
        .from('billing_settings')
        .upsert({ key: 'tracking_start', value: dateIso, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) fail('Enregistrement du réglage impossible', error.message);
}

// ---------------------------------------------------------------- client billing

export async function getClientBillingMap(): Promise<Map<string, ClientBilling>> {
    const { data, error } = await db().from('client_billing').select('*');
    if (error) fail('Lecture des réglages clients impossible', error.message);
    return new Map((data as ClientBillingRow[]).map(r => [r.client_id, rowToBilling(r.client_id, r)]));
}

export async function getClientBilling(clientId: string): Promise<ClientBilling> {
    const { data, error } = await db().from('client_billing').select('*').eq('client_id', clientId).maybeSingle();
    if (error) fail('Lecture du réglage client impossible', error.message);
    return rowToBilling(clientId, data as ClientBillingRow | null);
}

export async function saveClientBilling(
    clientId: string,
    patch: Partial<Pick<ClientBilling, 'rhythm' | 'plan' | 'customPriceCents' | 'abbyContactId'>>
): Promise<ClientBilling> {
    const current = await getClientBilling(clientId);
    const next = { ...current, ...patch };
    const { data, error } = await db()
        .from('client_billing')
        .upsert({
            client_id: clientId,
            rhythm: next.rhythm,
            plan: next.plan,
            custom_price_cents: next.customPriceCents,
            abby_contact_id: next.abbyContactId,
            updated_at: new Date().toISOString()
        }, { onConflict: 'client_id' })
        .select('*')
        .single();
    if (error) fail('Enregistrement du réglage client impossible', error.message);
    return rowToBilling(clientId, data as ClientBillingRow);
}

// ---------------------------------------------------------------- invoices

export async function listInvoices(filters: { status?: InvoiceStatus; clientId?: string; from?: string; to?: string } = {}): Promise<Invoice[]> {
    let query = db().from('invoices').select('*').order('created_at', { ascending: false });
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.clientId) query = query.eq('client_id', filters.clientId);
    // An invoice is in a date range when its sessions are
    if (filters.from) query = query.gte('period_end', filters.from);
    if (filters.to) query = query.lte('period_start', filters.to);
    const { data, error } = await query.limit(1000);
    if (error) fail('Lecture des factures impossible', error.message);
    return (data as InvoiceRow[]).map(rowToInvoice);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await db().from('invoices').select('*').eq('id', id).maybeSingle();
    if (error) fail('Lecture de la facture impossible', error.message);
    return data ? rowToInvoice(data as InvoiceRow) : null;
}

async function listSessionBilling(sinceIso: string): Promise<SessionBillingRow[]> {
    const { data, error } = await db().from('session_billing').select('*').gte('session_date', sinceIso);
    if (error) fail('Lecture du suivi des séances impossible', error.message);
    return data as SessionBillingRow[];
}

// ---------------------------------------------------------------- overview

/** Has the session taken place? The end of its slot is past (or, without times, the day is past). */
function isCompleted(session: BookingSession, today: string, now: Date): boolean {
    if (session.endsAt) return new Date(session.endsAt).getTime() <= now.getTime();
    return session.dateIso < today;
}

function toBillable(session: BookingSession, client: ClientProfile, billing: ClientBilling, today: string, now: Date): BillableSession {
    const counted = withClientCounts(session, client);
    const price = sessionPriceCents({
        plan: billing.plan,
        customPriceCents: billing.customPriceCents,
        dishCount: counted.dishCount,
        personCount: counted.personCount
    });
    return {
        sessionId: session.id,
        date: session.dateIso,
        dayName: getParisDateTimeInfo(session.dateIso).dayName,
        timeSlot: session.timeSlot,
        dishCount: counted.dishCount,
        personCount: counted.personCount,
        completed: isCompleted(session, today, now),
        label: sessionLabel(counted.dishCount, counted.personCount),
        suggestedPriceCents: price.cents,
        priceIsEstimate: price.estimate
    };
}

/** Same client, same day, same slot (a booking entered twice): only one is billable. */
function dedupe(sessions: BookingSession[]): BookingSession[] {
    const seen = new Set<string>();
    return sessions.filter(s => {
        const key = `${s.clientId}|${s.dateIso}|${s.timeSlot}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export async function loadBillingOverview(now = new Date()) {
    const today = parisToday(now);
    const trackingStart = await getTrackingStart();
    const [clients, sessions, billingMap, billed, invoices] = await Promise.all([
        listClients(),
        listSessions(trackingStart, addDays(today, UPCOMING_DAYS)),
        getClientBillingMap(),
        listSessionBilling(trackingStart),
        listInvoices()
    ]);
    const clientById = new Map(clients.map(c => [c.id, c]));
    const handled = new Set(billed.map(b => b.session_id).filter((id): id is string => Boolean(id)));

    const groups = new Map<string, ClientBillingGroup>();
    const groupFor = (client: ClientProfile): ClientBillingGroup => {
        let group = groups.get(client.id);
        if (!group) {
            group = {
                clientId: client.id,
                clientName: client.name,
                billing: billingMap.get(client.id) || { clientId: client.id, ...DEFAULT_CLIENT_BILLING },
                completed: [],
                upcoming: [],
                completedTotalCents: 0,
                dueDate: null,
                dueState: 'none',
                openInvoices: []
            };
            groups.set(client.id, group);
        }
        return group;
    };

    for (const session of dedupe(sessions)) {
        if (!session.clientId || handled.has(session.id)) continue;
        const client = clientById.get(session.clientId);
        if (!client) continue; // a calendar event that matches no client: nothing to invoice
        const group = groupFor(client);
        const billable = toBillable(session, client, group.billing, today, now);
        (billable.completed ? group.completed : group.upcoming).push(billable);
    }

    // Invoices still open (to create in Abby, or waiting for payment)
    for (const invoice of invoices) {
        if (invoice.status !== 'draft' && invoice.status !== 'invoiced') continue;
        const client = invoice.clientId ? clientById.get(invoice.clientId) : undefined;
        if (client) groupFor(client).openInvoices.push(invoice);
    }

    for (const group of groups.values()) {
        group.completedTotalCents = totalOf(group.completed.map(s => ({ priceCents: s.suggestedPriceCents })));
        Object.assign(group, clientDue(group.billing.rhythm, group.completed.map(s => s.date), today));
    }

    return {
        today,
        trackingStart,
        groups: [...groups.values()].sort(compareByDue),
        allClients: clients.map(c => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    };
}

// ---------------------------------------------------------------- grouping into an invoice

async function sessionsOfClient(clientId: string, sessionIds: string[]) {
    const unique = [...new Set(sessionIds)];
    if (unique.length === 0) throw new Error('Choisissez au moins une séance.');
    const sessions = await Promise.all(unique.map(id => getSession(id)));
    for (const [i, session] of sessions.entries()) {
        if (!session) throw new Error(`Séance introuvable (${unique[i]}).`);
        if (session.clientId !== clientId) throw new Error('Une des séances n’appartient pas à ce client.');
    }
    return sessions as BookingSession[];
}

/** Rows already holding these sessions (in an invoice, or marked « ne pas facturer »). */
async function billingRowsFor(sessionIds: string[]): Promise<SessionBillingRow[]> {
    const { data, error } = await db().from('session_billing').select('*').in('session_id', sessionIds);
    if (error) fail('Lecture du suivi des séances impossible', error.message);
    return data as SessionBillingRow[];
}

/** Saves what the provider reported on the invoice (and the client's Abby contact id). */
async function applyProviderResult(invoice: Invoice, result: ProviderResult | null): Promise<Invoice> {
    if (!result) return invoice;
    const update: Record<string, unknown> = {
        sync_status: result.syncStatus,
        sync_error: result.error || null,
        updated_at: new Date().toISOString()
    };
    if (result.syncStatus === 'synced') update.synced_at = new Date().toISOString();
    if (result.abbyInvoiceId) update.abby_invoice_id = result.abbyInvoiceId;
    if (result.abbyState) update.abby_state = result.abbyState;
    if (result.abbyPaymentRequestStatus) update.abby_payment_request_status = result.abbyPaymentRequestStatus;
    if (result.externalNumber) update.external_number = result.externalNumber;
    const { data, error } = await db().from('invoices').update(update).eq('id', invoice.id).select('*').single();
    if (error) fail('Mise à jour de la synchronisation impossible', error.message);
    if (result.abbyContactId && invoice.clientId) {
        await saveClientBilling(invoice.clientId, { abbyContactId: result.abbyContactId }).catch(() => undefined);
    }
    return rowToInvoice(data as InvoiceRow);
}

/**
 * Groups sessions of one client into one invoice (status « À créer dans Abby »), at the amounts
 * Elisa confirmed. The sessions leave the « À facturer » list.
 */
const MAX_LABEL_LENGTH = 200;
/** One line of text, no extra spaces. */
const cleanLabel = (text: string) => text.replace(/\s+/g, ' ').trim();

export async function createInvoice(input: {
    clientId: string;
    items: { sessionId: string; priceCents: number; label?: string }[];
    notes?: string;
}): Promise<Invoice> {
    const client = await getClientById(input.clientId);
    if (!client) throw new Error('Client introuvable');
    for (const item of input.items) {
        if (!Number.isInteger(item.priceCents) || item.priceCents < 0 || item.priceCents > 10_000_00) {
            throw new Error('Montant invalide (entre 0 et 10 000 €).');
        }
        if (item.label !== undefined && cleanLabel(item.label).length > MAX_LABEL_LENGTH) {
            throw new Error(`Texte de séance trop long (${MAX_LABEL_LENGTH} caractères maximum).`);
        }
    }
    const priceById = new Map(input.items.map(i => [i.sessionId, i.priceCents]));
    // The text Elisa typed for a session (e.g. « 4 recettes » that week); empty = the usual text
    const labelById = new Map(input.items.map(i => [i.sessionId, cleanLabel(i.label || '')]));
    const sessions = await sessionsOfClient(client.id, input.items.map(i => i.sessionId));

    const existing = await billingRowsFor(sessions.map(s => s.id));
    const taken = existing.filter(r => r.status !== 'skipped');
    if (taken.length > 0) throw new Error('Une des séances est déjà dans une facture. Rechargez la page.');

    const lines: InvoiceLine[] = sessions
        .map(session => {
            const counted = withClientCounts(session, client);
            return {
                sessionId: session.id,
                date: session.dateIso,
                timeSlot: session.timeSlot,
                dishCount: counted.dishCount,
                personCount: counted.personCount,
                label: labelById.get(session.id) || sessionLabel(counted.dishCount, counted.personCount),
                priceCents: priceById.get(session.id) ?? 0
            };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    const { data: created, error } = await db()
        .from('invoices')
        .insert({
            client_id: client.id,
            client_name: client.name,
            status: 'draft',
            total_cents: totalOf(lines),
            lines,
            period_start: lines[0].date,
            period_end: lines[lines.length - 1].date,
            notes: (input.notes || '').trim().slice(0, 1000) || null,
            provider: (await getInvoicingProvider()).id
        })
        .select('*')
        .single();
    if (error) fail('Création de la facture impossible', error.message);
    const invoice = rowToInvoice(created as InvoiceRow);

    // Sessions marked « ne pas facturer » before can be invoiced after all
    const skipped = existing.filter(r => r.status === 'skipped').map(r => r.id);
    if (skipped.length > 0) await db().from('session_billing').delete().in('id', skipped);

    const now = new Date().toISOString();
    const { error: linkError } = await db().from('session_billing').insert(lines.map(line => ({
        session_id: line.sessionId,
        client_id: client.id,
        session_date: line.date,
        time_slot: line.timeSlot,
        dish_count: line.dishCount,
        person_count: line.personCount,
        label: line.label,
        price_cents: line.priceCents,
        status: 'to_invoice',
        invoice_id: invoice.id,
        status_changed_at: now
    })));
    if (linkError) {
        // Don't leave an invoice without its sessions
        await db().from('invoices').delete().eq('id', invoice.id);
        fail('Création de la facture impossible', linkError.message);
    }

    const provider = await getInvoicingProvider();
    const billing = await getClientBilling(client.id);
    return applyProviderResult(invoice, await provider.pushInvoice({ invoice, client, billing }));
}

export type InvoiceAction = 'mark_invoiced' | 'mark_paid' | 'undo_paid' | 'undo_invoiced' | 'cancel' | 'edit';

/**
 * Status changes, each dated:
 *   draft → invoiced (« Facturé », with the Abby number) → paid (« Payé »)
 *   undo_paid / undo_invoiced step back; cancel frees the sessions (they are « À facturer » again).
 */
export async function updateInvoice(
    id: string,
    action: InvoiceAction,
    input: { externalNumber?: string | null; date?: string | null; notes?: string | null } = {}
): Promise<Invoice> {
    const invoice = await getInvoice(id);
    if (!invoice) throw new Error('Facture introuvable');
    const at = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? `${input.date}T12:00:00.000Z` : new Date().toISOString();
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { updated_at: now };
    let sessions: Record<string, unknown> | 'free' | null = null;

    const allowed: Record<InvoiceAction, InvoiceStatus[]> = {
        mark_invoiced: ['draft'],
        mark_paid: ['draft', 'invoiced'],
        undo_paid: ['paid'],
        undo_invoiced: ['invoiced'],
        cancel: ['draft', 'invoiced'],
        edit: ['draft', 'invoiced', 'paid', 'cancelled']
    };
    if (!allowed[action].includes(invoice.status)) {
        throw new Error('Cette action n’est pas possible pour une facture dans cet état. Rechargez la page.');
    }
    if (input.externalNumber !== undefined) update.external_number = (input.externalNumber || '').trim().slice(0, 60) || null;
    if (input.notes !== undefined) update.notes = (input.notes || '').trim().slice(0, 1000) || null;

    switch (action) {
        case 'mark_invoiced':
            Object.assign(update, { status: 'invoiced', invoiced_at: at });
            sessions = { status: 'invoiced', invoiced_at: at, status_changed_at: now };
            break;
        case 'mark_paid':
            Object.assign(update, { status: 'paid', paid_at: at, invoiced_at: invoice.invoicedAt || at });
            sessions = { status: 'paid', paid_at: at, invoiced_at: invoice.invoicedAt || at, status_changed_at: now };
            break;
        case 'undo_paid':
            Object.assign(update, { status: 'invoiced', paid_at: null });
            sessions = { status: 'invoiced', paid_at: null, status_changed_at: now };
            break;
        case 'undo_invoiced':
            Object.assign(update, { status: 'draft', invoiced_at: null });
            sessions = { status: 'to_invoice', invoiced_at: null, status_changed_at: now };
            break;
        case 'cancel':
            Object.assign(update, { status: 'cancelled', cancelled_at: now });
            sessions = 'free';
            break;
        case 'edit':
            break;
    }

    const { data, error } = await db().from('invoices').update(update).eq('id', id).select('*').single();
    if (error) fail('Mise à jour de la facture impossible', error.message);
    if (sessions === 'free') {
        const { error: freeError } = await db().from('session_billing').delete().eq('invoice_id', id);
        if (freeError) fail('Libération des séances impossible', freeError.message);
    } else if (sessions) {
        const { error: rowsError } = await db().from('session_billing').update({ ...sessions, updated_at: now }).eq('invoice_id', id);
        if (rowsError) fail('Mise à jour des séances impossible', rowsError.message);
    }

    const saved = rowToInvoice(data as InvoiceRow);
    const provider = await getInvoicingProvider();
    if (provider.id === 'manual' || !saved.clientId) return saved;
    const ctx = { invoice: saved, client: await getClientById(saved.clientId), billing: await getClientBilling(saved.clientId) };
    if (action === 'mark_paid') return applyProviderResult(saved, await provider.recordPayment(ctx, at));
    if (action === 'cancel') return applyProviderResult(saved, await provider.cancelInvoice(ctx));
    return saved;
}

// ---------------------------------------------------------------- « ne pas facturer »

/** Marks sessions as not to be invoiced (gift card, free session…), or puts them back. */
export async function setSessionsSkipped(clientId: string, sessionIds: string[], skip: boolean): Promise<void> {
    const client = await getClientById(clientId);
    if (!client) throw new Error('Client introuvable');
    const sessions = await sessionsOfClient(client.id, sessionIds);
    const existing = await billingRowsFor(sessions.map(s => s.id));
    if (!skip) {
        const ids = existing.filter(r => r.status === 'skipped').map(r => r.id);
        if (ids.length > 0) {
            const { error } = await db().from('session_billing').delete().in('id', ids);
            if (error) fail('Mise à jour impossible', error.message);
        }
        return;
    }
    if (existing.some(r => r.status !== 'skipped')) throw new Error('Une des séances est déjà dans une facture.');
    const already = new Set(existing.map(r => r.session_id));
    const rows = sessions.filter(s => !already.has(s.id)).map(session => {
        const counted = withClientCounts(session, client);
        return {
            session_id: session.id,
            client_id: client.id,
            session_date: session.dateIso,
            time_slot: session.timeSlot,
            dish_count: counted.dishCount,
            person_count: counted.personCount,
            label: sessionLabel(counted.dishCount, counted.personCount),
            price_cents: 0,
            status: 'skipped'
        };
    });
    if (rows.length === 0) return;
    const { error } = await db().from('session_billing').insert(rows);
    if (error) fail('Mise à jour impossible', error.message);
}

/** Sessions marked « ne pas facturer », to show them (and undo) on the client's panel. */
export async function listSkipped(clientId: string): Promise<{ sessionId: string | null; date: string; label: string }[]> {
    const { data, error } = await db()
        .from('session_billing')
        .select('session_id, session_date, label')
        .eq('client_id', clientId)
        .eq('status', 'skipped')
        .order('session_date', { ascending: false })
        .limit(50);
    if (error) fail('Lecture impossible', error.message);
    return (data as { session_id: string | null; session_date: string; label: string }[])
        .map(r => ({ sessionId: r.session_id, date: r.session_date, label: r.label }));
}

// ---------------------------------------------------------------- CSV export

/**
 * Every session of a date range with its billing status: invoiced / paid ones from their snapshot
 * (even if the session was since deleted from the planning), the others from the planning.
 */
export async function exportRows(from: string, to: string, now = new Date()): Promise<CsvRow[]> {
    const today = parisToday(now);
    const trackingStart = await getTrackingStart();
    const [clients, sessions, billingMap, billedResult, invoices] = await Promise.all([
        listClients(),
        listSessions(from, to),
        getClientBillingMap(),
        db().from('session_billing').select('*').gte('session_date', from).lte('session_date', to),
        listInvoices()
    ]);
    if (billedResult.error) fail('Lecture du suivi des séances impossible', billedResult.error.message);
    const billed = billedResult.data as SessionBillingRow[];
    const clientById = new Map(clients.map(c => [c.id, c]));
    const invoiceById = new Map(invoices.map(i => [i.id, i]));
    const rows: CsvRow[] = [];

    for (const b of billed) {
        const invoice = b.invoice_id ? invoiceById.get(b.invoice_id) : undefined;
        const status: CsvRow['status'] = b.status === 'to_invoice' ? 'in_draft' : b.status;
        rows.push({
            date: b.session_date,
            clientName: (b.client_id && clientById.get(b.client_id)?.name) || invoice?.clientName || '',
            timeSlot: b.time_slot || '',
            dishCount: b.dish_count,
            personCount: b.person_count,
            label: b.label,
            priceCents: b.price_cents,
            status,
            invoiceNumber: invoice?.externalNumber || '',
            invoicedAt: b.invoiced_at,
            paidAt: b.paid_at
        });
    }

    const handled = new Set(billed.map(b => b.session_id));
    for (const session of dedupe(sessions)) {
        if (!session.clientId || handled.has(session.id)) continue;
        const client = clientById.get(session.clientId);
        if (!client) continue;
        if (session.dateIso < trackingStart || !isCompleted(session, today, now)) continue; // only what is really to invoice
        const billable = toBillable(session, client, billingMap.get(client.id) || { clientId: client.id, ...DEFAULT_CLIENT_BILLING }, today, now);
        rows.push({
            date: billable.date,
            clientName: client.name,
            timeSlot: billable.timeSlot,
            dishCount: billable.dishCount,
            personCount: billable.personCount,
            label: billable.label,
            priceCents: billable.suggestedPriceCents,
            status: 'to_invoice',
            invoiceNumber: '',
            invoicedAt: null,
            paidAt: null
        });
    }
    return rows;
}

// ---------------------------------------------------------------- Abby client link (Abby provider only)

export interface AbbyLinkState {
    /** false while the provider is « manual »: nothing here calls Abby. */
    enabled: boolean;
    linked: AbbyContactCandidate | null;
    /** The saved link points to a contact that is gone or archived in Abby. */
    linkBroken: boolean;
    match: ContactMatch | null;
}

async function contactDirectory() {
    const provider = await getInvoicingProvider();
    return provider.contacts || null;
}

/** Who this client is in Abby: the saved link, or contacts to choose from (searched by name). */
export async function getAbbyLink(clientId: string, query?: string): Promise<AbbyLinkState> {
    const directory = await contactDirectory();
    if (!directory) return { enabled: false, linked: null, linkBroken: false, match: null };
    const client = await getClientById(clientId);
    if (!client) throw new Error('Client introuvable');
    const billing = await getClientBilling(clientId);
    if (billing.abbyContactId && !query) {
        const linked = await directory.get(billing.abbyContactId);
        if (linked && !linked.archived) return { enabled: true, linked, linkBroken: false, match: null };
        return { enabled: true, linked: null, linkBroken: true, match: matchAbbyContact(client, await directory.search(client)) };
    }
    return { enabled: true, linked: null, linkBroken: false, match: matchAbbyContact(client, await directory.search(client, query)) };
}

/** Elisa picked this Abby contact for the client: checked to exist, then saved. */
export async function linkAbbyContact(clientId: string, contactId: string): Promise<AbbyContactCandidate> {
    const directory = await contactDirectory();
    if (!directory) throw new Error('La connexion Abby est désactivée.');
    if (!(await getClientById(clientId))) throw new Error('Client introuvable');
    const contact = await directory.get(contactId);
    if (!contact || contact.archived) throw new Error('Ce contact n’existe pas ou est archivé dans Abby.');
    await saveClientBilling(clientId, { abbyContactId: contact.id });
    return contact;
}

/** Elisa clicked « Créer dans Abby »: refused if the client is already linked (no duplicate). */
export async function createAbbyContactFor(clientId: string): Promise<AbbyContactCandidate> {
    const directory = await contactDirectory();
    if (!directory) throw new Error('La connexion Abby est désactivée.');
    const client = await getClientById(clientId);
    if (!client) throw new Error('Client introuvable');
    const billing = await getClientBilling(clientId);
    if (billing.abbyContactId && (await directory.get(billing.abbyContactId))) {
        throw new Error('Ce client est déjà relié à un contact Abby.');
    }
    const contact = await directory.create(client);
    await saveClientBilling(clientId, { abbyContactId: contact.id });
    return contact;
}

export async function unlinkAbbyContact(clientId: string): Promise<void> {
    await saveClientBilling(clientId, { abbyContactId: null });
}

/** « Renvoyer vers Abby »: after linking the client, or when Abby failed. Reuses any draft already made. */
export async function resendInvoice(id: string): Promise<Invoice> {
    const provider = await getInvoicingProvider();
    if (!provider.contacts) throw new Error('La connexion Abby est désactivée.');
    const invoice = await getInvoice(id);
    if (!invoice) throw new Error('Facture introuvable');
    if (invoice.status !== 'draft') throw new Error('Seule une facture pas encore créée dans Abby peut être renvoyée.');
    if (invoice.syncStatus === 'synced') throw new Error('Cette facture est déjà dans Abby.');
    if (!invoice.clientId) throw new Error('Client supprimé : impossible d’envoyer la facture.');
    const ctx = { invoice, client: await getClientById(invoice.clientId), billing: await getClientBilling(invoice.clientId) };
    return applyProviderResult(invoice, await provider.pushInvoice(ctx));
}

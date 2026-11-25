'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, ChevronRight, Clock, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useConfirm } from '@/components/admin/useConfirm';
import { useToast } from '@/components/admin/useToast';
import ClientBillingPanel from '@/components/admin/invoicing/ClientBillingPanel';
import InvoiceCard from '@/components/admin/invoicing/InvoiceCard';
import { addDays, formatDateFr, formatEuros } from '@/lib/invoicing/logic';
import {
    BILLING_RHYTHMS, INVOICE_STATUS_LABELS,
    type BillingPlan, type BillingRhythm, type ClientBillingGroup, type Invoice, type InvoiceStatus
} from '@/lib/invoicing/types';

interface Overview {
    today: string;
    trackingStart: string;
    groups: ClientBillingGroup[];
    allClients: { id: string; name: string }[];
}

type Tab = 'todo' | 'history' | 'export';

const shortDate = (iso: string) => formatDateFr(iso).replace(/ \d{4}$/, '');

function DueBadge({ group }: { group: ClientBillingGroup }) {
    if (group.dueState === 'overdue') return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full border border-red-300 bg-red-50 text-red-700 px-2 py-0.5">
            <AlertTriangle className="w-3 h-3" /> En retard · à facturer depuis le {shortDate(group.dueDate!)}
        </span>
    );
    if (group.dueState === 'due_today') return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full border border-amber-300 bg-amber-50 text-amber-800 px-2 py-0.5">
            <Clock className="w-3 h-3" /> À facturer aujourd&apos;hui
        </span>
    );
    if (group.dueState === 'upcoming') return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full border border-stone-200 bg-stone-50 text-stone-600 px-2 py-0.5">
            <CalendarClock className="w-3 h-3" /> Prochaine facture le {shortDate(group.dueDate!)}
        </span>
    );
    return null;
}

/**
 * Facturation (Elisa only). Every session that has taken place is « À facturer » until it is
 * grouped into an invoice here (« À envoyer »); Elisa makes the invoice from the summary, then marks
 * it « Facturé » and « Payé ».
 */
export default function FacturationPage() {
    const [tab, setTab] = useState<Tab>('todo');
    const [overview, setOverview] = useState<Overview | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [openClientId, setOpenClientId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const { showToast, toastElement } = useToast();
    const { confirm, confirmDialog } = useConfirm();

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/invoicing', { cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Chargement impossible');
            setOverview(data);
            setLoadError(null);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : 'Chargement impossible');
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const call = async (url: string, method: string, body: unknown, done?: string): Promise<{ invoice?: Invoice } | null> => {
        setBusy(true);
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Action impossible');
            await load();
            if (done) showToast(done, 'check');
            return data;
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Action impossible', 'error');
            return null;
        } finally {
            setBusy(false);
        }
    };

    const invoiceAction = async (invoice: Invoice, action: string, extra: { externalNumber?: string; date?: string } = {}) => {
        if (action === 'cancel' && !(await confirm({
            title: `Annuler cette facture de ${invoice.clientName} ?`,
            description: `Ses ${invoice.lines.length} séance(s) redeviennent « À facturer ». Si la facture a déjà été envoyée, faites aussi un avoir.`,
            confirmLabel: 'Annuler la facture',
            tone: 'danger'
        }))) return;
        const messages: Record<string, string> = {
            mark_invoiced: 'Facture marquée « Facturé »',
            mark_paid: 'Facture marquée « Payé »',
            undo_paid: 'Facture remise en attente de paiement',
            undo_invoiced: 'Facture remise « À envoyer »',
            cancel: 'Facture annulée : séances remises à facturer',
            edit: 'Numéro enregistré'
        };
        await call(`/api/admin/invoicing/invoices/${encodeURIComponent(invoice.id)}`, 'PATCH', {
            action,
            ...(extra.externalNumber !== undefined ? { externalNumber: extra.externalNumber } : {}),
            ...(extra.date ? { date: extra.date } : {})
        }, messages[action]);
    };

    const copied = (ok: boolean) => showToast(ok ? 'Récapitulatif copié' : 'Copie impossible', ok ? 'check' : 'error');

    const groups = overview?.groups || [];
    const waiting = groups.filter(g => g.completed.length > 0);
    const late = waiting.filter(g => g.dueState === 'overdue' || g.dueState === 'due_today');
    const toInvoiceTotal = waiting.reduce((sum, g) => sum + g.completedTotalCents, 0);
    const openInvoices = groups.flatMap(g => g.openInvoices);
    const openGroup = groups.find(g => g.clientId === openClientId) || null;

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-28">
            <AdminPageHeader title="Facturation" />

            <main className="max-w-6xl mx-auto px-4 space-y-5">
                {overview && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white rounded-2xl border border-stone-200 p-4">
                            <p className="t-label">À facturer</p>
                            <p className="text-2xl font-bold tabular-nums">{formatEuros(toInvoiceTotal)}</p>
                            <p className="text-xs text-stone-500">{(() => { const n = waiting.reduce((t, g) => t + g.completed.length, 0); return `${n} séance${n > 1 ? 's' : ''} · ${waiting.length} client${waiting.length > 1 ? 's' : ''}`; })()}</p>
                        </div>
                        <div className={`rounded-2xl border p-4 ${late.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
                            <p className="t-label">À faire aujourd&apos;hui</p>
                            <p className={`text-2xl font-bold ${late.length > 0 ? 'text-red-700' : ''}`}>{late.length}</p>
                            <p className="text-xs text-stone-500">client{late.length > 1 ? 's' : ''} dû{late.length > 1 ? 's' : ''} ou en retard</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-stone-200 p-4">
                            <p className="t-label">À envoyer</p>
                            <p className="text-2xl font-bold">{openInvoices.filter(i => i.status === 'draft').length}</p>
                            <p className="text-xs text-stone-500">facture(s) regroupée(s)</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-stone-200 p-4">
                            <p className="t-label">En attente de paiement</p>
                            <p className="text-2xl font-bold tabular-nums">{formatEuros(openInvoices.filter(i => i.status === 'invoiced').reduce((s, i) => s + i.totalCents, 0))}</p>
                            <p className="text-xs text-stone-500">{openInvoices.filter(i => i.status === 'invoiced').length} facture(s)</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center bg-stone-100 p-1 rounded-full border border-stone-200">
                        {([['todo', 'À facturer'], ['history', 'Factures'], ['export', 'Export CSV']] as const).map(([id, label]) => (
                            <button
                                key={id}
                                onClick={() => setTab(id)}
                                className={`px-4 h-9 text-sm font-semibold rounded-full whitespace-nowrap ${tab === id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {loadError && <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-2xl text-sm font-semibold">{loadError}</div>}
                {!overview && !loadError && <div className="bg-white rounded-3xl p-10 text-center text-stone-500 border border-stone-200">Chargement…</div>}

                {overview && tab === 'todo' && (
                    <TodoList
                        overview={overview}
                        onOpen={setOpenClientId}
                        onTrackingStart={date => call('/api/admin/invoicing/settings', 'PUT', { trackingStart: date }, 'Date de début du suivi enregistrée')}
                        busy={busy}
                    />
                )}
                {overview && tab === 'history' && (
                    <History clients={overview.allClients} busy={busy} onAction={invoiceAction} onCopied={copied} reloadKey={JSON.stringify(openInvoices.map(i => [i.id, i.status]))} />
                )}
                {overview && tab === 'export' && <ExportPanel today={overview.today} />}
            </main>

            <Dialog open={!!openGroup} onOpenChange={open => { if (!open) setOpenClientId(null); }}>
                <DialogContent className="sm:max-w-2xl bg-white rounded-3xl p-6">
                    {openGroup && overview && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-serif font-semibold text-2xl leading-tight text-stone-900 text-left">{openGroup.clientName}</DialogTitle>
                                <div className="text-left"><DueBadge group={openGroup} /></div>
                            </DialogHeader>
                            <ClientBillingPanel
                                group={openGroup}
                                busy={busy}
                                onSaveBilling={async patch => {
                                    await call(`/api/admin/invoicing/clients/${encodeURIComponent(openGroup.clientId)}`, 'PUT', patch, 'Réglage enregistré');
                                }}
                                onCreateInvoice={async (items, notes) => {
                                    const data = await call('/api/admin/invoicing/invoices', 'POST', { clientId: openGroup.clientId, items, notes }, 'Facture regroupée : copiez le récapitulatif');
                                    return data?.invoice || null;
                                }}
                                onSkip={async (sessionIds, skip) => {
                                    await call('/api/admin/invoicing/sessions', 'POST', { clientId: openGroup.clientId, sessionIds, skip }, skip ? 'Séance(s) marquée(s) « ne pas facturer »' : 'Séance remise à facturer');
                                }}
                                onInvoiceAction={invoiceAction}
                                onCopied={copied}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {confirmDialog}
            {toastElement}
        </div>
    );
}

// ---------------------------------------------------------------- « À facturer »

function TodoList({ overview, onOpen, onTrackingStart, busy }: {
    overview: Overview;
    onOpen: (clientId: string) => void;
    onTrackingStart: (date: string) => void;
    busy: boolean;
}) {
    const [editStart, setEditStart] = useState(false);
    const [start, setStart] = useState(overview.trackingStart);
    const rhythmLabel = (r: BillingRhythm) => BILLING_RHYTHMS.find(x => x.id === r)?.label || r;
    const planHint: Record<BillingPlan, string> = { abonnement: 'Abonnement', ponctuel: 'Ponctuel', carte_cadeau: 'Carte cadeau', prix_libre: 'Prix libre' };
    const shown = overview.groups.filter(g => g.completed.length > 0 || g.openInvoices.length > 0);
    const onlyUpcoming = overview.groups.filter(g => g.completed.length === 0 && g.openInvoices.length === 0 && g.upcoming.length > 0);

    return (
        <div className="space-y-3">
            {shown.length === 0 && (
                <div className="bg-white rounded-3xl p-10 text-center text-stone-500 border border-stone-200">
                    Rien à facturer pour l&apos;instant 🎉
                </div>
            )}
            {shown.map(group => (
                <button
                    key={group.clientId}
                    type="button"
                    onClick={() => onOpen(group.clientId)}
                    className={`w-full text-left bg-white rounded-2xl border p-4 hover:shadow-md transition-all flex items-center gap-4 ${
                        group.dueState === 'overdue' ? 'border-red-300' : group.dueState === 'due_today' ? 'border-amber-300' : 'border-stone-200'
                    }`}
                >
                    <span className="flex-1 min-w-0 space-y-1.5">
                        <span className="flex flex-wrap items-center gap-2">
                            <span className="t-card-title">{group.clientName}</span>
                            <DueBadge group={group} />
                        </span>
                        <span className="block text-xs text-stone-500">
                            {rhythmLabel(group.billing.rhythm)} · {planHint[group.billing.plan]}
                        </span>
                        {group.completed.length > 0 && (
                            <span className="block text-xs text-stone-700">
                                <strong>{group.completed.length} séance{group.completed.length > 1 ? 's' : ''}</strong> : {group.completed.map(s => shortDate(s.date)).join(', ')}
                            </span>
                        )}
                        {group.openInvoices.length > 0 && (
                            <span className="flex flex-wrap gap-1.5">
                                {group.openInvoices.map(i => (
                                    <span key={i.id} className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 ${i.status === 'draft' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-sky-50 text-sky-800 border-sky-300'}`}>
                                        {INVOICE_STATUS_LABELS[i.status]} · {formatEuros(i.totalCents)}
                                    </span>
                                ))}
                            </span>
                        )}
                    </span>
                    {group.completed.length > 0 && (
                        <span className="text-xl font-bold tabular-nums text-stone-900 shrink-0">{formatEuros(group.completedTotalCents)}</span>
                    )}
                    <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
                </button>
            ))}

            {onlyUpcoming.length > 0 && (
                <div className="pt-2 space-y-2">
                    <h3 className="t-label px-1">Séances à venir</h3>
                    <div className="flex flex-wrap gap-2">
                        {onlyUpcoming.map(g => (
                            <button key={g.clientId} type="button" onClick={() => onOpen(g.clientId)} className="text-xs font-semibold rounded-full border border-stone-300 bg-white px-3 py-1.5 hover:border-[#E1567A]">
                                {g.clientName} · {g.upcoming.length} à venir
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-[11px] text-stone-500 pt-3 flex flex-wrap items-center gap-2">
                <Receipt className="w-3.5 h-3.5" />
                {editStart ? (
                    <>
                        Suivi à partir du
                        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="p-1 rounded-lg border border-stone-300" />
                        <Button size="sm" disabled={busy || !start} onClick={() => { onTrackingStart(start); setEditStart(false); }} className="h-7 rounded-full text-[11px]">Enregistrer</Button>
                        <button type="button" onClick={() => setEditStart(false)} className="underline">Annuler</button>
                    </>
                ) : (
                    <>
                        Suivi depuis le {formatDateFr(overview.trackingStart)}
                        <button type="button" onClick={() => setEditStart(true)} className="underline">Changer</button>
                    </>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- « Factures » (history)

function History({ clients, busy, onAction, onCopied, reloadKey }: {
    clients: { id: string; name: string }[];
    busy: boolean;
    onAction: (invoice: Invoice, action: string, extra?: { externalNumber?: string; date?: string }) => Promise<void>;
    onCopied: (ok: boolean) => void;
    reloadKey: string;
}) {
    const [status, setStatus] = useState<'' | InvoiceStatus>('');
    const [clientId, setClientId] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [invoices, setInvoices] = useState<Invoice[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const query = useMemo(() => {
        const p = new URLSearchParams();
        if (status) p.set('status', status);
        if (clientId) p.set('clientId', clientId);
        if (from) p.set('from', from);
        if (to) p.set('to', to);
        return p.toString();
    }, [status, clientId, from, to]);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/admin/invoicing/invoices?${query}`, { cache: 'no-store' })
            .then(async r => {
                const data = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(data.error || 'Chargement impossible');
                if (!cancelled) { setInvoices(data.invoices); setError(null); }
            })
            .catch(e => !cancelled && setError(e instanceof Error ? e.message : 'Chargement impossible'));
        return () => { cancelled = true; };
    }, [query, reloadKey]);

    const total = (invoices || []).filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.totalCents, 0);

    return (
        <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-stone-200 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="space-y-1">
                    <span className="block font-semibold text-stone-600">Statut</span>
                    <select value={status} onChange={e => setStatus(e.target.value as '' | InvoiceStatus)} className="w-full p-2 rounded-xl border border-stone-300 bg-white">
                        <option value="">Tous</option>
                        {(Object.keys(INVOICE_STATUS_LABELS) as InvoiceStatus[]).map(s => <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>)}
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="block font-semibold text-stone-600">Client</span>
                    <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full p-2 rounded-xl border border-stone-300 bg-white">
                        <option value="">Tous</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="block font-semibold text-stone-600">Séances du</span>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 rounded-xl border border-stone-300" />
                </label>
                <label className="space-y-1">
                    <span className="block font-semibold text-stone-600">au</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full p-2 rounded-xl border border-stone-300" />
                </label>
            </div>
            {error && <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-2xl text-sm">{error}</div>}
            {invoices && (
                <p className="text-xs text-stone-500 px-1">{invoices.length} facture(s) · {formatEuros(total)} hors annulées</p>
            )}
            {invoices?.length === 0 && <div className="bg-white rounded-3xl p-10 text-center text-stone-500 border border-stone-200">Aucune facture pour ces filtres.</div>}
            {(invoices || []).map(invoice => (
                <InvoiceCard key={`${invoice.id}-${invoice.status}`} invoice={invoice} busy={busy} onAction={onAction} onCopied={onCopied} />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------- CSV export

function ExportPanel({ today }: { today: string }) {
    const firstOfMonth = `${today.slice(0, 7)}-01`;
    const [from, setFrom] = useState(firstOfMonth);
    const [to, setTo] = useState(today);
    const lastMonthEnd = addDays(firstOfMonth, -1);
    const lastMonthStart = `${lastMonthEnd.slice(0, 7)}-01`;
    const valid = Boolean(from && to && from <= to);

    return (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4 text-sm">
            <div className="flex flex-wrap items-end gap-3">
                <label className="space-y-1">
                    <span className="block text-xs font-semibold text-stone-600">Du</span>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="p-2 rounded-xl border border-stone-300" />
                </label>
                <label className="space-y-1">
                    <span className="block text-xs font-semibold text-stone-600">Au</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="p-2 rounded-xl border border-stone-300" />
                </label>
                <div className="flex gap-2 text-xs">
                    <button type="button" className="underline text-stone-600" onClick={() => { setFrom(firstOfMonth); setTo(today); }}>Ce mois-ci</button>
                    <button type="button" className="underline text-stone-600" onClick={() => { setFrom(lastMonthStart); setTo(lastMonthEnd); }}>Mois dernier</button>
                    <button type="button" className="underline text-stone-600" onClick={() => { setFrom(`${today.slice(0, 4)}-01-01`); setTo(today); }}>Cette année</button>
                </div>
            </div>
            <a
                href={valid ? `/api/admin/invoicing/export?from=${from}&to=${to}` : undefined}
                aria-disabled={!valid}
                className={`inline-flex items-center gap-2 rounded-full px-5 h-10 text-sm font-semibold text-white ${valid ? 'bg-stone-900 hover:bg-stone-800' : 'bg-stone-300 pointer-events-none'}`}
            >
                <Download className="w-4 h-4" /> Télécharger le CSV
            </a>
        </div>
    );
}

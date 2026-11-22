'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Ban, CalendarClock, Receipt, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateFr, formatEuros } from '@/lib/invoicing/logic';
import {
    BILLING_PLANS, BILLING_RHYTHMS,
    type BillableSession, type BillingPlan, type BillingRhythm, type ClientBillingGroup, type Invoice
} from '@/lib/invoicing/types';
import InvoiceCard from './InvoiceCard';
import AbbyLinkPanel from './AbbyLinkPanel';

/** « 212,50 » / « 212.5 » / « 212 » → 21250 cents; null if not a valid amount. */
export function parseEuros(text: string): number | null {
    const clean = text.replace(/\s|€/g, '').replace(',', '.');
    if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
    return Math.round(Number(clean) * 100);
}
const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

interface Props {
    group: ClientBillingGroup;
    busy: boolean;
    providerCreatesInvoices: boolean;
    onSaveBilling: (patch: { rhythm?: BillingRhythm; plan?: BillingPlan; customPriceCents?: number | null }) => Promise<void>;
    onCreateInvoice: (items: { sessionId: string; priceCents: number; label: string }[], notes: string) => Promise<Invoice | null>;
    onSkip: (sessionIds: string[], skip: boolean) => Promise<void>;
    onInvoiceAction: (invoice: Invoice, action: string, extra?: { externalNumber?: string; date?: string }) => Promise<void>;
    onCopied: (ok: boolean) => void;
    onToast: (message: string, ok: boolean) => void;
}

/**
 * One client's billing: how they are billed, the sessions waiting (tick any, at any dates, adjust
 * an amount), « Regrouper en une facture », and their open invoices with the summary for Abby.
 */
export default function ClientBillingPanel({
    group, busy, providerCreatesInvoices, onSaveBilling, onCreateInvoice, onSkip, onInvoiceAction, onCopied, onToast
}: Props) {
    const [selected, setSelected] = useState<string[]>([]);
    const [prices, setPrices] = useState<Record<string, string>>({});
    // The text of each line, editable for a one-off change (e.g. 4 recettes instead of 5 that week)
    const [labels, setLabels] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');
    const [showUpcoming, setShowUpcoming] = useState(false);
    const [customPrice, setCustomPrice] = useState(group.billing.customPriceCents != null ? centsToInput(group.billing.customPriceCents) : '');
    const [skipped, setSkipped] = useState<{ sessionId: string | null; date: string; label: string }[]>([]);
    const [justCreated, setJustCreated] = useState<string | null>(null);

    const all = useMemo(() => [...group.completed, ...group.upcoming], [group]);

    // New sessions / new prices after a reload: refresh the amounts, preselect everything done
    useEffect(() => {
        setPrices(Object.fromEntries(all.map(s => [s.sessionId, centsToInput(s.suggestedPriceCents)])));
        setLabels(Object.fromEntries(all.map(s => [s.sessionId, s.label])));
        setSelected(group.completed.map(s => s.sessionId));
    }, [all, group.completed]);

    useEffect(() => {
        fetch(`/api/admin/invoicing/clients/${encodeURIComponent(group.clientId)}`)
            .then(r => r.json())
            .then(d => setSkipped(d.skipped || []))
            .catch(() => undefined);
    }, [group.clientId, group]);

    const toggle = (id: string) => setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    const chosen = all.filter(s => selected.includes(s.sessionId));
    const labelOf = (s: BillableSession) => labels[s.sessionId] ?? s.label;
    const invalid = chosen.filter(s => parseEuros(prices[s.sessionId] || '') === null || !labelOf(s).trim() || labelOf(s).length > 200);
    const total = chosen.reduce((sum, s) => sum + (parseEuros(prices[s.sessionId] || '') || 0), 0);

    const create = async () => {
        const created = await onCreateInvoice(
            chosen.map(s => ({ sessionId: s.sessionId, priceCents: parseEuros(prices[s.sessionId] || '') || 0, label: labelOf(s).trim() })),
            notes
        );
        if (created) {
            setJustCreated(created.id);
            setNotes('');
        }
    };

    const sessionRow = (s: BillableSession) => (
        <li key={s.sessionId} className="flex items-start gap-3 px-3 py-2.5">
            <input
                type="checkbox"
                checked={selected.includes(s.sessionId)}
                onChange={() => toggle(s.sessionId)}
                className="w-5 h-5 mt-0.5 accent-[#E1567A] shrink-0"
                aria-label={`Séance du ${formatDateFr(s.date)}`}
            />
            <span className="flex-1 min-w-0">
                <span className="block font-semibold text-stone-800 text-sm">
                    {formatDateFr(s.date, true)} <span className="font-normal text-stone-500">· {s.timeSlot}</span>
                </span>
                <input
                    value={labelOf(s)}
                    onChange={e => setLabels(l => ({ ...l, [s.sessionId]: e.target.value }))}
                    maxLength={200}
                    aria-label="Texte de la ligne sur la facture"
                    title="Texte de la ligne sur la facture : modifiable pour cette séance seulement"
                    className={`mt-1 w-full px-2 py-1 rounded-lg border text-xs text-stone-700 bg-white ${labelOf(s).trim() ? 'border-stone-200 hover:border-stone-300 focus:border-stone-400' : 'border-red-400'}`}
                />
                {labelOf(s) !== s.label && (
                    <button type="button" onClick={() => setLabels(l => ({ ...l, [s.sessionId]: s.label }))} className="text-[11px] text-stone-500 underline flex items-center gap-1 mt-0.5">
                        <RotateCcw className="w-3 h-3" /> Rétablir le texte habituel
                    </button>
                )}
                {s.priceIsEstimate && (
                    <span className="text-[11px] text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Prix à vérifier (pas de formule catalogue pour {s.dishCount} plats)
                    </span>
                )}
            </span>
            <label className="flex items-center gap-1 shrink-0 mt-0.5">
                <input
                    value={prices[s.sessionId] ?? ''}
                    onChange={e => setPrices(p => ({ ...p, [s.sessionId]: e.target.value }))}
                    inputMode="decimal"
                    aria-label="Montant"
                    className={`w-24 p-1.5 rounded-lg border text-right tabular-nums text-sm ${parseEuros(prices[s.sessionId] || '') === null ? 'border-red-400' : 'border-stone-300'}`}
                />
                <span className="text-sm text-stone-500">€</span>
            </label>
        </li>
    );

    return (
        <div className="space-y-5 text-sm">
            {/* How this client is billed */}
            <div className={`bg-stone-50 border border-stone-200 rounded-2xl p-3 grid grid-cols-1 gap-3 ${group.billing.plan === 'prix_libre' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                <label className="space-y-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">Rythme de facturation</span>
                    <select
                        value={group.billing.rhythm}
                        disabled={busy}
                        onChange={e => onSaveBilling({ rhythm: e.target.value as BillingRhythm })}
                        className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                    >
                        {BILLING_RHYTHMS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">Tarif</span>
                    <select
                        value={group.billing.plan}
                        disabled={busy}
                        onChange={e => onSaveBilling({ plan: e.target.value as BillingPlan })}
                        className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                    >
                        {BILLING_PLANS.map(p => <option key={p.id} value={p.id}>{p.label} — {p.hint}</option>)}
                    </select>
                </label>
                {group.billing.plan === 'prix_libre' && (
                    <label className="space-y-1">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">Prix par séance</span>
                        <span className="flex items-center gap-1">
                            <input
                                value={customPrice}
                                onChange={e => setCustomPrice(e.target.value)}
                                onBlur={() => {
                                    const cents = customPrice.trim() ? parseEuros(customPrice) : null;
                                    if (cents !== undefined && (cents !== null || !customPrice.trim())) onSaveBilling({ customPriceCents: cents });
                                }}
                                inputMode="decimal"
                                placeholder="ex : 180"
                                className="w-full p-2 rounded-xl border border-stone-300 bg-white text-right"
                            />
                            <span className="text-stone-500">€</span>
                        </span>
                    </label>
                )}
            </div>

            {/* Which Abby contact this client is (only when the Abby connection is on) */}
            {providerCreatesInvoices && (
                <AbbyLinkPanel clientId={group.clientId} clientName={group.clientName} onToast={onToast} />
            )}

            {/* Sessions waiting to be invoiced */}
            <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                        Séances à facturer ({group.completed.length})
                    </h4>
                    {all.length > 0 && (
                        <div className="flex gap-3 text-xs">
                            <button type="button" className="underline text-stone-600" onClick={() => setSelected(group.completed.map(s => s.sessionId))}>Tout cocher</button>
                            <button type="button" className="underline text-stone-600" onClick={() => setSelected([])}>Tout décocher</button>
                        </div>
                    )}
                </div>
                {group.completed.length > 0 ? (
                    <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">{group.completed.map(sessionRow)}</ul>
                ) : (
                    <p className="text-xs text-stone-500 bg-stone-50 rounded-xl p-3">Aucune séance passée en attente de facture.</p>
                )}

                {group.upcoming.length > 0 && (
                    <div className="space-y-2">
                        <button type="button" onClick={() => setShowUpcoming(v => !v)} className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                            <CalendarClock className="w-3.5 h-3.5" />
                            {showUpcoming ? 'Masquer' : 'Voir'} les séances à venir ({group.upcoming.length}) — pour facturer à l&apos;avance
                        </button>
                        {showUpcoming && (
                            <ul className="divide-y divide-stone-100 rounded-2xl border border-dashed border-stone-300 bg-white">{group.upcoming.map(sessionRow)}</ul>
                        )}
                    </div>
                )}
            </div>

            {chosen.length > 0 && (
                <div className="rounded-2xl border-2 border-[#E1567A]/30 bg-rose-50/40 p-4 space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-stone-700">{chosen.length} séance{chosen.length > 1 ? 's' : ''} sélectionnée{chosen.length > 1 ? 's' : ''}</span>
                        <span className="text-2xl font-black tabular-nums text-stone-900 whitespace-nowrap">{formatEuros(total)}</span>
                    </div>
                    <p className="text-xs text-stone-500">Avec l&apos;avance immédiate, l&apos;URSSAF règle {formatEuros(Math.round(total / 2))} et le client {formatEuros(total - Math.round(total / 2))}.</p>
                    <input
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Note interne (optionnel)"
                        className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                    />
                    {invalid.length > 0 && <p className="text-xs text-red-600">Vérifiez les cases en rouge (montant ou texte vide).</p>}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button disabled={busy || invalid.length > 0} onClick={create} className="rounded-full gap-1.5 bg-[#E1567A] hover:bg-[#c94567] text-white">
                            <Receipt className="w-4 h-4" /> Regrouper en une facture
                        </Button>
                        <button type="button" disabled={busy} onClick={() => onSkip(chosen.map(s => s.sessionId), true)} className="text-xs text-stone-600 underline flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Ne pas facturer (carte cadeau, séance offerte…)
                        </button>
                    </div>
                    {!providerCreatesInvoices && (
                        <p className="text-[11px] text-stone-500">
                            La facture est regroupée ici : créez-la ensuite dans Abby avec le récapitulatif, puis marquez-la « Facturé ».
                        </p>
                    )}
                </div>
            )}

            {/* Open invoices of this client */}
            {group.openInvoices.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-600">Factures en cours</h4>
                    {group.openInvoices.map(invoice => (
                        <InvoiceCard
                            key={invoice.id}
                            invoice={invoice}
                            busy={busy}
                            defaultOpen={invoice.id === justCreated || group.openInvoices.length === 1}
                            onAction={onInvoiceAction}
                            onCopied={onCopied}
                        />
                    ))}
                </div>
            )}

            {skipped.length > 0 && (
                <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Non facturées</h4>
                    <ul className="text-xs text-stone-600 space-y-1">
                        {skipped.map(s => (
                            <li key={`${s.sessionId}-${s.date}`} className="flex items-center justify-between gap-2">
                                <span>{formatDateFr(s.date)} · {s.label}</span>
                                {s.sessionId && (
                                    <button type="button" disabled={busy} onClick={() => onSkip([s.sessionId!], false)} className="underline flex items-center gap-1">
                                        <RotateCcw className="w-3 h-3" /> Remettre à facturer
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

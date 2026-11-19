'use client';

import React, { useState } from 'react';
import { Check, CheckCircle2, Copy, FileText, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateFr, formatEuros, formatPeriod, invoiceSummary } from '@/lib/invoicing/logic';
import { INVOICE_STATUS_LABELS, type Invoice } from '@/lib/invoicing/types';

export const INVOICE_STATUS_STYLE: Record<Invoice['status'], string> = {
    draft: 'bg-amber-50 text-amber-800 border-amber-300',
    invoiced: 'bg-sky-50 text-sky-800 border-sky-300',
    paid: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    cancelled: 'bg-stone-100 text-stone-500 border-stone-300'
};

const shortDate = (iso: string | null) => (iso ? formatDateFr(iso.slice(0, 10)) : '');

interface Props {
    invoice: Invoice;
    busy: boolean;
    defaultOpen?: boolean;
    onAction: (invoice: Invoice, action: string, extra?: { externalNumber?: string; date?: string }) => Promise<void>;
    onCopied: (ok: boolean) => void;
}

/**
 * One invoice grouped in the app: its lines, the summary to copy into Abby, and the steps
 * À créer dans Abby → Facturé (with the Abby number) → Payé. Each step can be undone.
 */
export default function InvoiceCard({ invoice, busy, defaultOpen = false, onAction, onCopied }: Props) {
    const [open, setOpen] = useState(defaultOpen);
    const [number, setNumber] = useState(invoice.externalNumber || '');
    const [date, setDate] = useState('');
    const summary = invoiceSummary({ clientName: invoice.clientName, lines: invoice.lines, notes: invoice.notes });

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            onCopied(true);
        } catch {
            onCopied(false);
        }
    };

    return (
        <div className={`rounded-2xl border bg-white ${invoice.status === 'cancelled' ? 'opacity-70' : ''}`}>
            <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left p-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className={`text-[11px] font-bold rounded-full border px-2.5 py-0.5 ${INVOICE_STATUS_STYLE[invoice.status]}`}>
                    {INVOICE_STATUS_LABELS[invoice.status]}
                </span>
                <span className="font-bold text-stone-900">{invoice.clientName}</span>
                <span className="text-xs text-stone-500">
                    {invoice.lines.length} séance{invoice.lines.length > 1 ? 's' : ''} · {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                </span>
                {invoice.externalNumber && <span className="text-xs text-stone-500">· N° {invoice.externalNumber}</span>}
                <span className="ml-auto text-lg font-black tabular-nums text-stone-900">{formatEuros(invoice.totalCents)}</span>
            </button>

            {open && (
                <div className="border-t border-stone-100 p-4 space-y-4 text-sm">
                    <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                        {invoice.lines.map((line, i) => (
                            <li key={`${line.sessionId}-${i}`} className="flex items-baseline justify-between gap-3 px-3 py-2">
                                <span>
                                    <span className="font-semibold text-stone-800">{formatDateFr(line.date, true)}</span>
                                    <span className="block text-xs text-stone-500">{line.label}</span>
                                </span>
                                <span className="font-bold tabular-nums">{formatEuros(line.priceCents)}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Récapitulatif pour Abby</p>
                            <Button size="sm" variant="outline" onClick={copy} className="rounded-full text-xs h-8 gap-1.5">
                                <Copy className="w-3.5 h-3.5" /> Copier
                            </Button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-xs text-stone-700 bg-stone-50 border border-stone-200 rounded-xl p-3">{summary}</pre>
                    </div>

                    <div className="text-xs text-stone-500 space-y-0.5">
                        <p>Regroupée le {shortDate(invoice.createdAt)}</p>
                        {invoice.invoicedAt && <p>Facturée le {shortDate(invoice.invoicedAt)}</p>}
                        {invoice.paidAt && <p>Payée le {shortDate(invoice.paidAt)}</p>}
                        {invoice.cancelledAt && <p>Annulée le {shortDate(invoice.cancelledAt)}</p>}
                        {invoice.syncStatus === 'error' && <p className="text-red-600">Abby : {invoice.syncError}</p>}
                    </div>

                    {invoice.status !== 'cancelled' && (
                        <div className="space-y-3 pt-1">
                            {(invoice.status === 'draft' || invoice.status === 'invoiced') && (
                                <div className="flex flex-wrap items-end gap-2">
                                    <label className="space-y-1">
                                        <span className="block text-[11px] text-stone-600">N° de facture Abby</span>
                                        <input
                                            value={number}
                                            onChange={e => setNumber(e.target.value)}
                                            placeholder="ex : F-2026-0042"
                                            className="w-40 p-2 rounded-xl border border-stone-300 text-sm"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="block text-[11px] text-stone-600">Date (vide = aujourd&apos;hui)</span>
                                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 rounded-xl border border-stone-300 text-sm" />
                                    </label>
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                {invoice.status === 'draft' && (
                                    <Button size="sm" disabled={busy} onClick={() => onAction(invoice, 'mark_invoiced', { externalNumber: number, date })} className="rounded-full text-xs h-9 gap-1.5 bg-sky-700 hover:bg-sky-800 text-white">
                                        <FileText className="w-3.5 h-3.5" /> Marquer « Facturé »
                                    </Button>
                                )}
                                {(invoice.status === 'draft' || invoice.status === 'invoiced') && (
                                    <Button size="sm" disabled={busy} onClick={() => onAction(invoice, 'mark_paid', { externalNumber: number, date })} className="rounded-full text-xs h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Marquer « Payé »
                                    </Button>
                                )}
                                {invoice.status === 'invoiced' && number !== (invoice.externalNumber || '') && (
                                    <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction(invoice, 'edit', { externalNumber: number })} className="rounded-full text-xs h-9 gap-1.5">
                                        <Check className="w-3.5 h-3.5" /> Enregistrer le n°
                                    </Button>
                                )}
                                {invoice.status === 'paid' && (
                                    <button type="button" disabled={busy} onClick={() => onAction(invoice, 'undo_paid')} className="text-xs text-stone-600 underline flex items-center gap-1">
                                        <RotateCcw className="w-3 h-3" /> Pas encore payée
                                    </button>
                                )}
                                {invoice.status === 'invoiced' && (
                                    <button type="button" disabled={busy} onClick={() => onAction(invoice, 'undo_invoiced')} className="text-xs text-stone-600 underline flex items-center gap-1">
                                        <RotateCcw className="w-3 h-3" /> Pas encore créée dans Abby
                                    </button>
                                )}
                                {(invoice.status === 'draft' || invoice.status === 'invoiced') && (
                                    <button type="button" disabled={busy} onClick={() => onAction(invoice, 'cancel')} className="ml-auto text-xs text-red-600 underline flex items-center gap-1">
                                        <X className="w-3 h-3" /> Annuler la facture
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

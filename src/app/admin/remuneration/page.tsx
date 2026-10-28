'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronLeft, ChevronRight, Copy, Pencil, Rocket, RotateCcw, Sparkles } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/useToast';
import { useStaff } from '@/components/admin/StaffContext';
import { getParisDateTimeInfo } from '@/lib/dateUtils';
import {
    BILLING_PLANS, BillingPlan, ChefSessionPay, DEFAULT_CHEF_URSSAF_RATE, ELISA_BILLING_IDENTITY,
    chefSessionPay, clientPriceCents, formatEuros
} from '@/lib/remuneration';

// ---- What the API sends (amounts in cents) ----

interface RowBase {
    id: string;
    dateIso: string;
    dayName: string;
    timeSlot: string;
    clientName: string;
    dishCount: number;
    personCount: number;
    done: boolean;
}
interface OwnerChefRow extends RowBase { plan: BillingPlan; priceOverride: number | null; clientPrice: number | null; phase: 1 | 2; pay: ChefSessionPay | null }
interface OwnerElisaRow extends RowBase { plan: BillingPlan; priceOverride: number | null; clientPrice: number | null; elisaKeeps: number | null }
interface ChefRow extends RowBase {
    phase: 1 | 2;
    priced: boolean;
    chefInvoice: number | null;
    keepsNow: number | null;
    keepsBoosted: number | null;
    boost: number | null;
    clientPrice?: number;
    elisaFee?: number;
}
interface PayData {
    month: string;
    todayIso: string;
    who: string;
    people: { id: string; name: string; active: boolean }[];
    chef: { userId: string; name: string; sapActiveSince: string | null; urssafRate: number } | null;
    rows: (OwnerChefRow | OwnerElisaRow | ChefRow)[];
}

const planLabel = (plan: BillingPlan) => BILLING_PLANS.find(p => p.id === plan)?.label || plan;
const firstName = (name: string) => name.split(/\s+/)[0] || name;
const sum = (values: (number | null | undefined)[]) => values.reduce<number>((t, v) => t + (v || 0), 0);

function shiftMonth(month: string, delta: number): string {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(month: string): string {
    const [y, m] = month.split('-').map(Number);
    const label = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    return label.charAt(0).toUpperCase() + label.slice(1);
}
function shortDate(row: RowBase): string {
    const { dayNumber, monthName } = getParisDateTimeInfo(row.dateIso);
    return `${row.dayName.slice(0, 3)}. ${dayNumber} ${monthName}`;
}
const frenchDate = (iso: string) => iso.split('-').reverse().join('/');

/**
 * « Rémunération »: what every session pays, worked out from the session (dishes, people)
 * and the client's plan. Elisa sees everything for each chef; a chef sees only their own euros.
 */
export default function RemunerationPage() {
    const { isOwner, isChef } = useStaff();
    const [month, setMonth] = useState(() => getParisDateTimeInfo(new Date()).isoDate.slice(0, 7));
    const [who, setWho] = useState('');
    const [tab, setTab] = useState<'mois' | 'grille'>('mois');
    const [data, setData] = useState<PayData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const { showToast, toastElement } = useToast();

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/cooking-ops/admin/remuneration?month=${month}${who ? `&who=${who}` : ''}`);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || 'Chargement impossible');
            setData(json);
            setLoadError(null);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : 'Chargement impossible');
        } finally {
            setLoading(false);
        }
    }, [month, who]);

    useEffect(() => {
        load();
    }, [load]);

    const copy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast(`${label} copiée`, 'check');
        } catch {
            showToast('Copie impossible sur cet appareil', 'error');
        }
    };

    const savePrice = async (sessionId: string, priceOverride: number | null) => {
        const res = await fetch('/api/cooking-ops/admin/remuneration', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, priceOverride })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            showToast(json.error || 'Enregistrement impossible', 'error');
            return false;
        }
        showToast(priceOverride == null ? 'Prix habituel remis' : 'Prix de la séance enregistré', 'check');
        load();
        return true;
    };

    const viewingElisa = data?.who === 'elisa';
    const chefName = data?.chef ? firstName(data.chef.name) : '';

    return (
        <div className="min-h-screen bg-[#FAFAF9] pb-20 text-stone-900">
            <AdminPageHeader
                title={isChef ? 'Mes gains' : 'Rémunération'}
                subtitle={isChef
                    ? 'Ce que te rapporte chaque séance, calculé tout seul à partir du nombre de plats et de personnes.'
                    : 'Ce que rapporte chaque séance à Elisa et à ses chefs, calculé tout seul à partir des séances et de la formule de chaque client.'}
            />

            <main className="max-w-6xl mx-auto px-4 space-y-5">
                {/* Month + who */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-white border border-stone-200 rounded-full p-1 shadow-xs">
                        <button onClick={() => setMonth(m => shiftMonth(m, -1))} className="h-8 w-8 rounded-full hover:bg-stone-100 flex items-center justify-center" aria-label="Mois précédent">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm font-bold min-w-36 text-center">{monthLabel(month)}</span>
                        <button onClick={() => setMonth(m => shiftMonth(m, 1))} className="h-8 w-8 rounded-full hover:bg-stone-100 flex items-center justify-center" aria-label="Mois suivant">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    {isOwner && data && data.people.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {data.people.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setWho(p.id)}
                                    className={`px-3.5 h-9 rounded-full text-xs font-bold border transition-colors ${data.who === p.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'} ${p.active ? '' : 'opacity-60'}`}
                                >
                                    {p.id === 'elisa' ? 'Séances d’Elisa' : firstName(p.name)}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-1.5 sm:ml-auto">
                        {(['mois', 'grille'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-3.5 h-9 rounded-full text-xs font-bold border ${tab === t ? 'bg-[#E1567A] text-white border-[#E1567A]' : 'bg-white text-stone-700 border-stone-200'}`}
                            >
                                {t === 'mois' ? 'Séances du mois' : 'Grille des tarifs'}
                            </button>
                        ))}
                    </div>
                </div>

                {loadError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
                        {loadError}
                        {isOwner && <p className="text-xs mt-1 text-red-700">Si c’est la première fois : lancez la migration 008 dans Supabase (SQL Editor).</p>}
                    </div>
                )}

                {loading && !data && <p className="text-sm text-stone-500">Chargement…</p>}

                {data && tab === 'grille' && (
                    <PriceGrid isOwner={isOwner} chefRate={data.chef?.urssafRate ?? DEFAULT_CHEF_URSSAF_RATE} chefName={chefName} />
                )}

                {data && tab === 'mois' && (
                    isChef
                        ? <ChefMonth data={data} rows={data.rows as ChefRow[]} onCopy={copy} />
                        : viewingElisa
                            ? <ElisaMonth rows={data.rows as OwnerElisaRow[]} onSavePrice={savePrice} />
                            : <OwnerChefMonth data={data} rows={data.rows as OwnerChefRow[]} onSavePrice={savePrice} onCopy={copy} />
                )}
            </main>
            {toastElement}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Shared bits

function Stat({ label, value, hint, tone = 'stone' }: { label: string; value: string; hint?: string; tone?: 'stone' | 'rose' | 'green' }) {
    const tones = {
        stone: 'bg-white border-stone-200',
        rose: 'bg-rose-50 border-rose-200',
        green: 'bg-emerald-50 border-emerald-300'
    };
    return (
        <div className={`rounded-3xl border p-4 ${tones[tone]}`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
            <p className={`text-2xl font-black mt-1 ${tone === 'green' ? 'text-emerald-700' : 'text-stone-900'}`}>{value}</p>
            {hint && <p className="text-[11px] text-stone-500 mt-0.5">{hint}</p>}
        </div>
    );
}

function SessionLabel({ row }: { row: RowBase }) {
    return (
        <div className="min-w-0">
            <p className="font-bold text-sm truncate">{row.clientName}</p>
            <p className="text-[11px] text-stone-500">
                {shortDate(row)} · {row.timeSlot} · {row.dishCount} recettes · {row.personCount} pers.
                {!row.done && <span className="ml-1.5 text-amber-700 font-bold">à venir</span>}
            </p>
        </div>
    );
}

function Empty({ text }: { text: string }) {
    return <div className="bg-white border border-dashed border-stone-300 rounded-3xl p-8 text-center text-sm text-stone-500">{text}</div>;
}

/** The client price of a session, editable by Elisa for this session only. */
function PriceCell({ row, onSave }: { row: { id: string; clientPrice: number | null; priceOverride: number | null }; onSave: (id: string, price: number | null) => Promise<boolean> }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState('');
    const [saving, setSaving] = useState(false);

    const start = () => {
        setValue(row.clientPrice != null ? (row.clientPrice / 100).toFixed(2).replace('.', ',') : '');
        setEditing(true);
    };
    const save = async (price: number | null) => {
        setSaving(true);
        if (await onSave(row.id, price)) setEditing(false);
        setSaving(false);
    };

    if (editing) {
        return (
            <form
                onSubmit={e => {
                    e.preventDefault();
                    const n = Number(value.replace(',', '.').replace(/[^\d.]/g, ''));
                    if (n > 0) save(n);
                }}
                className="flex items-center gap-1"
            >
                <input autoFocus value={value} onChange={e => setValue(e.target.value)} inputMode="decimal" className="w-20 h-8 px-2 rounded-lg border border-stone-300 text-sm text-right" placeholder="0,00" />
                <span className="text-xs">€</span>
                <Button type="submit" size="sm" disabled={saving} className="h-8 rounded-lg bg-[#E1567A] hover:bg-[#c94567] text-white text-xs px-2">OK</Button>
                {row.priceOverride != null && (
                    <button type="button" onClick={() => save(null)} title="Remettre le prix habituel" className="h-8 w-8 flex items-center justify-center text-stone-500 hover:text-stone-900">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                )}
                <button type="button" onClick={() => setEditing(false)} className="text-[11px] text-stone-500 px-1">Annuler</button>
            </form>
        );
    }
    return (
        <button onClick={start} className="group flex items-center gap-1.5 text-left" title="Changer le prix de cette séance">
            {row.clientPrice != null
                ? <span className="font-bold text-sm">{formatEuros(row.clientPrice)}</span>
                : <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Prix à saisir</span>}
            {row.priceOverride != null && <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-1.5">fixé à la main</span>}
            <Pencil className="w-3 h-3 text-stone-400 group-hover:text-stone-700" />
        </button>
    );
}

function invoiceText(chefName: string, month: string, rows: { clientName: string; dateIso: string; amount: number }[]): string {
    const lines = rows.map(r => `Sous-traitance prestation de cuisine à domicile (Batch Cooking) – Client ${r.clientName} – ${frenchDate(r.dateIso)} : ${formatEuros(r.amount)}`);
    return [
        `Facture de : ${chefName}`,
        '',
        'Facturé à :',
        ...ELISA_BILLING_IDENTITY,
        '',
        `Prestations de ${monthLabel(month).toLowerCase()} :`,
        ...lines,
        '',
        `TOTAL : ${formatEuros(sum(rows.map(r => r.amount)))}`,
        'TVA non applicable, art. 293 B du CGI'
    ].join('\n');
}

// ---------------------------------------------------------------------------
// Elisa looking at a chef

function OwnerChefMonth({ data, rows, onSavePrice, onCopy }: {
    data: PayData;
    rows: OwnerChefRow[];
    onSavePrice: (id: string, price: number | null) => Promise<boolean>;
    onCopy: (text: string, label: string) => void;
}) {
    const chef = data.chef!;
    const name = firstName(chef.name);
    const done = rows.filter(r => r.done);
    const unpriced = rows.filter(r => !r.pay);
    const phase1Done = done.filter(r => r.pay && r.phase === 1);
    const toPay = sum(phase1Done.map(r => r.pay!.phase1.chefInvoice));
    const elisaKeeps = sum(done.map(r => r.pay ? (r.phase === 1 ? r.pay.phase1.elisaKeeps : r.pay.phase2.elisaKeeps) : 0));
    const fees = sum(done.filter(r => r.pay && r.phase === 2).map(r => r.pay!.phase2.elisaFee));
    const boost = sum(phase1Done.map(r => r.pay!.boost));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                <span className={`font-bold rounded-full px-2.5 py-1 border ${chef.sapActiveSince ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    {chef.sapActiveSince ? `SAP de ${name} actif depuis le ${frenchDate(chef.sapActiveSince)} (phase 2)` : `${name} attend son SAP : phase 1, Elisa facture le client`}
                </span>
                <span>Taux URSSAF de {name} : {(chef.urssafRate * 100).toLocaleString('fr-FR')} %</span>
                <Link href="/admin/equipe" className="font-bold text-[#E1567A] underline underline-offset-2">Modifier dans Équipe</Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Séances réalisées" value={String(done.length)} hint={rows.length > done.length ? `+ ${rows.length - done.length} à venir ce mois-ci` : undefined} />
                <Stat label={`${name} facture à Elisa`} value={formatEuros(toPay)} hint="Séances réalisées en phase 1" tone="rose" />
                <Stat label="Elisa garde" value={formatEuros(elisaKeeps)} hint={fees > 0 ? `dont frais phase 2 : ${formatEuros(fees)}` : 'Après son URSSAF'} />
                <Stat label={`Avec son SAP, ${name} gagnerait`} value={`+${formatEuros(boost)}`} hint="Sur les séances réalisées en phase 1" tone="green" />
            </div>

            {unpriced.length > 0 && (
                <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{unpriced.length} séance{unpriced.length > 1 ? 's' : ''} sans prix (nombre de recettes hors catalogue ou prix libre non rempli). Cliquez sur « Prix à saisir ». {name} y voit « montant à confirmer ».</p>
                </div>
            )}

            {rows.length === 0 ? <Empty text={`Aucune séance de ${name} en ${monthLabel(data.month).toLowerCase()}.`} /> : (
                <div className="bg-white border border-stone-200 rounded-3xl divide-y divide-stone-100">
                    <div className="hidden md:grid grid-cols-[1.6fr_0.8fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        <span>Séance</span><span>Formule</span><span>Prix client</span><span>{name}</span><span>Elisa garde</span><span className="text-emerald-700">Avec son SAP</span>
                    </div>
                    {rows.map(r => (
                        <div key={r.id} className={`grid grid-cols-2 md:grid-cols-[1.6fr_0.8fr_1fr_1fr_1fr_1fr] gap-x-3 gap-y-2 px-4 py-3 items-center ${r.done ? '' : 'opacity-70'}`}>
                            <div className="col-span-2 md:col-span-1"><SessionLabel row={r} /></div>
                            <div className="text-xs">
                                <span className="font-bold">{planLabel(r.plan)}</span>
                                <span className={`ml-1.5 whitespace-nowrap text-[10px] font-bold rounded-full px-1.5 border ${r.phase === 2 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>phase {r.phase}</span>
                            </div>
                            <PriceCell row={r} onSave={onSavePrice} />
                            <div className="text-xs">
                                <span className="md:hidden text-stone-500">{name} : </span>
                                {r.pay ? (r.phase === 1
                                    ? <><strong className="text-sm">{formatEuros(r.pay.phase1.chefInvoice)}</strong><span className="block text-[10px] text-stone-500">à facturer à Elisa</span></>
                                    : <><strong className="text-sm">{formatEuros(r.clientPrice!)}</strong><span className="block text-[10px] text-stone-500">facturé au client, paie {formatEuros(r.pay.phase2.elisaFee)} à Elisa</span></>)
                                    : '—'}
                            </div>
                            <div className="text-xs">
                                <span className="md:hidden text-stone-500">Elisa garde : </span>
                                <strong className="text-sm">{r.pay ? formatEuros(r.phase === 1 ? r.pay.phase1.elisaKeeps : r.pay.phase2.elisaKeeps) : '—'}</strong>
                            </div>
                            <div className="text-xs text-emerald-700 font-bold">
                                <span className="md:hidden font-normal">Avec son SAP : </span>
                                {r.pay && r.phase === 1 ? `+${formatEuros(r.pay.boost)}` : r.pay ? 'déjà en phase 2' : '—'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {phase1Done.length > 0 && (
                <Button variant="outline" onClick={() => onCopy(invoiceText(chef.name, data.month, phase1Done.map(r => ({ clientName: r.clientName, dateIso: r.dateIso, amount: r.pay!.phase1.chefInvoice }))), 'Facture attendue')} className="rounded-full text-xs gap-1.5 border-stone-300">
                    <Copy className="w-3.5 h-3.5" /> Copier la facture attendue de {name}
                </Button>
            )}

            <p className="text-[11px] text-stone-500 leading-relaxed">
                Phase 1 : Elisa facture le client, son URSSAF est prélevée sur le total, le reste est partagé 80 / 20 et {name} facture sa part à Elisa.
                Phase 2 (dès que son SAP est actif) : {name} facture le client et paie 20 % du prix à Elisa ; Elisa garde la même somme qu’en phase 1.
                « Avec son SAP » = ce que {name} garderait en plus après ses propres cotisations. Les cartes cadeaux restent en phase 1 (déjà payées à Elisa).
            </p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Elisa's own sessions

function ElisaMonth({ rows, onSavePrice }: { rows: OwnerElisaRow[]; onSavePrice: (id: string, price: number | null) => Promise<boolean> }) {
    const done = rows.filter(r => r.done);
    const unpriced = rows.filter(r => r.clientPrice == null);
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <Stat label="Séances réalisées" value={String(done.length)} hint={rows.length > done.length ? `+ ${rows.length - done.length} à venir` : undefined} />
                <Stat label="Facturé aux clients" value={formatEuros(sum(done.map(r => r.clientPrice)))} hint="Avant le crédit d’impôt" tone="rose" />
                <Stat label="Elisa garde" value={formatEuros(sum(done.map(r => r.elisaKeeps)))} hint="Après son URSSAF" />
            </div>
            {unpriced.length > 0 && (
                <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{unpriced.length} séance{unpriced.length > 1 ? 's' : ''} sans prix : cliquez sur « Prix à saisir ».</p>
                </div>
            )}
            {rows.length === 0 ? <Empty text="Aucune séance d’Elisa ce mois-ci." /> : (
                <div className="bg-white border border-stone-200 rounded-3xl divide-y divide-stone-100">
                    {rows.map(r => (
                        <div key={r.id} className={`grid grid-cols-2 md:grid-cols-[1.6fr_0.8fr_1fr_1fr] gap-x-3 gap-y-2 px-4 py-3 items-center ${r.done ? '' : 'opacity-70'}`}>
                            <div className="col-span-2 md:col-span-1"><SessionLabel row={r} /></div>
                            <span className="text-xs font-bold">{planLabel(r.plan)}</span>
                            <PriceCell row={r} onSave={onSavePrice} />
                            <span className="text-xs"><span className="text-stone-500">Garde : </span><strong className="text-sm">{r.elisaKeeps != null ? formatEuros(r.elisaKeeps) : '—'}</strong></span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// A chef looking at their own month: euros only

function ChefMonth({ data, rows, onCopy }: { data: PayData; rows: ChefRow[]; onCopy: (text: string, label: string) => void }) {
    const chef = data.chef!;
    const done = rows.filter(r => r.done);
    const phase1Done = done.filter(r => r.priced && r.phase === 1);
    const phase2Done = done.filter(r => r.priced && r.phase === 2);
    const toInvoice = sum(phase1Done.map(r => r.chefInvoice));
    const keeps = sum(phase1Done.map(r => r.keepsNow)) + sum(phase2Done.map(r => r.keepsBoosted));
    const boost = sum(phase1Done.map(r => r.boost));
    const upcomingBoost = sum(rows.filter(r => !r.done && r.priced && r.phase === 1).map(r => r.boost));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat label="À facturer à Elisa" value={formatEuros(toInvoice)} hint={`${phase1Done.length} séance${phase1Done.length > 1 ? 's' : ''} réalisée${phase1Done.length > 1 ? 's' : ''}`} tone="rose" />
                <Stat label="Il te reste environ" value={formatEuros(keeps)} hint="Après tes cotisations URSSAF (estimation)" />
                {chef.sapActiveSince
                    ? <Stat label="Ton SAP est actif" value="Tarif boosté ✓" hint={`Depuis le ${frenchDate(chef.sapActiveSince)}`} tone="green" />
                    : <Stat label="Avec ton SAP, en plus" value={`+${formatEuros(boost)}`} hint={upcomingBoost > 0 ? `et +${formatEuros(upcomingBoost)} sur les séances à venir` : 'Sur ce mois-ci'} tone="green" />}
            </div>

            {!chef.sapActiveSince && (
                <div className="flex gap-3 items-start bg-emerald-50 border border-emerald-200 rounded-3xl p-4 text-sm text-emerald-900">
                    <Rocket className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700" />
                    <p>
                        Pour l’instant, l’argent du client passe par la micro-entreprise d’Elisa pour qu’il ait tout de suite son crédit d’impôt :
                        son compte paie donc une première fois des charges URSSAF sur le total. Dès que ton SAP et ton Avance Immédiate sont actifs,
                        cette étape saute et l’économie va directement dans ta poche.
                    </p>
                </div>
            )}

            {rows.length === 0 ? <Empty text={`Pas encore de séance en ${monthLabel(data.month).toLowerCase()}.`} /> : (
                <div className="bg-white border border-stone-200 rounded-3xl divide-y divide-stone-100">
                    <div className="hidden md:grid grid-cols-[1.8fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        <span>Séance</span><span>Tu factures à Elisa</span><span>Il te reste environ</span><span className="text-emerald-700">Avec ton SAP</span>
                    </div>
                    {rows.map(r => (
                        <div key={r.id} className={`grid grid-cols-2 md:grid-cols-[1.8fr_1fr_1fr_1fr] gap-x-3 gap-y-2 px-4 py-3 items-center ${r.done ? '' : 'opacity-70'}`}>
                            <div className="col-span-2 md:col-span-1"><SessionLabel row={r} /></div>
                            {!r.priced ? (
                                <span className="col-span-2 md:col-span-3 text-xs text-amber-700 font-bold">Montant à confirmer par Elisa</span>
                            ) : r.phase === 1 ? (
                                <>
                                    <span className="text-xs"><span className="md:hidden text-stone-500">À facturer : </span><strong className="text-sm">{formatEuros(r.chefInvoice!)}</strong></span>
                                    <span className="text-xs"><span className="md:hidden text-stone-500">Il te reste : </span><strong className="text-sm">{formatEuros(r.keepsNow!)}</strong></span>
                                    <span className="text-xs text-emerald-700"><span className="md:hidden">Avec ton SAP : </span><strong className="text-sm">{formatEuros(r.keepsBoosted!)}</strong> <span className="font-bold">(+{formatEuros(r.boost!)})</span></span>
                                </>
                            ) : (
                                <span className="col-span-2 md:col-span-3 text-xs">
                                    Tu factures le client <strong>{formatEuros(r.clientPrice!)}</strong> · frais Elisa <strong>{formatEuros(r.elisaFee!)}</strong> · il te reste environ <strong className="text-emerald-700">{formatEuros(r.keepsBoosted!)}</strong>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {phase1Done.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-3xl p-4 space-y-2">
                    <p className="text-sm font-bold">Ta facture du mois pour Elisa</p>
                    <p className="text-xs text-stone-600">Une ligne par séance réalisée, le total et la mention TVA : copie-la dans ton logiciel de facturation.</p>
                    <Button onClick={() => onCopy(invoiceText(chef.name, data.month, phase1Done.map(r => ({ clientName: r.clientName, dateIso: r.dateIso, amount: r.chefInvoice! }))), 'Facture')} className="bg-[#E1567A] hover:bg-[#c94567] text-white rounded-full text-xs gap-1.5">
                        <Copy className="w-3.5 h-3.5" /> Copier ma facture ({formatEuros(toInvoice)})
                    </Button>
                </div>
            )}

            <p className="text-[11px] text-stone-500">« Il te reste environ » = après tes propres cotisations URSSAF, à titre indicatif.</p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// The price grid: subscription prices (most clients), every catalogue formula

const GRID_DISHES = [3, 5, 6];
const GRID_PEOPLE = [1, 2, 3, 4, 5, 6];
const EXAMPLE_SESSIONS = 12;

function PriceGrid({ isOwner, chefRate, chefName }: { isOwner: boolean; chefRate: number; chefName: string }) {
    const rows = useMemo(() => GRID_DISHES.flatMap(dishCount => GRID_PEOPLE.map(personCount => {
        const price = clientPriceCents({ dishCount, personCount, plan: 'abonnement' })!;
        return { dishCount, personCount, price, pay: chefSessionPay(price, chefRate) };
    })), [chefRate]);
    const example = rows.find(r => r.dishCount === 5 && r.personCount === 2)!;
    const you = isOwner ? (chefName || 'le chef') : 'tu';

    return (
        <div className="space-y-4">
            <div className="flex gap-3 items-start bg-white border border-stone-200 rounded-3xl p-4 text-sm">
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-[#E1567A]" />
                <p className="text-stone-700">
                    Tarifs <strong>abonnement</strong> (la formule de la plupart des clients), par séance.
                    {isOwner ? ' Les colonnes chef sont calculées avec le taux URSSAF de ' + (chefName || 'ce chef') + '.' : ' Elisa trouve les clients, prépare les menus et les listes de courses : toi, tu cuisines.'}
                </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                    <thead>
                        <tr className="text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
                            <th className="text-left px-4 py-3">Formule</th>
                            {isOwner && <th className="text-right px-3 py-3">Prix client</th>}
                            <th className="text-right px-3 py-3">{isOwner ? 'Chef facture à Elisa' : 'Aujourd’hui, tu factures'}</th>
                            <th className="text-right px-3 py-3">Il {isOwner ? 'lui' : 'te'} reste</th>
                            <th className="text-right px-3 py-3 text-emerald-700 bg-emerald-50">Avec {isOwner ? 'son' : 'ton'} SAP, il {isOwner ? 'lui' : 'te'} reste</th>
                            <th className="text-right px-3 py-3 text-emerald-700 bg-emerald-50">Bonus</th>
                            {isOwner && <th className="text-right px-4 py-3">Elisa garde</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={`${r.dishCount}-${r.personCount}`} className={`border-b border-stone-100 last:border-0 ${r.personCount === 1 ? 'border-t-2 border-t-stone-200' : ''}`}>
                                <td className="px-4 py-2.5 font-bold whitespace-nowrap">{r.dishCount} recettes · {r.personCount} pers.</td>
                                {isOwner && <td className="text-right px-3 py-2.5 whitespace-nowrap">{formatEuros(r.price)}</td>}
                                <td className="text-right px-3 py-2.5 whitespace-nowrap font-bold">{formatEuros(r.pay.phase1.chefInvoice)}</td>
                                <td className="text-right px-3 py-2.5 whitespace-nowrap">{formatEuros(r.pay.phase1.chefKeeps)}</td>
                                <td className="text-right px-3 py-2.5 whitespace-nowrap font-bold text-emerald-700 bg-emerald-50/60">{formatEuros(r.pay.phase2.chefKeeps)}</td>
                                <td className="text-right px-3 py-2.5 whitespace-nowrap font-black text-emerald-700 bg-emerald-50/60">+{formatEuros(r.pay.boost)}</td>
                                {isOwner && <td className="text-right px-4 py-2.5 whitespace-nowrap">{formatEuros(r.pay.phase1.elisaKeeps)}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-4 text-sm text-emerald-900">
                <p className="font-bold">Exemple : {EXAMPLE_SESSIONS} séances « 5 recettes · 2 pers. » dans le mois</p>
                <p className="mt-1">
                    Aujourd’hui il {isOwner ? 'lui' : 'te'} reste environ <strong>{formatEuros(example.pay.phase1.chefKeeps * EXAMPLE_SESSIONS)}</strong>.
                    Avec {isOwner ? 'son' : 'ton'} SAP : <strong>{formatEuros(example.pay.phase2.chefKeeps * EXAMPLE_SESSIONS)}</strong>,
                    soit <strong>+{formatEuros(example.pay.boost * EXAMPLE_SESSIONS)} par mois</strong> pour {you === 'tu' ? 'toi' : you}.
                </p>
            </div>

            <p className="text-[11px] text-stone-500">« Il {isOwner ? 'lui' : 'te'} reste » = après {isOwner ? 'ses' : 'tes'} propres cotisations URSSAF, à titre indicatif. Pour un client ponctuel ou une carte cadeau, les montants sont un peu plus élevés : ils s’affichent séance par séance dans « Séances du mois ».</p>
        </div>
    );
}

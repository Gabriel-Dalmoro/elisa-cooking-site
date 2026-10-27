'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Eye, EyeOff, Save } from 'lucide-react';
import { applyCombinedEdits, combinedListToText, GroceryItem, GroceryList, nameEditKey } from '@/lib/grocery/list';
import QuantityEdit from './QuantityEdit';
import AddGroceryItem from './AddGroceryItem';
import AisleSection, { FoldAllButton, useFoldedAisles } from './AisleSection';
import { UNSORTED } from '@/lib/grocery/parse';

// One colour per client, same order as the columns (left side of the trolley, right side…)
const COLORS = [
    { dot: 'bg-sky-500', text: 'text-sky-800', tile: 'bg-sky-50 border-sky-200', ring: 'ring-sky-500', pill: 'bg-sky-100 text-sky-900 border-sky-300' },
    { dot: 'bg-violet-500', text: 'text-violet-800', tile: 'bg-violet-50 border-violet-200', ring: 'ring-violet-500', pill: 'bg-violet-100 text-violet-900 border-violet-300' },
    { dot: 'bg-amber-500', text: 'text-amber-800', tile: 'bg-amber-50 border-amber-200', ring: 'ring-amber-500', pill: 'bg-amber-100 text-amber-900 border-amber-300' },
    { dot: 'bg-teal-500', text: 'text-teal-800', tile: 'bg-teal-50 border-teal-200', ring: 'ring-teal-500', pill: 'bg-teal-100 text-teal-900 border-teal-300' }
];
const colorOf = (i: number) => COLORS[i % COLORS.length];

type Ticks = Record<string, string[]>; // client label → ticked item keys
type Edits = Record<string, Record<string, string>>; // client label → item key → amount corrected by hand

interface Props {
    list: GroceryList; // built with buildMergedGroceryList (has clients + byClient)
    saved: Ticks; // each client's saved ticks (their whole own list, not only these items)
    savedEdits: Edits; // each client's corrected quantities (their whole own list)
    extras: Record<string, string[]>; // each client's items added by hand
    onExtrasChange: (client: string, next: string[]) => Promise<boolean>; // saved right away
    onSave: (next: Ticks, edits: Edits) => Promise<boolean>;
    onCopied: (ok: boolean) => void;
    foldKey?: string; // remembers folded aisles on this device for this list
}

const sameKeys = (a: string[], b: string[]) => a.length === b.length && a.every(k => b.includes(k));
const sameEdits = (a: Record<string, string> = {}, b: Record<string, string> = {}) =>
    Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[k] === v);
const firstName = (label: string) => label.split(/\s+/)[0];

/**
 * Shopping for several clients at once, built for the phone in the shop:
 * one tick PER CLIENT on every item (3 potatoes for Nicolas ✓, 2 for Clarisse ✓),
 * each client always in the same column and colour, so each trolley side / invoice stays separate.
 * A tick here is the same tick as on that client's own list (saved with « Enregistrer »).
 */
export default function CombinedGroceryList({ list, saved, savedEdits, extras, onExtrasChange, onSave, onCopied, foldKey = 'courses-groupees' }: Props) {
    const clients = useMemo(() => list.clients || [], [list]);
    const [ticks, setTicks] = useState<Ticks>(saved);
    const [lastSaved, setLastSaved] = useState<Ticks>(saved);
    const [saving, setSaving] = useState(false);
    const [only, setOnly] = useState<string | null>(null); // show one client's items only
    const [hideDone, setHideDone] = useState(false);

    // Follow the saved ticks when they really change (e.g. after saving)
    const savedChanged = clients.some(c => !sameKeys(saved[c.label] || [], lastSaved[c.label] || []));
    if (savedChanged) {
        setLastSaved(saved);
        setTicks(saved);
    }
    // Quantities corrected by hand, per client (same saving as the ticks)
    const [edits, setEdits] = useState<Edits>(savedEdits);
    const [lastSavedEdits, setLastSavedEdits] = useState<Edits>(savedEdits);
    if (clients.some(c => !sameEdits(savedEdits[c.label], lastSavedEdits[c.label]))) {
        setLastSavedEdits(savedEdits);
        setEdits(savedEdits);
    }
    const shown = useMemo(() => applyCombinedEdits(list, edits), [list, edits]);
    const calculatedShare = (key: string, client: string) =>
        list.sections.flatMap(sec => sec.items).find(i => i.key === key)?.byClient?.find(b => b.client === client)?.amount ?? null;
    const setEdit = (client: string, key: string, amount: string | null) => {
        setEdits(prev => {
            const own = { ...(prev[client] || {}) };
            if (amount) own[key] = amount;
            else delete own[key];
            return { ...prev, [client]: own };
        });
    };

    // A new name applies to everyone who needs the item (stored in each client's own list)
    const renameItem = (item: GroceryItem, name: string | null) => {
        for (const share of item.byClient || []) setEdit(share.client, nameEditKey(item.key), name);
    };

    const isDone = (client: string, key: string) => (ticks[client] || []).includes(key);
    const isDirty = clients.some(c =>
        !sameKeys(ticks[c.label] || [], saved[c.label] || []) || !sameEdits(edits[c.label], savedEdits[c.label])
    );

    useEffect(() => {
        if (!isDirty) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    const toggle = (client: string, key: string) => {
        setTicks(prev => {
            const own = prev[client] || [];
            return { ...prev, [client]: own.includes(key) ? own.filter(k => k !== key) : [...own, key] };
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            await onSave(ticks, edits);
        } finally {
            setSaving(false);
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(combinedListToText(shown, isDone));
            onCopied(true);
        } catch {
            onCopied(false);
        }
    };

    // Progress per client: items ticked / items needed
    const progress = useMemo(() => clients.map(c => {
        const needed = list.sections.flatMap(s => s.items).filter(i => i.byClient?.some(b => b.client === c.label));
        return { label: c.label, total: needed.length, done: needed.filter(i => (ticks[c.label] || []).includes(i.key)).length };
    }), [clients, list, ticks]);

    const visibleClients = only ? clients.filter(c => c.label === only) : clients;
    const needsVisible = (item: GroceryItem) => visibleClients.some(c => item.byClient?.some(b => b.client === c.label));
    const allVisibleDone = (item: GroceryItem) =>
        visibleClients.every(c => !item.byClient?.some(b => b.client === c.label) || isDone(c.label, item.key));
    // Each aisle: what the visible clients still need there
    const aisles = useMemo(() => shown.sections.map(section => {
        const needed = section.items.filter(needsVisible);
        return { name: section.name, done: needed.filter(allVisibleDone).length, total: needed.length };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [shown, ticks, only]);
    const folds = useFoldedAisles(`folds:${foldKey}`, aisles);

    // Two clients side by side on a phone; three or more stacked (columns would be too narrow)
    const columns = visibleClients.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

    return (
        <div className="space-y-4">
            {/* Who's who + progress, and the filters */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-4 space-y-3">
                <div className={`grid gap-2 ${clients.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {progress.map((p, i) => (
                        <div key={p.label} className={`rounded-2xl border px-3 py-2 ${colorOf(i).tile}`}>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${colorOf(i).dot}`} />
                                <span className={`text-sm font-bold truncate ${colorOf(i).text}`}>{firstName(p.label)}</span>
                            </div>
                            <div className="text-[11px] text-stone-600 mt-0.5">
                                {i === 0 && clients.length === 2 ? 'Côté gauche' : i === 1 && clients.length === 2 ? 'Côté droit' : `${clients[i].persons} pers.`}
                                {' · '}<strong className="text-stone-900">{p.done}/{p.total}</strong> pris
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setOnly(null)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${only === null ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-300'}`}
                    >
                        Tous
                    </button>
                    {clients.map((c, i) => (
                        <button
                            key={c.label}
                            type="button"
                            onClick={() => setOnly(c.label)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                                only === c.label ? colorOf(i).pill : 'bg-white text-stone-700 border-stone-300'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${colorOf(i).dot}`} /> {firstName(c.label)}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setHideDone(h => !h)}
                        className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full border bg-white text-stone-700 border-stone-300 flex items-center gap-1.5"
                    >
                        {hideDone ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {hideDone ? 'Voir les cochés' : 'Cacher les cochés'}
                    </button>
                    <FoldAllButton allFolded={folds.allFolded} onFold={folds.foldAll} onUnfold={folds.unfoldAll} />
                </div>

                <AddGroceryItem
                    extras={extras}
                    clients={clients.map((c, i) => ({ label: c.label, dot: colorOf(i).dot }))}
                    onChange={onExtrasChange}
                />

                {list.dishesWithoutIngredients.length > 0 && (
                    <p className="text-[11px] bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-amber-900">
                        <strong>Pas dans la liste (aucun ingrédient lu) :</strong> {list.dishesWithoutIngredients.join(' · ')}
                    </p>
                )}
            </div>

            {/* The list, by aisle */}
            {shown.sections.map((section, sectionIndex) => {
                const aisle = aisles[sectionIndex];
                if (!aisle || aisle.total === 0) return null;
                const items = section.items.filter(item => needsVisible(item) && !(hideDone && allVisibleDone(item)));
                return (
                    <AisleSection
                        key={section.name}
                        title={section.name === UNSORTED ? 'À classer (rayon inconnu)' : section.name}
                        warning={section.name === UNSORTED}
                        done={aisle.done}
                        total={aisle.total}
                        folded={folds.isFolded(section.name)}
                        onToggle={() => folds.toggle(section.name)}
                    >
                        {items.length === 0 && (
                            <p className="text-sm text-stone-500 px-2">Tout est pris dans ce rayon (cochés cachés).</p>
                        )}
                        <ul className="space-y-2">
                            {items.map(item => {
                                const done = allVisibleDone(item);
                                return (
                                    <li key={item.key} className={`rounded-2xl border p-3 transition-colors ${done ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-stone-200'}`}>
                                        <div className="flex items-baseline justify-between gap-2 px-0.5">
                                            <span className={`text-base font-bold leading-tight ${done ? 'line-through text-stone-400' : item.originalName ? 'text-[#c94567]' : 'text-stone-900'}`}>
                                                {item.name}
                                                {item.originalName && (
                                                    <span className="block text-[11px] font-normal text-stone-400">au lieu de « {item.originalName} »</span>
                                                )}
                                            </span>
                                            {visibleClients.length > 1 && (item.byClient?.length || 0) > 1 && item.total && (
                                                <span className="text-[11px] text-stone-400 tabular-nums shrink-0">total {item.total}</span>
                                            )}
                                        </div>
                                        {item.details.length > 0 && (
                                            <p className="text-[11px] text-stone-500 italic px-0.5">{item.details.join(' · ')}</p>
                                        )}
                                        {item.warnings.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-1 px-0.5">
                                                {item.warnings.map(w => (
                                                    <span key={w} className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${w.startsWith('🚫') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                                                        {w}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* One tile per client, always in the same column */}
                                        <div className={`grid gap-2 mt-2 ${columns}`}>
                                            {visibleClients.map(c => {
                                                const ci = clients.findIndex(x => x.label === c.label);
                                                const share = item.byClient?.find(b => b.client === c.label);
                                                if (!share) {
                                                    return (
                                                        <div key={c.label} className="rounded-xl border border-dashed border-stone-200 flex items-center justify-center text-[11px] text-stone-300 min-h-[3.25rem]">
                                                            — pas pour {firstName(c.label)}
                                                        </div>
                                                    );
                                                }
                                                const ticked = isDone(c.label, item.key);
                                                const lines = item.sources.filter(s => s.client === c.label);
                                                return (
                                                    <div
                                                        key={c.label}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => toggle(c.label, item.key)}
                                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.label, item.key); } }}
                                                        aria-pressed={ticked}
                                                        className={`cursor-pointer flex flex-col justify-start text-left rounded-xl border-2 p-2.5 transition-all active:scale-[0.98] ${
                                                            ticked ? 'bg-emerald-50 border-emerald-400' : `${colorOf(ci).tile}`
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${
                                                                ticked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-stone-300'
                                                            }`}>
                                                                {ticked && <Check className="w-4 h-4 stroke-[3]" />}
                                                            </span>
                                                            <span className={`text-xs font-bold truncate ${ticked ? 'text-emerald-800' : colorOf(ci).text}`}>
                                                                {firstName(c.label)}
                                                            </span>
                                                        </span>
                                                        <span className="block mt-1 leading-tight">
                                                            <QuantityEdit
                                                                large
                                                                value={share.amount}
                                                                calculated={calculatedShare(item.key, c.label)}
                                                                edited={Boolean(share.edited)}
                                                                muted={ticked}
                                                                emptyLabel={item.handAdded ? 'à acheter' : undefined}
                                                                onChange={amount => setEdit(c.label, item.key, amount)}
                                                                name={item.name}
                                                                originalName={item.originalName}
                                                                onRename={name => renameItem(item, name)}
                                                            />
                                                        </span>
                                                        {lines.length > 0 && (
                                                            <span className="block mt-1 space-y-0.5">
                                                                {lines.map((s, i) => (
                                                                    <span key={i} className="block text-[10.5px] leading-snug text-stone-500">
                                                                        {s.amount && lines.length > 1 && <strong className="text-stone-700">{s.amount} </strong>}
                                                                        {s.dish}
                                                                    </span>
                                                                ))}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </AisleSection>
                );
            })}

            {/* Always at hand while shopping */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-2">
                    <div className="flex-1 min-w-0 text-[11px] text-stone-600 leading-tight">
                        {isDirty ? <strong className="text-amber-700">Cases modifiées, pensez à enregistrer</strong> : 'Tout est enregistré'}
                    </div>
                    <button
                        type="button"
                        onClick={copy}
                        className="h-10 px-3.5 rounded-full border border-stone-300 text-stone-700 text-xs font-semibold flex items-center gap-1.5"
                    >
                        <Copy className="w-3.5 h-3.5" /> Copier
                    </button>
                    <button
                        type="button"
                        onClick={save}
                        disabled={!isDirty || saving}
                        className="h-10 px-4 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                    >
                        <Save className="w-3.5 h-3.5" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

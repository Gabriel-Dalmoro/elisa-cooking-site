'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, ChevronDown, Copy, Save, ShoppingCart, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroceryList, groceryListToText } from '@/lib/grocery/list';
import { UNSORTED } from '@/lib/grocery/parse';

interface Props {
    list: GroceryList;
    title: string; // used in the copied text: « Liste de courses — Dupont »
    savedChecked: string[]; // ticks saved on the server for this client's week
    onSave: (checkedKeys: string[]) => Promise<boolean>;
    onCopied: (ok: boolean) => void;
}

const sameKeys = (a: string[], b: string[]) => a.length === b.length && a.every(k => b.includes(k));

/**
 * One client's grocery list: sections in supermarket order, exact totals for their number of people,
 * where each amount comes from, allergy / preference alerts, and tick boxes for the shop.
 * Ticks are saved with the "Enregistrer" button, so they are still there on any device
 * (e.g. butter the client already has, ticked before going shopping).
 */
export default function GroceryListCard({ list, title, savedChecked, onSave, onCopied }: Props) {
    const [open, setOpen] = useState(false);
    const [checked, setChecked] = useState<string[]>(savedChecked);
    const [saving, setSaving] = useState(false);

    // Follow the saved ticks when they really change (not when another save on the page refreshes the sheet)
    const [lastSaved, setLastSaved] = useState(savedChecked);
    if (!sameKeys(lastSaved, savedChecked)) {
        setLastSaved(savedChecked);
        setChecked(savedChecked);
    }

    const isDirty = useMemo(() => !sameKeys(checked, savedChecked), [checked, savedChecked]);

    // Warn before leaving the page with ticks that are not saved yet
    useEffect(() => {
        if (!isDirty) return;
        const warn = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    const toggle = (key: string) => {
        setChecked(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
    };

    const clearTicks = () => setChecked([]);

    const save = async () => {
        setSaving(true);
        try {
            await onSave(checked);
        } finally {
            setSaving(false);
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(groceryListToText(list, title));
            onCopied(true);
        } catch {
            onCopied(false);
        }
    };

    const allItems = list.sections.flatMap(s => s.items);
    const itemCount = allItems.length;
    const tickedCount = allItems.filter(i => checked.includes(i.key)).length;
    const alertCount = allItems.filter(i => i.warnings.length > 0).length;
    const otherBases = list.dishes.filter(d => d.servings !== list.persons);

    if (itemCount === 0 && list.dishesWithoutIngredients.length === 0) return null;

    return (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-stone-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                        <p className="font-bold text-stone-900">Liste de courses</p>
                        <p className="text-xs text-stone-500">
                            {itemCount} article{itemCount > 1 ? 's' : ''} · pour {list.persons} personne{list.persons > 1 ? 's' : ''}
                            {tickedCount > 0 && ` · ${tickedCount} coché${tickedCount > 1 ? 's' : ''}`}
                        </p>
                        {isDirty && (
                            <p className="text-[11px] font-bold text-amber-700">Cases modifiées — pensez à enregistrer</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {alertCount > 0 && (
                                <span className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                                    ⚠️ {alertCount} alerte{alertCount > 1 ? 's' : ''}
                                </span>
                            )}
                            {list.unsortedCount > 0 && (
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">
                                    {list.unsortedCount} à classer
                                </span>
                            )}
                            {list.dishesWithoutIngredients.length > 0 && (
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">
                                    {list.dishesWithoutIngredients.length} plat{list.dishesWithoutIngredients.length > 1 ? 's' : ''} sans ingrédients
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-stone-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="border-t border-stone-100 p-4 sm:p-5 space-y-4">
                    {list.dishesWithoutIngredients.length > 0 && (
                        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-900">
                            <strong>Pas dans la liste (aucun ingrédient lu) :</strong> {list.dishesWithoutIngredients.join(' · ')}.
                            Ajoutez les ingrédients avec « Modifier » sur le plat, ou dans le menu de la semaine.
                        </div>
                    )}

                    {otherBases.length > 0 && (
                        <p className="text-[11px] text-stone-500">
                            Quantités recalculées pour {list.persons} personne{list.persons > 1 ? 's' : ''} à partir des recettes pour{' '}
                            {[...new Set(otherBases.map(d => d.servings))].join(' / ')}.
                        </p>
                    )}

                    <p className="text-[11px] text-stone-500">
                        Cochez ce qui est acheté ou ce que le client a déjà (ex : beurre), puis « Enregistrer » :
                        les cases restent cochées la prochaine fois, sur tous vos appareils.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            onClick={save}
                            disabled={!isDirty || saving}
                            className="bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs gap-1.5"
                        >
                            <Save className="w-3.5 h-3.5" /> {saving ? 'Enregistrement…' : isDirty ? 'Enregistrer' : 'Enregistré'}
                        </Button>
                        <Button size="sm" onClick={copy} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs gap-1.5">
                            <Copy className="w-3.5 h-3.5" /> Copier la liste
                        </Button>
                        {tickedCount > 0 && (
                            <Button size="sm" variant="outline" onClick={clearTicks} className="rounded-full text-xs border-stone-300">
                                Tout décocher
                            </Button>
                        )}
                    </div>

                    {list.sections.map(section => (
                        <div key={section.name} className="space-y-1.5">
                            <h4
                                className={`text-[11px] font-black uppercase tracking-wider px-1 ${
                                    section.name === UNSORTED ? 'text-amber-700' : 'text-stone-500'
                                }`}
                            >
                                {section.name === UNSORTED ? '❓ À classer (rayon inconnu)' : section.name}
                            </h4>
                            <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200">
                                {section.items.map(item => {
                                    const isChecked = checked.includes(item.key);
                                    return (
                                        <li key={item.key}>
                                            <button
                                                type="button"
                                                onClick={() => toggle(item.key)}
                                                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                                                    isChecked ? 'bg-emerald-50/50' : 'hover:bg-stone-50'
                                                }`}
                                            >
                                                <span className="pt-0.5 shrink-0">
                                                    {isChecked
                                                        ? <CheckSquare className="w-4 h-4 text-emerald-600" />
                                                        : <Square className="w-4 h-4 text-stone-400" />}
                                                </span>
                                                <span className="flex-1 min-w-0 space-y-0.5">
                                                    <span className="flex items-baseline justify-between gap-3">
                                                        <span className={`text-sm font-semibold ${isChecked ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                                                            {item.name}
                                                        </span>
                                                        {item.total && (
                                                            <span className={`shrink-0 text-sm font-bold tabular-nums text-right ${isChecked ? 'text-stone-400' : 'text-stone-900'}`}>
                                                                {item.total}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {item.details.length > 0 && (
                                                        <span className="block text-[11px] text-stone-500 italic">{item.details.join(' · ')}</span>
                                                    )}
                                                    <span className="block text-[11px] text-stone-500 leading-snug">
                                                        {item.sources.map((s, i) => (
                                                            <span key={i}>
                                                                {i > 0 && ' · '}
                                                                {s.amount && item.sources.length > 1 && <strong className="text-stone-700">{s.amount}</strong>}
                                                                {s.amount && item.sources.length > 1 && ' '}
                                                                {s.dish}
                                                            </span>
                                                        ))}
                                                    </span>
                                                    {item.warnings.length > 0 && (
                                                        <span className="flex flex-wrap gap-1 pt-0.5">
                                                            {item.warnings.map(w => (
                                                                <span
                                                                    key={w}
                                                                    className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${
                                                                        w.startsWith('🚫')
                                                                            ? 'bg-red-50 text-red-700 border-red-200'
                                                                            : 'bg-amber-50 text-amber-800 border-amber-200'
                                                                    }`}
                                                                >
                                                                    {w}
                                                                </span>
                                                            ))}
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

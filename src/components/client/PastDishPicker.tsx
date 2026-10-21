'use client';

import React, { useMemo, useState } from 'react';
import { Fish, Flame, Leaf, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface PastDishOption {
    id: string;
    name: string;
    category: string;
    description?: string;
    weekStart: string;
    cookedWeek: string; // « Semaine du 29 septembre au 5 octobre »
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dishes: PastDishOption[]; // most recent first
    seasonOfPhrase: string; // « de l'automne »
    seasonPhrase: string; // « cet automne »
    replaceCount: number; // the client's formula (the dish replaces one of them)
    onPick: (dish: PastDishOption) => void;
}

function DishIcon({ category }: { category: string }) {
    const c = category.toLowerCase();
    if (c.includes('poisson') || c === 'fish') return <Fish className="w-3.5 h-3.5 text-blue-500" />;
    if (c.includes('vég') || c.includes('veg')) return <Leaf className="w-3.5 h-3.5 text-emerald-500" />;
    return <Flame className="w-3.5 h-3.5 text-amber-500" />;
}

const normalize = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * The season's earlier dishes, grouped by the week they were cooked (« the one from two weeks ago »).
 * One tap picks a dish as the client's custom dish.
 */
export default function PastDishPicker({ open, onOpenChange, dishes, seasonOfPhrase, seasonPhrase, replaceCount, onPick }: Props) {
    const [query, setQuery] = useState('');

    const groups = useMemo(() => {
        const q = normalize(query.trim());
        const matching = q
            ? dishes.filter(d => normalize(`${d.name} ${d.category} ${d.description || ''}`).includes(q))
            : dishes;
        const byWeek = new Map<string, { label: string; dishes: PastDishOption[] }>();
        for (const d of matching) {
            if (!byWeek.has(d.weekStart)) byWeek.set(d.weekStart, { label: d.cookedWeek, dishes: [] });
            byWeek.get(d.weekStart)!.dishes.push(d);
        }
        return [...byWeek.values()];
    }, [dishes, query]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-0 overflow-hidden max-h-[88vh] flex flex-col">
                <DialogHeader className="p-5 pb-3 border-b border-stone-100 text-left">
                    <DialogTitle className="font-serif text-lg">Les plats {seasonOfPhrase}</DialogTitle>
                    <p className="text-xs text-stone-600">
                        Elisa les a déjà cuisinés {seasonPhrase}. Choisissez-en un : il remplace un des {replaceCount} plats de votre formule.
                    </p>
                    {dishes.length > 6 && (
                        <div className="relative pt-2">
                            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 mt-1" />
                            <input
                                type="search"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Rechercher (ex : canard, potiron…)"
                                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#E1567A]"
                            />
                        </div>
                    )}
                </DialogHeader>

                <div className="overflow-y-auto p-4 space-y-5">
                    {groups.length === 0 && (
                        <p className="text-sm text-stone-500 text-center py-6">Aucun plat ne correspond à « {query} ».</p>
                    )}
                    {groups.map(group => (
                        <section key={group.label} className="space-y-2">
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-500 px-1">{group.label}</h4>
                            <ul className="space-y-2">
                                {group.dishes.map(dish => (
                                    <li key={`${dish.weekStart}:${dish.id}`}>
                                        <button
                                            type="button"
                                            onClick={() => onPick(dish)}
                                            className="w-full text-left rounded-2xl border border-stone-200 bg-white hover:border-[#E1567A] hover:bg-rose-50/40 active:scale-[0.99] transition-all p-3.5"
                                        >
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-stone-100 text-stone-700 rounded-full px-2 py-0.5">
                                                <DishIcon category={dish.category} /> {dish.category}
                                            </span>
                                            <span className="block font-serif font-bold text-stone-900 text-base leading-snug mt-1">{dish.name}</span>
                                            {dish.description && (
                                                <span className="block text-xs text-stone-600 mt-0.5 leading-relaxed">{dish.description}</span>
                                            )}
                                            <span className="block text-xs font-bold text-[#E1567A] mt-1.5">Choisir ce plat →</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

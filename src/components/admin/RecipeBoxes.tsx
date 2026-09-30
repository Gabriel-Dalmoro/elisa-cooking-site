'use client';

import React, { useMemo } from 'react';
import { Scissors } from 'lucide-react';
import { DEFAULT_SERVINGS, UNSORTED, parseIngredients, splitRecipe } from '@/lib/grocery/parse';

interface Props {
    ingredients: string;
    steps: string;
    onChange: (next: { ingredients: string; steps: string }) => void;
    stepsRows?: number;
}

/**
 * The two recipe boxes: ingredients (read by the grocery list) and preparation & notes (kept as written).
 * A full recipe pasted in one box can be split in one tap at its « Ingrédients » / « Préparation » headings.
 */
export default function RecipeBoxes({ ingredients, steps, onChange, stepsRows = 12 }: Props) {
    // Whether one of the boxes holds a whole recipe that can be split
    const split = useMemo(() => {
        if (!ingredients.trim()) {
            const s = splitRecipe(steps);
            return s.found ? { ingredients: s.ingredients, steps: s.steps } : null;
        }
        const s = splitRecipe(ingredients);
        return s.found && s.steps.trim()
            ? { ingredients: s.ingredients, steps: [s.steps, steps.trim()].filter(Boolean).join('\n\n') }
            : null;
    }, [ingredients, steps]);

    const summary = useMemo(() => {
        const parsed = parseIngredients(ingredients);
        const unsorted = parsed.items.filter(i => i.line.section === UNSORTED).map(i => i.line.name);
        return { count: parsed.items.length, servings: parsed.servings, unsorted: [...new Set(unsorted)] };
    }, [ingredients]);

    return (
        <div className="space-y-4">
            {split && (
                <button
                    type="button"
                    onClick={() => onChange(split)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#E1567A] bg-rose-50 border border-[#E1567A]/40 rounded-2xl px-4 py-3 hover:bg-rose-100 transition-colors"
                >
                    <Scissors className="w-4 h-4" />
                    Séparer automatiquement les ingrédients et la préparation
                </button>
            )}

            <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Ingrédients (pour la liste de courses)
                </label>
                <p className="text-[11px] text-stone-500">
                    Un ingrédient par ligne, quantités pour {DEFAULT_SERVINGS} personnes (ou écrivez « Pour 6 personnes »).
                    Une ligne seule comme « Polenta » ou « Pour la sauce : » regroupe les ingrédients qui suivent.
                </p>
                <textarea
                    rows={10}
                    value={ingredients}
                    onChange={e => onChange({ ingredients: e.target.value, steps })}
                    placeholder={'Pour 4 personnes\n\n250 g de figues fraîches\n2 échalotes\n1 c. à soupe de miel\nSel\nPoivre'}
                    className="w-full text-sm leading-relaxed p-4 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                />
                {summary.count > 0 && (
                    <div className="text-[11px] space-y-1">
                        <p className="text-emerald-700 font-semibold">
                            ✓ {summary.count} ingrédient{summary.count > 1 ? 's' : ''} lu{summary.count > 1 ? 's' : ''} ·
                            recette pour {summary.servings ?? DEFAULT_SERVINGS} personnes
                        </p>
                        {summary.unsorted.length > 0 && (
                            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                                Rayon inconnu (apparaîtra dans « À classer ») : {summary.unsorted.join(', ')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Préparation, cuisson & notes
                </label>
                <textarea
                    rows={stepsRows}
                    value={steps}
                    onChange={e => onChange({ ingredients, steps: e.target.value })}
                    placeholder="Étapes, cuisson, dressage… (ou collez la recette complète puis « Séparer »)"
                    className="w-full text-sm leading-relaxed p-4 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                />
            </div>
        </div>
    );
}

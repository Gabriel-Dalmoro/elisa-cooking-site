'use client';

import React from 'react';
import { DEFAULT_SERVINGS, findServings, parseLine } from '@/lib/grocery/parse';
import { formatAmount } from '@/lib/grocery/list';

/**
 * A dish's ingredient list as written, with each amount recalculated for the client's
 * number of people (exact, never rounded) next to it.
 */
export default function ScaledIngredients({ text, persons }: { text: string; persons: number }) {
    const servings = findServings(text) ?? DEFAULT_SERVINGS;
    const factor = persons / servings;
    const scaled = factor !== 1;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">Ingrédients</span>
                <span className={`text-[11px] font-semibold ${scaled ? 'text-[#E1567A]' : 'text-stone-500'}`}>
                    {scaled
                        ? `Recette pour ${servings} → quantités pour ${persons} personne${persons > 1 ? 's' : ''}`
                        : `Pour ${persons} personne${persons > 1 ? 's' : ''}`}
                </span>
            </div>
            <ul className="space-y-1">
                {lines.map((line, i) => {
                    const parsed = parseLine(line);
                    if (parsed.kind === 'servings' || /^\W*ingr[ée]dients?\s*:?\s*$/i.test(line)) return null;
                    if (parsed.kind === 'heading') {
                        return (
                            <li key={i} className="pt-2 text-xs font-bold text-stone-800">
                                {parsed.text}
                            </li>
                        );
                    }
                    const amount = scaled && parsed.kind === 'item' && parsed.qty && parsed.scales
                        ? formatAmount(parsed.unit, { min: parsed.qty.min * factor, max: parsed.qty.max * factor })
                        : null;
                    return (
                        <li key={i} className="flex items-start justify-between gap-3 text-sm leading-snug">
                            <span className={amount ? 'text-stone-500' : 'text-stone-800'}>{line.replace(/^[-•*·]\s*/, '')}</span>
                            {amount && <span className="shrink-0 font-bold text-stone-900 tabular-nums">{amount}</span>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

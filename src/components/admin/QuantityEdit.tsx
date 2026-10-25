'use client';

import React, { useState } from 'react';
import { Check, Pencil, RotateCcw, X } from 'lucide-react';

interface Props {
    value: string | null; // amount shown (corrected or calculated)
    calculated: string | null; // the computed amount (to go back to)
    edited: boolean;
    onChange: (amount: string | null) => void; // null = back to the calculated amount
    muted?: boolean; // item ticked: greyed out
    large?: boolean;
    emptyLabel?: string; // shown when there is no amount
}

/**
 * An amount on the shopping list that Elisa can correct on the spot (« 750 g » → « 800 g », « 2 bottes »…).
 * Clicks never reach the row underneath (which ticks the item).
 */
export default function QuantityEdit({ value, calculated, edited, onChange, muted, large, emptyLabel }: Props) {
    const [draft, setDraft] = useState<string | null>(null);
    const stop = (e: React.SyntheticEvent) => e.stopPropagation();

    if (draft !== null) {
        const commit = () => {
            const clean = draft.trim();
            onChange(clean && clean !== (calculated || '') ? clean : null);
            setDraft(null);
        };
        return (
            <span className="inline-flex items-center gap-1" onClick={stop}>
                <input
                    autoFocus
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === 'Enter') commit();
                        if (e.key === 'Escape') setDraft(null);
                    }}
                    maxLength={60}
                    placeholder={calculated || 'ex : 800 g'}
                    className="w-28 text-sm font-bold text-right rounded-lg border border-stone-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#E1567A] bg-white"
                />
                <button type="button" onClick={commit} aria-label="Valider" className="p-1.5 rounded-lg bg-stone-900 text-white">
                    <Check className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setDraft(null)} aria-label="Annuler" className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100">
                    <X className="w-3.5 h-3.5" />
                </button>
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 shrink-0" onClick={stop}>
            <span
                className={`${large ? 'text-lg font-black' : 'text-sm font-bold'} tabular-nums text-right ${
                    muted ? 'line-through text-stone-400' : edited ? 'text-[#c94567]' : 'text-stone-900'
                }`}
                title={edited && calculated ? `Calculé : ${calculated}` : undefined}
            >
                {value || emptyLabel || (large ? 'selon recette' : '')}
            </span>
            <button
                type="button"
                onClick={() => setDraft(value || '')}
                aria-label="Modifier la quantité"
                className="p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100"
            >
                <Pencil className="w-3.5 h-3.5" />
            </button>
            {edited && (
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    aria-label="Revenir à la quantité calculée"
                    title={calculated ? `Revenir à ${calculated}` : 'Revenir à la quantité calculée'}
                    className="p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
            )}
        </span>
    );
}

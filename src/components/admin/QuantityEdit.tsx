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
    // Optional: the item's name can be changed in the same edit (last-minute swaps)
    name?: string; // name shown (renamed or from the recipes)
    originalName?: string; // set when the item was renamed by hand
    onRename?: (name: string | null) => void; // null = back to the recipe name
}

/**
 * An amount on the shopping list that Elisa can correct on the spot (« 750 g » → « 800 g », « 2 bottes »…),
 * and, when onRename is given, the item's name too (« Crème fraîche » → « Crème de soja »).
 * Clicks never reach the row underneath (which ticks the item).
 */
export default function QuantityEdit({ value, calculated, edited, onChange, muted, large, emptyLabel, name, originalName, onRename }: Props) {
    const [draft, setDraft] = useState<{ amount: string; name: string } | null>(null);
    const stop = (e: React.SyntheticEvent) => e.stopPropagation();
    const renamed = Boolean(originalName);
    const canRename = Boolean(onRename && name !== undefined);
    const recipeName = originalName || name || '';

    if (draft !== null) {
        const commit = () => {
            const amount = draft.amount.trim();
            const nextAmount = amount && amount !== (calculated || '') ? amount : null;
            if (nextAmount !== (edited ? value : null)) onChange(nextAmount);
            if (canRename) {
                const typed = draft.name.trim();
                const nextName = typed && typed !== recipeName ? typed : null;
                if (nextName !== (renamed ? name : null)) onRename!(nextName);
            }
            setDraft(null);
        };
        const onKeyDown = (e: React.KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setDraft(null);
        };
        const input = 'text-sm font-bold rounded-lg border border-stone-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#E1567A] bg-white';
        return (
            <span className="inline-flex flex-wrap items-center justify-end gap-1" onClick={stop}>
                {canRename && (
                    <input
                        autoFocus
                        value={draft.name}
                        onChange={e => setDraft({ ...draft, name: e.target.value })}
                        onKeyDown={onKeyDown}
                        maxLength={60}
                        placeholder={recipeName}
                        aria-label="Nom de l’article"
                        className={`${input} w-40 min-w-0`}
                    />
                )}
                <input
                    autoFocus={!canRename}
                    value={draft.amount}
                    onChange={e => setDraft({ ...draft, amount: e.target.value })}
                    onKeyDown={onKeyDown}
                    maxLength={60}
                    placeholder={calculated || 'ex : 800 g'}
                    aria-label="Quantité"
                    className={`${input} w-24 text-right`}
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

    const changed = edited || renamed;
    const backTitle = [
        edited && calculated ? `quantité ${calculated}` : edited ? 'quantité calculée' : '',
        renamed ? `« ${originalName} »` : ''
    ].filter(Boolean).join(' et ');

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
                onClick={() => setDraft({ amount: value || '', name: name || '' })}
                aria-label={canRename ? 'Modifier l’article ou la quantité' : 'Modifier la quantité'}
                title={canRename ? 'Modifier le nom ou la quantité' : 'Modifier la quantité'}
                className="p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100"
            >
                <Pencil className="w-3.5 h-3.5" />
            </button>
            {changed && (
                <button
                    type="button"
                    onClick={() => {
                        if (edited) onChange(null);
                        if (renamed) onRename?.(null);
                    }}
                    aria-label="Revenir à la version de la recette"
                    title={`Revenir à ${backTitle}`}
                    className="p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
            )}
        </span>
    );
}

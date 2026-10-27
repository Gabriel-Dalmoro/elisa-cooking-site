'use client';

import React, { useState } from 'react';
import { Check, Pencil, RotateCcw, X } from 'lucide-react';

interface Props {
    title: string; // the menu's title (or what the client wrote, for a custom dish)
    override?: string; // this client's title, when Elisa renamed it
    onSave: (title: string) => Promise<boolean>; // '' = back to the menu's title
    className?: string;
}

/**
 * A dish title on one client's cooking sheet that Elisa can rename for this client only
 * (« Curry de légumes » → « Curry de légumes sans lait de coco »). The menu keeps its title.
 */
export default function DishTitleEdit({ title, override, onSave, className = 'text-lg font-serif font-bold text-stone-900' }: Props) {
    const [draft, setDraft] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const shown = override || title;

    const save = async (value: string) => {
        setSaving(true);
        const ok = await onSave(value.trim() === title.trim() ? '' : value.trim());
        setSaving(false);
        if (ok) setDraft(null);
    };

    if (draft !== null) {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                    <input
                        autoFocus
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') save(draft);
                            if (e.key === 'Escape') setDraft(null);
                        }}
                        maxLength={120}
                        placeholder={title}
                        aria-label="Titre du plat pour ce client"
                        className="flex-1 min-w-0 text-base font-bold rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E1567A]"
                    />
                    <button type="button" disabled={saving} onClick={() => save(draft)} aria-label="Valider" className="p-2 rounded-xl bg-stone-900 text-white disabled:opacity-50">
                        <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setDraft(null)} aria-label="Annuler" className="p-2 rounded-xl text-stone-500 hover:bg-stone-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-[11px] text-stone-500">Pour ce client et cette semaine seulement. Le menu garde « {title} ».</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-start gap-1.5">
                <h4 className={`${className} ${override ? 'text-[#c94567]' : ''}`}>{shown}</h4>
                <button
                    type="button"
                    onClick={() => setDraft(shown)}
                    aria-label="Renommer ce plat pour ce client"
                    title="Renommer pour ce client"
                    className="mt-0.5 p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 shrink-0"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </div>
            {override && (
                <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
                    Titre du menu : « {title} »
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => save('')}
                        className="inline-flex items-center gap-1 font-semibold text-stone-600 hover:text-stone-900 underline-offset-2 hover:underline"
                    >
                        <RotateCcw className="w-3 h-3" /> Rétablir
                    </button>
                </p>
            )}
        </div>
    );
}

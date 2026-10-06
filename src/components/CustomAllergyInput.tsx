'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cleanCustomAllergy } from '@/lib/allergies';

interface Props {
    existing: string[];
    onAdd: (allergy: string) => void;
    focusRingClass?: string; // e.g. 'focus:ring-amber-500' to match the page
    buttonClass?: string;
}

/**
 * "Autre" box under the allergy buttons: type a restriction that isn't in the list (Halal, Kasher…)
 * and add it as a tag. Enter also adds it.
 */
export default function CustomAllergyInput({
    existing,
    onAdd,
    focusRingClass = 'focus:ring-[#E1567A]',
    buttonClass = 'bg-[#E1567A] hover:bg-[#c94567]'
}: Props) {
    const [text, setText] = useState('');
    const value = cleanCustomAllergy(text);
    const alreadyThere = existing.some(a => a.toLowerCase() === value.toLowerCase());

    const add = () => {
        if (!value || alreadyThere) {
            setText('');
            return;
        }
        onAdd(value);
        setText('');
    };

    return (
        <div className="flex items-center gap-1.5 pt-2">
            <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        add();
                    }
                }}
                maxLength={100}
                placeholder="Autre (ex : Halal, Kasher, sans soja…)"
                className={`flex-1 min-w-0 text-xs p-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 ${focusRingClass}`}
            />
            <button
                type="button"
                onClick={add}
                disabled={!value}
                className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-white px-3 py-2 rounded-xl transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed ${buttonClass}`}
            >
                <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
        </div>
    );
}

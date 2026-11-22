'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { Refrigerator, Snowflake } from 'lucide-react';

/**
 * A text box that grows with its text, so a long dish name wraps onto a new line instead of
 * being cut off. Enter doesn't add a line (a name is one line of text).
 */
export function AutoTextarea({
    value, onChange, className = '', placeholder, onClick, ariaLabel
}: {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    onClick?: (e: React.MouseEvent) => void;
    ariaLabel?: string;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);
    return (
        <textarea
            ref={ref}
            rows={1}
            value={value}
            placeholder={placeholder}
            aria-label={ariaLabel}
            onClick={onClick}
            onChange={e => onChange(e.target.value.replace(/\n/g, ' '))}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
            className={`w-full resize-none overflow-hidden bg-transparent focus:outline-none ${className}`}
        />
    );
}

/**
 * How a dish keeps, set with its name (before the recipe): freezable or not, and about how many
 * days in the fridge. Clients see it when they choose.
 */
export function StorageFields({
    freezable, fridgeDays, onChange
}: {
    freezable: boolean | null | undefined;
    fridgeDays: number | null | undefined;
    onChange: (patch: { freezable?: boolean | null; fridgeDays?: number | null }) => void;
}) {
    const choice = (value: boolean, label: string) => (
        <button
            type="button"
            onClick={() => onChange({ freezable: freezable === value ? null : value })}
            aria-pressed={freezable === value}
            className={`px-3 h-8 text-xs font-semibold rounded-full transition-colors ${
                freezable === value ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
        >
            {label}
        </button>
    );
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-sky-600" />
                <span className="text-sm text-stone-700">Congelable</span>
                <div className="flex items-center bg-stone-100 rounded-full p-0.5 border border-stone-200">
                    {choice(true, 'Oui')}
                    {choice(false, 'Non')}
                </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-700">
                <Refrigerator className="w-4 h-4 text-stone-500" />
                Se garde ≈
                <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={30}
                    value={fridgeDays ?? ''}
                    onChange={e => {
                        const n = parseInt(e.target.value, 10);
                        onChange({ fridgeDays: Number.isInteger(n) && n >= 1 && n <= 30 ? n : null });
                    }}
                    placeholder="—"
                    className="w-14 h-8 px-2 rounded-lg border border-stone-300 text-center text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E1567A]"
                />
                jours au frigo
            </label>
        </div>
    );
}

/** Compact « ❄️ · 3 j » for lists; nothing when not set. */
export function StorageBadges({ freezable, fridgeDays }: { freezable?: boolean | null; fridgeDays?: number | null }) {
    if (freezable == null && !fridgeDays) return null;
    return (
        <span className="inline-flex items-center gap-2 text-[11px] text-stone-500">
            {freezable === true && <span className="inline-flex items-center gap-0.5" title="Se congèle"><Snowflake className="w-3 h-3 text-sky-600" /> Congelable</span>}
            {freezable === false && <span className="inline-flex items-center gap-0.5" title="Ne se congèle pas"><Snowflake className="w-3 h-3 text-stone-400" /> Non congelable</span>}
            {fridgeDays ? <span className="inline-flex items-center gap-0.5" title="Jours au frigo (estimation)"><Refrigerator className="w-3 h-3" /> {fridgeDays} j</span> : null}
        </span>
    );
}

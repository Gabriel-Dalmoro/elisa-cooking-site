'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';

/**
 * Shopping list aisles, built for the phone at the market:
 * a big tappable aisle bar (name, « 3/8 », progress) that stays pinned while scrolling,
 * folds on tap, and folds by itself once everything in it is taken.
 * Folded aisles are remembered on the device (per list), so a reload or a locked phone keeps them.
 */

export interface AisleProgress {
    name: string;
    done: number;
    total: number;
}

export function useFoldedAisles(storageKey: string, aisles: AisleProgress[]) {
    const [folded, setFolded] = useState<string[]>([]);
    const loaded = useRef(false);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (Array.isArray(saved)) setFolded(saved.filter((n): n is string => typeof n === 'string'));
        } catch {
            // private mode or blocked storage: nothing remembered
        }
        loaded.current = true;
    }, [storageKey]);

    useEffect(() => {
        if (!loaded.current) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(folded));
        } catch {
            // ignore
        }
    }, [storageKey, folded]);

    // An aisle that just became complete folds itself (only on that change: it can be reopened)
    const wasComplete = useRef<Record<string, boolean> | null>(null);
    const signature = aisles.map(a => `${a.name}:${a.done}/${a.total}`).join('|');
    useEffect(() => {
        const now = Object.fromEntries(aisles.map(a => [a.name, a.total > 0 && a.done >= a.total]));
        const before = wasComplete.current;
        wasComplete.current = now;
        if (!before) return; // first render: keep what was remembered
        const justDone = aisles.filter(a => now[a.name] && before[a.name] === false).map(a => a.name);
        if (justDone.length > 0) setFolded(prev => [...new Set([...prev, ...justDone])]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signature]);

    const isFolded = useCallback((name: string) => folded.includes(name), [folded]);
    const toggle = useCallback((name: string) => {
        setFolded(prev => (prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]));
    }, []);
    const foldAll = useCallback(() => setFolded(aisles.map(a => a.name)), [aisles]);
    const unfoldAll = useCallback(() => setFolded([]), []);
    const allFolded = aisles.length > 0 && aisles.every(a => folded.includes(a.name));

    return { isFolded, toggle, foldAll, unfoldAll, allFolded };
}

interface Props {
    title: string;
    done: number;
    total: number;
    folded: boolean;
    onToggle: () => void;
    warning?: boolean; // « À classer »: aisle unknown
    stickyTop?: string; // where the bar pins (below a fixed header, if any)
    children: React.ReactNode;
}

export default function AisleSection({ title, done, total, folded, onToggle, warning, stickyTop = 'top-0', children }: Props) {
    const complete = total > 0 && done >= total;
    const left = total - done;
    return (
        <section className="space-y-2">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={!folded}
                className={`sticky ${stickyTop} z-20 w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition-colors ${
                    complete
                        ? 'bg-emerald-50 border-emerald-200'
                        : warning
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-stone-900 border-stone-900'
                }`}
            >
                <span className="flex-1 min-w-0">
                    <span className={`block text-lg font-black leading-tight truncate ${
                        complete ? 'text-emerald-800' : warning ? 'text-amber-900' : 'text-white'
                    }`}>
                        {title}
                    </span>
                    <span className="mt-1.5 flex items-center gap-2">
                        <span className={`h-1.5 flex-1 max-w-[8rem] rounded-full overflow-hidden ${complete ? 'bg-emerald-200' : warning ? 'bg-amber-200' : 'bg-white/20'}`}>
                            <span
                                className={`block h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : warning ? 'bg-amber-500' : 'bg-[#E1567A]'}`}
                                style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                            />
                        </span>
                        <span className={`text-xs font-semibold tabular-nums ${complete ? 'text-emerald-700' : warning ? 'text-amber-800' : 'text-stone-300'}`}>
                            {complete ? 'Tout pris' : `${left} à prendre · ${done}/${total}`}
                        </span>
                    </span>
                </span>
                {complete && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />}
                <ChevronDown
                    className={`w-6 h-6 shrink-0 transition-transform ${folded ? '-rotate-90' : ''} ${
                        complete ? 'text-emerald-700' : warning ? 'text-amber-800' : 'text-white'
                    }`}
                />
            </button>
            {!folded && children}
        </section>
    );
}

/** « Tout replier / Tout déplier », next to the list's other filters. */
export function FoldAllButton({ allFolded, onFold, onUnfold }: { allFolded: boolean; onFold: () => void; onUnfold: () => void }) {
    return (
        <button
            type="button"
            onClick={allFolded ? onUnfold : onFold}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white text-stone-700 border-stone-300 flex items-center gap-1.5"
        >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${allFolded ? '-rotate-90' : ''}`} />
            {allFolded ? 'Tout déplier' : 'Tout replier'}
        </button>
    );
}

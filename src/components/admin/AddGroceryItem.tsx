'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface ClientOption {
    label: string;
    dot: string; // colour class of that client's column
}

interface Props {
    // One client's list: their added items. Combined list: each client's (label → items).
    extras: Record<string, string[]>;
    clients: ClientOption[]; // one entry for a single list (no picker shown)
    onChange: (client: string, next: string[]) => Promise<boolean>;
}

/**
 * Add something to the shopping list on the spot (« 2 citrons », « 1 l de lait », « sacs congélation »).
 * It lands in the right aisle, adds up with the same item from the recipes, and is saved right away
 * on that client's list for the week.
 */
export default function AddGroceryItem({ extras, clients, onChange }: Props) {
    const [text, setText] = useState('');
    const [client, setClient] = useState(clients[0]?.label || '');
    const [busy, setBusy] = useState(false);
    const target = clients.some(c => c.label === client) ? client : clients[0]?.label || '';
    const showPicker = clients.length > 1;

    const add = async () => {
        const line = text.trim();
        if (!line || !target || busy) return;
        setBusy(true);
        const ok = await onChange(target, [...(extras[target] || []), line]);
        setBusy(false);
        if (ok) setText('');
    };

    const remove = async (owner: string, index: number) => {
        setBusy(true);
        await onChange(owner, (extras[owner] || []).filter((_, i) => i !== index));
        setBusy(false);
    };

    const added = clients.flatMap(c => (extras[c.label] || []).map((line, index) => ({ owner: c, line, index })));

    return (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-3 space-y-2.5">
            <p className="text-xs font-bold text-stone-700">+ Ajouter un article</p>
            {showPicker && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-stone-500">Pour :</span>
                    {clients.map(c => (
                        <button
                            key={c.label}
                            type="button"
                            onClick={() => setClient(c.label)}
                            className={`px-3 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${
                                target === c.label ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-300'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} /> {c.label.split(/\s+/)[0]}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex items-center gap-2">
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    maxLength={100}
                    placeholder="ex : 2 citrons, 1 l de lait, sacs congélation"
                    className="flex-1 min-w-0 text-sm p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#E1567A]"
                />
                <button
                    type="button"
                    onClick={add}
                    disabled={!text.trim() || busy}
                    className="shrink-0 h-10 px-4 rounded-xl bg-[#E1567A] hover:bg-[#c94567] text-white text-sm font-bold flex items-center gap-1 disabled:opacity-40"
                >
                    <Plus className="w-4 h-4" /> Ajouter
                </button>
            </div>
            {added.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {added.map(({ owner, line, index }) => (
                        <span key={`${owner.label}-${index}`} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-stone-200 rounded-full pl-2.5 pr-1 py-0.5">
                            {showPicker && <span className={`w-2 h-2 rounded-full ${owner.dot}`} />}
                            {line}
                            <button
                                type="button"
                                onClick={() => remove(owner.label, index)}
                                disabled={busy}
                                aria-label={`Retirer ${line}`}
                                className="p-0.5 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

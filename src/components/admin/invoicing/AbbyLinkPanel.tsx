'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Link2, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AbbyContactCandidate, ContactMatch } from '@/lib/invoicing/abbyMatch';

interface LinkState {
    enabled: boolean;
    linked: AbbyContactCandidate | null;
    linkBroken: boolean;
    match: ContactMatch | null;
}

/**
 * « Client dans Abby »: which Abby contact this client is. Shown only when the Abby connection is on.
 * Abby can't search by e-mail, so the app searches by name and Elisa confirms the right one once;
 * a new contact is created only when she clicks « Créer dans Abby ».
 */
export default function AbbyLinkPanel({ clientId, clientName, onToast }: {
    clientId: string;
    clientName: string;
    onToast: (message: string, ok: boolean) => void;
}) {
    const [state, setState] = useState<LinkState | null>(null);
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);
    const [changing, setChanging] = useState(false);
    const base = `/api/admin/invoicing/clients/${encodeURIComponent(clientId)}/abby`;

    const load = useCallback(async (q?: string) => {
        setBusy(true);
        try {
            const res = await fetch(q ? `${base}?q=${encodeURIComponent(q)}` : base);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Abby ne répond pas');
            setState(data);
        } catch (e) {
            onToast(e instanceof Error ? e.message : 'Abby ne répond pas', false);
        } finally {
            setBusy(false);
        }
    }, [base, onToast]);

    useEffect(() => { load(); }, [load]);

    const post = async (body: object, done: string) => {
        setBusy(true);
        try {
            const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Action impossible');
            onToast(done, true);
            setChanging(false);
            await load();
        } catch (e) {
            onToast(e instanceof Error ? e.message : 'Action impossible', false);
        } finally {
            setBusy(false);
        }
    };

    if (!state) return null;
    if (!state.enabled) return null;

    const box = 'rounded-2xl border border-stone-200 bg-stone-50 p-3 space-y-2.5';
    const title = <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Client dans Abby</p>;

    if (state.linked && !changing) {
        return (
            <div className={box}>
                {title}
                <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-stone-800">{state.linked.fullname}</span>
                    <span className="text-xs text-stone-500">{state.linked.emails.join(', ')}</span>
                    <button type="button" disabled={busy} onClick={() => setChanging(true)} className="ml-auto text-xs underline text-stone-600">Changer</button>
                </div>
            </div>
        );
    }

    const candidates = state.match?.candidates || [];
    return (
        <div className={box}>
            {title}
            {state.linkBroken && (
                <p className="text-xs text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Le contact relié n’existe plus ou est archivé dans Abby : choisissez-le à nouveau.
                </p>
            )}
            <p className="text-xs text-stone-600">
                Choisissez une seule fois qui est {clientName} dans Abby. Ensuite, toutes ses factures iront sur ce contact.
            </p>

            {candidates.length > 0 ? (
                <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
                    {candidates.map(c => (
                        <li key={c.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-stone-800 text-sm">
                                    {c.fullname}
                                    {c.organizationName && <span className="font-normal text-stone-500"> · {c.organizationName}</span>}
                                </span>
                                <span className="block text-xs text-stone-500">{c.emails.join(', ') || 'pas d’e-mail'}</span>
                                <span className="flex gap-1.5 mt-0.5">
                                    {c.sameEmail && <span className="text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-2">même e-mail</span>}
                                    {c.sameName && <span className="text-[10px] font-bold rounded-full bg-sky-50 text-sky-800 border border-sky-300 px-2">même nom</span>}
                                    {c.hasBillings && <span className="text-[10px] rounded-full bg-stone-100 text-stone-600 border border-stone-200 px-2">déjà facturé</span>}
                                </span>
                            </span>
                            <Button size="sm" disabled={busy} onClick={() => post({ action: 'link', contactId: c.id }, `${clientName} relié(e) à ${c.fullname} dans Abby`)} className="rounded-full text-xs h-8 gap-1.5 bg-stone-900 text-white hover:bg-stone-800">
                                <Link2 className="w-3.5 h-3.5" /> C’est ce client
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-stone-500 bg-white rounded-xl border border-stone-200 p-2.5">Aucun contact trouvé dans Abby pour ce nom.</p>
            )}

            <form onSubmit={e => { e.preventDefault(); if (query.trim()) load(query.trim()); }} className="flex gap-2">
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Chercher un autre nom dans Abby"
                    className="flex-1 min-w-0 p-2 rounded-xl border border-stone-300 bg-white text-sm"
                />
                <Button type="submit" size="sm" variant="outline" disabled={busy || !query.trim()} className="rounded-full h-9 gap-1.5">
                    <Search className="w-3.5 h-3.5" /> Chercher
                </Button>
            </form>

            <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                        if (window.confirm(`Créer « ${clientName} » comme nouveau client dans Abby ? Faites-le seulement s’il n’y est pas déjà.`)) {
                            post({ action: 'create' }, `${clientName} créé(e) dans Abby`);
                        }
                    }}
                    className="text-xs underline text-stone-700 flex items-center gap-1"
                >
                    <UserPlus className="w-3.5 h-3.5" /> Pas dans la liste : créer dans Abby
                </button>
                {changing && (
                    <button type="button" onClick={() => setChanging(false)} className="text-xs underline text-stone-500">Garder le contact actuel</button>
                )}
            </div>
        </div>
    );
}

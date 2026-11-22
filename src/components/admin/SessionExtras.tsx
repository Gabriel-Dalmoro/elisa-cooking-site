'use client';

import React, { useEffect, useState } from 'react';
import { Clock3, Copy, Gift, Mail, MapPin, Phone, Plus, StickyNote, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimeFr, type BookingSession, type ClientProfile, type WeeklyDish } from '@/lib/types/cooking-ops';

/** Phone, e-mail and address of the client, one tap away (Elisa looks them up from the planning). */
export function ClientContact({ client, onCopied }: { client: ClientProfile; onCopied: (message: string) => void }) {
    const copy = async (text: string, what: string) => {
        try {
            await navigator.clipboard.writeText(text);
            onCopied(`${what} copié`);
        } catch {
            onCopied('Copie impossible sur cet appareil');
        }
    };
    if (!client.phone && !client.email && !client.address) return null;
    const row = 'flex items-center gap-2 min-w-0';
    return (
        <div className="rounded-2xl border border-stone-200 p-3 space-y-2 text-sm">
            {client.phone && (
                <div className={row}>
                    <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                    <a href={`tel:${client.phone.replace(/[^0-9+]/g, '')}`} className="font-medium text-stone-900 hover:underline">{client.phone}</a>
                    <button type="button" onClick={() => copy(client.phone, 'Numéro')} className="ml-auto p-1 text-stone-400 hover:text-stone-800" title="Copier"><Copy className="w-3.5 h-3.5" /></button>
                </div>
            )}
            {client.email && (
                <div className={row}>
                    <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                    <a href={`mailto:${client.email}`} className="text-stone-800 hover:underline truncate">{client.email}</a>
                    <button type="button" onClick={() => copy(client.email!, 'E-mail')} className="ml-auto p-1 text-stone-400 hover:text-stone-800" title="Copier"><Copy className="w-3.5 h-3.5" /></button>
                </div>
            )}
            {client.address && (
                <div className={row}>
                    <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`} target="_blank" rel="noopener noreferrer" className="text-stone-800 hover:underline truncate">{client.address}</a>
                    <button type="button" onClick={() => copy(client.address!, 'Adresse')} className="ml-auto p-1 text-stone-400 hover:text-stone-800" title="Copier"><Copy className="w-3.5 h-3.5" /></button>
                </div>
            )}
            {client.accessCode && <p className="t-meta pl-6">Code d&apos;accès : <span className="font-semibold text-stone-700">{client.accessCode}</span></p>}
        </div>
    );
}

/**
 * This session only: arrival time, a note (the client's notes stay « for always »), and free dishes
 * added for this session (e.g. to make up for a mistake). Saved straight away.
 */
export function SessionExtras({
    session, menuDishes, onSaved, onError
}: {
    session: BookingSession;
    menuDishes: WeeklyDish[];
    onSaved: (session: BookingSession, message: string) => void;
    onError: (message: string) => void;
}) {
    const [time, setTime] = useState(session.arrivalTime || '');
    const [note, setNote] = useState(session.sessionNote || '');
    const [adding, setAdding] = useState(false);
    const [pick, setPick] = useState('');
    const [customName, setCustomName] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setTime(session.arrivalTime || '');
        setNote(session.sessionNote || '');
    }, [session.id, session.arrivalTime, session.sessionNote]);

    const patch = async (body: object, message: string) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/cooking-ops/session/${encodeURIComponent(session.id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Enregistrement impossible');
            onSaved(data.session, message);
            return true;
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Enregistrement impossible');
            return false;
        } finally {
            setBusy(false);
        }
    };

    const extras = session.extraDishes || [];
    const named = menuDishes.filter(d => d.name.trim());

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 items-start">
                <label className="space-y-1">
                    <span className="t-label flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> Arrivée</span>
                    <input
                        type="time"
                        value={time}
                        disabled={busy}
                        onChange={e => setTime(e.target.value)}
                        onBlur={() => { if (time !== (session.arrivalTime || '')) patch({ arrivalTime: time }, time ? `Arrivée à ${formatTimeFr(time)}` : 'Heure d’arrivée retirée'); }}
                        className="h-10 px-3 rounded-xl border border-stone-300 bg-white text-sm tabular-nums"
                    />
                </label>
                <label className="space-y-1">
                    <span className="t-label flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" /> Note pour cette séance</span>
                    <textarea
                        value={note}
                        disabled={busy}
                        rows={2}
                        maxLength={1000}
                        onChange={e => setNote(e.target.value)}
                        onBlur={() => { if (note.trim() !== (session.sessionNote || '')) patch({ sessionNote: note }, 'Note enregistrée'); }}
                        placeholder="Seulement cette fois (ex : code de la porte changé)"
                        className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-sm resize-none"
                    />
                </label>
            </div>

            <div className="space-y-2">
                <span className="t-label flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Plats offerts</span>
                {extras.length > 0 && (
                    <ul className="space-y-1.5">
                        {extras.map(extra => (
                            <li key={extra.id} className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm">
                                <span className="font-serif font-semibold text-stone-900 flex-1 min-w-0">{extra.name}</span>
                                <span className="t-meta">offert</span>
                                <button type="button" disabled={busy} onClick={() => patch({ removeExtraDishId: extra.id }, `« ${extra.name} » retiré`)} className="p-1 text-stone-400 hover:text-red-600" title="Retirer">
                                    <X className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {adding ? (
                    <div className="rounded-2xl border border-stone-200 p-3 space-y-2">
                        <select value={pick} onChange={e => { setPick(e.target.value); setCustomName(''); }} className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-sm">
                            <option value="">Un plat du menu de la semaine…</option>
                            {named.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <input
                            value={customName}
                            onChange={e => { setCustomName(e.target.value); setPick(''); }}
                            placeholder="… ou un autre plat (nom)"
                            maxLength={200}
                            className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-sm"
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                disabled={busy || (!pick && !customName.trim())}
                                onClick={async () => {
                                    const ok = await patch(
                                        { addExtraDish: pick ? { fromMenuDishId: pick } : { name: customName } },
                                        'Plat offert ajouté à la fiche cuisine et aux courses'
                                    );
                                    if (ok) { setAdding(false); setPick(''); setCustomName(''); }
                                }}
                                className="rounded-full h-9 px-4 text-xs font-semibold bg-stone-900 text-white"
                            >
                                Ajouter (offert)
                            </Button>
                            <button type="button" onClick={() => setAdding(false)} className="text-xs text-stone-500 underline">Annuler</button>
                        </div>
                    </div>
                ) : (
                    <button type="button" onClick={() => setAdding(true)} className="text-sm font-semibold text-[#E1567A] flex items-center gap-1 hover:underline">
                        <Plus className="w-4 h-4" /> Ajouter un plat offert
                    </button>
                )}
            </div>
        </div>
    );
}

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, ChefHat, ShoppingCart, Square, Users } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import GroceryListCard from '@/components/admin/GroceryListCard';
import { useToast } from '@/components/admin/useToast';
import { BookingSession, SlotSessionStatus } from '@/lib/types/cooking-ops';
import { getParisDateTimeInfo } from '@/lib/dateUtils';
import { GrocerySheet, sheetGroceryInput } from '@/lib/grocery/fromSheet';
import { buildMergedGroceryList, GroceryClientInput } from '@/lib/grocery/list';

interface SessionSheet extends GrocerySheet {
    session: BookingSession;
}

// Upcoming sessions: this week and next (Elisa shops a day or two ahead)
const WEEK_OFFSETS = [0, 1];

function sessionLabel(session: BookingSession): string {
    const { dayNumber, monthName } = getParisDateTimeInfo(session.dateIso);
    return `${session.dayName} ${dayNumber} ${monthName} · ${session.timeSlot}`;
}

const sameKeys = (a: string[], b: string[]) => a.length === b.length && a.every(k => b.includes(k));

/**
 * Shopping for several clients at once: tick 2 clients (or more) and get ONE list,
 * amounts added up, with each client's part on every item.
 * The selection is kept in the address (?s=id1,id2) so other pages can link straight to it.
 */
export default function CombinedGroceryPage() {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [slots, setSlots] = useState<SlotSessionStatus[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sheets, setSheets] = useState<Record<string, SessionSheet>>({});
    const [sheetError, setSheetError] = useState<string | null>(null);
    const { showToast, toastElement } = useToast();

    // Sessions to choose from, plus the ones already in the address
    useEffect(() => {
        const fromUrl = (new URLSearchParams(window.location.search).get('s') || '').split(',').filter(Boolean);
        setSelectedIds(fromUrl);

        const load = async () => {
            try {
                const weeks = await Promise.all(WEEK_OFFSETS.map(async offset => {
                    const res = await fetch(`/api/cooking-ops/admin?offset=${offset}`);
                    if (!res.ok) throw new Error('Chargement du planning impossible');
                    return (await res.json()).slotStatuses as SlotSessionStatus[];
                }));
                const todayIso = getParisDateTimeInfo(new Date()).isoDate;
                const upcoming = weeks
                    .flat()
                    .filter(s => !s.isUnmatchedClient && (s.session.dateIso >= todayIso || fromUrl.includes(s.session.id)))
                    .sort((a, b) =>
                        a.session.dateIso.localeCompare(b.session.dateIso) ||
                        (a.session.timeSlot === b.session.timeSlot ? 0 : a.session.timeSlot === 'Matin' ? -1 : 1)
                    );
                setSlots(upcoming);
            } catch (e) {
                setLoadError(e instanceof Error ? e.message : 'Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Keep the address in sync, so the page can be reopened or shared as is
    useEffect(() => {
        const url = new URL(window.location.href);
        if (selectedIds.length > 0) url.searchParams.set('s', selectedIds.join(','));
        else url.searchParams.delete('s');
        window.history.replaceState(null, '', url.toString());
    }, [selectedIds]);

    // Load each chosen session's kitchen sheet (dishes, recipes, ticks) once
    useEffect(() => {
        const missing = selectedIds.filter(id => !sheets[id]);
        if (missing.length === 0) return;
        let cancelled = false;
        Promise.all(missing.map(async id => {
            const res = await fetch(`/api/cooking-ops/session/${encodeURIComponent(id)}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Séance introuvable');
            return [id, data as SessionSheet] as const;
        }))
            .then(entries => {
                if (cancelled) return;
                setSheetError(null);
                setSheets(prev => ({ ...prev, ...Object.fromEntries(entries) }));
            })
            .catch(e => {
                if (!cancelled) setSheetError(e instanceof Error ? e.message : 'Chargement impossible');
            });
        return () => {
            cancelled = true;
        };
    }, [selectedIds, sheets]);

    const toggleSession = (id: string) => {
        setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    // The chosen clients, in planning order, with what the list needs
    const chosen = useMemo(() => {
        const ready = selectedIds
            .map(id => sheets[id])
            .filter((sheet): sheet is SessionSheet => Boolean(sheet?.client && sheet.selection))
            .sort((a, b) => a.session.dateIso.localeCompare(b.session.dateIso));
        const names = ready.map(s => s.client!.name);
        return ready.map(sheet => {
            const name = sheet.client!.name;
            // Same client twice (two sessions): add the day so the parts can be told apart
            const label = names.filter(n => n === name).length > 1 ? `${name} (${sheet.session.dayName})` : name;
            const persons = sheet.session.personCount || sheet.client!.personCount || 2;
            return { sheet, label, input: sheetGroceryInput(sheet, persons)! };
        });
    }, [selectedIds, sheets]);

    const allLoaded = selectedIds.every(id => sheets[id]);

    const list = useMemo(() => {
        if (chosen.length < 2) return null;
        const clients: GroceryClientInput[] = chosen.map(c => ({
            ...c.input,
            label: c.label,
            done: c.sheet.selection?.groceryChecked || []
        }));
        return buildMergedGroceryList(clients);
    }, [chosen]);

    // Ticked in the combined list = ticked for every client who needs that item
    const savedChecked = useMemo(
        () => (list ? list.sections.flatMap(s => s.items.filter(i => i.done).map(i => i.key)) : []),
        [list]
    );

    // Only the items whose tick changed are written to each client's own list
    const saveTicks = useCallback(async (checkedKeys: string[]) => {
        if (!list) return false;
        const turnedOn = checkedKeys.filter(k => !savedChecked.includes(k));
        const turnedOff = savedChecked.filter(k => !checkedKeys.includes(k));
        const itemsByClient = new Map<string, Set<string>>();
        for (const item of list.sections.flatMap(s => s.items)) {
            for (const share of item.byClient || []) {
                if (!itemsByClient.has(share.client)) itemsByClient.set(share.client, new Set());
                itemsByClient.get(share.client)!.add(item.key);
            }
        }

        try {
            const updates = chosen.map(async ({ sheet, label }) => {
                const own = itemsByClient.get(label) || new Set<string>();
                const before = sheet.selection?.groceryChecked || [];
                const after = [
                    ...before.filter(k => !(turnedOff.includes(k) && own.has(k))),
                    ...turnedOn.filter(k => own.has(k) && !before.includes(k))
                ];
                if (sameKeys(before, after)) return null;
                const res = await fetch(`/api/cooking-ops/session/${encodeURIComponent(sheet.session.id)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groceryChecked: after })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || `Enregistrement impossible pour ${label}`);
                return [sheet.session.id, data.selection] as const;
            });
            const results = (await Promise.all(updates)).filter((r): r is NonNullable<typeof r> => Boolean(r));
            setSheets(prev => {
                const next = { ...prev };
                for (const [id, selection] of results) next[id] = { ...next[id], selection };
                return next;
            });
            showToast('Liste enregistrée sur la fiche de chaque client', 'check');
            return true;
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Enregistrement impossible', 'error');
            return false;
        }
    }, [list, savedChecked, chosen, showToast]);

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-28 font-sans">
            <AdminPageHeader
                badgeText="ESPACE ADMIN • COURSES"
                title="Courses groupées"
                subtitle="Vous faites les courses pour plusieurs clients en même temps ? Cochez-les : une seule liste, quantités additionnées, avec la part de chaque client."
                backHref="/admin"
                backLabel="Retour à l'admin"
            />

            <main className="max-w-3xl mx-auto px-4 space-y-6">
                {/* 1. Pick the clients */}
                <section className="bg-white rounded-3xl border border-stone-200 shadow-xs p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#E1567A]" />
                        <h2 className="font-bold text-stone-900">1. Choisissez les clients (2 ou plus)</h2>
                    </div>

                    {loading ? (
                        <p className="text-sm text-stone-500">Chargement du planning…</p>
                    ) : loadError ? (
                        <p className="text-sm text-red-700 font-semibold">{loadError}</p>
                    ) : slots.length === 0 ? (
                        <p className="text-sm text-stone-500">Aucune séance à venir cette semaine ni la semaine prochaine.</p>
                    ) : (
                        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 overflow-hidden">
                            {slots.map(({ session, client, selection }) => {
                                const isChosen = selectedIds.includes(session.id);
                                const canChoose = Boolean(selection);
                                return (
                                    <li key={session.id}>
                                        <button
                                            type="button"
                                            onClick={() => toggleSession(session.id)}
                                            disabled={!canChoose && !isChosen}
                                            className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                                isChosen ? 'bg-rose-50/60' : canChoose ? 'hover:bg-stone-50' : 'opacity-60'
                                            }`}
                                        >
                                            {isChosen
                                                ? <CheckSquare className="w-5 h-5 text-[#E1567A] shrink-0" />
                                                : <Square className="w-5 h-5 text-stone-300 shrink-0" />}
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-sm font-bold text-stone-900">{client.name}</span>
                                                <span className="block text-[11px] text-stone-500">
                                                    {sessionLabel(session)} · {session.personCount || client.personCount || 2} pers.
                                                </span>
                                            </span>
                                            {canChoose ? (
                                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
                                                    ✓ Choix reçus
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold bg-stone-100 text-stone-500 border border-stone-200 rounded-full px-2 py-0.5 shrink-0">
                                                    Pas encore de choix
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* 2. The combined list */}
                {sheetError && (
                    <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-3xl text-sm font-semibold">{sheetError}</div>
                )}

                {selectedIds.length < 2 ? (
                    <div className="bg-white border border-dashed border-stone-300 rounded-3xl p-6 text-center text-sm text-stone-600 space-y-1">
                        <ShoppingCart className="w-8 h-8 text-stone-300 mx-auto" />
                        <p>
                            {selectedIds.length === 0
                                ? 'Cochez au moins 2 clients pour voir la liste groupée.'
                                : 'Cochez au moins un autre client pour grouper les listes.'}
                        </p>
                    </div>
                ) : !allLoaded ? (
                    <p className="text-sm text-stone-500 text-center">Préparation de la liste…</p>
                ) : list ? (
                    <>
                        <GroceryListCard
                            list={list}
                            title="Courses groupées"
                            heading="2. Liste de courses groupée"
                            defaultOpen
                            savedChecked={savedChecked}
                            onSave={saveTicks}
                            onCopied={ok => showToast(ok ? 'Liste copiée — collez-la dans WhatsApp ou Notes' : 'Copie impossible sur cet appareil', ok ? 'check' : 'error')}
                        />
                        <div className="flex flex-wrap gap-2 justify-center">
                            {chosen.map(({ sheet, label }) => (
                                <Link
                                    key={sheet.session.id}
                                    href={`/admin/cuisine/${encodeURIComponent(sheet.session.id)}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-full px-3 py-1.5 hover:border-[#E1567A]"
                                >
                                    <ChefHat className="w-3.5 h-3.5 text-[#E1567A]" /> Fiche cuisine · {label}
                                </Link>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4 text-sm text-amber-900">
                        Un des clients cochés n&apos;a pas encore envoyé ses choix : sa liste ne peut pas être ajoutée.
                    </div>
                )}
            </main>

            {toastElement}
        </div>
    );
}

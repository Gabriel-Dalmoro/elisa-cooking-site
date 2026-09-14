'use client';

import React, { useCallback, useEffect, useRef, useState, use } from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    CheckSquare,
    Square,
    Sun,
    Phone,
    MapPin,
    Info,
    ChefHat,
    Key,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { BookingSession, ClientProfile, ClientSelection, WeeklyDish } from '@/lib/types/cooking-ops';

interface KitchenSheet {
    session: BookingSession;
    client: ClientProfile | null;
    selection: ClientSelection | null;
    dishes: WeeklyDish[];
    missingDishNames: string[];
    weekLabel: string;
}

// Minimal typing for the Screen Wake Lock API
interface WakeLockSentinelLike {
    release: () => Promise<void>;
    addEventListener: (type: 'release', listener: () => void) => void;
}

function formatParisTime(iso?: string): string | null {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
}

export default function ChefCookingModePage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [sheet, setSheet] = useState<KitchenSheet | null>(null);
    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
    const [wakeLockWanted, setWakeLockWanted] = useState(false);
    const [wakeLockActive, setWakeLockActive] = useState(false);
    const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

    const stepsStorageKey = `cuisine:${sessionId}:steps`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/cooking-ops/session/${encodeURIComponent(sessionId)}`);
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || 'Séance introuvable');
                setSheet(data);
            } catch (e) {
                setLoadError(e instanceof Error ? e.message : 'Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Ticked steps survive a reload (e.g. the page is re-opened after losing signal)
        try {
            const saved = localStorage.getItem(stepsStorageKey);
            if (saved) setCompletedSteps(JSON.parse(saved));
        } catch {
            // Storage unavailable (private mode): ticks just won't persist
        }
    }, [sessionId, stepsStorageKey]);

    // --- Screen Wake Lock: the browser drops it whenever the screen locks or the tab is hidden,
    //     so it is requested again each time the page becomes visible.
    const requestWakeLock = useCallback(async () => {
        const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } };
        if (!nav.wakeLock) return false;
        try {
            const sentinel = await nav.wakeLock.request('screen');
            wakeLockRef.current = sentinel;
            setWakeLockActive(true);
            sentinel.addEventListener('release', () => setWakeLockActive(false));
            return true;
        } catch (err) {
            console.warn('Wake Lock error:', err);
            return false;
        }
    }, []);

    useEffect(() => {
        if (!wakeLockWanted) return;
        const onVisibility = () => {
            if (document.visibilityState === 'visible') requestWakeLock();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [wakeLockWanted, requestWakeLock]);

    const toggleWakeLock = async () => {
        if (wakeLockWanted) {
            setWakeLockWanted(false);
            await wakeLockRef.current?.release().catch(() => undefined);
            wakeLockRef.current = null;
            setWakeLockActive(false);
            return;
        }
        const ok = await requestWakeLock();
        if (ok) {
            setWakeLockWanted(true);
        } else {
            alert('La fonction « écran toujours allumé » n’est pas disponible sur cet appareil. Désactivez la mise en veille automatique dans les réglages du téléphone.');
        }
    };

    const toggleStep = (stepKey: string) => {
        setCompletedSteps(prev => {
            const next = { ...prev, [stepKey]: !prev[stepKey] };
            try {
                localStorage.setItem(stepsStorageKey, JSON.stringify(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center text-stone-600 font-sans">
                <div className="text-center space-y-3">
                    <ChefHat className="w-8 h-8 text-[#E1567A] animate-bounce mx-auto" />
                    <p className="text-sm font-semibold">Chargement de la fiche cuisine...</p>
                </div>
            </div>
        );
    }

    if (loadError || !sheet) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-4 max-w-sm">
                    <p className="text-stone-800 font-bold">{loadError || 'Fiche introuvable.'}</p>
                    <Link href="/admin/semaine">
                        <Button className="bg-[#E1567A] hover:bg-[#c94567] text-white rounded-full text-xs">
                            Retour au planning
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const { session, client, selection, dishes, missingDishNames } = sheet;
    const displayName = client?.name || session.clientName;
    const arrival = formatParisTime(session.startsAt);
    const allergiesAdded = selection?.allergiesAdded || [];

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-36 font-sans">
            <AdminPageHeader
                badgeText="ESPACE ADMIN • FICHE CUISINE"
                title={`Cuisine : ${displayName}`}
                subtitle={`${session.dayName} ${session.dateIso.split('-').reverse().join('/')} • ${session.timeSlot}${arrival ? ` • arrivée ${arrival}` : ''}`}
                backHref="/admin/semaine"
                backLabel="Retour au planning"
                actionElement={
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleWakeLock}
                        className={`text-xs h-9 px-4 rounded-full font-semibold border-stone-300 transition-colors ${
                            wakeLockActive ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white text-stone-700'
                        }`}
                    >
                        <Sun className={`w-3.5 h-3.5 mr-1.5 ${wakeLockActive ? 'text-amber-600' : 'text-stone-400'}`} />
                        {wakeLockActive ? 'Écran toujours allumé ✓' : 'Garder l’écran allumé'}
                    </Button>
                }
            />

            <main className="max-w-4xl mx-auto px-4 space-y-5">

                {!client && (
                    <div className="bg-red-50 text-red-800 border border-red-200 rounded-3xl p-4 text-sm font-semibold">
                        Aucune fiche client ne correspond à cet événement Google Calendar. Créez la fiche depuis le planning pour voir allergies, accès et choix.
                    </div>
                )}

                {/* 1. Arrival: address, access code, time */}
                {client && (
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 font-medium">
                            <span>🍽️ {dishes.length} plat(s) à préparer</span>
                            <span>•</span>
                            <span className="text-[#E1567A] font-bold">👥 Pour {session.personCount || client.personCount || 2} personnes</span>
                            {arrival && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Arrivée {arrival}</span>
                                </>
                            )}
                        </div>

                        {client.address && (
                            <div className="flex items-start gap-2 text-sm text-stone-800 font-semibold">
                                <MapPin className="w-4 h-4 text-[#E1567A] shrink-0 mt-0.5" />
                                <span>{client.address}</span>
                            </div>
                        )}

                        {client.accessCode && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3">
                                <Key className="w-5 h-5 text-amber-700 shrink-0" />
                                <span className="text-base font-black text-stone-900 tracking-wide">Code d&apos;accès : {client.accessCode}</span>
                            </div>
                        )}

                        {client.phone && (
                            <a href={`tel:${client.phone}`} className="inline-block">
                                <Button size="sm" variant="outline" className="text-xs h-8 rounded-full border-stone-300 gap-1.5 text-stone-700">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    {client.phone}
                                </Button>
                            </a>
                        )}
                    </div>
                )}

                {/* 2. Allergies — high visibility */}
                {client && client.allergies.length > 0 && (
                    <div className="bg-red-500 text-white rounded-3xl p-5 shadow-sm border border-red-600 space-y-2">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
                            <span className="font-bold uppercase tracking-wider text-xs">
                                ⚠️ VIGILANCE ALLERGIES & RESTRICTIONS STRICTES
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {client.allergies.map(al => (
                                <span key={al} className="bg-white text-red-700 font-black text-xs px-3 py-1 rounded-full shadow-xs">
                                    🚫 {al}{allergiesAdded.includes(al) ? ' (ajoutée par le client)' : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Kitchen notes & client messages */}
                {client && (client.notes || client.dislikes || selection?.generalNote) && (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-5 text-xs text-amber-950 space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-amber-900 uppercase tracking-wider text-[11px]">
                            <Info className="w-4 h-4 text-amber-700" />
                            Consignes cuisine & préférences du client
                        </div>
                        <div className="space-y-1">
                            {client.notes && <p><strong>Cuisine / matériel :</strong> {client.notes}</p>}
                            {client.dislikes && <p><strong>N&apos;aime pas :</strong> {client.dislikes}</p>}
                            {selection?.generalNote && (
                                <p className="text-[#E1567A] font-semibold">
                                    <strong>Message pour cette semaine :</strong> &quot;{selection.generalNote}&quot;
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. Dishes */}
                {client && !selection && (
                    <div className="bg-white border border-dashed border-stone-300 rounded-3xl p-6 text-center text-sm text-stone-600">
                        {displayName} n&apos;a pas encore envoyé ses choix pour la {sheet.weekLabel.toLowerCase()}.
                    </div>
                )}

                {missingDishNames.length > 0 && (
                    <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4 text-xs text-amber-900 font-semibold">
                        Plat(s) choisi(s) puis retiré(s) du menu : {missingDishNames.join(', ')}
                    </div>
                )}

                <div className="space-y-4">
                    {dishes.map((dish, dIdx) => {
                        const clientDishNote = selection?.dishNotes?.[dish.id];
                        return (
                            <div key={dish.id} className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
                                <div className="space-y-1 border-b border-stone-100 pb-3">
                                    <Badge variant="outline" className="bg-rose-50 text-[#E1567A] border-[#E1567A]/30 text-[11px] font-bold rounded-full">
                                        Plat #{dIdx + 1} • {dish.category}
                                    </Badge>
                                    <h4 className="text-lg font-serif font-bold text-stone-900">{dish.name}</h4>
                                </div>

                                {clientDishNote && (
                                    <div className="bg-rose-50 text-[#E1567A] border border-rose-200 rounded-2xl p-3 text-xs font-medium">
                                        💬 <strong>Demande du client :</strong> &quot;{clientDishNote}&quot;
                                    </div>
                                )}

                                {dish.chefNotes && (
                                    <div className="bg-stone-50 border border-stone-200 text-stone-700 rounded-2xl p-3 text-xs italic">
                                        💡 <strong>Astuce chef :</strong> {dish.chefNotes}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {dish.instructions && dish.instructions.length > 0 ? (
                                        dish.instructions.map((step, sIdx) => {
                                            const stepKey = `${dish.id}_${sIdx}`;
                                            const isDone = !!completedSteps[stepKey];
                                            return (
                                                <div
                                                    key={sIdx}
                                                    onClick={() => toggleStep(stepKey)}
                                                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                                                        isDone
                                                            ? 'bg-emerald-50/60 border-emerald-300 text-stone-400 line-through'
                                                            : 'bg-stone-50/50 border-stone-200 text-stone-800'
                                                    }`}
                                                >
                                                    <div className="pt-0.5 shrink-0">
                                                        {isDone ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-stone-400" />}
                                                    </div>
                                                    <span className="text-sm leading-relaxed font-medium">{step}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-stone-400 italic">Aucune étape enregistrée pour ce plat.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}

'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
    AlertTriangle, 
    ArrowLeft, 
    CheckSquare, 
    Square, 
    Sun, 
    Moon, 
    Phone, 
    MapPin, 
    Info, 
    ChefHat, 
    Flame,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ClientProfile, ClientSelection, WeeklyDish, WeeklyMenuData } from '@/lib/types/cooking-ops';

export default function ChefCookingModePage({ params }: { params: Promise<{ clientId: string }> }) {
    const resolvedParams = use(params);
    const clientId = resolvedParams.clientId;

    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<ClientProfile | null>(null);
    const [selection, setSelection] = useState<ClientSelection | null>(null);
    const [weekMenu, setWeekMenu] = useState<WeeklyMenuData | null>(null);
    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
    const [wakeLockActive, setWakeLockActive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/cooking-ops/client/${clientId}`);
                if (!res.ok) throw new Error('Client introuvable');
                const data = await res.json();
                setClient(data.client);
                setSelection(data.selection);
                setWeekMenu(data.weekMenu);
            } catch (e) {
                console.error('Error loading chef cook data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [clientId]);

    // Keep screen awake using Web Screen Wake Lock API
    const toggleWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                if (!wakeLockActive) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (navigator as any).wakeLock.request('screen');
                    setWakeLockActive(true);
                } else {
                    setWakeLockActive(false);
                }
            } else {
                alert('La fonction écran allumé n’est pas supportée par ce navigateur.');
            }
        } catch (err) {
            console.warn('Wake Lock error:', err);
        }
    };

    const toggleStep = (stepKey: string) => {
        setCompletedSteps(prev => ({
            ...prev,
            [stepKey]: !prev[stepKey]
        }));
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

    if (!client) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-4 max-w-sm">
                    <p className="text-stone-800 font-bold">Fiche client introuvable.</p>
                    <Link href="/admin/semaine">
                        <Button className="bg-[#E1567A] hover:bg-[#c94567] text-white rounded-full text-xs">
                            Retour au suivi hebdomadaire
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Filter menu to only include the dishes this client selected
    const selectedDishes: WeeklyDish[] = (weekMenu?.recipes || []).filter(dish => 
        selection?.selectedDishNames?.includes(dish.name)
    );

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-36 font-sans">
            {/* Standardized Header */}
            <AdminPageHeader
                badgeText="ESPACE ADMIN • FICHE CUISINE ACTIVE"
                title={`Cuisine : ${client.name}`}
                subtitle="Fiche de préparation en direct chez le client avec alertes allergies et étapes de cuisson interactives."
                backHref="/admin/semaine"
                backLabel="Retour au Suivi Hebdo"
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

            {/* Main Cook Container */}
            <main className="max-w-4xl mx-auto px-4 space-y-6">

                {/* 1. Client Contact & Location Card */}
                <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-serif font-bold text-stone-900">
                                {client.name}
                            </h2>
                            {client.bookingDay && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 text-xs font-bold rounded-full">
                                    {client.bookingDay}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-stone-500 font-medium flex items-center gap-1.5 flex-wrap">
                            <span>🍽️ {selectedDishes.length} plats à préparer</span>
                            <span>•</span>
                            <span className="text-[#E1567A] font-bold">👥 Pour {client.personCount || 2} personnes</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {client.phone && (
                            <a href={`tel:${client.phone}`}>
                                <Button size="sm" variant="outline" className="text-xs h-8 rounded-full border-stone-300 gap-1.5 text-stone-700">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    {client.phone}
                                </Button>
                            </a>
                        )}
                        {client.address && (
                            <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-full flex items-center gap-1 font-medium">
                                <MapPin className="w-3 h-3 text-[#E1567A]" />
                                {client.address}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. CRITICAL ALLERGY ALERT BANNER (High Visibility) */}
                {client.allergies && client.allergies.length > 0 && (
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
                                    🚫 {al}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Client Specific Notes & Access Codes */}
                {(client.notes || client.dislikes || selection?.generalNote) && (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-5 text-xs text-amber-950 space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-amber-900 uppercase tracking-wider text-[11px]">
                            <Info className="w-4 h-4 text-amber-700" />
                            Consignes cuisine & préférences du client
                        </div>
                        <div className="space-y-1">
                            {client.notes && (
                                <p><strong>Cuisine / Accès :</strong> {client.notes}</p>
                            )}
                            {client.dislikes && (
                                <p><strong>Goûts :</strong> {client.dislikes}</p>
                            )}
                            {selection?.generalNote && (
                                <p className="text-[#E1567A] font-semibold">
                                    <strong>Message pour cette session :</strong> &quot;{selection.generalNote}&quot;
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. DISHES PREPARATION CHECKLIST CARDS */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 px-1">
                        Les {selectedDishes.length} Recettes du Jour
                    </h3>

                    {selectedDishes.map((dish, dIdx) => {
                        const clientDishNote = selection?.dishNotes?.[dish.name];

                        return (
                            <div 
                                key={dish.id || dIdx}
                                className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4 hover:border-stone-300 transition-all"
                            >
                                {/* Dish Title Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-rose-50 text-[#E1567A] border-[#E1567A]/30 text-[11px] font-bold rounded-full">
                                                Plat #{dIdx + 1} • {dish.category}
                                            </Badge>
                                        </div>
                                        <h4 className="text-lg font-serif font-bold text-stone-900">
                                            {dish.name}
                                        </h4>
                                    </div>
                                </div>

                                {/* Client Custom Request for this dish */}
                                {clientDishNote && (
                                    <div className="bg-rose-50 text-[#E1567A] border border-rose-200 rounded-2xl p-3 text-xs font-medium">
                                        💬 <strong>Demande du client :</strong> &quot;{clientDishNote}&quot;
                                    </div>
                                )}

                                {/* Chef Internal Tips */}
                                {dish.chefNotes && (
                                    <div className="bg-stone-50 border border-stone-200 text-stone-700 rounded-2xl p-3 text-xs italic">
                                        💡 <strong>Astuce chef :</strong> {dish.chefNotes}
                                    </div>
                                )}

                                {/* Step-by-Step Cooking Checklist */}
                                <div className="space-y-2 pt-1">
                                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                                        Étapes de préparation :
                                    </span>
                                    
                                    <div className="space-y-2">
                                        {dish.instructions && dish.instructions.length > 0 ? (
                                            dish.instructions.map((step, sIdx) => {
                                                const stepKey = `${dish.id || dIdx}_step_${sIdx}`;
                                                const isDone = !!completedSteps[stepKey];

                                                return (
                                                    <div
                                                        key={sIdx}
                                                        onClick={() => toggleStep(stepKey)}
                                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                                                            isDone 
                                                                ? 'bg-emerald-50/60 border-emerald-300 text-stone-400 line-through' 
                                                                : 'bg-stone-50/50 border-stone-200 text-stone-800 hover:bg-stone-100/70'
                                                        }`}
                                                    >
                                                        <div className="pt-0.5 shrink-0">
                                                            {isDone ? (
                                                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                                                            ) : (
                                                                <Square className="w-4 h-4 text-stone-400" />
                                                            )}
                                                        </div>
                                                        <span className="text-xs leading-relaxed font-medium">
                                                            {step}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-stone-400 italic">
                                                Aucune étape de cuisson enregistrée.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </main>
        </div>
    );
}

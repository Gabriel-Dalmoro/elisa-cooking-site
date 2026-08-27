'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
    Calendar, 
    Navigation, 
    MapPin, 
    Phone, 
    MessageCircle, 
    ChefHat, 
    AlertTriangle, 
    Check, 
    Copy, 
    ChevronLeft, 
    ChevronRight, 
    Sun, 
    Moon, 
    Sparkles, 
    ExternalLink, 
    Key, 
    Clock,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { SlotSessionStatus, ClientProfile, BookingSession } from '@/lib/types/cooking-ops';
import { formatLocalDateToIso, FRENCH_DAYS } from '@/lib/dateUtils';

export default function TodayOperationsPage() {
    // Current selected date (defaults to Today local)
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [loading, setLoading] = useState(true);
    const [allSessions, setAllSessions] = useState<SlotSessionStatus[]>([]);
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const isoSelectedDate = useMemo(() => formatLocalDateToIso(selectedDate), [selectedDate]);

    // Human-readable French date e.g. "Mardi 25 Août 2026"
    const formattedDateLabel = useMemo(() => {
        const dayName = FRENCH_DAYS[selectedDate.getDay()];
        const dayNum = selectedDate.getDate();
        const monthName = selectedDate.toLocaleDateString('fr-FR', { month: 'long' });
        const year = selectedDate.getFullYear();
        return `${dayName} ${dayNum} ${monthName} ${year}`;
    }, [selectedDate]);

    const isToday = useMemo(() => {
        const todayIso = formatLocalDateToIso(new Date());
        return isoSelectedDate === todayIso;
    }, [isoSelectedDate]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Fetch current week overview (and offset if needed)
            const res = await fetch('/api/cooking-ops/admin');
            if (!res.ok) throw new Error('Erreur de chargement');
            const data = await res.json();
            setAllSessions(data.slotStatuses || []);
            setClients(data.clients || []);
        } catch (e) {
            console.error('Error loading today operations:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter sessions matching the selected date
    const todaySessions = useMemo(() => {
        return allSessions.filter(s => s.session.dateIso === isoSelectedDate);
    }, [allSessions, isoSelectedDate]);

    const morningSession = todaySessions.find(s => s.session.timeSlot === 'Matin');
    const afternoonSession = todaySessions.find(s => s.session.timeSlot === 'Après-midi');

    // Date Stepper Handlers
    const goToPreviousDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const goToNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(label);
        setTimeout(() => setCopiedText(null), 2000);
    };

    // Navigation links helper
    const getWazeUrl = (address: string) => {
        return `https://waze.com/ul?q=${encodeURIComponent(address)}`;
    };

    const getGoogleMapsUrl = (address: string) => {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    };

    const getAppleMapsUrl = (address: string) => {
        return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`;
    };

    const getWhatsAppUrl = (client: ClientProfile) => {
        const cleanPhone = (client.phone || '').replace(/[^0-9]/g, '');
        const message = `Bonjour ${client.name.split(' ')[0]} ! Je suis en route pour votre séance de cuisine 👩‍🍳. À tout de suite !`;
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    };

    // Render a single Session Card
    const renderSessionCard = (slotStatus: SlotSessionStatus | undefined, slotType: 'Matin' | 'Après-midi') => {
        const isMorning = slotType === 'Matin';
        const timeRange = isMorning ? '09:00 - 12:00' : '14:00 - 18:00';

        if (!slotStatus) {
            return (
                <div className="bg-white rounded-3xl p-6 border border-dashed border-stone-300 text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-stone-400 text-xs font-bold uppercase tracking-wider">
                        {isMorning ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                        Séance {slotType} ({timeRange})
                    </div>
                    <p className="text-stone-500 text-xs font-medium">
                        Aucun client réservé sur ce créneau.
                    </p>
                    <Link href="/admin/semaine">
                        <Button variant="outline" size="sm" className="mt-2 text-xs rounded-full border-stone-300">
                            + Planifier sur le calendrier
                        </Button>
                    </Link>
                </div>
            );
        }

        const { client, session, isSubmitted, selectedCount } = slotStatus;
        const address = client.address || session.notes || '';
        const hasAddress = address.trim().length > 0;

        return (
            <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-md p-5 sm:p-6 space-y-5 relative overflow-hidden ring-1 ring-stone-900/5">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                            {isMorning ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                            {slotType} • {timeRange}
                        </span>
                    </div>

                    {isSubmitted ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] font-bold gap-1 rounded-full px-2.5 py-0.5">
                            <Check className="w-3 h-3 text-emerald-600" />
                            {selectedCount}/{session.dishCount} plats validés
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[11px] font-medium gap-1 rounded-full px-2.5 py-0.5">
                            <Clock className="w-3 h-3 text-amber-600" />
                            En attente de choix
                        </Badge>
                    )}
                </div>

                {/* Client Name & Portions */}
                <div className="space-y-1">
                    <h3 className="font-serif font-bold text-2xl text-stone-900">
                        {session.clientName || client.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-xs bg-rose-50 text-[#E1567A] border border-rose-200 font-bold px-2.5 py-0.5 rounded-full">
                            👥 {session.personCount || client.personCount || 2} personnes
                        </span>
                        <span className="text-xs bg-stone-100 text-stone-700 border border-stone-200 font-semibold px-2.5 py-0.5 rounded-full">
                            🍽️ Formule {session.dishCount || client.defaultDishCount} plats
                        </span>
                    </div>
                </div>

                {/* Severe Allergy Alert Banner */}
                {client.allergies && client.allergies.length > 0 && (
                    <div className="bg-red-500 text-white rounded-2xl p-3.5 shadow-xs space-y-1 border border-red-600">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                            <AlertTriangle className="w-4 h-4 text-white animate-pulse shrink-0" />
                            <span>Vigilance Allergies & Régimes :</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                            {client.allergies.map(al => (
                                <span key={al} className="bg-white text-red-700 font-bold text-xs px-2 py-0.5 rounded-lg shadow-2xs">
                                    ⚠️ {al}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Location & GPS Navigation Block (THE KEY PHONE FEATURE) */}
                <div className="bg-gradient-to-br from-stone-50 to-orange-50/30 rounded-2xl p-4 border border-stone-200 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#E1567A]" />
                                Adresse de destination :
                            </div>
                            <div className="text-sm font-bold text-stone-900 leading-snug">
                                {hasAddress ? address : 'Adresse non renseignée dans la fiche client'}
                            </div>
                        </div>

                        {hasAddress && (
                            <button
                                onClick={() => copyToClipboard(address, 'adresse')}
                                className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold shrink-0 shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Copier l'adresse"
                            >
                                {copiedText === 'adresse' ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-[10px] text-emerald-700">Copié !</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                                        <span className="text-[10px]">Copier</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Building Notes & Door Code Highlight */}
                    {client.notes && (
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 text-xs text-stone-700 flex items-start gap-2 shadow-2xs">
                            <Key className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold text-stone-900">Codes & Accès : </span>
                                <span>{client.notes}</span>
                            </div>
                        </div>
                    )}

                    {/* 1-Tap GPS Navigation Buttons (Waze & Google Maps) */}
                    {hasAddress && (
                        <div className="pt-2 border-t border-stone-200/80 grid grid-cols-3 gap-2">
                            {/* Waze Button */}
                            <a
                                href={getWazeUrl(address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button
                                    size="sm"
                                    className="w-full bg-[#33CCFF] hover:bg-[#2bb8e6] text-stone-900 font-bold text-xs h-10 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                                >
                                    <Navigation className="w-4 h-4 text-stone-900" />
                                    Waze
                                </Button>
                            </a>

                            {/* Google Maps Button */}
                            <a
                                href={getGoogleMapsUrl(address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button
                                    size="sm"
                                    className="w-full bg-[#34A853] hover:bg-[#2d9248] text-white font-bold text-xs h-10 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                                >
                                    <MapPin className="w-4 h-4 text-white" />
                                    Google
                                </Button>
                            </a>

                            {/* Apple Maps Button */}
                            <a
                                href={getAppleMapsUrl(address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full bg-white hover:bg-stone-100 text-stone-800 border-stone-300 font-bold text-xs h-10 rounded-xl shadow-xs gap-1 cursor-pointer"
                                >
                                    Plans
                                </Button>
                            </a>
                        </div>
                    )}
                </div>

                {/* Quick Phone & WhatsApp Bar */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {client.phone ? (
                        <>
                            <a href={`tel:${client.phone}`} className="w-full">
                                <Button
                                    variant="outline"
                                    className="w-full border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold h-9 rounded-xl gap-1.5 cursor-pointer"
                                >
                                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                    Appeler ({client.phone})
                                </Button>
                            </a>

                            <a
                                href={getWhatsAppUrl(client)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 font-semibold h-9 rounded-xl gap-1.5 cursor-pointer"
                                >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    WhatsApp
                                </Button>
                            </a>
                        </>
                    ) : (
                        <div className="col-span-2 text-center text-xs text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                            Numéro de téléphone manquant
                        </div>
                    )}
                </div>

                {/* Big Primary Action: Open Kitchen Sheet */}
                <Link href={`/admin/cuisine/${client.id}`} className="block w-full">
                    <Button
                        className="w-full bg-[#E1567A] hover:bg-[#c94567] text-white text-sm h-12 rounded-2xl shadow-md font-bold gap-2 cursor-pointer"
                    >
                        <ChefHat className="w-5 h-5" />
                        Ouvrir la Fiche Cuisine ({session.dishCount} plats)
                    </Button>
                </Link>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-900 pb-28 font-sans">
            {/* Standardized Header */}
            <AdminPageHeader
                badgeText="ESPACE ADMIN • EN ROUTE"
                title="Séances du Jour & Itinéraires"
                subtitle="Consultez vos clients du jour sur mobile, lancez l'itinéraire direct Waze / Google Maps et ouvrez vos fiches cuisine."
                backHref="/admin"
                backLabel="Retour au menu"
                actionElement={
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={loadData}
                        className="border-stone-300 text-stone-700 hover:bg-stone-100 gap-1.5 text-xs h-9 px-3 rounded-full font-semibold cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                }
            />

            {/* Main Mobile-Friendly Container */}
            <main className="max-w-3xl mx-auto px-4 space-y-6">

                {/* Date Stepper Bar (Hier / Aujourd'hui / Demain) */}
                <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs flex items-center justify-between gap-2">
                    <button
                        onClick={goToPreviousDay}
                        className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Hier</span>
                    </button>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                            <span className="font-serif font-bold text-base sm:text-lg text-stone-900 capitalize">
                                {formattedDateLabel}
                            </span>
                            {isToday && (
                                <Badge className="bg-[#E1567A] text-white text-[10px] font-bold rounded-full px-2 py-0.2">
                                    Aujourd&apos;hui
                                </Badge>
                            )}
                        </div>
                        {!isToday && (
                            <button
                                onClick={goToToday}
                                className="text-[11px] text-[#E1567A] font-bold hover:underline mt-0.5 cursor-pointer"
                            >
                                ↩ Revenir à aujourd&apos;hui
                            </button>
                        )}
                    </div>

                    <button
                        onClick={goToNextDay}
                        className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                        <span className="hidden sm:inline">Demain</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-stone-500 border border-stone-200">
                        Chargement des séances...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Morning Slot */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-2 flex items-center gap-1.5">
                                <Sun className="w-3.5 h-3.5 text-amber-500" />
                                1. Matinée (09:00 - 12:00)
                            </h4>
                            {renderSessionCard(morningSession, 'Matin')}
                        </div>

                        {/* Afternoon Slot */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-2 flex items-center gap-1.5">
                                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                                2. Après-midi (14:00 - 18:00)
                            </h4>
                            {renderSessionCard(afternoonSession, 'Après-midi')}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
    ChefHat, 
    CheckCircle2, 
    Clock, 
    MessageCircle, 
    Plus, 
    Users, 
    Sparkles, 
    Check, 
    Copy,
    BookOpen,
    ArrowLeft,
    Image as ImageIcon,
    Calendar as CalendarIcon,
    CalendarCheck,
    RefreshCw,
    AlertCircle,
    Info,
    Edit2,
    Sun,
    Moon,
    LayoutGrid,
    ListFilter,
    Navigation,
    ChevronLeft,
    ChevronRight,
    MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ClientProfile, SlotSessionStatus, WeeklyMenuData } from '@/lib/types/cooking-ops';
import { getWeekBounds, WEEK_DAY_NAMES } from '@/lib/dateUtils';

const COMMON_ALLERGIES = [
    'Sans Gluten',
    'Sans Lactose',
    'Sans Arachides',
    'Sans Fruits à coque',
    'Sans Porc',
    'Sans Crustacés',
    'Végétarien',
    'Végan'
];

const SLOTS: ('Matin' | 'Après-midi')[] = ['Matin', 'Après-midi'];

export default function WeeklyOpsAdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [weekMenu, setWeekMenu] = useState<WeeklyMenuData | null>(null);
    const [slotStatuses, setSlotStatuses] = useState<SlotSessionStatus[]>([]);
    const [allClients, setAllClients] = useState<ClientProfile[]>([]);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [weekOffset, setWeekOffset] = useState<number>(0);
    
    // Calendar Sync State & Toast Info
    const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
    const [syncSummary, setSyncSummary] = useState<{
        validCount: number;
        createdCount: number;
        ignoredBlocks: number;
    } | null>(null);

    // New Client Dialog State
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
    const [clientFormName, setClientFormName] = useState('');
    const [clientFormPhone, setClientFormPhone] = useState('');
    const [clientFormEmail, setClientFormEmail] = useState('');
    const [clientFormAddress, setClientFormAddress] = useState('');
    const [clientFormQuota, setClientFormQuota] = useState(4);
    const [clientFormPersonCount, setClientFormPersonCount] = useState(2);
    const [clientFormAllergies, setClientFormAllergies] = useState<string[]>([]);
    const [clientFormNotes, setClientFormNotes] = useState('');
    const [slotTargetDateIso, setSlotTargetDateIso] = useState<string>('');
    const [slotTargetDayName, setSlotTargetDayName] = useState<string>('Lundi');
    const [slotTargetTimeSlot, setSlotTargetTimeSlot] = useState<'Matin' | 'Après-midi'>('Matin');
    const [isSavingClient, setIsSavingClient] = useState(false);

    const weekInfo = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);

    const loadWeekOverview = async (offset = weekOffset) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/cooking-ops/admin?offset=${offset}`);
            if (!res.ok) throw new Error('Erreur de chargement');
            const data = await res.json();
            setWeekMenu(data.weekMenu);
            setSlotStatuses(data.slotStatuses || []);
            setAllClients(data.clients || []);
        } catch (e) {
            console.error('Error loading admin ops overview:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCalendarSync = async (offset = weekOffset) => {
        try {
            setIsSyncingCalendar(true);
            const res = await fetch(`/api/cooking-ops/calendar-sync?offset=${offset}`);
            if (!res.ok) throw new Error('Erreur de synchronisation');
            const data = await res.json();
            setSlotStatuses(data.slotStatuses || []);
            setWeekMenu(data.weekMenu);
            setSyncSummary({
                validCount: data.validBookingsCount || 0,
                createdCount: data.createdCount || 0,
                ignoredBlocks: data.ignoredBlocksCount || 0
            });
            setTimeout(() => setSyncSummary(null), 5000);
        } catch (e) {
            console.error('Calendar sync error:', e);
            // Fallback load without blocking
            loadWeekOverview(offset);
        } finally {
            setIsSyncingCalendar(false);
            setLoading(false);
        }
    };

    // Automatically sync calendar and load data whenever weekOffset changes
    useEffect(() => {
        handleCalendarSync(weekOffset);
    }, [weekOffset]);

    const copyClientLink = (token: string) => {
        const url = `${window.location.origin}/choisir/${token}`;
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2500);
    };

    const getWhatsAppUrl = (client: ClientProfile) => {
        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/choisir/${client.token}`;
        const message = `Bonjour ${client.name.split(' ')[0]} ! ✨ Voici le menu de la semaine pour choisir vos ${client.defaultDishCount} plats : ${url}`;
        const cleanPhone = client.phone.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    };

    const openEditClient = (client: ClientProfile) => {
        setEditingClient(client);
        setClientFormName(client.name);
        setClientFormPhone(client.phone || '');
        setClientFormEmail(client.email || '');
        setClientFormAddress(client.address || '');
        setClientFormQuota(client.defaultDishCount || 4);
        setClientFormPersonCount(client.personCount || 2);
        setClientFormAllergies(client.allergies || []);
        setClientFormNotes(client.notes || '');
        setSlotTargetDateIso('');
        setIsAddClientOpen(true);
    };

    const openCreateClientForSlot = (dayName: string, slot: 'Matin' | 'Après-midi', isoDate: string) => {
        setEditingClient(null);
        setClientFormName('');
        setClientFormPhone('');
        setClientFormEmail('');
        setClientFormAddress('');
        setClientFormQuota(4);
        setClientFormPersonCount(2);
        setClientFormAllergies([]);
        setClientFormNotes('');
        setSlotTargetDateIso(isoDate);
        setSlotTargetDayName(dayName);
        setSlotTargetTimeSlot(slot);
        setIsAddClientOpen(true);
    };

    const handleSaveClientForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientFormName.trim()) return;

        try {
            setIsSavingClient(true);
            const res = await fetch('/api/cooking-ops/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingClient ? editingClient.id : undefined,
                    name: clientFormName,
                    phone: clientFormPhone,
                    email: clientFormEmail,
                    address: clientFormAddress,
                    defaultDishCount: clientFormQuota,
                    personCount: clientFormPersonCount,
                    allergies: clientFormAllergies,
                    notes: clientFormNotes,
                    bookingDateIso: slotTargetDateIso || undefined,
                    dayName: slotTargetDayName,
                    timeSlot: slotTargetTimeSlot
                })
            });

            if (!res.ok) throw new Error('Erreur lors de l’enregistrement');
            const data = await res.json();
            
            setIsAddClientOpen(false);
            loadWeekOverview(weekOffset);

            if (data.gcalSyncResult && !data.gcalSyncResult.success) {
                alert(`⚠️ La séance a bien été enregistrée dans l'app, mais l'écriture vers Google Calendar a échoué :\n"${data.gcalSyncResult.error}"\n\n👉 Solution : Dans Google Calendar (Paramètres de l'agenda > Partager avec des personnes spécifiques), donnez l'autorisation "Apporter des modifications aux événements" à l'adresse de service.`);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erreur';
            alert(message);
        } finally {
            setIsSavingClient(false);
        }
    };

    const toggleFormAllergy = (tag: string) => {
        setClientFormAllergies(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const bookedCount = slotStatuses.length;
    const submittedCount = slotStatuses.filter(s => s.isSubmitted).length;

    const getClientForSlot = (isoDate: string, slot: 'Matin' | 'Après-midi') => {
        return slotStatuses.find(s => s.session.dateIso === isoDate && s.session.timeSlot === slot);
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-28 font-sans">
            {/* Standardized Header with Controls */}
            <AdminPageHeader
                badgeText="ESPACE ADMIN • PLANNING & COMMANDES"
                title="Planning Hebdo & Commandes"
                subtitle="Visualisez votre calendrier synchronisé avec Google Calendar en temps réel et suivez les choix de plats."
                backHref="/admin"
                backLabel="Retour à l'admin"
                actionElement={
                    <div className="flex items-center gap-2">
                        {/* View Switchers: Calendrier | Liste | Aujourd'hui */}
                        <div className="flex items-center bg-stone-100 p-1 rounded-full border border-stone-200 text-xs">
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    viewMode === 'calendar' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5 text-[#E1567A]" />
                                Calendrier
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    viewMode === 'list' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                <ListFilter className="w-3.5 h-3.5 text-stone-600" />
                                Liste
                            </button>
                            <Link href="/admin/aujourd-hui">
                                <button
                                    className="px-3 py-1.5 rounded-full font-bold text-stone-600 hover:text-stone-900 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Navigation className="w-3.5 h-3.5 text-[#E1567A]" />
                                    Aujourd&apos;hui
                                </button>
                            </Link>
                        </div>

                        <Button 
                            size="sm" 
                            onClick={() => openCreateClientForSlot('Lundi', 'Matin', weekInfo.daysWithDates[0].isoDate)}
                            className="bg-[#E1567A] hover:bg-[#c94567] text-white gap-1.5 shadow-xs text-xs h-9 px-4 rounded-full font-semibold cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" /> Nouveau Client
                        </Button>
                    </div>
                }
            />

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 space-y-6">

                {/* Calendar Sync Success Toast Notification */}
                {syncSummary !== null && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs font-semibold shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>
                                <strong>Google Calendar synchronisé ({weekInfo.dateRangeOnly}) :</strong> {syncSummary.validCount} séance(s) active(s)
                                {syncSummary.createdCount > 0 && ` • ${syncSummary.createdCount} nouvelle(s) fiche(s)`}
                                {syncSummary.ignoredBlocks > 0 && ` • ${syncSummary.ignoredBlocks} créneau(x) "Bloc" ignoré(s)`}
                            </span>
                        </div>
                    </div>
                )}

                {/* Clean Hero Date, Stepper, Sync & Stats Card */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Big Date Stepper */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setWeekOffset(w => w - 1)}
                                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Semaine précédente"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <h2 className="text-2xl font-serif font-bold text-stone-900 capitalize px-1">
                                {weekInfo.dateRangeOnly}
                            </h2>

                            <button
                                onClick={() => setWeekOffset(w => w + 1)}
                                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Semaine suivante"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {weekOffset === 0 ? (
                            <Badge className="bg-rose-50 text-[#E1567A] border-[#E1567A]/30 text-xs rounded-full font-bold px-3 py-1">
                                Semaine Active
                            </Badge>
                        ) : (
                            <button
                                onClick={() => setWeekOffset(0)}
                                className="text-xs text-[#E1567A] font-bold hover:underline cursor-pointer bg-rose-50 px-3 py-1 rounded-full border border-rose-200"
                            >
                                ↩ Revenir à cette semaine
                            </button>
                        )}

                        {/* Sync GCal Button inside Hero */}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCalendarSync(weekOffset)}
                            disabled={isSyncingCalendar}
                            className="text-xs h-8 px-3 gap-1.5 border-stone-300 rounded-full font-semibold bg-white shadow-2xs cursor-pointer ml-1"
                            title="Resynchroniser Google Calendar"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
                            <span>{isSyncingCalendar ? 'Syncing...' : 'Sync GCal'}</span>
                        </Button>
                    </div>

                    {/* Stats Counters */}
                    <div className="flex items-center gap-4 bg-stone-50 p-3 sm:p-3.5 rounded-2xl border border-stone-200 self-start md:self-auto">
                        <div className="text-center px-2">
                            <div className="text-xl sm:text-2xl font-bold font-serif text-[#E1567A]">
                                {submittedCount} / {bookedCount}
                            </div>
                            <div className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
                                Choix Reçus
                            </div>
                        </div>
                        <div className="w-px h-8 bg-stone-200" />
                        <div className="text-center px-2">
                            <div className="text-xl sm:text-2xl font-bold font-serif text-stone-800">
                                {bookedCount}
                            </div>
                            <div className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
                                Séances Prévues
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-stone-500 border border-stone-200">
                        Chargement du planning...
                    </div>
                ) : viewMode === 'calendar' ? (
                    /* ========================================================================= */
                    /* CALENDAR GRID VIEW: Monday to Friday (With Light Pink Border on Today)    */
                    /* ========================================================================= */
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                        {weekInfo.daysWithDates.map(({ dayName, dateNumber, monthName, isoDate, isToday }) => (
                            <div 
                                key={dayName} 
                                className={`space-y-3 transition-all rounded-3xl ${
                                    isToday 
                                        ? 'bg-rose-50/50 p-2.5 -m-2.5 rounded-3xl border-2 border-[#E1567A]/30 shadow-xs' 
                                        : ''
                                }`}
                            >
                                {/* Day Column Header with Day Number & Month */}
                                <div className={`rounded-2xl py-3 px-2 text-center shadow-xs ${
                                    isToday 
                                        ? 'bg-gradient-to-br from-[#E1567A] to-[#c94567] text-white shadow-md ring-2 ring-[#E1567A]/20' 
                                        : 'bg-stone-900 text-white'
                                }`}>
                                    <h3 className="font-serif font-bold text-sm tracking-wide">
                                        {dayName}
                                    </h3>
                                    <span className={`text-[11px] font-medium block mt-0.5 ${isToday ? 'text-rose-100' : 'text-stone-300'}`}>
                                        {dateNumber} {monthName}
                                    </span>
                                </div>

                                {/* Slots for this day */}
                                <div className="space-y-3">
                                    {SLOTS.map((slot) => {
                                        const status = getClientForSlot(isoDate, slot);
                                        const isMorning = slot === 'Matin';

                                        if (status) {
                                            const { client, isSubmitted, selectedCount, session } = status;
                                            const isMissingPhone = !client.phone || client.phone.trim().length === 0;

                                            return (
                                                <div 
                                                    key={slot}
                                                    className="bg-white rounded-3xl p-4 border border-rose-200 shadow-xs hover:shadow-md transition-all relative group ring-1 ring-[#E1567A]/20 min-h-[220px] flex flex-col justify-between"
                                                >
                                                    <div className="space-y-2.5">
                                                        {/* Slot Header */}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                {isMorning ? <Sun className="w-3 h-3 text-amber-600" /> : <Moon className="w-3 h-3 text-indigo-600" />}
                                                                {slot}
                                                            </span>

                                                            <button
                                                                onClick={() => openEditClient(client)}
                                                                className="text-stone-400 hover:text-stone-800 p-1"
                                                                title="Modifier ce client"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        {/* Client Name & Quota */}
                                                        <div>
                                                            <h4 className="font-serif font-bold text-base text-stone-900 line-clamp-1">
                                                                {session.clientName || client.name}
                                                            </h4>
                                                            <p className="text-[11px] text-stone-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                                <span>Formule {session.dishCount || client.defaultDishCount} plats</span>
                                                                <span>•</span>
                                                                <span className="text-[#E1567A] font-bold">👥 {session.personCount || client.personCount || 2} pers</span>
                                                            </p>
                                                        </div>

                                                        {/* Status Badge */}
                                                        <div>
                                                            {isSubmitted ? (
                                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold gap-1 rounded-full w-full justify-center py-0.5">
                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                    Choix validés ({selectedCount}/{session.dishCount})
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-medium gap-1 rounded-full w-full justify-center py-0.5">
                                                                    <Clock className="w-3 h-3 text-amber-600" />
                                                                    En attente de choix
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Allergies / Notes */}
                                                        {client.allergies && client.allergies.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {client.allergies.map(al => (
                                                                    <span key={al} className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded-md font-bold">
                                                                        ⚠️ {al}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Missing Phone Alert */}
                                                        {isMissingPhone && (
                                                            <button 
                                                                onClick={() => openEditClient(client)}
                                                                className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-1.5 w-full text-left font-medium flex items-center gap-1"
                                                            >
                                                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                                                <span>+ Ajouter tél WhatsApp</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Quick Action Buttons */}
                                                    <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-1.5 text-xs mt-2">
                                                        {client.phone ? (
                                                            <a
                                                                href={getWhatsAppUrl(client)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-full"
                                                            >
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline"
                                                                    className="w-full text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-[11px] h-7 px-1 rounded-xl font-semibold gap-1"
                                                                >
                                                                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                                                                    WhatsApp
                                                                </Button>
                                                            </a>
                                                        ) : (
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => copyClientLink(client.token)}
                                                                className="w-full text-stone-700 border-stone-200 text-[11px] h-7 px-1 rounded-xl font-semibold gap-1"
                                                            >
                                                                <Copy className="w-3 h-3 text-stone-500" />
                                                                Lien
                                                            </Button>
                                                        )}

                                                        <Link href={`/admin/cuisine/${client.id}`} className="w-full">
                                                            <Button
                                                                size="sm"
                                                                className="w-full bg-[#E1567A] hover:bg-[#c94567] text-white text-[11px] h-7 px-1 shadow-xs font-bold rounded-xl gap-1"
                                                            >
                                                                <ChefHat className="w-3 h-3" />
                                                                Cuisine
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Free / Unbooked slot
                                        return (
                                            <div 
                                                key={slot}
                                                onClick={() => openCreateClientForSlot(dayName, slot, isoDate)}
                                                className="rounded-3xl p-4 border border-dashed border-stone-300 bg-stone-50/50 hover:bg-white hover:border-[#E1567A] transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] text-center space-y-2 group"
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                                                    {isMorning ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                                                    {slot}
                                                </span>
                                                <span className="text-xs text-stone-400 font-semibold group-hover:text-[#E1567A] transition-colors">
                                                    + Créneau libre
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ========================================================================= */
                    /* LIST VIEW: Detailed Vertical Cards                                        */
                    /* ========================================================================= */
                    <div className="grid grid-cols-1 gap-3.5">
                        {slotStatuses.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center text-stone-500 border border-stone-200">
                                Aucun client réservé pour cette semaine.
                            </div>
                        ) : (
                            slotStatuses.map(({ client, isSubmitted, selectedCount, session }) => {
                                const isMissingPhone = !client.phone || client.phone.trim().length === 0;

                                return (
                                    <div 
                                        key={session.id}
                                        className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-stone-300 transition-all"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Client Identity & Booking Slot */}
                                            <div className="space-y-2 flex-1">
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <h4 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                                                        {session.clientName || client.name}
                                                        <button
                                                            onClick={() => openEditClient(client)}
                                                            className="text-stone-400 hover:text-stone-700 p-1"
                                                            title="Modifier ce client"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </h4>

                                                    {/* Booking Slot pill */}
                                                    <span className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                                                        <CalendarIcon className="w-3 h-3 text-amber-700" />
                                                        {session.dayName} {session.timeSlot} ({session.dateIso})
                                                    </span>

                                                    {/* Quota Badge */}
                                                    <span className="text-[11px] bg-stone-100 text-stone-600 border border-stone-200 px-2.5 py-0.5 rounded-full font-medium">
                                                        {session.dishCount} plats
                                                    </span>
                                                    
                                                    {/* Status Badge */}
                                                    {isSubmitted ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold gap-1 rounded-full">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                            {selectedCount} / {session.dishCount} plats choisis
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-medium gap-1 rounded-full">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            En attente de sélection
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Allergies / Diets Pills */}
                                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                    {client.allergies && client.allergies.length > 0 ? (
                                                        client.allergies.map(al => (
                                                            <span key={al} className="text-[11px] bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full font-semibold">
                                                                ⚠️ {al}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[11px] text-stone-400">Aucune allergie enregistrée</span>
                                                    )}
                                                    {client.dislikes && (
                                                        <span className="text-[11px] text-stone-500 italic">
                                                            ({client.dislikes})
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Missing Phone Alert */}
                                                {isMissingPhone && (
                                                    <div 
                                                        onClick={() => openEditClient(client)}
                                                        className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2 cursor-pointer hover:bg-amber-100/70 transition-colors flex items-center gap-1.5 font-medium"
                                                    >
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                        <span>Numéro WhatsApp non renseigné — Cliquez ici pour l&apos;ajouter</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons Toolbar */}
                                            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 shrink-0">
                                                {/* 1. WhatsApp Reminder Link */}
                                                {client.phone ? (
                                                    <a
                                                        href={getWhatsAppUrl(client)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs h-9 gap-1.5 rounded-full font-semibold"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                            WhatsApp
                                                        </Button>
                                                    </a>
                                                ) : (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => openEditClient(client)}
                                                        className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs h-9 gap-1.5 rounded-full font-semibold"
                                                    >
                                                        + N° Tél
                                                    </Button>
                                                )}

                                                {/* 2. Copy Link Button */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => copyClientLink(client.token)}
                                                    className="border-stone-300 text-stone-700 hover:bg-stone-100 text-xs h-9 gap-1.5 rounded-full font-semibold"
                                                >
                                                    {copiedToken === client.token ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            Lien copié !
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                                                            Copier Lien
                                                        </>
                                                    )}
                                                </Button>

                                                {/* 3. Open Kitchen Cook Mode */}
                                                <Link href={`/admin/cuisine/${client.id}`}>
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#E1567A] hover:bg-[#c94567] text-white text-xs h-9 px-4 gap-1.5 shadow-xs font-bold rounded-full"
                                                    >
                                                        <ChefHat className="w-3.5 h-3.5" />
                                                        Fiche Cuisine
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>

            {/* Client Add & Edit Modal */}
            <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold">
                            {editingClient 
                                ? `Modifier : ${editingClient.name}` 
                                : `Réserver créneau : ${slotTargetDayName} ${slotTargetTimeSlot}`}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveClientForm} className="space-y-3.5 py-2 text-xs">
                        <div>
                            <label className="font-semibold block text-stone-700 mb-1">Nom & Prénom *</label>
                            <input 
                                type="text" 
                                required 
                                value={clientFormName}
                                onChange={e => setClientFormName(e.target.value)}
                                placeholder="Ex: Thibault Martin"
                                className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Téléphone (WhatsApp)</label>
                                <input 
                                    type="text" 
                                    value={clientFormPhone}
                                    onChange={e => setClientFormPhone(e.target.value)}
                                    placeholder="+33 6 12 34 56 78"
                                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Email (optionnel)</label>
                                <input 
                                    type="email" 
                                    value={clientFormEmail}
                                    onChange={e => setClientFormEmail(e.target.value)}
                                    placeholder="thibault@email.com"
                                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Nombre de personnes (foyer)</label>
                                <input 
                                    type="number" 
                                    min={1} 
                                    max={12}
                                    value={clientFormPersonCount}
                                    onChange={e => setClientFormPersonCount(Number(e.target.value))}
                                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Nombre de plats / séance</label>
                                <input 
                                    type="number" 
                                    min={1} 
                                    max={8}
                                    value={clientFormQuota}
                                    onChange={e => setClientFormQuota(Number(e.target.value))}
                                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="font-semibold block text-stone-700 mb-1">Adresse & Code d&apos;accès</label>
                            <input 
                                type="text" 
                                value={clientFormAddress}
                                onChange={e => setClientFormAddress(e.target.value)}
                                placeholder="12 rue de Rivoli, 75004 Paris (Code: 4589)"
                                className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="font-semibold block text-stone-700 mb-1">Allergies & Restrictions</label>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {COMMON_ALLERGIES.map(tag => {
                                    const active = clientFormAllergies.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleFormAllergy(tag)}
                                            className={`px-2.5 py-1 rounded-full border transition-all text-[11px] ${
                                                active ? 'bg-[#E1567A] text-white border-[#E1567A] font-bold' : 'bg-stone-50 text-stone-600 border-stone-200'
                                            }`}
                                        >
                                            {tag} {active && '✓'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="font-semibold block text-stone-700 mb-1">Notes cuisine (Plaques, équipement...)</label>
                            <textarea 
                                rows={2}
                                value={clientFormNotes}
                                onChange={e => setClientFormNotes(e.target.value)}
                                placeholder="Plaque induction, chien gentil..."
                                className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={isSavingClient}
                            className="w-full bg-[#E1567A] hover:bg-[#c94567] text-white mt-2 rounded-xl h-10 font-bold"
                        >
                            {isSavingClient ? 'Enregistrement & Sync...' : editingClient ? 'Mettre à jour la fiche' : 'Créer la séance & Sync Google Calendar'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

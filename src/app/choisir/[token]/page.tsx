'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { COMMON_ALLERGIES } from '@/lib/allergies';
import { 
    Check, 
    Sparkles, 
    AlertTriangle, 
    Utensils, 
    Edit2, 
    CheckCircle2, 
    MessageSquare, 
    Leaf, 
    Fish, 
    Flame,
    ArrowRight,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Only what the public API returns for a client link
interface PublicClient {
    firstName: string;
    defaultDishCount: number;
    allergies: string[];
    dislikes: string;
}

interface PublicDish {
    id: string;
    name: string;
    category: string;
    description?: string;
}

interface PublicMenu {
    weekStart: string;
    weekLabel: string;
    dishes: PublicDish[];
}

export default function ClientMenuSelectionPage() {
    const routeParams = useParams();
    const rawToken = (routeParams?.token as string) || '';
    const token = decodeURIComponent(rawToken);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<PublicClient | null>(null);
    const [menu, setMenu] = useState<PublicMenu | null>(null);
    // open = the client can choose | none = no menu published yet | closed = choices locked
    const [menuState, setMenuState] = useState<'open' | 'none' | 'closed'>('none');
    const [closedWeekLabel, setClosedWeekLabel] = useState<string | null>(null);
    const [previousSubmissionAt, setPreviousSubmissionAt] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    
    // Form state (dish ids)
    const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
    const [dishNotes, setDishNotes] = useState<Record<string, string>>({});
    const [generalNote, setGeneralNote] = useState<string>('');
    const [allergies, setAllergies] = useState<string[]>([]);
    // Allergies already on file can't be removed from the client link (only Elisa can)
    const [lockedAllergies, setLockedAllergies] = useState<string[]>([]);
    const [dislikes, setDislikes] = useState<string>('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
    const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const res = await fetch(`/api/cooking-ops/client?token=${encodeURIComponent(token)}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Lien invalide ou expiré');
                }
                const data = await res.json();
                setClient(data.client);
                setMenuState(data.state);
                setClosedWeekLabel(data.weekLabel || null);
                setMenu(data.state === 'open' ? data.menu : null);
                setAllergies(data.client.allergies || []);
                setLockedAllergies(data.client.allergies || []);
                setDislikes(data.client.dislikes || '');

                if (data.existingSelection && data.existingSelection.selectedDishIds?.length > 0) {
                    setSelectedDishes(data.existingSelection.selectedDishIds);
                    setDishNotes(data.existingSelection.dishNotes || {});
                    setGeneralNote(data.existingSelection.generalNote || '');
                    setPreviousSubmissionAt(data.existingSelection.submittedAt || null);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Erreur de chargement';
                setError(message);
            } finally {
                setLoading(false);
            }
        }
        if (token) {
            loadData();
        }
    }, [token]);

    // The client's formula, capped by the number of dishes on this week's menu
    const targetCount = Math.min(client?.defaultDishCount || 4, menu?.dishes.length || client?.defaultDishCount || 4);

    const toggleDish = (dishId: string) => {
        setSubmitError(null);
        setSelectedDishes(prev => {
            if (prev.includes(dishId)) {
                return prev.filter(d => d !== dishId);
            }
            // Can't pick more dishes than the formula
            return prev.length >= targetCount ? prev : [...prev, dishId];
        });
    };

    const handleNoteChange = (dishId: string, note: string) => {
        setDishNotes(prev => ({
            ...prev,
            [dishId]: note
        }));
    };

    const dishName = (dishId: string) => menu?.dishes.find(d => d.id === dishId)?.name || '';

    const toggleAllergyTag = (tag: string) => {
        if (lockedAllergies.includes(tag)) return;
        setAllergies(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (!client || !menu) return;
        try {
            setIsSubmitting(true);
            setSubmitError(null);
            const res = await fetch('/api/cooking-ops/client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    weekStart: menu.weekStart,
                    selectedDishIds: selectedDishes,
                    dishNotes,
                    generalNote,
                    updatedAllergies: allergies,
                    updatedDislikes: dislikes
                })
            });

            const data = await res.json().catch(() => ({}));
            if (res.status === 409) {
                // Elisa closed the menu while the client was choosing
                setClosedWeekLabel(menu.weekLabel);
                setMenuState('closed');
                return;
            }
            if (!res.ok) {
                throw new Error(data.error || 'Erreur lors de l’enregistrement. Réessayez ou contactez Elisa sur WhatsApp.');
            }

            setLockedAllergies(allergies);
            setIsSubmittedSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDishIcon = (type?: string) => {
        switch (type?.toLowerCase()) {
            case 'fish':
            case 'poisson':
                return <Fish className="w-3.5 h-3.5 text-blue-500" />;
            case 'vegan':
            case 'végan':
            case 'vegetarian':
            case 'végétarien':
                return <Leaf className="w-3.5 h-3.5 text-emerald-500" />;
            default:
                return <Flame className="w-3.5 h-3.5 text-amber-500" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-stone-600 font-medium">Chargement de votre menu personnalisé...</p>
                </div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center bg-white shadow-lg border-stone-200">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-stone-900 mb-2">Lien introuvable</h1>
                    <p className="text-stone-600 text-sm mb-6">
                        {error || 'Ce lien d’accès n’est plus actif ou comporte une erreur. Contactez directement Elisa sur WhatsApp.'}
                    </p>
                </Card>
            </div>
        );
    }

    if (menuState !== 'open' || !menu) {
        return (
            <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center bg-white shadow-lg border-stone-200 rounded-3xl">
                    {menuState === 'closed' ? (
                        <Lock className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                    ) : (
                        <Utensils className="w-12 h-12 text-[#E1567A] mx-auto mb-4" />
                    )}
                    <h1 className="text-xl font-serif font-bold text-stone-900 mb-2">
                        Bonjour {client.firstName} 👋
                    </h1>
                    <p className="text-stone-600 text-sm">
                        {menuState === 'closed'
                            ? `Les choix pour la ${closedWeekLabel ? closedWeekLabel.toLowerCase() : 'semaine'} sont clôturés. Pour toute modification, contactez Elisa directement sur WhatsApp.`
                            : 'Le menu de la semaine n’est pas encore disponible. Elisa vous enverra ce lien dès qu’il sera prêt.'}
                    </p>
                </Card>
            </div>
        );
    }

    if (isSubmittedSuccess) {
        return (
            <div className="min-h-screen bg-[#faf8f5] py-12 px-4">
                <div className="max-w-xl mx-auto">
                    <Card className="bg-white border-emerald-200 shadow-xl overflow-hidden text-center p-8 rounded-3xl">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">
                            Choix confirmés avec succès !
                        </h1>
                        <p className="text-stone-600 text-sm mb-6">
                            Merci <strong>{client.firstName}</strong>, Elisa a bien reçu votre sélection de <strong>{selectedDishes.length} plats</strong> pour la {menu.weekLabel.toLowerCase()}.
                        </p>

                        <div className="bg-stone-50 rounded-2xl p-5 text-left border border-stone-200 mb-6 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                                Récapitulatif de vos plats :
                            </h3>
                            <ul className="space-y-2">
                                {selectedDishes.map((dishId) => (
                                    <li key={dishId} className="flex items-start text-sm text-stone-800 font-medium">
                                        <span className="text-amber-600 mr-2 font-bold">✓</span>
                                        <span>
                                            {dishName(dishId)}
                                            {dishNotes[dishId] && (
                                                <span className="block text-xs text-stone-500 font-normal italic mt-0.5">
                                                    Note : &quot;{dishNotes[dishId]}&quot;
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {allergies.length > 0 && (
                                <div className="pt-3 border-t border-stone-200 text-xs text-stone-600">
                                    <strong>Régime mémorisé :</strong> {allergies.join(', ')} {dislikes ? `(${dislikes})` : ''}
                                </div>
                            )}
                        </div>

                        <Button 
                            variant="outline" 
                            onClick={() => setIsSubmittedSuccess(false)}
                            className="border-stone-300 hover:bg-stone-100 rounded-full text-xs font-semibold"
                        >
                            Modifier ma sélection
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    const countDifference = targetCount - selectedDishes.length;

    return (
        <div className="min-h-screen bg-[#faf8f5] text-stone-800 pb-36 font-sans">
            {/* Top Navigation / Brand Header */}
            <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 px-4 py-3.5 shadow-xs">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-[#E1567A] text-white rounded-xl flex items-center justify-center font-serif font-bold text-base shadow-xs">
                            E
                        </div>
                        <div>
                            <span className="font-serif font-semibold text-stone-900 tracking-tight block text-sm">
                                Elisa • Batch Cooking
                            </span>
                            <span className="text-[11px] text-stone-500 block leading-tight font-medium">
                                Espace Privé Client
                            </span>
                        </div>
                    </div>

                    <Badge variant="outline" className="bg-rose-50 text-[#E1567A] border-[#E1567A]/30 text-xs py-1 px-3 font-semibold rounded-full">
                        {menu.weekLabel}
                    </Badge>
                </div>
            </header>

            {/* Main Content Area with Generous Spacing */}
            <main className="max-w-3xl mx-auto px-4 pt-8 sm:pt-10 space-y-8">
                
                {/* Welcome Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center space-x-2 mb-1.5">
                                <Sparkles className="w-4 h-4 text-[#E1567A]" />
                                <span className="text-xs uppercase font-bold tracking-wider text-[#E1567A]">
                                    Menu Hebdomadaire
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                                Bonjour {client.firstName} 👋
                            </h1>
                            <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
                                Choisissez vos <strong>{targetCount} plats</strong> parmi les {menu.dishes.length} recettes fraîches de la semaine.
                            </p>
                            {previousSubmissionAt && (
                                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-3 inline-block">
                                    ✓ Choix envoyés le {new Date(previousSubmissionAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}. Vous pouvez encore les modifier.
                                </p>
                            )}
                        </div>


                        {/* Saved Dietary Profile Pill */}
                        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 sm:max-w-xs text-left">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-stone-400" /> Vos préférences mémorisées
                                </span>
                                <Dialog open={isAllergyModalOpen} onOpenChange={setIsAllergyModalOpen}>
                                    <DialogTrigger asChild>
                                        <button className="text-xs text-amber-700 hover:text-amber-800 font-semibold underline flex items-center gap-0.5">
                                            <Edit2 className="w-3 h-3" /> Modifier
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md bg-white rounded-3xl">
                                        <DialogHeader>
                                            <DialogTitle className="font-serif text-lg">
                                                Modifier vos allergies & restrictions
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-2">
                                            <p className="text-xs text-stone-600">
                                                Sélectionnez vos restrictions. Elles seront automatiquement mémorisées pour toutes vos prochaines séances.
                                            </p>
                                            {lockedAllergies.length > 0 && (
                                                <p className="text-[11px] text-stone-500 flex items-center gap-1">
                                                    <Lock className="w-3 h-3" /> Pour retirer une allergie déjà enregistrée, contactez Elisa.
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(new Set([...lockedAllergies, ...COMMON_ALLERGIES])).map((item) => {
                                                    const isChecked = allergies.includes(item);
                                                    const isLocked = lockedAllergies.includes(item);
                                                    return (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() => toggleAllergyTag(item)}
                                                            disabled={isLocked}
                                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                                                isChecked
                                                                    ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                                                                    : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                                                            } ${isLocked ? 'cursor-not-allowed opacity-90' : ''}`}
                                                        >
                                                            {item} {isLocked ? '🔒' : isChecked && '✓'}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="pt-2">
                                                <label className="text-xs font-semibold text-stone-700 block mb-1">
                                                    Autres aversions ou précisions (ex: pas de coriandre) :
                                                </label>
                                                <input
                                                    type="text"
                                                    value={dislikes}
                                                    onChange={(e) => setDislikes(e.target.value)}
                                                    placeholder="Ex: Pas de piment, peu d'oignons..."
                                                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                            </div>

                                            <Button 
                                                className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-2 rounded-xl"
                                                onClick={() => setIsAllergyModalOpen(false)}
                                            >
                                                Enregistrer mes préférences
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {allergies.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {allergies.map(al => (
                                        <span key={al} className="text-[11px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                                            {al}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-stone-400 italic">Aucune restriction enregistrée</span>
                            )}
                            {dislikes && (
                                <p className="text-[11px] text-stone-500 mt-1 italic line-clamp-1">
                                    Note: {dislikes}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between pt-2 px-1">
                    <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-amber-600" />
                        Les {menu.dishes.length} Recettes de la semaine
                    </h2>
                    <span className="text-xs text-stone-500 font-medium">
                        Cochez vos plats favoris
                    </span>
                </div>

                {/* 8 Dishes Grid */}
                <div className="grid grid-cols-1 gap-3.5">
                    {menu.dishes.map((dish, idx) => {
                        const isSelected = selectedDishes.includes(dish.id);
                        return (
                            <div
                                key={dish.id || idx}
                                onClick={() => toggleDish(dish.id)}
                                className={`group cursor-pointer relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                                    isSelected
                                        ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                                        : 'bg-white border-stone-200 hover:border-stone-300'
                                }`}
                            >
                                <div className="p-4 sm:p-5 flex items-start gap-3.5">
                                    {/* Custom Checkbox */}
                                    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                                        isSelected 
                                            ? 'bg-amber-600 border-amber-600 text-white shadow-xs' 
                                            : 'border-stone-300 bg-stone-50 group-hover:border-stone-400'
                                    }`}>
                                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                                    </div>

                                    {/* Dish Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <Badge variant="secondary" className="text-[11px] font-medium bg-stone-100 text-stone-700 gap-1 py-0.5">
                                                {getDishIcon(dish.category)}
                                                {dish.category}
                                            </Badge>
                                        </div>

                                        <h3 className="font-serif font-bold text-stone-900 text-base leading-snug">
                                            {dish.name}
                                        </h3>
                                        
                                        {dish.description && (
                                            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                                                {dish.description}
                                            </p>
                                        )}

                                        {/* Optional Note field when selected */}
                                        {isSelected && (
                                            <div 
                                                className="mt-3.5 pt-3 border-t border-amber-200/60"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-1">
                                                    <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                                                    Consigne particulière pour ce plat (optionnel) :
                                                </div>
                                                <input
                                                    type="text"
                                                    value={dishNotes[dish.id] || ''}
                                                    onChange={(e) => handleNoteChange(dish.id, e.target.value)}
                                                    placeholder="Ex: sans oignons, sauce à part, bien cuit..."
                                                    className="w-full text-xs p-2 rounded-xl bg-white border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* General Note Box */}
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        Un message général pour Elisa pour cette semaine ?
                    </label>
                    <textarea
                        rows={2}
                        value={generalNote}
                        onChange={(e) => setGeneralNote(e.target.value)}
                        placeholder="Ex: Merci Elisa, pourrais-tu ranger les barquettes directement dans le bac du bas du frigo..."
                        className="w-full text-xs p-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800"
                    />
                </div>
            </main>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl p-4 z-40">
                {submitError && (
                    <div className="max-w-3xl mx-auto mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5 font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {submitError}
                    </div>
                )}
                <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                        <div>
                            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                                Votre formule : {targetCount} plats
                            </div>
                            <div className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                                <span>{selectedDishes.length} / {targetCount} sélectionnés</span>
                                {selectedDishes.length === targetCount && (
                                    <span className="text-xs font-sans font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Parfait !
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="sm:hidden text-xs text-stone-500 font-medium">
                            {countDifference > 0 ? `Encore ${countDifference} plat(s)` : 'Quota atteint'}
                        </div>
                    </div>

                    <Button
                        size="lg"
                        disabled={selectedDishes.length !== targetCount || isSubmitting}
                        onClick={handleSubmit}
                        className={`w-full sm:w-auto px-8 font-semibold shadow-md transition-all rounded-full ${
                            selectedDishes.length === targetCount
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                    >
                        {isSubmitting ? (
                            'Enregistrement...'
                        ) : (
                            <span className="flex items-center gap-2">
                                Confirmer mes choix <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

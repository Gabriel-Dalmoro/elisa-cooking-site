"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Clock,
    Euro,
    Utensils,
    ChefHat,
    ShieldCheck,
    RotateCcw,
    Sparkles,
    Wallet,
    Users,
    Printer,
    MapPin,
    CalendarDays
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// --- Default Configuration ---
const DEFAULTS = {
    travelTime: 0.5,
    extraPersonPrice: 10,
    tiers: [
        { recipes: 3, basePrice: 120, cookingTime: 2.5, shoppingTime: 1.0 },
        { recipes: 5, basePrice: 200, cookingTime: 4.0, shoppingTime: 1.25 },
        { recipes: 6, basePrice: 240, cookingTime: 4.5, shoppingTime: 1.5 },
    ]
};

const LIVE_VALUES = {
    extraPersonPrice: 10,
    tiers: {
        3: 120,
        5: 200,
        6: 240
    }
};

interface TierConfig {
    recipes: number;
    basePrice: number;
    cookingTime: number;
    shoppingTime: number;
}

export default function InternalCalculator() {
    // --- State: Configuration ---
    const [travelTime, setTravelTime] = useState(DEFAULTS.travelTime);
    const [extraPersonPrice, setExtraPersonPrice] = useState(DEFAULTS.extraPersonPrice);
    const [extraPersonTime] = useState(0.25); // 15 mins constant

    const [tiers, setTiers] = useState<TierConfig[]>(JSON.parse(JSON.stringify(DEFAULTS.tiers)));

    // --- State: Simulation Scenario ---
    const [selectedRecipes, setSelectedRecipes] = useState(6);
    const [numPeople, setNumPeople] = useState(4);

    // Revenue Modifiers
    const [isSubscription, setIsSubscription] = useState(false);
    const [promoDiscount, setPromoDiscount] = useState(0);

    // --- Logic: Mutual Exclusivity ---
    const handleSubscriptionChange = (checked: boolean) => {
        setIsSubscription(checked);
        if (checked) setPromoDiscount(0); // Disable promo if sub is checked
    };

    const handlePromoChange = (value: number) => {
        setPromoDiscount(value);
        if (value > 0) setIsSubscription(false); // Disable sub if promo is active
    };

    // --- Logic: Check for Changes ---
    const hasChanges = useMemo(() => {
        const isTravelChanged = travelTime !== DEFAULTS.travelTime;
        const isExtraPriceChanged = extraPersonPrice !== DEFAULTS.extraPersonPrice;
        const isTiersChanged = JSON.stringify(tiers) !== JSON.stringify(DEFAULTS.tiers);
        return isTravelChanged || isExtraPriceChanged || isTiersChanged;
    }, [travelTime, extraPersonPrice, tiers]);

    const handleReset = () => {
        setTravelTime(DEFAULTS.travelTime);
        setExtraPersonPrice(DEFAULTS.extraPersonPrice);
        setTiers(JSON.parse(JSON.stringify(DEFAULTS.tiers)));
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
        document.title = `Rapport Profitabilité Elisa Cooking - ${dateStr}`;

        window.print();

        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    };

    const updateTier = (index: number, field: keyof TierConfig, value: number) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setTiers(newTiers);
    };

    // --- Core Calculation Logic ---
    const results = useMemo(() => {
        const tier = tiers.find(t => t.recipes === selectedRecipes) || tiers[2];
        const extraPeople = Math.max(0, numPeople - 1);
        const grossServicePrice = tier.basePrice + (extraPeople * extraPersonPrice);
        const subDiscountAmount = isSubscription ? grossServicePrice * 0.15 : 0;
        const promoDiscountAmount = grossServicePrice * (promoDiscount / 100);
        const totalDiscounts = subDiscountAmount + promoDiscountAmount;
        const finalInvoiced = grossServicePrice - totalDiscounts;
        const netRevenue = finalInvoiced * (1 - 0.24);
        const totalTime = travelTime + tier.shoppingTime + tier.cookingTime + (extraPeople * extraPersonTime);
        const netHourlyRate = totalTime > 0 ? netRevenue / totalTime : 0;

        return {
            grossServicePrice,
            subDiscountAmount,
            promoDiscountAmount,
            finalInvoiced,
            netRevenue,
            totalTime,
            netHourlyRate,
            tier
        };
    }, [selectedRecipes, numPeople, travelTime, extraPersonPrice, extraPersonTime, tiers, isSubscription, promoDiscount]);

    // --- State: Authentication ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple client-side protection
        if (passwordInput === 'elisa2024') {
            setIsAuthenticated(true);
            setAuthError(false);
        } else {
            setAuthError(true);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] p-4">
                <Card className="w-full max-w-md shadow-xl border-stone-100">
                    <CardHeader className="text-center space-y-1">
                        <div className="mx-auto bg-stone-900 text-white p-3 rounded-xl w-fit shadow-lg shadow-stone-900/10 mb-2">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-2xl font-black text-stone-900">Accès Sécurisé</CardTitle>
                        <p className="text-stone-500 text-sm">Veuillez entrer le mot de passe pour accéder au calculateur.</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="••••••••"
                                    className="text-lg text-center tracking-widest"
                                />
                            </div>
                            {authError && <p className="text-red-500 text-xs font-bold text-center">Mot de passe incorrect</p>}
                            <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold h-12 rounded-xl">
                                Entrer
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FAFAF9] py-8 text-stone-900 font-sans selection:bg-brand-rose/20 print:bg-white print:p-0 print:m-0 print:h-auto print:min-h-0 print:overflow-hidden">
            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: auto; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    footer, .site-footer { display: none !important; }
                    header { display: none !important; }
                    main { min-height: 0 !important; height: auto !important; padding: 0 !important; margin: 0 !important; }
                }
            `}</style>

            <div className="container mx-auto px-4 max-w-7xl print:max-w-none print:px-4 print:py-0">

                {/* --- HEADER (Screen Only) --- */}
                <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-8 relative print:hidden">
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                        <div className="flex items-center gap-3">
                            <div className="bg-stone-900 text-white p-2.5 rounded-xl shadow-lg shadow-stone-900/10">
                                <ChefHat className="w-5 h-5" />
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-widest uppercase border border-emerald-200">
                                Version 3.8
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tight leading-none">
                            Calcul de <span className="font-handwriting text-brand-rose transform -rotate-1 inline-block ml-1 text-4xl lg:text-5xl">Profitabilité.</span>
                        </h1>
                        <p className="text-stone-500 text-sm font-medium max-w-lg mt-1">
                            Simulateur interactif pour ajuster vos prix et garantir votre rentabilité.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 z-10 w-full lg:w-auto justify-end">
                        <Button
                            onClick={handlePrint}
                            variant="outline"
                            className="bg-white border-stone-200 text-stone-600 hover:bg-stone-50 shadow-sm rounded-xl gap-2 font-bold"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimer
                        </Button>
                        <AnimatePresence>
                            {hasChanges && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <Button onClick={handleReset} size="sm" variant="ghost" className="text-stone-400">
                                        <RotateCcw className="w-4 h-4 mr-2" /> Reset
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* --- PRINT LAYOUT (A4 One-Pager) --- */}
                <div className="hidden print:block w-full">
                    {/* 1. Header: Logo & date */}
                    <div className="flex justify-between items-center mb-8 border-b-2 border-stone-900 pb-4">
                        <div className="flex items-center gap-3">
                            <ChefHat className="w-8 h-8 text-stone-900" />
                            <h1 className="text-2xl font-black text-stone-900 uppercase tracking-tight">Elisa Batch Cooking</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">Configuration Tarifaire</p>
                            <div className="flex items-center gap-2 text-stone-900 font-medium text-sm">
                                <CalendarDays className="w-4 h-4" />
                                {new Date().toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                    </div>

                    {/* 2. Global Params (Compact Row) */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2 border-b border-stone-200 pb-1">Paramètres Généraux</h3>
                        <div className="flex gap-8">
                            <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-lg border border-stone-100">
                                <MapPin className="w-4 h-4 text-stone-400" />
                                <span className="font-bold text-sm text-stone-600">Trajet Facturé:</span>
                                <span className="font-black text-lg text-stone-900">{travelTime}h</span>
                            </div>
                            <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-lg border border-stone-100">
                                <Users className="w-4 h-4 text-stone-400" />
                                <span className="font-bold text-sm text-stone-600">Prix Extra/Pers:</span>
                                <span className="font-black text-lg text-brand-rose">{extraPersonPrice}€</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Main Data: 3 Columns for All Recipes */}
                    <div className="mb-8">
                        <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-200 pb-1">Grille Tarifaire Complète</h3>
                        <div className="grid grid-cols-3 gap-6">
                            {tiers.map((tier, idx) => (
                                <div key={idx} className="border-2 border-stone-100 rounded-xl p-4 bg-white break-inside-avoid shadow-sm">
                                    <div className="flex justify-between items-center mb-3 border-b border-stone-100 pb-2">
                                        <Badge className="bg-stone-900 text-white text-sm font-black px-2 py-0.5 rounded-md">{tier.recipes} Recettes</Badge>
                                        <div className="text-2xl font-black text-stone-900">{tier.basePrice}€</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center bg-stone-50 p-1.5 rounded-lg">
                                            <span className="text-[10px] font-bold text-stone-500 uppercase">Cuisine</span>
                                            <span className="font-black text-base">{tier.cookingTime}h</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-stone-50 p-1.5 rounded-lg">
                                            <span className="text-[10px] font-bold text-stone-500 uppercase">Courses</span>
                                            <span className="font-black text-base">{tier.shoppingTime}h</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-emerald-50 p-1.5 rounded-lg border border-emerald-100 mt-2">
                                            <span className="text-[10px] font-bold text-emerald-700 uppercase">Taux Horaire*</span>
                                            <span className="font-black text-base text-emerald-900">
                                                {((tier.basePrice * (1 - 0.24)) / (travelTime + tier.shoppingTime + tier.cookingTime)).toFixed(1)}€
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] text-stone-400 mt-1 italic">*Estimation net horaire pour 1 personne (base)</p>
                    </div>

                    {/* 4. Footer: Simulation Snapshot (Compact) */}
                    <div className="border-t-2 border-stone-900 pt-4 break-inside-avoid">
                        <div className="flex justify-between items-end">
                            <div className="max-w-xs">
                                <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-widest mb-2">Scénario Simulé</h3>
                                <p className="text-xs text-stone-600 mb-1">Formule: <span className="font-bold text-stone-900">{results.tier.recipes} Recettes</span></p>
                                <p className="text-xs text-stone-600 mb-1">Couverts: <span className="font-bold text-stone-900">{numPeople} Personnes</span></p>
                                <p className="text-xs text-stone-600">Options: {isSubscription ? "Abo (-15%)" : "Standard"} {promoDiscount > 0 && `, Promo (-${promoDiscount}%)`}</p>
                            </div>

                            <div className="flex gap-8 text-right items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Facture Client</p>
                                    <p className="text-3xl font-black text-stone-900 leading-none">{Math.round(results.finalInvoiced)}€</p>
                                </div>
                                <div className="pl-8 border-l border-stone-200">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Net Estimé</p>
                                    <p className="text-4xl font-black text-emerald-600 leading-none">{Math.round(results.netRevenue)}€</p>
                                    <p className="text-xs font-bold text-emerald-800/60 mt-1">{results.netHourlyRate.toFixed(1)}€ / h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- INPUTS & UI (Screen Only) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:hidden">
                    {/* LEFT INPUTS */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Global Params */}
                        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
                            <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6">
                                <div className="bg-stone-50 p-2 rounded-lg text-stone-500"><Clock className="w-5 h-5" /></div>
                                <h2 className="text-sm font-black uppercase text-stone-400 tracking-widest">Paramètres Généraux</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <Label className="font-bold text-stone-800">Trajet (Aller/Retour)</Label>
                                            <p className="text-[10px] text-stone-400 font-medium max-w-[180px]">Temps perdu en déplacement non facturé.</p>
                                        </div>
                                        <Badge variant="secondary" className="text-sm font-black px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-lg">{travelTime}h</Badge>
                                    </div>
                                    <Slider value={[travelTime]} onValueChange={(v) => setTravelTime(v[0])} max={2} step={0.25} className="py-2" />
                                </div>
                                <div className="space-y-4 border-t md:border-t-0 md:border-l border-stone-100 pt-6 md:pt-0 md:pl-8">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <Label className="font-bold text-stone-800">Prix Pers. Supplémentaire</Label>
                                            <p className="text-[10px] text-stone-400 font-medium max-w-[180px]">Coût ajouté par personne au delà de 1.</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <Badge className="bg-brand-rose text-white text-sm font-black px-2.5 py-0.5 rounded-lg">{extraPersonPrice}€</Badge>
                                            {extraPersonPrice !== LIVE_VALUES.extraPersonPrice && (<span className="text-[9px] font-bold text-amber-500 mt-1">Site: {LIVE_VALUES.extraPersonPrice}€</span>)}
                                        </div>
                                    </div>
                                    <Slider value={[extraPersonPrice]} onValueChange={(v) => setExtraPersonPrice(v[0])} max={30} step={1} className="py-2" />
                                </div>
                            </div>
                        </section>

                        {/* Recipe Tiers */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-stone-200/60 pb-3">
                                <div className="bg-stone-100 p-2 rounded-lg text-stone-500"><Utensils className="w-4 h-4" /></div>
                                <h2 className="text-sm font-black uppercase text-stone-400 tracking-widest">Vos Formules</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {tiers.map((tier, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col md:flex-row items-center gap-6 group hover:border-brand-rose/20 hover:shadow-md transition-all">
                                        <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full md:w-40 shrink-0 gap-2">
                                            <Badge className="bg-stone-900 text-white text-sm font-bold px-3 py-1 rounded-lg">{tier.recipes} Recettes</Badge>
                                            <div className="text-[10px] font-bold text-stone-400 px-2 py-1 bg-stone-50 rounded-full border border-stone-100">Site: {LIVE_VALUES.tiers[tier.recipes as keyof typeof LIVE_VALUES.tiers]}€</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6 flex-1 w-full">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider pl-1">Prix</Label>
                                                <div className="relative">
                                                    <Input type="number" value={tier.basePrice || ''} onChange={(e) => updateTier(idx, 'basePrice', e.target.value === '' ? 0 : parseFloat(e.target.value))} className="font-black text-lg h-12 border-stone-200 bg-stone-50/50 rounded-xl text-center pl-6 pr-2 shadow-inner" />
                                                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider pl-1 flex items-center gap-1">Cuisine <Clock className="w-3 h-3" /></Label>
                                                <Input type="number" step="0.5" value={tier.cookingTime || ''} onChange={(e) => updateTier(idx, 'cookingTime', e.target.value === '' ? 0 : parseFloat(e.target.value))} className="font-bold text-lg h-12 border-stone-200 bg-white rounded-xl text-center" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider pl-1 flex items-center gap-1">Courses <Wallet className="w-3 h-3" /></Label>
                                                <Input type="number" step="0.25" value={tier.shoppingTime || ''} onChange={(e) => updateTier(idx, 'shoppingTime', e.target.value === '' ? 0 : parseFloat(e.target.value))} className="font-bold text-lg h-12 border-stone-200 bg-white rounded-xl text-center" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT SIMULATOR (Compact & Profit First) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-4">
                        <Card className="border-none shadow-xl bg-white text-stone-900 rounded-[2rem] overflow-hidden ring-4 ring-stone-50 relative pb-4">

                            <CardContent className="px-5 pt-5 pb-5 space-y-5">

                                {/* 1. PROFIT FIRST (Top Card) */}
                                <div className="bg-emerald-500 text-emerald-50 p-5 rounded-3xl shadow-xl shadow-emerald-200/50 transform scale-[1.02]">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[9px] font-black uppercase text-emerald-900/60 tracking-[0.1em]">Net en Poche</p>
                                        <p className="text-[9px] font-bold text-emerald-900/40">(après 24% URSSAF)</p>
                                    </div>

                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <span className="text-6xl font-black tracking-tighter text-white">{Math.round(results.netRevenue)}</span>
                                        <span className="text-2xl font-bold opacity-80 translate-y-1 text-emerald-100">€</span>
                                    </div>

                                    <div className="h-px bg-emerald-900/10 w-full my-3"></div>

                                    <div className="flex items-center justify-center gap-2 text-emerald-900">
                                        <span className="text-3xl font-black">{results.netHourlyRate.toFixed(1)}</span>
                                        <span className="text-sm font-bold opacity-70">€ / heure</span>
                                    </div>
                                </div>

                                {/* 2. Secondary Metrics (Compact) */}
                                <div className="flex justify-between items-center text-xs font-medium px-2">
                                    <div className="text-left">
                                        <span className="block text-stone-400 text-[9px] uppercase tracking-wider">Facture Client</span>
                                        <span className="block text-lg font-black text-stone-900">{Math.round(results.finalInvoiced)}€</span>
                                    </div>
                                    <div className="h-8 w-px bg-stone-200"></div>
                                    <div className="text-right">
                                        <span className="block text-stone-400 text-[9px] uppercase tracking-wider">Temps Total</span>
                                        <span className="block text-lg font-black text-stone-900">{results.totalTime.toFixed(1)}h</span>
                                    </div>
                                </div>

                                {/* 3. INPUT S (Below) */}
                                <div className="space-y-4 pt-4 border-t border-stone-100">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-stone-400 font-bold uppercase tracking-widest pl-1">Formule Choisie</Label>
                                            <select value={selectedRecipes} onChange={(e) => setSelectedRecipes(Number(e.target.value))} className="w-full bg-stone-100 border border-stone-200 rounded-xl h-10 text-center text-sm font-bold text-stone-900 outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer appearance-none hover:bg-stone-200 transition-colors">
                                                <option value="3" className="text-stone-900">3 Recettes</option>
                                                <option value="5" className="text-stone-900">5 Recettes</option>
                                                <option value="6" className="text-stone-900">6 Recettes</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <Label className="text-[10px] text-stone-400 font-bold uppercase tracking-widest pl-1">Nombre de Personnes</Label>
                                                <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200"><Users className="w-3 h-3 text-brand-gold" /><span className="text-sm font-black text-stone-900">{numPeople}</span></div>
                                            </div>
                                            <Slider value={[numPeople]} onValueChange={(v) => setNumPeople(v[0])} min={1} max={8} step={1} className="py-2" />
                                        </div>
                                    </div>

                                    {/* Exclusive Discounts */}
                                    <div className="space-y-3 pt-3 border-t border-stone-100">
                                        <div className={`flex items-center justify-between p-2.5 rounded-xl transition-colors border cursor-pointer ${isSubscription ? "bg-brand-rose/5 border-brand-rose/20" : "bg-stone-50 border-stone-100 hover:bg-stone-100"}`} onClick={() => handleSubscriptionChange(!isSubscription)}>
                                            <div className="space-y-0.5">
                                                <span className={`text-xs font-bold block ${isSubscription ? "text-brand-rose" : "text-stone-800"}`}>Abonnement (-15%)</span>
                                            </div>
                                            <Switch checked={isSubscription} onCheckedChange={handleSubscriptionChange} className="data-[state=checked]:bg-brand-rose scale-75 origin-right" />
                                        </div>

                                        <div className={`p-2.5 rounded-xl border space-y-2 ${promoDiscount > 0 ? "bg-brand-gold/10 border-brand-gold/20" : "bg-stone-50 border-stone-100"}`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs font-bold ${promoDiscount > 0 ? "text-stone-900" : "text-stone-500"}`}>Vente Flash</span>
                                                <Badge className={`text-[10px] font-black pointer-events-none h-5 ${promoDiscount > 0 ? 'bg-brand-gold text-stone-900' : 'bg-stone-200 text-stone-400'}`}>-{promoDiscount}%</Badge>
                                            </div>
                                            <Slider
                                                value={[promoDiscount]}
                                                onValueChange={(v) => handlePromoChange(v[0])}
                                                max={50} step={5}
                                                className="py-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}

"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    Euro,
    User,
    TrendingUp,
    Info,
    ChefHat,
    ShieldCheck,
    Lock,
    Eye,
    EyeOff,
    ShoppingBag,
    Utensils,
    HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

// --- Types ---
interface TierConfig {
    recipes: number;
    basePrice: number;
    cookingTime: number;
    shoppingTime: number;
}

// --- Local Utils ---
const getGroceryUnitCost = (peopleCount: number) => {
    if (peopleCount === 1) return { min: 7.5, max: 10.0 };
    if (peopleCount === 2) return { min: 6.0, max: 8.5 };
    if (peopleCount === 3) return { min: 5.0, max: 7.5 };
    return { min: 4.0, max: 6.5 }; // 4+ people
};

// --- Defaults ---
const DEFAULT_TIERS: TierConfig[] = [
    { recipes: 3, basePrice: 120, cookingTime: 2.5, shoppingTime: 1.0 },
    { recipes: 5, basePrice: 200, cookingTime: 4.0, shoppingTime: 1.25 },
    { recipes: 6, basePrice: 240, cookingTime: 4.5, shoppingTime: 1.5 },
];

const DEFAULT_TRAVEL_TIME = 0.5; // 30 mins
const DEFAULT_EXTRA_PERSON_PRICE = 10;
const DEFAULT_EXTRA_PERSON_TIME = 0.25; // 15 mins

export default function InternalCalculator() {
    // --- Auth State ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState(false);

    // --- Calculator State ---
    const [travelTime, setTravelTime] = useState(DEFAULT_TRAVEL_TIME);
    const [extraPersonPrice, setExtraPersonPrice] = useState(DEFAULT_EXTRA_PERSON_PRICE);
    const [extraPersonTime, setExtraPersonTime] = useState(DEFAULT_EXTRA_PERSON_TIME);
    const [tiers, setTiers] = useState<TierConfig[]>(DEFAULT_TIERS);

    // Simulations
    const [selectedRecipes, setSelectedRecipes] = useState(5);
    const [numPeople, setNumPeople] = useState(4);

    // --- Handlers ---
    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'elisa2024') {
            setIsAuthenticated(true);
            setAuthError(false);
        } else {
            setAuthError(true);
            setTimeout(() => setAuthError(false), 2000);
        }
    };

    const updateTier = (index: number, field: keyof TierConfig, value: number) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setTiers(newTiers);
    };

    // --- Calculations ---
    const results = useMemo(() => {
        const tier = tiers.find(t => t.recipes === selectedRecipes) || tiers[1];
        const extraPeople = Math.max(0, numPeople - 1);

        // 1. Revenue
        const totalRevenue = tier.basePrice + (extraPeople * extraPersonPrice);
        const netRevenue = totalRevenue * (1 - 0.24); // URSSAF - 24%

        // 2. Time
        const totalTime = travelTime + tier.shoppingTime + tier.cookingTime + (extraPeople * extraPersonTime);
        const grossHourlyRate = totalRevenue / totalTime;
        const netHourlyRate = netRevenue / totalTime;

        // 3. Client Perspective
        const clientCostAfterTax = totalRevenue * 0.5;
        const totalMeals = selectedRecipes * numPeople;
        const costPerMeal = clientCostAfterTax / totalMeals;

        // 4. Grocery Integration (High end estimation)
        const groceryUnit = getGroceryUnitCost(numPeople);
        const totalGroceryCost = totalMeals * groceryUnit.max;
        const clientTotalOutOfPocket = clientCostAfterTax + totalGroceryCost;

        return {
            totalRevenue,
            netRevenue,
            totalTime,
            grossHourlyRate,
            netHourlyRate,
            clientCostAfterTax,
            totalMeals,
            costPerMeal,
            totalGroceryCost,
            clientTotalOutOfPocket,
            tier
        };
    }, [selectedRecipes, numPeople, travelTime, extraPersonPrice, extraPersonTime, tiers]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-stone-800 bg-stone-950 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-rose via-brand-gold to-brand-rose" />
                        <CardHeader className="text-center pt-10">
                            <div className="h-16 w-16 bg-brand-rose/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-rose/20">
                                <Lock className="h-8 w-8 text-brand-rose" />
                            </div>
                            <CardTitle className="text-2xl font-black text-white tracking-tight">Espace Business</CardTitle>
                            <CardDescription className="text-stone-500">
                                Connectez-vous pour voir vos marges.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10">
                            <form onSubmit={handleAuth} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-stone-400 text-xs font-bold uppercase tracking-widest leading-none">Secret Marie</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={cn(
                                                "bg-stone-900 border-stone-800 text-white h-12 rounded-xl focus:ring-brand-rose transition-all",
                                                authError && "border-red-500"
                                            )}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <Button
                                    className="w-full h-12 rounded-xl bg-brand-rose hover:bg-brand-rose/90 text-white font-bold text-lg shadow-xl shadow-brand-rose/20"
                                    type="submit"
                                >
                                    Entrer dans le labo
                                </Button>
                                {authError && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-red-500 font-bold uppercase tracking-tighter mt-2">
                                        Accès refusé. Vérifiez votre clé.
                                    </motion.p>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFCFB] py-12 md:py-16 text-stone-900 text-sm">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-stone-900/10">
                                <ChefHat className="h-7 w-7" />
                            </div>
                            <Badge className="bg-brand-rose/10 text-brand-rose border-none px-3 py-1 uppercase text-[10px] font-black tracking-widest">
                                Strategic Dashboard v2.0
                            </Badge>
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.9]">
                                Calcul de <span className="text-brand-rose italic underline decoration-brand-gold/20">Profitabilité.</span>
                            </h1>
                            <p className="text-stone-500 mt-4 text-lg font-medium max-w-xl leading-relaxed">
                                Ajustez vos prix, visualisez vos heures et assurez-vous que chaque session batch-cooking soit rentable pour vous comme pour vos clients.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-stone-100 min-w-[280px]">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 leading-none mb-1.5">Identité Elisa</p>
                            <p className="text-sm font-black text-stone-900">Session Protégée Active</p>
                        </div>
                    </div>
                </div>

                {/* --- GRID LAYOUT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* --- LEFT COLUMN: CONFIGURATION --- */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Card 1: Business Constants */}
                        <Card className="rounded-[2.5rem] border-stone-100 shadow-xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                            <CardHeader className="bg-stone-50/50 border-b border-stone-100 pb-6 pt-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-brand-rose/10 rounded-xl text-brand-rose">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl font-black text-stone-900">Constantes Métier</CardTitle>
                                </div>
                                <CardDescription className="text-stone-500 font-medium leading-relaxed">
                                    Réglez les temps incompressibles et vos tarifs de suppléments.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-10">
                                {/* Trajet */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center group/item">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-stone-500">Temps de trajet (H)</Label>
                                            <HelpCircle className="h-3 w-3 text-stone-300" />
                                        </div>
                                        <Badge variant="outline" className="text-stone-900 font-black px-3 rounded-full border-stone-200">{travelTime}h</Badge>
                                    </div>
                                    <Slider
                                        value={[travelTime]} onValueChange={(val) => setTravelTime(val[0])}
                                        max={2} min={0} step={0.25} className="py-2"
                                    />
                                </div>

                                {/* Supplément € */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center group/item">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-stone-500">Prix / Pers. Extra</Label>
                                            <HelpCircle className="h-3 w-3 text-stone-300" />
                                        </div>
                                        <Badge className="bg-brand-rose text-white border-none font-black px-3 rounded-full">{extraPersonPrice}€</Badge>
                                    </div>
                                    <Slider
                                        value={[extraPersonPrice]} onValueChange={(val) => setExtraPersonPrice(val[0])}
                                        max={50} min={0} step={5} className="py-2"
                                    />
                                </div>

                                {/* Supplément Time */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center group/item">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-stone-500">Temps / Pers. Extra</Label>
                                            <HelpCircle className="h-3 w-3 text-stone-300" />
                                        </div>
                                        <Badge variant="outline" className="text-stone-900 font-black px-3 rounded-full border-stone-200">{extraPersonTime}h</Badge>
                                    </div>
                                    <Slider
                                        value={[extraPersonTime]} onValueChange={(val) => setExtraPersonTime(val[0])}
                                        max={1} min={0} step={0.05} className="py-2"
                                    />
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tight italic">Équivaut à {Math.round(extraPersonTime * 60)} minutes.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 2: Tier Grid Settings */}
                        <Card className="rounded-[2.5rem] border-stone-100 shadow-xl overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                            <CardHeader className="bg-stone-50/50 border-b border-stone-100 pb-6 pt-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-brand-gold/10 rounded-xl text-brand-gold">
                                        <ShoppingBag className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl font-black text-stone-900">Grille des Forfaits</CardTitle>
                                </div>
                                <CardDescription className="text-stone-500 font-medium leading-relaxed">
                                    Base de votre offre. Modifiez prix et temps estimés.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-6">
                                {tiers.map((tier, idx) => (
                                    <div key={idx} className="p-5 rounded-3xl bg-stone-50/50 border border-stone-100 hover:border-brand-gold/30 transition-all space-y-5 group/tier">
                                        <div className="flex justify-between items-center">
                                            <Badge className="bg-stone-900 text-white font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl">
                                                {tier.recipes} RECETTES
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Prix Client (€)</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number" value={tier.basePrice}
                                                        onChange={(e) => updateTier(idx, 'basePrice', parseInt(e.target.value) || 0)}
                                                        className="h-11 rounded-2xl border-stone-200 bg-white font-black text-brand-rose focus:ring-brand-rose"
                                                    />
                                                    <Euro className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Cuisine (H)</Label>
                                                <Input
                                                    type="number" step="0.5" value={tier.cookingTime}
                                                    onChange={(e) => updateTier(idx, 'cookingTime', parseFloat(e.target.value) || 0)}
                                                    className="h-11 rounded-2xl border-stone-200 bg-white font-black text-stone-900"
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Courses (H)</Label>
                                                <Input
                                                    type="number" step="0.25" value={tier.shoppingTime}
                                                    onChange={(e) => updateTier(idx, 'shoppingTime', parseFloat(e.target.value) || 0)}
                                                    className="h-11 rounded-2xl border-stone-200 bg-white font-black text-stone-900"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- RIGHT COLUMN: SIMULATOR & DASHBOARD --- */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Card 3: Live Simulator Interaction */}
                        <div className="bg-stone-900 rounded-[3rem] p-8 md:p-12 text-white shadow-3xl relative overflow-hidden ring-1 ring-white/10">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-rose/20 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none opacity-40" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none opacity-30" />

                            <div className="relative z-10 space-y-10">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="flex-1 w-full space-y-8">
                                        <div className="space-y-2">
                                            <p className="text-brand-gold font-black text-[11px] uppercase tracking-[0.4em]">Simulateur Temps Réel</p>
                                            <h2 className="text-3xl font-black tracking-tight leading-none">Scénario de session.</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-5">
                                                <Label className="text-stone-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Utensils className="h-4 w-4 text-brand-rose" /> Volume de Recettes
                                                </Label>
                                                <div className="flex gap-2">
                                                    {[3, 5, 6].map((n) => (
                                                        <button
                                                            key={n} onClick={() => setSelectedRecipes(n)}
                                                            className={cn(
                                                                "h-16 flex-1 rounded-3xl font-black text-2xl transition-all border-2",
                                                                selectedRecipes === n
                                                                    ? "bg-brand-rose border-brand-rose text-white shadow-2xl shadow-brand-rose/40 scale-105"
                                                                    : "bg-white/5 border-white/10 text-stone-500 hover:border-white/20 hover:text-white"
                                                            )}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                <Label className="text-stone-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                    <User className="h-4 w-4 text-brand-gold" /> Nombre de personnes
                                                </Label>
                                                <div className="flex items-center gap-6 bg-white/5 p-4 rounded-3xl border border-white/10 transition-all">
                                                    <Slider
                                                        value={[numPeople]} onValueChange={(val) => setNumPeople(val[0])}
                                                        max={8} min={1} step={1} className="py-2 flex-1"
                                                    />
                                                    <span className="text-5xl font-black text-brand-gold tabular-nums min-w-[3rem] text-center">{numPeople}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Visual Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[2.5rem] p-7 group hover:bg-white/[0.06] transition-all">
                                        <p className="text-[10px] font-black uppercase text-stone-500 mb-4 tracking-widest leading-none">Heures Engagées</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-white">{results.totalTime.toFixed(1)}</span>
                                            <span className="text-sm font-bold text-stone-500 lowercase">h</span>
                                        </div>
                                        <p className="text-[8px] font-black uppercase text-stone-600 mt-4 tracking-tighter">Trajet + Courses + Cuisine</p>
                                    </div>

                                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[2.5rem] p-7 group hover:bg-white/[0.06] transition-all">
                                        <p className="text-[10px] font-black uppercase text-stone-500 mb-4 tracking-widest leading-none">CA BRUT Visite</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-white">{results.totalRevenue}</span>
                                            <span className="text-sm font-bold text-stone-500 uppercase">€</span>
                                        </div>
                                        <p className="text-[8px] font-black uppercase text-brand-gold/60 mt-4 tracking-tighter">Facturation Directe</p>
                                    </div>

                                    <div className="bg-brand-rose/20 border border-brand-rose/30 rounded-[2.5rem] p-7 group hover:bg-brand-rose/30 transition-all ring-1 ring-brand-rose/20">
                                        <p className="text-[10px] font-black uppercase text-brand-gold mb-4 tracking-widest leading-none">Net en Poche (est.)</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-white">{Math.round(results.netRevenue)}</span>
                                            <span className="text-sm font-bold text-stone-300 uppercase">€</span>
                                        </div>
                                        <p className="text-[8px] font-black uppercase text-white/40 mt-4 tracking-tighter">Après URSSAF 24%</p>
                                    </div>

                                    <div className="bg-brand-gold/20 border border-brand-gold/30 rounded-[2.5rem] p-7 group hover:bg-brand-gold/30 transition-all ring-1 ring-brand-gold/20">
                                        <p className="text-[10px] font-black uppercase text-brand-gold mb-4 tracking-widest leading-none">Taux Horaire Net</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-white scale-110 origin-left">{Math.round(results.netHourlyRate)}</span>
                                            <span className="text-sm font-bold text-stone-300 uppercase ml-1">€/h</span>
                                        </div>
                                        <p className="text-[8px] font-black uppercase text-white/40 mt-4 tracking-tighter">Objectif : 35€/h</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Detailed Customer Analysis & Profit Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Perspective Client - Focus on ingredients/real cost */}
                            <Card className="rounded-[3rem] border-stone-100 shadow-xl overflow-hidden flex flex-col pt-10 px-10 pb-12 bg-white ring-1 ring-stone-900/5 hover:-translate-y-1 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="h-10 w-10 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold">
                                        <ShoppingBag className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-stone-900 tracking-tight leading-none mb-1">Impact Client</h3>
                                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Coût global des courses</p>
                                    </div>
                                </div>

                                <div className="space-y-10 flex-1">
                                    <div className="bg-stone-50 rounded-[2.5rem] p-10 border border-stone-100 text-center relative">
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-stone-900 text-white font-black text-[9px] uppercase px-3 py-1 rounded-full">TOTAL DÉBOURSÉ</Badge>
                                        </div>
                                        <div className="flex items-baseline justify-center gap-1 mt-4">
                                            <span className="text-7xl font-black text-stone-900 tracking-tighter tabular-nums">{Math.round(results.clientTotalOutOfPocket)}</span>
                                            <span className="text-2xl font-black text-stone-400 uppercase">€</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mt-2 italic">Service + Ingrédients (Max)</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-stone-50/50 p-6 rounded-3xl border border-stone-100 text-center">
                                            <p className="text-3xl font-black text-brand-rose">{results.costPerMeal.toFixed(1)}€</p>
                                            <p className="text-[8px] font-black uppercase text-stone-400 tracking-[0.2em] mt-2 leading-none">L'Assiette<br />Cuisinée Chef</p>
                                        </div>
                                        <div className="bg-stone-50/50 p-6 rounded-3xl border border-stone-100 text-center">
                                            <p className="text-3xl font-black text-stone-900 tabular-nums">{Math.round(results.totalGroceryCost)}€</p>
                                            <p className="text-[8px] font-black uppercase text-stone-400 tracking-[0.2em] mt-2 leading-none">Estimation<br />Courses (Max)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 p-6 bg-stone-900 rounded-[2rem] text-white/90">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-brand-gold shrink-0 mt-0.5" />
                                        <p className="text-[11px] leading-[1.6] font-medium opacity-80">
                                            Les clients retiennent l'effort financier TOTAL. Pour **{numPeople} personnes**, inclure les courses (est. **{Math.round(results.totalGroceryCost)}€**) montre que le repas revient à seulement **{Math.round(results.clientTotalOutOfPocket / results.totalMeals)}€** tout inclus.
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Analyse de Rentabilité - Elisa's Efficiency */}
                            <Card className="rounded-[3rem] border-stone-100 shadow-xl overflow-hidden flex flex-col p-10 bg-white ring-1 ring-stone-900/5 hover:-translate-y-1 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="h-10 w-10 bg-brand-rose/10 rounded-2xl flex items-center justify-center text-brand-rose">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-stone-900 tracking-tight leading-none mb-1">Votre Efficacité</h3>
                                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Temps vs Profit Net</p>
                                    </div>
                                </div>

                                <div className="space-y-12 flex-1 flex flex-col">

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Densité Session</Label>
                                                    <p className="text-sm font-black text-stone-900">{results.totalMeals} Plats cuisinés</p>
                                                </div>
                                                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px]">OPTIMAL</Badge>
                                            </div>
                                            <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden p-0.5 ring-1 ring-stone-900/5">
                                                <motion.div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: "88%" }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end text-xs font-black uppercase tracking-widest">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Rentabilité Temps / Net</Label>
                                                    <p className="text-sm font-black text-stone-900">{Math.round(results.netHourlyRate)}€ / Heure de vie</p>
                                                </div>
                                                <span className={cn(
                                                    "text-[10px]",
                                                    results.netHourlyRate > 35 ? "text-emerald-500" : "text-brand-rose"
                                                )}>
                                                    {results.netHourlyRate > 35 ? 'EXCELLENTE' : 'À AMÉLIORER'}
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden p-0.5 ring-1 ring-stone-900/5">
                                                <motion.div
                                                    className="h-full bg-brand-rose"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (results.netHourlyRate / 50) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="p-8 bg-brand-gold/10 rounded-[2.5rem] border border-brand-gold/20 flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-gold shrink-0">
                                                <ChefHat className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-brand-gold mb-2 tracking-widest leading-none">Conseil Stratégique</p>
                                                <p className="text-[11px] text-stone-700 font-bold leading-relaxed italic">
                                                    "Pour cette zone, tu génères **{Math.round(results.netRevenue)}€ NET** pour une journée de **{results.totalTime.toFixed(1)}h**. Si tu veux augmenter ton taux horaire, réduit le temps des courses ou optimise ton trajet."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <footer className="mt-24 pt-10 border-t border-stone-200 text-center space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Copyright © 2024 Chef Elisa • Confidentialité Entreprise</p>
                    <div className="flex justify-center gap-6">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-stone-300 uppercase tracking-widest"><ShieldCheck className="h-3 w-3" /> Chiffrement SSL</span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-stone-300 uppercase tracking-widest"><Lock className="h-3 w-3" /> Accès Restreint</span>
                    </div>
                </footer>
            </div>
        </main>
    );
}

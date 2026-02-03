"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Briefcase, Car, Check, Clock, Cookie, Flame, Lightbulb, ListTodo, PackageOpen, Search, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICING_CONFIG, usePricingCalculation, getGroceryUnitCost } from "@/components/simulator/usePricingLogic";
import { AddressAutocomplete } from "@/components/booking/AddressAutocomplete";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TimeSavingsVisualizer, { TimeSavingsBreakdown } from "@/components/simulator/TimeSavingsVisualizer";
import CountUp from "@/components/ui/CountUp";
import { SiteConfig } from "@/lib/googleSheets";

interface SimulatorFormProps {
    promoConfig: SiteConfig | null;
}

const formatPrice = (price: number) => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
};

// New visual component for cleaner prices
const PriceDisplay = ({ amount, className = "", currencyClassName = "", large = false }: { amount: number, className?: string, currencyClassName?: string, large?: boolean }) => {
    // If integer, just show integer
    if (amount % 1 === 0) {
        return (
            <span className={cn("inline-flex items-baseline", className)}>
                {amount}
                <span className={cn("ml-0.5", currencyClassName)}>€</span>
            </span>
        );
    }

    // Split for styling
    const formatted = amount.toFixed(2);
    const [int, dec] = formatted.split('.');

    return (
        <span className={cn("inline-flex items-baseline", className)}>
            {int}
            <span className={cn("font-bold opacity-80 select-none", large ? "text-[0.5em] -translate-y-4" : "text-[0.65em] -translate-y-1")}>,{dec}</span>
            <span className={cn("ml-0.5", currencyClassName)}>€</span>
        </span>
    );
};

export function SimulatorForm({ promoConfig }: SimulatorFormProps) {
    const [step, setStep] = useState(0);
    const [tierId, setTierId] = useState("six");
    const [people, setPeople] = useState(4);
    // Check if promo is active (date check)
    const isPromoActive = useMemo(() => {
        if (!promoConfig || !promoConfig.promoActive) return false;
        if (!promoConfig.promoExpiry) return true;
        const expiry = new Date(promoConfig.promoExpiry);
        return expiry > new Date();
    }, [promoConfig]);

    const [isSubscribed, setIsSubscribed] = useState(!isPromoActive);

    const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEligible, setIsEligible] = useState(true);
    const [addressDetails, setAddressDetails] = useState<{ address: string; distance: number | null; coords: [number, number] } | null>(null);
    const [hasSweetAddon, setHasSweetAddon] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });

    const searchParams = useSearchParams();

    const activeDiscount = isPromoActive ? (promoConfig?.promoDiscount || 0) : 0;

    const calculation = usePricingCalculation(tierId, people, isSubscribed, frequency, activeDiscount);
    const groceryUnit = getGroceryUnitCost(people);

    // Scroll to top when step changes
    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const nextStep = () => setStep((s: number) => Math.min(s + 1, 3));
    const prevStep = () => setStep((s: number) => Math.max(s - 1, 0));

    const currentTier = Object.values(PRICING_CONFIG.TIERS).find(t => t.id === tierId) || PRICING_CONFIG.TIERS.SIX;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const frequencyMap: Record<string, string> = {
                weekly: "Hebdomadaire",
                biweekly: "Bi-mensuel",
                monthly: "Mensuel"
            };
            const frequencyLabel = isSubscribed ? frequencyMap[frequency] : "Une seule fois";
            const engagementLabel = isSubscribed ? "Abonnement ( -15% )" : "Commande Ponctuelle";

            const payload = {
                type: 'simulator_lead',
                client_name: formData.name,
                client_email: formData.email,
                client_phone: formData.phone,
                client_address: addressDetails?.address || "",
                service_distance: addressDetails?.distance,
                meals_count: currentTier.meals,
                people_count: people,
                is_subscribed: isSubscribed,
                frequency_label: frequencyLabel,
                engagement_type: engagementLabel,
                has_sweet_addon: hasSweetAddon ? "Oui" : "Non",
                total_price: `${formatPrice(calculation.finalPocketCost)}€`,
                billed_total: `${formatPrice(calculation.amountToPayElisa)}€`,
                grocery_min: `${formatPrice(calculation.groceryRange.min)}€`,
                grocery_max: `${formatPrice(calculation.groceryRange.max)}€`,
                custom_message: formData.message,
                promo_applied: isPromoActive ? `${promoConfig?.promoLabel} (-${activeDiscount}%)` : "Aucune"
            };

            const isTestMode = searchParams.get('mode') === 'test' || searchParams.get('debug') === 'true';
            const productionUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n-production-ced7.up.railway.app/webhook/lead-submit';
            const testUrl = 'https://n8n-production-ced7.up.railway.app/webhook-test/lead-submit';
            const webhookUrl = isTestMode ? testUrl : productionUrl;

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsModalOpen(false);
                alert("Merci ! Votre demande de devis a été envoyée avec succès.");
                setFormData({ name: "", email: "", phone: "", message: "" });
                setAddressDetails(null);
                setIsEligible(true);
                setHasSweetAddon(false);
            } else {
                alert("Une erreur est survenue lors de l'envoi de votre demande.");
            }
        } catch (error) {
            alert("Une erreur est survenue. Veuillez réessayer plus tard.");
        }
    };

    return (
        <main className="min-h-screen bg-stone-50 py-8 md:py-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-rose/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-gold/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-6xl">
                {/* 1. Header */}
                <header className="text-center mb-6 md:mb-10">
                    {isPromoActive && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8"
                        >
                            <div className="inline-flex items-center gap-4 bg-stone-900 text-white rounded-3xl p-1 pr-6 shadow-2xl border border-white/10 group overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-rose/20 to-brand-gold/20 animate-pulse" />
                                <div className="bg-brand-rose text-white px-4 py-2 rounded-[1.2rem] text-sm font-black uppercase tracking-widest relative z-10">
                                    {promoConfig?.promoLabel || 'OFFRE SPÉCIALE'}
                                </div>
                                <div className="flex flex-col items-start relative z-10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-rose">Remise immédiate</span>
                                    <span className="text-sm font-bold"> -{activeDiscount}% appliqué sur votre simulation</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}

                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 bg-brand-rose/10 text-brand-rose text-[10px] font-bold uppercase tracking-widest rounded-full mb-3"
                    >
                        {step < 3 ? `Étape ${step + 1} sur 3` : "C'est prêt !"}
                    </motion.div>
                    <AnimatePresence mode="wait">
                        {step < 3 && (
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <h1 className="text-2xl md:text-4xl font-extrabold text-stone-900 mb-2 tracking-tight">
                                    {step === 0 && "Volume de Recettes"}
                                    {step === 1 && "Nombre de Convives"}
                                    {step === 2 && "Votre Engagement"}
                                </h1>
                                <p className="text-stone-500 text-base md:text-lg max-w-xl mx-auto">
                                    {step === 0 && "Sélectionnez le nombre de plats que je préparerai pour vous chaque semaine."}
                                    {step === 1 && "Adaptez les quantités selon la taille de votre foyer."}
                                    {step === 2 && "Optez pour la régularité et profitez d'avantages exclusifs."}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
                    {/* Left Column: Form Steps (7/12) */}
                    {step < 3 && (
                        <div className="lg:col-span-7">
                            <div className="relative">
                                <AnimatePresence mode="wait">
                                    {step === 0 && (
                                        <motion.section
                                            key="step0"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
                                                {Object.values(PRICING_CONFIG.TIERS).map((tier) => {
                                                    const isSelected = tierId === tier.id;
                                                    return (
                                                        <div key={tier.id} className="flex">
                                                            <motion.button
                                                                whileHover={{ scale: 1.02, y: -4 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => setTierId(tier.id)}
                                                                className={cn(
                                                                    "group relative flex-1 flex flex-col items-center p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-500 shadow-sm",
                                                                    isSelected
                                                                        ? "bg-rose-50 border-brand-rose shadow-xl shadow-brand-rose/5 opacity-100 z-10"
                                                                        : "bg-white border-stone-100 opacity-80 hover:opacity-100 hover:border-stone-200"
                                                                )}
                                                            >
                                                                {tier.isRecommended && (
                                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                                                        <Badge className="bg-brand-gold text-stone-900 border-none px-3 py-0.5 shadow-lg whitespace-nowrap text-[9px] font-bold ring-2 ring-stone-50">
                                                                            <Flame className="h-3 w-3 mr-1 fill-current" />
                                                                            LE MEILLEUR CHOIX
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                                <div className={cn(
                                                                    "absolute top-4 right-4 h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                                                    isSelected ? "bg-brand-rose border-brand-rose text-white shadow-md" : "bg-transparent border-stone-100 text-transparent"
                                                                )}>
                                                                    <Check className="h-2.5 w-2.5 stroke-[3px]" />
                                                                </div>
                                                                <div className="flex flex-col items-center text-center">
                                                                    <span className={cn(
                                                                        "text-5xl md:text-6xl font-black block leading-none mb-1 duration-500",
                                                                        isSelected ? "text-brand-rose" : "text-stone-200"
                                                                    )}>
                                                                        {tier.meals}
                                                                    </span>
                                                                    <span className="text-sm font-bold text-stone-900 leading-tight">
                                                                        Recettes <br /> / semaine
                                                                    </span>
                                                                </div>
                                                            </motion.button>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Sweet Add-on Option */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="flex justify-center"
                                            >
                                                <button
                                                    onClick={() => setHasSweetAddon(!hasSweetAddon)}
                                                    className={cn(
                                                        "group flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all duration-300",
                                                        hasSweetAddon
                                                            ? "bg-brand-gold/10 border-brand-gold shadow-md"
                                                            : "bg-white border-stone-100 hover:border-stone-200"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all",
                                                        hasSweetAddon ? "bg-brand-gold border-brand-gold text-stone-900" : "bg-transparent border-stone-200 text-transparent"
                                                    )}>
                                                        <Check className="h-4 w-4 stroke-[3px]" />
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                                            hasSweetAddon ? "bg-brand-gold/20 text-brand-gold" : "bg-stone-50 text-stone-400 group-hover:bg-stone-100"
                                                        )}>
                                                            <Cookie className="h-5 w-5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold text-stone-900">Complément sucré (optionnel)</p>
                                                            <p className="text-[10px] text-stone-500 font-medium leading-tight">
                                                                Pâtisseries artisanales premium signées <span className="text-brand-rose font-bold">Butter Mood</span>.<br />
                                                                <span className="text-emerald-500 font-bold italic">Elisa en discutera avec vous (non inclus dans ce devis).</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            </motion.div>

                                            <div className="flex justify-center -mt-2">
                                                <Link
                                                    href="/menu"
                                                    target="_blank"
                                                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 border border-stone-100 text-xs md:text-sm text-stone-500 font-medium hover:bg-white hover:border-brand-rose/20 hover:text-brand-rose hover:shadow-md transition-all"
                                                >
                                                    <span className="bg-white p-1 rounded-full shadow-sm group-hover:scale-110 transition-transform">📖</span>
                                                    <span>Voir un exemple de menu et nos douceurs</span>
                                                    <ArrowRight className="h-3 w-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                                </Link>
                                            </div>

                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={nextStep}
                                                    className="rounded-full px-8 py-4 h-auto text-base bg-brand-gold hover:bg-brand-gold/90 text-stone-900 font-bold shadow-lg shadow-brand-gold/20 group border-none"
                                                >
                                                    Continuer <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </motion.section>
                                    )}

                                    {step === 1 && (
                                        <motion.section
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="max-w-xl mx-auto space-y-6"
                                        >
                                            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-stone-100 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-full -mr-12 -mt-12 -z-10 group-hover:bg-brand-rose/5" />
                                                <div className="mb-6 text-center text-xl md:text-2xl font-bold text-stone-900 flex flex-col items-center gap-1">
                                                    Pour <span className="text-6xl md:text-7xl text-brand-rose font-black leading-none">{people}</span> convives
                                                </div>
                                                <div className="px-4 mb-8">
                                                    <Slider value={[people]} onValueChange={(val) => setPeople(val[0])} max={6} min={1} step={1} className="[&_[role=slider]]:h-8 [&_[role=slider]]:w-8 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:bg-brand-rose [&_[role=slider]]:shadow-xl" />
                                                    <div className="flex justify-between mt-4 text-[10px] font-black uppercase tracking-widest text-stone-300">
                                                        <span>Solo</span><span>6 personnes</span>
                                                    </div>
                                                </div>
                                                <div className="min-h-[50px] flex justify-center items-center">
                                                    <AnimatePresence mode="wait">
                                                        {people === 1 && (
                                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                                <Badge className="bg-brand-gold/10 text-stone-700 border-brand-gold/20 px-4 py-2 rounded-xl text-[11px] font-medium flex items-center gap-2 shadow-sm mx-auto"><Lightbulb className="h-4 w-4 text-brand-gold" /> Astuce : Passez à 2 personnes pour réduire le coût des ingrédients de ~25%.</Badge>
                                                            </motion.div>
                                                        )}
                                                        {people >= 4 && (
                                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-2 rounded-xl text-[11px] font-medium flex items-center gap-2 shadow-sm mx-auto"><Check className="h-4 w-4 text-emerald-500" /> Tarif Ingrédients Optimisé (Achat Vrac).</Badge>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <Button variant="ghost" onClick={prevStep} className="rounded-full px-6 py-6 h-auto text-base text-stone-400 hover:text-stone-900 border-none"><ArrowLeft className="mr-2 h-5 w-5" /> Retour</Button>
                                                <Button
                                                    onClick={nextStep}
                                                    className="rounded-full px-8 py-4 h-auto text-base bg-brand-gold hover:bg-brand-gold/90 text-stone-900 font-bold shadow-lg shadow-brand-gold/20 group border-none"
                                                >
                                                    Continuer <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </motion.section>
                                    )}

                                    {step === 2 && (
                                        <motion.section
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="max-w-xl mx-auto space-y-6"
                                        >
                                            <div className={cn("p-6 md:p-10 rounded-[2.5rem] shadow-xl border transition-all duration-500 relative overflow-hidden", isSubscribed ? "bg-emerald-50/50 border-emerald-200 shadow-emerald-900/5" : "bg-white border-stone-100")}>
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                                                <div className="bg-stone-100/80 p-1.5 md:p-2 rounded-full flex relative mb-8 shadow-inner border border-stone-200/50">
                                                    <motion.div className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] md:w-[calc(50%-8px)] rounded-full shadow-lg z-0" animate={{ x: isSubscribed ? "100%" : "0%", backgroundColor: isSubscribed ? "#10b981" : (isPromoActive ? "#fb7185" : "#FFFFFF") }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                                                    <button onClick={() => setIsSubscribed(false)} className={cn("flex-1 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full relative z-10 transition-colors duration-300", !isSubscribed ? (isPromoActive ? "text-white" : "text-stone-900") : "text-stone-400")}>
                                                        Unique
                                                        {isPromoActive && <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-[8px] font-black shadow-sm", !isSubscribed ? "bg-white text-brand-rose" : "bg-brand-rose text-white")}>-{activeDiscount}%</span>}
                                                    </button>
                                                    <button onClick={() => setIsSubscribed(true)} className={cn("flex-1 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full relative z-10 flex items-center justify-center gap-1.5 md:gap-2 transition-colors duration-300", isSubscribed ? "text-white" : "text-stone-400")}>Abonnement <span className={cn("bg-brand-rose text-white px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-black shadow-md", isSubscribed ? "bg-stone-900" : "")}>-15%</span></button>
                                                </div>

                                                <div className="space-y-4 relative z-10 text-stone-900">
                                                    <h4 className="text-lg md:text-xl font-bold mb-1">{isSubscribed ? "L'Option Sérénité" : "Une prestation ponctuelle"}</h4>
                                                    <p className="text-stone-500 text-sm md:text-base leading-relaxed">{isSubscribed ? <><span className="font-bold text-stone-700">Engagement 3 mois minimum.</span> Bénéficiez d'un tarif préférentiel pour vos repas réguliers.</> : "Idéale pour un besoin spécifique ou pour tester. Une expérience culinaire d'exception, sans engagement."}</p>

                                                    {isSubscribed && (
                                                        <div className="pt-6 border-t border-emerald-100/50 space-y-4">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Fréquence des visites</p>
                                                            <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                                                                {[
                                                                    { id: 'weekly', label: 'Hebdo' },
                                                                    { id: 'biweekly', label: 'Bimensuel' },
                                                                    { id: 'monthly', label: 'Mensuel' }
                                                                ].map((freq) => (
                                                                    <button
                                                                        key={freq.id}
                                                                        onClick={() => setFrequency(freq.id as any)}
                                                                        className={cn(
                                                                            "py-3 px-1 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                                                                            frequency === freq.id
                                                                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                                                                : "bg-white text-stone-400 border border-stone-100 hover:border-emerald-200"
                                                                        )}
                                                                    >
                                                                        {freq.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 bg-white/80 p-4 rounded-[1.5rem] border border-emerald-100 shadow-sm">
                                                                <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200"><Check className="h-4 w-4 text-white" /></div>
                                                                <p className="font-bold text-emerald-900 text-xs">Réduction de 15% appliquée automatiquement.</p>
                                                            </motion.div>
                                                        </div>
                                                    )}

                                                    {!isSubscribed && isPromoActive && (
                                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="pt-6 border-t border-brand-rose/10 space-y-4">
                                                            <motion.div className="flex items-center gap-3 bg-brand-rose/5 p-4 rounded-[1.5rem] border border-brand-rose/10 shadow-sm">
                                                                <div className="h-8 w-8 rounded-lg bg-brand-rose flex items-center justify-center shadow-lg shadow-brand-rose/20"><Flame className="h-4 w-4 text-white" /></div>
                                                                <p className="font-bold text-brand-rose text-xs">Offre exceptionnelle : {activeDiscount}% de réduction immédiate !</p>
                                                            </motion.div>
                                                        </motion.div>
                                                    )}

                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <Button variant="ghost" onClick={prevStep} className="rounded-full px-6 py-6 h-auto text-base text-stone-400 hover:text-stone-900 border-none"><ArrowLeft className="mr-2 h-5 w-5" /> Retour</Button>
                                                <Button
                                                    onClick={nextStep}
                                                    className="rounded-full px-8 py-4 h-auto text-base bg-brand-gold hover:bg-brand-gold/90 text-stone-900 font-bold shadow-lg shadow-brand-gold/20 group border-none"
                                                >
                                                    Voir mon estimation <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </motion.section>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Right Column: Live Summary (Steps 0-2) */}
                    {step < 3 && (
                        <div className="lg:col-span-5 lg:sticky lg:top-8">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                {/* Time Saved Highlight - PROMINENT and EXCITING during selection */}
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-gradient-to-br from-brand-rose/20 via-white to-brand-gold/20 p-6 rounded-[2.5rem] text-stone-900 relative overflow-hidden shadow-xl border-2 border-white"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-rose/10 blur-[60px] rounded-full -mr-16 -mt-16 animate-pulse" />
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-brand-rose font-black text-[10px] md:text-xs uppercase tracking-[0.2em] leading-tight mb-1">Votre Temps de Vie Sauvé</p>
                                            <p className="text-[9px] text-stone-400 font-medium leading-tight mb-2 italic">Ce n'est pas mon temps de travail, c'est <span className="font-bold text-brand-rose">votre temps libre.</span></p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-rose to-brand-gold tracking-tighter leading-none">
                                                    <CountUp
                                                        to={parseFloat(calculation.tier.savings.total.split(' ')[0])}
                                                        duration={1.5}
                                                        separator=","
                                                        className="tabular-nums"
                                                    />
                                                </span>
                                                <span className="text-lg font-black text-stone-300 uppercase">Heures</span>
                                            </div>
                                        </div>
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-brand-rose/10 flex items-center justify-center shadow-xl">
                                            <Clock className="h-8 w-8 text-brand-rose animate-bounce" />
                                        </div>
                                    </div>

                                    {/* Real-time Category Breakdown - Sorted by Dynamic Impact */}
                                    <div className="mt-6 pt-6 border-t border-brand-rose/10 space-y-4">
                                        {/* 1. Cuisine & Vaisselle (Most Dynamic) */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-white shadow-sm hover:shadow-md transition-all duration-300 group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-brand-rose/10 group-hover:text-brand-rose transition-all duration-300">
                                                    <Utensils className="h-4 w-4" />
                                                </div>
                                                <p className="font-bold text-stone-700 uppercase tracking-widest leading-none text-[10px]">
                                                    Cuisine & Vaisselle <span className="text-stone-400 text-[9px] lowercase italic normal-case block mt-0.5">(pour {calculation.tier.meals} recettes)</span>
                                                </p>
                                            </div>
                                            <div className="font-black text-sm tabular-nums leading-none">
                                                {Math.floor(calculation.tier.savings.cookingCleaning / 60) > 0 && <><CountUp to={Math.floor(calculation.tier.savings.cookingCleaning / 60)} duration={1} />h</>}
                                                {(calculation.tier.savings.cookingCleaning % 60) > 0 && <><CountUp to={calculation.tier.savings.cookingCleaning % 60} duration={1} />min</>}
                                            </div>
                                        </div>

                                        {/* 2. Recherche & Menus */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-white shadow-sm hover:shadow-md transition-all duration-300 group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-brand-rose/10 group-hover:text-brand-rose transition-all duration-300">
                                                    <Search className="h-4 w-4" />
                                                </div>
                                                <p className="font-bold text-stone-700 uppercase tracking-widest leading-none text-[10px]">Recherche & Menus</p>
                                            </div>
                                            <div className="font-black text-sm tabular-nums leading-none">
                                                {Math.floor(calculation.tier.savings.planning / 60) > 0 && <><CountUp to={Math.floor(calculation.tier.savings.planning / 60)} duration={1} />h</>}
                                                {(calculation.tier.savings.planning % 60) > 0 && <><CountUp to={calculation.tier.savings.planning % 60} duration={1} />min</>}
                                            </div>
                                        </div>

                                        {/* 3. Liste de courses */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-white shadow-sm hover:shadow-md transition-all duration-300 group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-brand-rose/10 group-hover:text-brand-rose transition-all duration-300">
                                                    <ListTodo className="h-4 w-4" />
                                                </div>
                                                <p className="font-bold text-stone-700 uppercase tracking-widest leading-none text-[10px]">Liste de courses</p>
                                            </div>
                                            <div className="font-black text-sm tabular-nums leading-none">
                                                {Math.floor(calculation.tier.savings.shoppingList / 60) > 0 && <><CountUp to={Math.floor(calculation.tier.savings.shoppingList / 60)} duration={1} />h</>}
                                                {(calculation.tier.savings.shoppingList % 60) > 0 && <><CountUp to={calculation.tier.savings.shoppingList % 60} duration={1} />min</>}
                                            </div>
                                        </div>

                                        {/* 4. Courses & Trajet */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-white shadow-sm hover:shadow-md transition-all duration-300 group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-brand-rose/10 group-hover:text-brand-rose transition-all duration-300">
                                                    <Car className="h-4 w-4" />
                                                </div>
                                                <p className="font-bold text-stone-700 uppercase tracking-widest leading-none text-[10px]">Courses & Trajet</p>
                                            </div>
                                            <div className="font-black text-sm tabular-nums leading-none">
                                                {Math.floor(calculation.tier.savings.groceryRun / 60) > 0 && <><CountUp to={Math.floor(calculation.tier.savings.groceryRun / 60)} duration={1} />h</>}
                                                {(calculation.tier.savings.groceryRun % 60) > 0 && <><CountUp to={calculation.tier.savings.groceryRun % 60} duration={1} />min</>}
                                            </div>
                                        </div>

                                        {/* 5. Rangement */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-white shadow-sm hover:shadow-md transition-all duration-300 group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-brand-rose/10 group-hover:text-brand-rose transition-all duration-300">
                                                    <PackageOpen className="h-4 w-4" />
                                                </div>
                                                <p className="font-bold text-stone-700 uppercase tracking-widest leading-none text-[10px]">Rangement Courses</p>
                                            </div>
                                            <div className="font-black text-sm tabular-nums leading-none">
                                                {Math.floor(calculation.tier.savings.packing / 60) > 0 && <><CountUp to={Math.floor(calculation.tier.savings.packing / 60)} duration={1} />h</>}
                                                {(calculation.tier.savings.packing % 60) > 0 && <><CountUp to={calculation.tier.savings.packing % 60} duration={1} />min</>}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden">
                                    <div className="p-8 space-y-8">
                                        <div className="space-y-6">
                                            {/* 1. Original Price at Top */}
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-sm text-stone-400">Prix de la prestation</span>
                                                <span className="text-base font-bold text-stone-400 line-through decoration-stone-200 flex items-center">
                                                    <PriceDisplay amount={calculation.originalServicePrice} />
                                                </span>
                                            </div>

                                            {/* 2. Applicable Discounts */}
                                            {isSubscribed && calculation.serviceDiscount > 0 && (
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-sm text-emerald-500 font-medium italic">Avantage Abonnement (-15%)</span>
                                                    <span className="text-base font-bold text-emerald-500 flex items-center">-<PriceDisplay amount={calculation.serviceDiscount} /></span>
                                                </div>
                                            )}
                                            {!isSubscribed && calculation.flashSaleAmount > 0 && (
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-sm text-brand-rose font-medium italic">Offre exceptionnelle : {activeDiscount}% de réduction !</span>
                                                    <span className="text-base font-bold text-brand-rose flex items-center">-<PriceDisplay amount={calculation.flashSaleAmount} /></span>
                                                </div>
                                            )}

                                            {/* 3. À payer à Elisa */}
                                            <div className="flex justify-between items-center px-1 pt-4 border-t border-stone-50">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-stone-900 leading-none">À payer à Elisa</span>
                                                    <span className="text-9px text-stone-400 mt-1 uppercase tracking-widest font-bold">Lors de la prestation</span>
                                                </div>
                                                <span className="text-2xl font-black text-stone-900 flex items-center"><PriceDisplay amount={calculation.amountToPayElisa} /></span>
                                            </div>

                                            {/* 4. Tax Credit Deduction */}
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-sm text-emerald-500 font-medium italic">Économie fiscale (-50%)</span>
                                                <span className="text-base font-bold text-emerald-500 flex items-center">-<PriceDisplay amount={calculation.taxCredit} /></span>
                                            </div>

                                            {/* 5. BIG PINK TOTAL - Final Real Cost */}
                                            <div className="pt-6 border-t-2 border-dashed border-stone-100 text-center space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Votre coût réel de revient</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-7xl font-black text-brand-rose tracking-tighter leading-none flex items-center"><PriceDisplay amount={calculation.finalPocketCost} large={true} /></span>
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 italic">/ Visite de Chef</p>
                                            </div>

                                            {/* 6. Budget Ingredients - Separated below */}
                                            <div className="pt-6 border-t border-stone-50">
                                                <div className="flex justify-between items-center bg-stone-50/80 p-4 rounded-xl">
                                                    <span className="text-xs font-bold text-stone-900 uppercase tracking-widest">Budget Ingrédients</span>
                                                    <span className="text-sm text-stone-400 font-bold italic flex items-center gap-1">~<PriceDisplay amount={calculation.groceryRange.min} /> - <PriceDisplay amount={calculation.groceryRange.max} /></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-brand-rose/5 border border-brand-rose/10">
                                            <p className="text-[10px] leading-relaxed text-brand-rose/80 italic text-center font-medium">
                                                "Le crédit d'impôt de 50% vous sera restitué par l'administration fiscale lors de votre déclaration annuelle (en attendant l'activation de l'avance immédiate). Le montant 'À payer à Elisa' correspond à votre règlement lors de la prestation."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Step 3: Full Width Final Summary */}
                    {step === 3 && (
                        <div className="col-span-full">
                            <motion.section
                                key="step3"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-12 pb-12"
                            >
                                <div className="text-center space-y-4">
                                    <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-900/5">
                                        <Check className="h-8 w-8 stroke-[3px]" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight leading-none">C'est le moment de savourer.</h2>
                                        <p className="text-stone-500 text-sm md:text-base max-w-lg mx-auto">Votre Chef est prêt, votre cuisine n'attend plus que sa magie.</p>
                                    </div>
                                </div>

                                {/* Time Savings Visualizer - FULL WIDTH AT TOP */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-full"
                                >
                                    <TimeSavingsVisualizer savings={calculation.tier.savings} meals={calculation.tier.meals} />
                                </motion.div>

                                {/* Cost Summary - BELOW TIME */}
                                <div className="max-w-md mx-auto w-full">
                                    <div className="bg-white rounded-[3rem] shadow-xl border border-stone-100 overflow-hidden">
                                        <div className="p-10 md:p-12 space-y-10">
                                            <div className="space-y-8">
                                                {/* 1. Original Price at Top */}
                                                <div className="flex justify-between items-center px-2">
                                                    <span className="text-stone-400 text-lg font-medium">Prix de la prestation</span>
                                                    <span className="text-2xl font-bold text-stone-300 line-through decoration-stone-200 flex items-center">
                                                        <PriceDisplay amount={calculation.originalServicePrice} />
                                                    </span>
                                                </div>

                                                {/* 2. Applicable Discounts */}
                                                {isSubscribed && calculation.serviceDiscount > 0 && (
                                                    <div className="flex justify-between items-center px-2">
                                                        <span className="text-emerald-500 font-bold text-xl italic">Avantage Abonnement (-15%)</span>
                                                        <span className="text-2xl font-black text-emerald-500 flex items-center">-<PriceDisplay amount={calculation.serviceDiscount} /></span>
                                                    </div>
                                                )}
                                                {!isSubscribed && calculation.flashSaleAmount > 0 && (
                                                    <div className="flex justify-between items-center px-2">
                                                        <span className="text-brand-rose font-bold text-xl italic leading-tight">Offre exceptionnelle :<br />{activeDiscount}% de réduction !</span>
                                                        <span className="text-base font-bold text-brand-rose flex items-center">-<PriceDisplay amount={calculation.flashSaleAmount} /></span>
                                                    </div>
                                                )}

                                                {/* 3. À payer à Elisa */}
                                                <div className="flex justify-between items-center px-2 pt-8 border-t border-stone-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-xl font-black text-stone-900 leading-none">À payer à Elisa</span>
                                                        <span className="text-xs text-stone-400 mt-2 uppercase tracking-widest font-bold">Lors de la prestation</span>
                                                    </div>
                                                    <span className="text-4xl font-black text-stone-900 flex items-center"><PriceDisplay amount={calculation.amountToPayElisa} /></span>
                                                </div>

                                                {/* 4. Tax Credit Deduction */}
                                                <div className="flex justify-between items-center px-2">
                                                    <span className="text-emerald-500 font-bold text-xl italic">Économie fiscale (-50%)</span>
                                                    <span className="text-2xl font-black text-emerald-500 flex items-center">-<PriceDisplay amount={calculation.taxCredit} /></span>
                                                </div>

                                                {/* 5. BIG PINK TOTAL - Final Real Cost */}
                                                <div className="pt-10 border-t-2 border-dashed border-stone-100 text-center space-y-4">
                                                    <p className="text-sm font-black uppercase tracking-[0.4em] text-stone-400">Votre coût réel de revient</p>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <span className="text-8xl md:text-9xl font-black text-brand-rose tracking-tighter leading-none flex items-center"><PriceDisplay amount={calculation.finalPocketCost} large={true} /></span>
                                                    </div>
                                                    <p className="text-base font-black uppercase tracking-[0.3em] text-stone-400 italic">/ Visite de Chef</p>
                                                </div>

                                                {/* 6. Budget Ingredients - Separated below */}
                                                <div className="pt-10 border-t border-stone-100">
                                                    <div className="flex justify-between items-center bg-stone-50 p-6 rounded-[2rem] border border-stone-100">
                                                        <span className="text-xl font-black text-stone-900 uppercase tracking-widest">Budget Ingrédients</span>
                                                        <span className="text-xl text-stone-400 font-bold italic flex items-center gap-1">~<PriceDisplay amount={calculation.groceryRange.min} /> - <PriceDisplay amount={calculation.groceryRange.max} /></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-[2rem] bg-brand-rose/5 border border-brand-rose/10 shadow-sm shadow-brand-rose/5">
                                                <p className="text-xs leading-relaxed text-brand-rose/70 italic text-center font-medium max-w-[280px] mx-auto">
                                                    "Le crédit d'impôt de 50% vous sera restitué par l'administration fiscale lors de votre déclaration annuelle (en attendant l'activation de l'avance immédiate). Le montant 'À payer à Elisa' correspond à votre règlement lors de la prestation."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-6 pt-8">
                                    <Button
                                        onClick={() => setIsModalOpen(true)}
                                        size="lg"
                                        className="rounded-full px-12 py-7 h-auto text-xl bg-brand-rose hover:bg-brand-rose/90 text-white shadow-3xl shadow-brand-rose/30 group border-none transition-transform active:scale-95"
                                    >
                                        Vérifier les disponibilités
                                        <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep(0)}
                                        className="rounded-full text-stone-400 hover:text-stone-900 text-sm font-bold uppercase tracking-widest"
                                    >
                                        Modifier mes choix
                                    </Button>
                                </div>
                            </motion.section>
                        </div>
                    )}
                </div>

                {/* Mobile Sticky Price Bar (Steps 0-2) */}
                {step < 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md border-t border-stone-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
                    >
                        <div className="container max-w-lg mx-auto flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Votre Coût Réel</span>
                                <div className="flex items-baseline gap-1">
                                    {isPromoActive && (
                                        <span className="text-sm font-bold text-stone-200 line-through decoration-brand-rose/40 mr-1 flex items-center">
                                            <PriceDisplay amount={calculation.finalPocketCost + (calculation.flashSaleAmount / 2)} />
                                        </span>
                                    )}
                                    <span className="text-3xl font-black text-brand-rose leading-none flex items-center"><PriceDisplay amount={calculation.finalPocketCost} /></span>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">/ sem.</span>
                                </div>
                            </div>

                            <Button
                                onClick={nextStep}
                                className="rounded-full px-6 py-4 h-auto bg-brand-gold text-stone-900 text-sm font-bold shadow-lg"
                            >
                                {step === 2 ? "Voir mon devis" : "Continuer"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Booking Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] overflow-y-auto bg-white">
                    <div className="p-8 md:p-10 pb-4 relative">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-rose/10 rounded-full blur-3xl -mr-20 -mt-20 -z-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl -ml-16 -mb-16 -z-10" />

                        <DialogHeader className="text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-emerald-100 w-fit">
                                <Check className="h-3 w-3" /> Presque fini !
                            </div>
                            <DialogTitle className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight leading-tight mb-4">
                                Recevez votre <span className="text-brand-rose">devis personnalisé</span>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="bg-stone-50 border border-stone-100 rounded-[2rem] p-6 shadow-sm mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[11px] font-black uppercase tracking-widest text-stone-400">Votre Configuration</p>
                                <Badge className="bg-brand-rose text-white border-none text-[9px] font-black uppercase tracking-widest px-2.5 py-1 shadow-md shadow-brand-rose/10">
                                    {!isSubscribed ? "Engagement Unique" : frequency === 'weekly' ? "Hebdomadaire" : frequency === 'biweekly' ? "Bi-mensuel" : "Mensuel"}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-brand-rose shadow-sm">
                                    <Utensils className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-xl font-black text-stone-900 block leading-none">
                                        {currentTier.meals} Recettes <span className="text-stone-300 font-light mx-1">•</span> {people} Personnes
                                    </span>
                                    <p className="text-[11px] text-stone-500 font-medium">Préparé par Chef Elisa chez vous.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleFormSubmit} className="px-8 md:px-10 pb-10 space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-2 px-1">
                                <Label className="text-[11px] font-black uppercase text-stone-500 ml-1">Adresse de livraison</Label>
                                <AddressAutocomplete
                                    onEligibilityChange={(eligible, data) => {
                                        setIsEligible(eligible);
                                        if (data) setAddressDetails(data);
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[11px] font-black uppercase text-stone-500 ml-1">Nom Complet</Label>
                                    <Input
                                        id="name"
                                        required
                                        placeholder="Ex: Jean Dupont"
                                        className="rounded-xl border-stone-100 bg-stone-100/50 h-12 focus:ring-brand-rose text-stone-900 placeholder:text-stone-400"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[11px] font-black uppercase text-stone-500 ml-1">Téléphone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        required
                                        placeholder="06 12 34 56 78"
                                        className="rounded-xl border-stone-100 bg-stone-100/50 h-12 focus:ring-brand-rose text-stone-900 placeholder:text-stone-400"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[11px] font-black uppercase text-stone-500 ml-1">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="votre@email.com"
                                className="rounded-xl border-stone-100 bg-stone-100/50 h-12 focus:ring-brand-rose text-stone-900 placeholder:text-stone-400"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <AnimatePresence>
                            {!isEligible && addressDetails && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    <Label htmlFor="message" className="text-[11px] font-black uppercase text-stone-500 ml-1">Un petit mot pour Elisa ?</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Dites-moi en plus sur votre projet pour voir si un déplacement exceptionnel est possible..."
                                        className="rounded-xl border-stone-100 bg-stone-100/50 min-h-[100px] focus:ring-brand-rose text-stone-900 placeholder:text-stone-400"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={!addressDetails}
                                className={cn(
                                    "w-full rounded-full py-8 h-auto text-xl shadow-2xl transition-all group relative overflow-hidden",
                                    addressDetails
                                        ? "bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/20"
                                        : "bg-stone-100 text-stone-300 cursor-not-allowed border-none"
                                )}
                            >
                                <motion.div
                                    className="absolute inset-0 bg-brand-rose/10"
                                    initial={{ x: "-100%" }}
                                    whileHover={{ x: "0%" }}
                                    transition={{ type: "tween" }}
                                />
                                <span className="relative z-10 flex items-center justify-center">
                                    {addressDetails ? "Recevoir mon devis gratuit" : "Veuillez saisir votre adresse"}
                                    {addressDetails && <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />}
                                </span>
                            </Button>
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-center text-[10px] text-stone-400 font-medium">
                                    Réponse garantie sous 24h • Sans engagement
                                </p>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Lightbulb, ArrowRight, ArrowLeft, Receipt, Wallet, ShoppingBag, Utensils, MapPin } from "lucide-react";
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function SimulatorPage() {
    const [step, setStep] = useState(0);
    const [tierId, setTierId] = useState("family");
    const [people, setPeople] = useState(4);
    const [isSubscribed, setIsSubscribed] = useState(true);
    const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEligible, setIsEligible] = useState(true);
    const [addressDetails, setAddressDetails] = useState<{ address: string; distance: number | null; coords: [number, number] } | null>(null);



    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });

    const calculation = usePricingCalculation(tierId, people, isSubscribed, frequency);
    const groceryUnit = getGroceryUnitCost(people);

    const nextStep = () => setStep((s: number) => Math.min(s + 1, 3));
    const prevStep = () => setStep((s: number) => Math.max(s - 1, 0));

    // Get current tier label for display
    const currentTier = Object.values(PRICING_CONFIG.TIERS).find(t => t.id === tierId) || PRICING_CONFIG.TIERS.FAMILY;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Formatting Helpers for n8n/Email template
            const frequencyMap: Record<string, string> = {
                weekly: "Hebdomadaire",
                biweekly: "Bi-mensuel",
                monthly: "Mensuel"
            };
            const frequencyLabel = isSubscribed ? frequencyMap[frequency] : "Une seule fois";

            const engagementLabel = isSubscribed
                ? "Abonnement ( -15% )"
                : "Commande Ponctuelle";

            const packLabel = currentTier.label;

            const payload = {
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
                total_price: calculation.finalPocketCost,
                billed_total: calculation.amountToPayElisa,
                grocery_min: calculation.groceryRange.min,
                grocery_max: calculation.groceryRange.max,
                address_status: isEligible ? "Inside Zone" : "Outside Zone",
                distance_km: addressDetails?.distance,
                custom_message: formData.message
            };

            // Send to n8n webhook
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/lead-submit';
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsModalOpen(false);
                alert("Merci ! Votre demande de devis a été envoyée avec succès.");
                // Reset form
                setFormData({ name: "", email: "", phone: "", message: "" });
                setAddressDetails(null);
                setIsEligible(true);
            } else {
                console.error("Webhook response not OK:", response.status, response.statusText);
                alert("Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer plus tard.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Une erreur est survenue. Veuillez réessayer plus tard.");
        }
    };

    return (
        <main className="min-h-screen bg-stone-50 py-8 md:py-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-rose/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-gold/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-5xl">
                {/* 1. Header */}
                <header className="text-center mb-6 md:mb-10">
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Form Steps (7/12) */}
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
                                        <div className="flex justify-end">
                                            <Button onClick={nextStep} size="lg" className="rounded-full px-8 py-6 h-auto text-lg bg-stone-900 hover:bg-stone-800 text-white shadow-xl group border-none">
                                                Continuer <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
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
                                                <Slider value={[people]} onValueChange={(val) => setPeople(val[0])} max={8} min={1} step={1} className="[&_[role=slider]]:h-8 [&_[role=slider]]:w-8 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:bg-brand-rose [&_[role=slider]]:shadow-xl" />
                                                <div className="flex justify-between mt-4 text-[10px] font-black uppercase tracking-widest text-stone-300">
                                                    <span>Solo</span><span>8 personnes</span>
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
                                            <Button onClick={nextStep} size="lg" className="rounded-full px-8 py-6 h-auto text-lg bg-stone-900 hover:bg-stone-800 text-white shadow-xl group border-none">Continuer <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Button>
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
                                                <motion.div className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] md:w-[calc(50%-8px)] rounded-full shadow-lg z-0" animate={{ x: isSubscribed ? "100%" : "0%", backgroundColor: isSubscribed ? "#10b981" : "#FFFFFF" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                                                <button onClick={() => setIsSubscribed(false)} className={cn("flex-1 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full relative z-10 transition-colors duration-300", !isSubscribed ? "text-stone-900" : "text-stone-400")}>Unique</button>
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
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <Button variant="ghost" onClick={prevStep} className="rounded-full px-6 py-6 h-auto text-base text-stone-400 hover:text-stone-900 border-none"><ArrowLeft className="mr-2 h-5 w-5" /> Retour</Button>
                                            <Button onClick={nextStep} size="lg" className="rounded-full px-8 py-6 h-auto text-lg bg-brand-rose hover:bg-brand-rose/90 text-white shadow-xl shadow-brand-rose/20 group border-none">Voir mon estimation <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Button>
                                        </div>
                                    </motion.section>
                                )}

                                {step === 3 && (
                                    <motion.section
                                        key="step3"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="max-w-4xl mx-auto space-y-8 pb-12"
                                    >
                                        <div className="text-center space-y-4">
                                            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-900/5">
                                                <Check className="h-8 w-8 stroke-[3px]" />
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">C'est le moment de savourer.</h2>
                                                <p className="text-stone-500 text-base md:text-lg max-w-lg mx-auto">Votre Chef est prêt, votre cuisine n'attend plus que sa magie.</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row justify-center gap-4">
                                            <Button
                                                onClick={() => setIsModalOpen(true)}
                                                size="lg"
                                                className="rounded-full px-10 py-8 h-auto text-xl bg-brand-rose hover:bg-brand-rose/90 text-white shadow-xl shadow-brand-rose/20 group border-none"
                                            >
                                                Vérifier les disponibilités
                                                <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setStep(0)}
                                                className="rounded-full px-10 py-8 h-auto text-lg text-stone-400 hover:text-stone-900"
                                            >
                                                Modifier mes choix
                                            </Button>
                                        </div>
                                    </motion.section>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Column: Live Summary (5/12) */}
                    <div className="lg:col-span-5 lg:sticky lg:top-8">
                        {step < 3 ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-900 shadow-sm">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-lg font-black text-stone-900 uppercase tracking-tighter italic">Estimation en temps réel</h3>
                                </div>

                                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
                                    {/* Service Section (Stack) */}
                                    <div className="p-8 pb-6 border-b border-stone-100 relative">
                                        <div className="absolute top-6 right-6 text-right">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 leading-none mb-1">Standard</p>
                                            <p className="text-sm font-bold text-stone-300 line-through">{calculation.serviceBase}€</p>
                                        </div>

                                        <div className="flex items-center gap-2 mb-6">
                                            <Receipt className="h-4 w-4 text-brand-rose" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Votre Tarif Chef</span>
                                        </div>

                                        <div className="text-center py-2">
                                            <div className="mb-6 space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">À régler à Elisa</p>
                                                <p className="text-2xl font-bold text-stone-900">{Math.round(calculation.amountToPayElisa)}€ <span className="text-[10px] text-stone-400 uppercase">/ visite</span></p>
                                            </div>

                                            <div className="pt-6 border-t border-stone-50">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Votre coût réel</p>
                                                <div className="flex justify-center items-baseline gap-1">
                                                    <span className="text-6xl font-black text-brand-rose tracking-tighter leading-none">
                                                        {Math.round(calculation.finalPocketCost)}€
                                                    </span>
                                                    <span className="text-stone-400 font-bold text-[10px] uppercase tracking-widest">/ visite</span>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">Avantage Fiscal de 50%</Badge>
                                                </div>
                                                <p className="text-[9px] text-stone-400 font-medium mt-3 italic">* Crédit d'impôt récupéré lors de votre déclaration annuelle (Dispositif SAP).</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grocery Section (Stack) */}
                                    <div className="p-8 pt-6 bg-stone-50/50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ShoppingBag className="h-4 w-4 text-stone-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Ingrédients (Estimé)</span>
                                        </div>
                                        <p className="text-xl font-medium text-stone-500 mb-4">
                                            {Math.round(calculation.groceryRange.min)}€ - {Math.round(calculation.groceryRange.max)}€
                                        </p>
                                        <div className="bg-white px-3 py-2 rounded-xl border border-stone-100 shadow-sm inline-flex items-center gap-2">
                                            <span className="text-[#A8A29E] text-[8px] font-black uppercase tracking-widest">Moyenne :</span>
                                            <span className="text-stone-900 font-bold text-[10px]">{Math.round((groceryUnit.min + groceryUnit.max) / 2)}€ / repas / pers.</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* Final Desktop Summary (In Step 3) */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="bg-white rounded-[3rem] shadow-2xl border-2 border-brand-rose/10 overflow-hidden">
                                    {/* Reuse full summary components if needed, or stick to simpler stack */}
                                    <div className="p-10 text-center border-b border-stone-100">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-3">Votre Coût Réel de revient</p>
                                        <span className="text-7xl md:text-8xl font-black text-brand-rose tracking-tighter block mb-2">{Math.round(calculation.finalPocketCost)}€</span>
                                        <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">/ visite de chef</p>
                                    </div>
                                    <div className="p-8 bg-stone-50 flex flex-col gap-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-stone-400 font-medium">À payer à Elisa</span>
                                            <span className="text-stone-900 font-black text-lg">{Math.round(calculation.amountToPayElisa)}€</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-emerald-600">
                                            <span className="font-medium">Économie fiscale (50%)</span>
                                            <span className="font-bold">-{Math.round(calculation.taxCredit)}€</span>
                                        </div>
                                        {isSubscribed && (
                                            <div className="flex justify-between items-center text-sm text-emerald-600">
                                                <span className="font-medium">Remise Fidélité</span>
                                                <span className="font-bold">-{Math.round(calculation.serviceDiscount)}€</span>
                                            </div>
                                        )}
                                        <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
                                            <span className="text-stone-900 font-bold">Budget Ingrédients</span>
                                            <span className="text-stone-500 font-medium">~{Math.round(calculation.groceryRange.min)}€ - {Math.round(calculation.groceryRange.max)}€</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-brand-rose/5 p-6 rounded-3xl border border-brand-rose/10">
                                    <p className="text-[11px] leading-relaxed text-brand-rose/80 font-medium italic text-center">
                                        "Le crédit d'impôt de 50% vous sera restitué par l'administration fiscale lors de votre déclaration annuelle (en attendant l'activation de l'avance immédiate). Le montant 'À payer à Elisa' correspond à votre règlement lors de la prestation."
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>
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
                                    <span className="text-3xl font-black text-brand-rose leading-none">{Math.round(calculation.finalPocketCost)}€</span>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">/ sem.</span>
                                </div>
                            </div>
                            <Button
                                onClick={nextStep}
                                className="rounded-full px-6 py-4 h-auto bg-stone-900 text-white text-sm font-bold shadow-lg"
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

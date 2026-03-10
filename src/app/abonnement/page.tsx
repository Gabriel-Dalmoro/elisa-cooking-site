"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2, ShieldCheck, Sparkles, Send, Lock,
    Calendar, CalendarDays, CalendarClock, Clock, PiggyBank
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Pricing constants (example: 6 recettes · 4 personnes)
// Catalogue: 240 + 3×10 = 270 € / visite
// After −15% sub + −50% tax credit → 114,75 € real cost / visite
const ORIGINAL = 270;
const REAL = 114.75;


const FREQUENCIES = [
    { id: "monthly" as const, label: "1×\u00a0par mois", icon: Calendar, visitsPerMonth: 1, isRecommended: false },
    { id: "biweekly" as const, label: "2×\u00a0par mois", icon: CalendarDays, visitsPerMonth: 2, isRecommended: true },
    { id: "weekly" as const, label: "1×\u00a0par semaine", icon: CalendarClock, visitsPerMonth: 4, isRecommended: false },
] as const;

function fmt(n: number) {
    return n.toFixed(2).replace(".", ",") + "\u00a0€";
}

export default function AbonnementPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [selectedFrequency, setSelectedFrequency] = useState<"monthly" | "biweekly" | "weekly">("biweekly");
    const [formData, setFormData] = useState({ name: "", email: "", consent: false });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.consent) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/subscription-submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "vip_upgrade",
                    client_name: formData.name,
                    client_email: formData.email,
                    engagement_type: "Abonnement Sérénité",
                    frequency: selectedFrequency,
                    consent_3_months: formData.consent,
                }),
            });
            if (res.ok) setIsSent(true);
            else alert("Une erreur est survenue. Veuillez contacter Elisa directement.");
        } catch {
            alert("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-stone-50 py-16 md:py-24 relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-rose/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-gold/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-3xl relative z-10">
                <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-brand-gold/40 via-brand-gold/20 to-brand-gold/40 rounded-[3.5rem] blur-2xl opacity-70" />

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 md:p-14 rounded-[3rem] shadow-2xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden z-10"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/10 rounded-full -mr-20 -mt-20 blur-3xl" />

                        <AnimatePresence mode="wait">
                            {!isSent ? (
                                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10">

                                    {/* ── Header ── */}
                                    <div className="text-center space-y-4">
                                        <div className="mx-auto h-16 w-16 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-brand-gold/20">
                                            <Sparkles className="h-8 w-8" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight leading-none">
                                            Pérennisez votre <span className="text-brand-rose">tranquillité</span>.
                                        </h1>
                                        <p className="text-stone-500 text-base md:text-lg max-w-lg mx-auto leading-relaxed pt-2">
                                            Sécurisez votre créneau, conservez votre tarif préférentiel et profitez d'une charge mentale réduite à néant.
                                        </p>
                                    </div>

                                    {/* ── Benefit chips ── */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex gap-3 items-center bg-white p-4 rounded-2xl border border-emerald-100 shadow-md shadow-emerald-900/5">
                                            <div className="flex-shrink-0 bg-emerald-100 text-emerald-600 rounded-xl p-2">
                                                <ShieldCheck className="h-4 w-4 stroke-[2.5px]" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-stone-900 text-xs uppercase tracking-wider leading-tight">Facturation automatisée</h4>
                                                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Une facture / mois. Zéro paperasse.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-center bg-white p-4 rounded-2xl border border-brand-rose/10 shadow-md shadow-brand-rose/5">
                                            <div className="flex-shrink-0 bg-brand-rose/10 text-brand-rose rounded-xl p-2">
                                                <Lock className="h-4 w-4 stroke-[2.5px]" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-stone-900 text-xs uppercase tracking-wider leading-tight">Avantage −50% sécurisé</h4>
                                                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Crédit d'impôt + −15% garantis.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── FORM ── */}
                                    <form onSubmit={handleSubmit} className="relative">
                                        <div className="relative bg-white/80 backdrop-blur-sm p-6 md:p-10 rounded-[2.5rem] border-2 border-brand-gold/40 shadow-xl space-y-8">
                                            <div className="absolute top-0 right-6 md:right-10 -translate-y-1/2 bg-brand-gold text-stone-900 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-brand-gold/50 flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3 md:h-4 md:w-4" /> Offre Sérénité
                                            </div>

                                            {/* Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-stone-600 ml-1">Nom &amp; Prénom</Label>
                                                <Input
                                                    id="name" required
                                                    placeholder="Comment vous appelez-vous ?"
                                                    className="rounded-2xl border-brand-gold/20 bg-white h-14 focus:ring-brand-gold text-stone-900 placeholder:text-stone-300 shadow-sm"
                                                    value={formData.name}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>

                                            {/* Email */}
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-stone-600 ml-1">Email</Label>
                                                <Input
                                                    id="email" type="email" required
                                                    placeholder="votre.email@exemple.com"
                                                    className="rounded-2xl border-brand-gold/20 bg-white h-14 focus:ring-brand-gold text-stone-900 placeholder:text-stone-300 shadow-sm"
                                                    value={formData.email}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>

                                            {/* ── Frequency ── */}
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-stone-600 ml-1">
                                                    À quelle fréquence souhaitez-vous qu'Elisa vienne ?
                                                </Label>

                                                {/* 3 pill buttons — frequency only, no prices */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    {FREQUENCIES.map((f) => {
                                                        const isSelected = selectedFrequency === f.id;
                                                        const IconComp = f.icon;
                                                        return (
                                                            <motion.button
                                                                key={f.id}
                                                                type="button"
                                                                whileTap={{ scale: 0.96 }}
                                                                onClick={() => setSelectedFrequency(f.id)}
                                                                className={cn(
                                                                    "relative flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-2xl border-2 transition-all cursor-pointer focus:outline-none text-center",
                                                                    isSelected
                                                                        ? "border-brand-rose bg-brand-rose/5 shadow-lg shadow-brand-rose/10"
                                                                        : "border-stone-100 bg-white hover:border-stone-200 hover:-translate-y-0.5"
                                                                )}
                                                            >
                                                                {f.isRecommended && (
                                                                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-rose text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                                                                        Recommandé
                                                                    </span>
                                                                )}
                                                                <div className={cn(
                                                                    "p-2.5 rounded-xl transition-colors",
                                                                    isSelected ? "bg-brand-rose text-white" : "bg-stone-100 text-stone-400"
                                                                )}>
                                                                    <IconComp className="h-5 w-5" />
                                                                </div>
                                                                <p className={cn(
                                                                    "font-black text-sm leading-tight transition-colors",
                                                                    isSelected ? "text-stone-900" : "text-stone-500"
                                                                )}>
                                                                    {f.label}
                                                                </p>
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>

                                                {/* ── Value metrics (change with frequency) ── */}
                                                <AnimatePresence mode="wait">
                                                    {(() => {
                                                        const f = FREQUENCIES.find(f => f.id === selectedFrequency)!;
                                                        // 8h15 per visit (6 recettes) = 8.25h
                                                        const hoursPerVisit = 8.25;
                                                        const totalHours = Math.round(hoursPerVisit * f.visitsPerMonth);
                                                        const moneySaved = (ORIGINAL - REAL) * f.visitsPerMonth;
                                                        return (
                                                            <motion.div
                                                                key={selectedFrequency}
                                                                initial={{ opacity: 0, y: 6 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -6 }}
                                                                transition={{ duration: 0.18 }}
                                                                className="grid grid-cols-2 gap-3"
                                                            >
                                                                {/* Time saved */}
                                                                <div className="flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl px-4 py-5 text-center">
                                                                    <div className="bg-amber-100 text-amber-600 rounded-xl p-2">
                                                                        <Clock className="h-4 w-4" />
                                                                    </div>
                                                                    <p className="text-amber-700 font-black text-3xl leading-none">~{totalHours}h</p>
                                                                    <p className="text-amber-600/80 text-[11px] font-semibold uppercase tracking-wide">libérées / mois</p>
                                                                </div>
                                                                {/* Money saved */}
                                                                <div className="flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl px-4 py-5 text-center">
                                                                    <div className="bg-emerald-100 text-emerald-600 rounded-xl p-2">
                                                                        <PiggyBank className="h-4 w-4" />
                                                                    </div>
                                                                    <p className="text-emerald-700 font-black text-3xl leading-none">{fmt(moneySaved)}</p>
                                                                    <p className="text-emerald-600/80 text-[11px] font-semibold uppercase tracking-wide">économisés / mois</p>
                                                                </div>
                                                                {/* Note — spans both columns */}
                                                                <p className="col-span-2 text-center text-[11px] text-stone-400 font-medium">* Estimé pour 6 recettes · 4 personnes</p>
                                                            </motion.div>
                                                        );
                                                    })()}
                                                </AnimatePresence>
                                            </div>

                                            {/* Consent */}
                                            <div
                                                className="bg-white border-2 border-brand-rose/20 p-5 md:p-6 rounded-[2rem] flex items-start gap-4 cursor-pointer group hover:border-brand-rose/40 hover:shadow-md transition-all"
                                                onClick={() => setFormData({ ...formData, consent: !formData.consent })}
                                            >
                                                <div className={cn(
                                                    "mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    formData.consent
                                                        ? "bg-brand-rose border-brand-rose text-white shadow-sm"
                                                        : "bg-stone-50 border-stone-200 text-transparent group-hover:border-brand-rose/40"
                                                )}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <div className="select-none">
                                                    <p className="text-sm font-bold text-stone-900 leading-tight mb-1">
                                                        Je confirme mon passage à l'Option Sérénité&nbsp;!
                                                    </p>
                                                    <p className="text-xs text-stone-500 font-medium leading-relaxed">
                                                        Je m'engage pour une durée minimum de 3 mois pour sécuriser mon créneau et mon tarif préférentiel (−15%). Je comprends que la facturation sera effectuée une fois par mois de manière automatisée.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Submit */}
                                            <div className="pt-2">
                                                <Button
                                                    type="submit"
                                                    disabled={!formData.consent || isSubmitting}
                                                    size="lg"
                                                    className="w-full rounded-full py-6 md:py-8 h-auto bg-stone-900 hover:bg-stone-800 text-brand-gold shadow-xl shadow-stone-900/20 text-sm md:text-lg font-black group border-none transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-wide"
                                                >
                                                    {isSubmitting ? (
                                                        <span className="flex items-center gap-3">
                                                            <div className="h-5 w-5 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
                                                            Validation...
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            Activer mon abonnement
                                                            <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                                        </span>
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-[10px] text-stone-400 font-medium">✨ Paiement sécurisé via Abby/Stripe. Rétractation possible selon CGV.</p>
                                            </div>
                                        </div>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-16 flex flex-col items-center text-center space-y-6"
                                >
                                    <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/10 mb-2 relative">
                                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
                                        <CheckCircle2 className="h-12 w-12 stroke-[2.5px] relative z-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-3xl font-black text-stone-900 tracking-tight">C'est officiel&nbsp;! 🎉</h2>
                                        <p className="text-stone-500 text-lg max-w-md mx-auto leading-relaxed">
                                            Votre abonnement Sérénité est activé. Vous recevrez très bientôt par email votre premier mandat de prélèvement mensuel sécurisé.
                                        </p>
                                    </div>
                                    <div className="pt-4 text-sm font-bold text-brand-rose">
                                        Elisa reste à votre disposition. À très vite en cuisine&nbsp;!
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}

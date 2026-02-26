"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck, Sparkles, Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AbonnementPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        consent: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.consent) return;

        setIsSubmitting(true);

        try {
            const currentParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
            const isTestMode = currentParams.get('mode') === 'test' || currentParams.get('debug') === 'true';
            const productionUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n-production-ced7.up.railway.app/webhook/86d17b28-b3cd-46ed-a7a1-82b4b0af88b3';
            const testUrl = 'https://n8n-production-ced7.up.railway.app/webhook-test/86d17b28-b3cd-46ed-a7a1-82b4b0af88b3';
            const webhookUrl = isTestMode ? testUrl : productionUrl;

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'vip_upgrade',
                    client_name: formData.name,
                    client_email: formData.email,
                    engagement_type: "Abonnement Sérénité",
                    consent_3_months: formData.consent
                })
            });

            if (response.ok) {
                setIsSent(true);
            } else {
                alert("Une erreur est survenue lors de la validation. Veuillez contacter Elisa directement.");
            }
        } catch (error) {
            alert("Une erreur est survenue. Veuillez réessayer ou contacter Elisa.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-stone-50 py-16 md:py-24 relative overflow-hidden flex items-center justify-center">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-rose/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-gold/5 blur-[100px] rounded-full -ml-20 -mb-20 -z-10" />

            <div className="container mx-auto px-4 max-w-3xl relative z-10">
                <div className="relative">
                    {/* Golden Glow Effect Behind the Entire Card */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-brand-gold/40 via-brand-gold/20 to-brand-gold/40 rounded-[3.5rem] blur-2xl opacity-70" />

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 md:p-14 rounded-[3rem] shadow-2xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden z-10"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/10 rounded-full -mr-20 -mt-20 blur-3xl" />

                        <AnimatePresence mode="wait">
                            {!isSent ? (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-10"
                                >
                                    <div className="text-center space-y-4">
                                        <div className="mx-auto h-16 w-16 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-brand-gold/20">
                                            <Sparkles className="h-8 w-8" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight leading-none">
                                            Pérennisez votre <span className="text-brand-rose">tranquillité</span>.
                                        </h1>
                                        <p className="text-stone-500 text-base md:text-lg max-w-lg mx-auto leading-relaxed pt-2">
                                            Sécurisez votre créneau sur mon planning, conservez votre tarif préférentiel et profitez d'une charge mentale réduite à néant.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                                        <div className="flex gap-4 items-start bg-white p-6 rounded-[2rem] border-2 border-emerald-50 shadow-xl shadow-emerald-900/5 hover:-translate-y-1 transition-transform">
                                            <div className="mt-1 bg-emerald-100 text-emerald-600 rounded-xl p-3 shadow-md shadow-emerald-200">
                                                <ShieldCheck className="h-6 w-6 stroke-[2.5px]" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-stone-900 md:text-lg uppercase tracking-wider text-sm mb-1">Facturation <br />Automatisée</h4>
                                                <p className="text-sm text-stone-500 font-medium leading-relaxed">Une seule facture par mois. Zéro relance, zéro paperasse.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-start bg-white p-6 rounded-[2rem] border-2 border-brand-rose/10 shadow-xl shadow-brand-rose/5 hover:-translate-y-1 transition-transform">
                                            <div className="mt-1 bg-brand-rose/10 text-brand-rose rounded-xl p-3 shadow-md shadow-brand-rose/20">
                                                <Lock className="h-6 w-6 stroke-[2.5px]" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-stone-900 md:text-lg uppercase tracking-wider text-sm mb-1">Avantage -50% <br />Sécurisé</h4>
                                                <p className="text-sm text-stone-500 font-medium leading-relaxed">Crédit d'impôt préservé et 15% de remise garantis à chaque prestation.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="relative mt-8">
                                        <div className="relative bg-white/80 backdrop-blur-sm p-6 md:p-10 rounded-[2.5rem] border-2 border-brand-gold/40 shadow-xl space-y-8">
                                            <div className="absolute top-0 right-6 md:right-10 -translate-y-1/2 bg-brand-gold text-stone-900 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-brand-gold/50 flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3 md:h-4 md:w-4" /> Offre Sérénité
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-stone-600 ml-1">Nom & Prénom</Label>
                                                    <Input
                                                        id="name"
                                                        required
                                                        placeholder="Comment vous appelez-vous ?"
                                                        className="rounded-2xl border-brand-gold/20 bg-white h-14 focus:ring-brand-gold text-stone-900 placeholder:text-stone-300 shadow-sm"
                                                        value={formData.name}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-stone-600 ml-1">Email</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        required
                                                        placeholder="votre.email@exemple.com"
                                                        className="rounded-2xl border-brand-gold/20 bg-white h-14 focus:ring-brand-gold text-stone-900 placeholder:text-stone-300 shadow-sm"
                                                        value={formData.email}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-white border-2 border-brand-rose/20 p-5 md:p-6 rounded-[2rem] flex items-start gap-4 cursor-pointer group hover:border-brand-rose/40 hover:shadow-md transition-all" onClick={() => setFormData({ ...formData, consent: !formData.consent })}>
                                                <div className={cn(
                                                    "mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    formData.consent ? "bg-brand-rose border-brand-rose text-white shadow-sm" : "bg-stone-50 border-stone-200 text-transparent group-hover:border-brand-rose/40"
                                                )}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <div className="select-none">
                                                    <p className="text-sm font-bold text-stone-900 leading-tight mb-1">
                                                        Je confirme mon passage à l'Option Sérénité !
                                                    </p>
                                                    <p className="text-xs text-stone-500 font-medium leading-relaxed">
                                                        Je m'engage pour une durée minimum de 3 mois pour sécuriser mon créneau et mon tarif préférentiel (-15%). Je comprends que la facturation sera effectuée une fois par mois de manière automatisée.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <Button
                                                    type="submit"
                                                    disabled={!formData.consent || isSubmitting}
                                                    size="lg"
                                                    className="w-full rounded-full py-8 h-auto bg-stone-900 hover:bg-stone-800 text-brand-gold shadow-xl shadow-stone-900/20 text-lg font-black group border-none transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-wide"
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

                                            <div className="text-center mt-4">
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
                                        <h2 className="text-3xl font-black text-stone-900 tracking-tight">C'est officiel ! 🎉</h2>
                                        <p className="text-stone-500 text-lg max-w-md mx-auto leading-relaxed">
                                            Votre abonnement Sérénité est activé. Vous recevrez très bientôt par email votre premier mandat de prélèvement mensuel sécurisé.
                                        </p>
                                    </div>
                                    <div className="pt-4 text-sm font-bold text-brand-rose">
                                        Elisa reste à votre disposition. À très vite en cuisine !
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

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';

export default function GiftCardSuccessPage() {
    return (
        <main className="min-h-screen bg-stone-50 py-20 md:py-32 relative overflow-hidden text-stone-900 flex items-center justify-center">
            {/* Background glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-gold/15 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

            <div className="container mx-auto px-4 max-w-md relative z-10 text-center space-y-8">
                {/* Check Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="mx-auto relative w-24 h-24"
                >
                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-10" />
                    <div className="relative h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/10">
                        <Check className="h-12 w-12 stroke-[3px]" />
                    </div>
                </motion.div>

                {/* Main Text */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        Paiement Réussi
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                        Merci pour votre confiance !
                    </h1>
                    <p className="text-stone-500 text-sm leading-relaxed max-w-sm mx-auto">
                        Le bon cadeau est en cours d'activation. Nous préparons le PDF contenant votre message personnalisé.
                    </p>
                </motion.div>

                {/* Steps/Info */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white border border-stone-100 rounded-[2rem] p-6 text-left shadow-xl space-y-4"
                >
                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Prochaines étapes</h3>
                    <ul className="space-y-3 text-xs text-stone-600 font-medium">
                        <li className="flex items-start gap-2.5">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>Confirmation de paiement Stripe envoyée par email.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>Génération automatique du code cadeau unique et inscription dans notre registre.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>Envoi du bon cadeau PDF personnalisé par email sous quelques minutes.</span>
                        </li>
                    </ul>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center gap-4 pt-4"
                >
                    <Link
                        href="/"
                        className="rounded-full px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-xl text-sm flex items-center gap-2 group transition-transform active:scale-98"
                    >
                        Retourner à l'accueil
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}

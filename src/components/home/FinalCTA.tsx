"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function FinalCTA() {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="flex justify-center mb-6 text-brand-gold">
                        <Sparkles className="h-10 w-10 animate-pulse" />
                    </div>

                    <h2 className="text-4xl md:text-5xl font-handwriting text-stone-900 mb-8 leading-tight">
                        Hâte de cuisiner pour vous et de vous faire gagner ce temps précieux...
                    </h2>

                    <p className="text-stone-600 mb-12 text-lg">
                        Prêt à transformer vos soirées ? Faites le premier pas vers une expérience gastronomique sans quitter votre maison.
                    </p>

                    <Button
                        asChild
                        size="lg"
                        className="bg-brand-rose hover:bg-brand-rose/90 text-white px-10 py-7 rounded-full text-xl font-bold shadow-xl shadow-brand-rose/20 hover:scale-105 transition-all group"
                    >
                        <Link href="/simulateur">
                            Simuler mon tarif
                            <motion.span
                                className="ml-2 inline-block"
                                animate={{ x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                →
                            </motion.span>
                        </Link>
                    </Button>
                </motion.div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-rose/5 rounded-full blur-3xl" />
            </div>
        </section>
    );
}

"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Star, Map, ChefHat, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TIMELINE_NODES = [
    {
        label: "L'Excellence Académique",
        title: "Formée à Ferrandi Paris",
        icon: GraduationCap,
        color: "brand-gold",
        description: "Diplômée de l'une des meilleures écoles de cuisine au monde. L'apprentissage de la rigueur, de la technique française et du respect absolu des produits.",
    },
    {
        label: "L'Expérience Étoilée",
        title: "Restaurants Gastronomiques & Étoilés",
        icon: Star,
        color: "brand-gold",
        description: "J'ai affiné ma technique dans des brigades exigeantes, notamment en Australie et dans des établissements étoilés. J'y ai appris le souci du détail et la perfection du dressage.",
    },
    {
        label: "L'Ouverture au Monde",
        title: "Voyages & Saveurs",
        icon: Map,
        color: "brand-rose",
        description: "Mon parcours m’a menée en Amérique du Sud, en Asie et en Afrique (Tanzanie). Ces expériences ont façonné ma signature : une cuisine ouverte, généreuse, pleine de vie et d'épices.",
    },
    {
        label: "Aujourd'hui",
        title: "Votre Cheffe à Domicile",
        icon: ChefHat,
        color: "brand-rose",
        description: "Je pose mes valises à Annecy pour réaliser un nouveau rêve : vous accompagner au quotidien avec des plats sains et savoureux.",
    },
];

export default function AboutPage() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end center"],
    });

    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    return (
        <main className="min-h-screen bg-stone-50 overflow-hidden">
            {/* 1. Hero Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="relative aspect-[4/5] w-full max-w-md mx-auto"
                        >
                            <div className="absolute -inset-4 border-2 border-brand-gold rounded-[3rem] -z-10 translate-x-4 translate-y-4 opacity-50" />
                            <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] shadow-2xl">
                                <Image
                                    src="/images/chef-elisa.jpg"
                                    alt="Elisa portrait"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <h1 className="text-5xl md:text-6xl font-serif text-stone-900 mb-6 italic">
                                Bonjour, je m'appelle <span className="text-brand-rose">Elisa</span>.
                            </h1>
                            <h2 className="text-2xl font-bold text-stone-800 mb-8 border-l-4 border-brand-gold pl-6 py-2">
                                Cuisinière depuis 7 ans, je ramène le monde dans votre assiette.
                            </h2>
                            <p className="text-xl text-stone-600 leading-relaxed font-light mb-8">
                                Cuisiner pour vous, chez vous, des plats maison, réconfortants et pensés pour votre semaine, est ce qui m’anime profondément et me procure une immense joie.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 2. Journey Section */}
            <section className="py-24" ref={containerRef}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-center text-stone-900 mb-20">
                        Mon Parcours : De l'Exigence à la Passion
                    </h2>

                    <div className="relative max-w-5xl mx-auto">
                        {/* The Vertical Line - Centered on desktop, Left-aligned on mobile */}
                        <div className="absolute left-4 md:left-1/2 top-0 h-full w-0.5 bg-stone-200 -translate-x-1/2" />
                        <motion.div
                            style={{ scaleY }}
                            className="absolute left-4 md:left-1/2 top-0 h-full w-0.5 bg-brand-rose -translate-x-1/2 origin-top"
                        />

                        <div className="space-y-16 md:space-y-24">
                            {TIMELINE_NODES.map((node, index) => {
                                const Icon = node.icon;
                                const isEven = index % 2 === 0;

                                return (
                                    <div key={index} className="relative pl-12 md:pl-0">
                                        {/* Node Dot */}
                                        <div className="absolute left-4 md:left-1/2 top-10 -translate-x-1/2 z-10">
                                            <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-white border-2 border-brand-rose shadow-lg">
                                                <div className="h-3 w-3 md:h-4 md:w-4 rounded-full bg-brand-rose" />
                                            </div>
                                        </div>

                                        <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                            <motion.div
                                                initial={{ opacity: 0, x: isEven ? 20 : -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true, margin: "-50px" }}
                                                className="flex-1 w-full"
                                            >
                                                <Card className="rounded-3xl md:rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                                    <div className={`h-2 w-full ${node.color === 'brand-rose' ? 'bg-brand-rose' : 'bg-brand-gold'}`} />
                                                    <CardContent className="p-6 md:p-10">
                                                        <div className="flex items-center gap-4 mb-4 md:mb-6">
                                                            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${node.color === 'brand-rose' ? 'bg-brand-rose/10 text-brand-rose' : 'bg-brand-gold/10 text-brand-gold'}`}>
                                                                <Icon className="h-6 w-6 md:h-8 md:w-8" />
                                                            </div>
                                                            <div>
                                                                <span className={`text-xs md:text-sm font-bold uppercase tracking-widest ${node.color === 'brand-rose' ? 'text-brand-rose' : 'text-brand-gold'}`}>
                                                                    {node.label}
                                                                </span>
                                                                <h3 className="text-xl md:text-2xl font-bold text-stone-900 mt-1">{node.title}</h3>
                                                            </div>
                                                        </div>
                                                        <p className="text-stone-600 text-base md:text-lg leading-relaxed">{node.description}</p>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                            <div className="flex-1 hidden md:block" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Philosophy Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-center text-stone-900 mb-20 italic">
                        Ma Cuisine en 3 Mots
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Généreuse", body: "Pas de portions minimalistes. De la vraie cuisine qui nourrit." },
                            { title: "Vivante", body: "Des couleurs, des herbes fraîches, et des influences d'ailleurs." },
                            { title: "Sur-mesure", body: "Adaptée à votre santé, vos goûts et votre rythme de vie." }
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="bg-stone-50 p-12 rounded-[2.5rem] text-center border border-stone-100 hover:border-brand-gold/20 hover:scale-105 transition-all duration-500 group"
                            >
                                <h3 className="text-4xl font-handwriting text-brand-rose mb-6 group-hover:scale-110 transition-transform">{card.title}</h3>
                                <p className="text-stone-600 text-lg">{card.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Final CTA */}
            <section className="py-24 container mx-auto px-4">
                <div className="bg-brand-gold rounded-[3rem] p-16 text-center text-stone-900 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-gold to-white opacity-20" />
                    <h2 className="text-4xl md:text-5xl font-handwriting mb-10 relative z-10 transition-transform group-hover:scale-105">
                        Envie de goûter à cette expérience ?
                    </h2>
                    <Button
                        asChild
                        size="lg"
                        className="bg-stone-900 text-white hover:bg-stone-800 px-12 py-8 rounded-full text-xl font-bold shadow-xl relative z-10"
                    >
                        <Link href="/simulateur" className="flex items-center gap-2">
                            Découvrir mes tarifs
                            <ArrowRight className="h-6 w-6" />
                        </Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}

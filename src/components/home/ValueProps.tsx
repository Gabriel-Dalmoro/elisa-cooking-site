"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Leaf, Recycle, SlidersHorizontal } from "lucide-react";

const VALUES = [
    {
        icon: MapPin,
        title: "Approvisionnement local",
        description: "Je privilégie les producteurs locaux pour vous garantir fraîcheur et soutien à l'économie locale.",
    },
    {
        icon: Leaf,
        title: "Produits de saison",
        description: "Ma cuisine évolue au rythme de la nature, respectant les cycles pour un goût authentique.",
    },
    {
        icon: Recycle,
        title: "Démarche zéro-déchet",
        description: "Je m'engage à réduire l'empreinte écologique de mes prestations à chaque étape.",
    },
    {
        icon: SlidersHorizontal,
        title: "Menus sur mesure",
        description: "Chaque prestation est unique : je m'adapte à vos goûts, régimes et envies du moment.",
    },
];

export function ValueProps() {
    return (
        <section className="py-24 bg-stone-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                        Mes valeurs
                    </h2>
                    <div className="mt-4 mx-auto h-1.5 w-24 bg-brand-gold rounded-full" />
                </motion.div>

                <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                    {/* Left Side: Photo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl"
                    >
                        <Image
                            src="/images/chef-elisa.jpg"
                            alt="Chef Elisa in her kitchen"
                            fill
                            className="object-cover"
                        />
                        {/* Subtle brand overlay */}
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2.5rem]" />
                    </motion.div>

                    {/* Right Side: List of Values */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
                        {VALUES.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <motion.div
                                    key={value.title}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                >
                                    {/* Branding accent: Top border/glow */}
                                    <div className="absolute top-0 left-0 h-1 w-0 bg-brand-gold transition-all duration-300 group-hover:w-full rounded-t-3xl" />

                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-rose/10 text-brand-rose group-hover:bg-brand-rose group-hover:text-white transition-colors">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-stone-900 mb-1 group-hover:text-brand-rose transition-colors">
                                                {value.title}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-stone-600">
                                                {value.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

"use client";

import { motion } from "framer-motion";
import { Calculator, ChefHat, UtensilsCrossed, ArrowRight } from "lucide-react";

const STEPS = [
    {
        icon: Calculator,
        title: "Je simule & je réserve",
        description: "Estimez le coût de vos prestations en quelques clics et réservez votre créneau en toute simplicité.",
    },
    {
        icon: ChefHat,
        title: "Courses & Cuisine à domicile",
        description: "Je m'occupe de l'achat des ingrédients frais et je prépare vos repas directement dans votre cuisine.",
    },
    {
        icon: UtensilsCrossed,
        title: "Réchauffer & Déguster",
        description: "Vos plats sont prêts, étiquetés et rangés. Il ne vous reste plus qu'à les réchauffer et savourer.",
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
        },
    },
};

const arrowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            delay: 0.4,
        },
    },
};

export function ProcessSteps() {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-20 text-center"
                >
                    <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                        Comment ça marche ?
                    </h2>
                    <div className="mt-4 mx-auto h-1.5 w-24 bg-brand-gold rounded-full" />
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-12 lg:gap-20 items-stretch"
                >
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isLast = index === STEPS.length - 1;

                        return (
                            <div key={step.title} className="relative flex items-center">
                                <motion.div
                                    variants={itemVariants}
                                    className="flex-1 h-full rounded-3xl border border-stone-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-brand-rose/5 hover:border-brand-rose/20 flex flex-col items-center text-center group relative"
                                >
                                    {/* Subtle top accent line */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-3xl" />

                                    {/* Icon Circle */}
                                    <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-brand-gold/10 transition-all duration-500 group-hover:bg-brand-rose group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-brand-rose/30">
                                        <Icon className="h-10 w-10 text-brand-gold group-hover:text-white transition-colors duration-300" />
                                    </div>

                                    {/* Text Content */}
                                    <h3 className="mb-4 text-xl font-bold text-stone-900 group-hover:text-brand-rose transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-stone-600 leading-relaxed text-sm">
                                        {step.description}
                                    </p>

                                    {/* Step Number Badge */}
                                    <div className="absolute -top-3 -left-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white shadow-lg ring-4 ring-white group-hover:bg-brand-gold transition-colors">
                                        {index + 1}
                                    </div>
                                </motion.div>

                                {/* Desktop Arrow - Perfectly centered in the grid gap */}
                                {!isLast && (
                                    <motion.div
                                        variants={arrowVariants}
                                        className="hidden absolute top-1/2 -translate-y-1/2 -right-10 lg:-right-14 z-10 md:flex items-center justify-center text-brand-gold/60"
                                    >
                                        <ArrowRight className="h-6 w-6 lg:h-8 lg:w-8 stroke-[3]" />
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Decorative background blobs */}
            <div className="absolute top-1/2 -right-64 -z-10 h-[500px] w-[500px] rounded-full bg-brand-gold/5 blur-3xl" />
            <div className="absolute bottom-0 -left-64 -z-10 h-[400px] w-[400px] rounded-full bg-brand-rose/5 blur-3xl" />
        </section>
    );
}

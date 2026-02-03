"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Search,
    ListTodo,
    Car,
    PackageOpen,
    Utensils,
    Sparkles,
    ArrowRight,
    Info,
    HeartPulse,
    Heart,
    Rocket,
    BookOpen,
    Moon,
    Languages,
    Banknote,
    Smile,
    Music,
    Cloud,
    Briefcase
} from 'lucide-react';
import { TimeSavings } from './usePricingLogic';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TimeSavingsVisualizerProps {
    savings: TimeSavings;
    meals: number;
}

// Fixed maximums for relative progress bar display (based on 6 recipes tier)
const MAX_TIMES = {
    planning: 40,
    shoppingList: 20,
    groceryRun: 60,
    packing: 15,
    cooking: 360
};

const SUGGESTIONS = [
    { text: "Passer plus de temps en famille", icon: Heart },
    { text: "Lancer votre side-project", icon: Rocket },
    { text: "Lire ce livre qui vous attend", icon: BookOpen },
    { text: "Faire une sieste royale", icon: Moon },
    { text: "Apprendre une nouvelle langue", icon: Languages },
    { text: "Gagner plus d'argent", icon: Banknote },
    { text: "Apprendre à jouer de la guitare", icon: Music },
    { text: "Méditer sans culpabiliser", icon: Cloud },
    { text: "Enfin lancer votre business", icon: Briefcase },
    { text: "Apprendre à jongler avec des avocats", icon: Smile },
    { text: "Compter les grains de riz dans le placard", icon: Search },
];

const SuggestionRotator = ({ className }: { className?: string }) => {
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % SUGGESTIONS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const { text, icon: Icon } = SUGGESTIONS[index];

    return (
        <div className={cn("pointer-events-none flex flex-col items-center md:items-end gap-3", className)}>
            <div className="space-y-1 text-center md:text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100 mb-1">Utilisez ce temps pour...</p>
            </div>

            <div className="relative flex flex-col items-center md:items-end gap-3">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`icon-${index}`}
                        initial={{ opacity: 0, x: 20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.8 }}
                        transition={{ type: "spring", damping: 20, stiffness: 120 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
                        <div className="relative h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md shadow-xl border border-white/20 flex items-center justify-center text-white">
                            <Icon className="h-7 w-7" />
                        </div>
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    <motion.p
                        key={`text-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="text-sm font-black text-white tracking-tight leading-tight max-w-[180px] text-center md:text-right drop-shadow-sm"
                    >
                        {text}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};

export const CategoryItem = ({
    icon: Icon,
    label,
    time,
    delay,
    maxTime,
    isCompact = false,
    isExtraCompact = false
}: {
    icon: any,
    label: string,
    time: number,
    delay: number,
    maxTime: number,
    isCompact?: boolean,
    isExtraCompact?: boolean
}) => {
    const hours = Math.floor(time / 60);
    const mins = time % 60;
    const timeStr = hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins}min`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className={cn(
                "flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-white shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 group",
                isExtraCompact && "p-3 rounded-xl"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-brand-rose/10 group-hover:text-brand-rose transition-all duration-300",
                    isExtraCompact ? "h-8 w-8" : (isCompact ? "h-10 w-10" : "h-12 w-12")
                )}>
                    <Icon className={isExtraCompact ? "h-4 w-4" : (isCompact ? "h-5 w-5" : "h-6 w-6")} />
                </div>
                <p className={cn("font-bold text-stone-700 uppercase tracking-widest leading-none", isExtraCompact ? "text-[10px]" : "text-xs")}>{label}</p>
            </div>

            <div className="flex items-center gap-2">
                <motion.p
                    key={timeStr}
                    initial={{ scale: 1.1, color: "#f43f5e" }}
                    animate={{ scale: 1, color: "#1c1917" }}
                    className={cn("font-black tabular-nums leading-none", isExtraCompact ? "text-sm" : "text-lg")}
                >
                    {timeStr}
                </motion.p>
            </div>
        </motion.div>
    );
};

export const TimeSavingsBreakdown = ({
    savings,
    meals,
    isCompact = false,
    isExtraCompact = false,
    className
}: {
    savings: TimeSavings,
    meals: number,
    isCompact?: boolean,
    isExtraCompact?: boolean,
    className?: string
}) => {
    return (
        <div className={cn("grid grid-cols-1 gap-x-12", !isCompact && "lg:grid-cols-2", (isExtraCompact || isCompact) ? "gap-y-6" : "gap-y-10", className)}>
            <div className={cn("space-y-6", (isExtraCompact || isCompact) && "space-y-4")}>
                <p className={cn("font-black text-brand-gold uppercase tracking-[0.4em] pl-1", isExtraCompact ? "text-[10px]" : "text-xs")}>Organisation & Logistique</p>
                <div className={cn("space-y-6", (isExtraCompact || isCompact) && "space-y-4")}>
                    <CategoryItem
                        icon={Search}
                        label="Recherche & Menus"
                        time={savings.planning}
                        maxTime={MAX_TIMES.planning}
                        delay={0.1}
                        isCompact={isCompact}
                        isExtraCompact={isExtraCompact}
                    />
                    <CategoryItem
                        icon={ListTodo}
                        label="Liste de courses"
                        time={savings.shoppingList}
                        maxTime={MAX_TIMES.shoppingList}
                        delay={0.2}
                        isCompact={isCompact}
                        isExtraCompact={isExtraCompact}
                    />
                    <CategoryItem
                        icon={Car}
                        label="Courses & Trajet"
                        time={savings.groceryRun}
                        maxTime={MAX_TIMES.groceryRun}
                        delay={0.3}
                        isCompact={isCompact}
                        isExtraCompact={isExtraCompact}
                    />
                </div>
            </div>

            <div className={cn("space-y-6 flex flex-col", (isExtraCompact || isCompact) && "space-y-4")}>
                <p className={cn("font-black text-brand-gold uppercase tracking-[0.4em] pl-1", isExtraCompact ? "text-[10px]" : "text-xs")}>Préparation & Rangement</p>
                <div className={cn("space-y-6 flex-1", (isExtraCompact || isCompact) && "space-y-4")}>
                    <CategoryItem
                        icon={PackageOpen}
                        label="Rangement Courses"
                        time={savings.packing}
                        maxTime={MAX_TIMES.packing}
                        delay={0.4}
                        isCompact={isCompact}
                        isExtraCompact={isExtraCompact}
                    />
                    <CategoryItem
                        icon={Utensils}
                        label={`Cuisine & Vaisselle (pour ${meals} recettes)`}
                        time={savings.cookingCleaning}
                        maxTime={MAX_TIMES.cooking}
                        delay={0.5}
                        isCompact={isCompact}
                        isExtraCompact={isExtraCompact}
                    />
                </div>

                {!isCompact && (
                    <div className="pt-6 mt-auto border-t border-stone-100 flex items-start gap-4 p-5 rounded-3xl bg-brand-gold/5 border border-brand-gold/10">
                        <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-brand-rose shadow-sm shrink-0 mt-0.5">
                            <HeartPulse className="h-5 w-5" />
                        </div>
                        <p className="text-xs leading-relaxed text-stone-500 font-medium italic">
                            Chaque heure listée ici n'est pas seulement du temps gagné, c'est de l'espace mental libéré pour ce qui compte vraiment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TimeSavingsVisualizer({ savings, meals }: TimeSavingsVisualizerProps) {
    return (
        <Card className="border-none bg-white shadow-xl rounded-[3rem] overflow-hidden p-0 gap-0">
            {/* SIMPLIFIED HEADER */}
            <div className="bg-gradient-to-br from-brand-rose via-brand-rose/90 to-brand-gold p-8 md:p-12 relative overflow-hidden border-b border-stone-100/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32 opacity-60" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-sm">
                            <Sparkles className="h-3 w-3 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Votre Liberté</span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-white drop-shadow-sm">
                            Le temps que vous <br />
                            <span className="text-rose-100">allez récupérer.</span>
                        </h3>
                        <p className="text-rose-50 text-sm md:text-base font-medium max-w-sm mx-auto md:mx-0">
                            Chaque semaine, je m'occupe de tout pour vous offrir <span className="text-white font-bold">le luxe ultime : votre temps.</span>
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
                        <SuggestionRotator className="w-full md:w-48" />

                        <div className="relative group">
                            <div className="absolute inset-0 bg-white/30 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
                            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full bg-white/10 backdrop-blur-md border-8 border-white/20 flex flex-col items-center justify-center shadow-2xl">
                                <Clock className="h-6 w-6 text-white mb-1" />
                                <motion.p
                                    key={savings.total}
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-white drop-shadow-sm"
                                >
                                    {savings.total.split(' ')[0]}
                                </motion.p>
                                <p className="text-xs font-black uppercase tracking-widest text-rose-100 mt-1">Heures</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 md:p-12 bg-stone-50/30">
                <TimeSavingsBreakdown savings={savings} meals={meals} />
            </div>
        </Card>
    );
}

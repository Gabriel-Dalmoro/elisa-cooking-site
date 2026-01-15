"use client";

import { motion } from 'framer-motion';
import {
    Salad, Soup, Pizza, Fish, ChefHat,
    Drumstick, Beef, Coffee, Cookie,
    Carrot, Egg, Wheat, Leaf, Flame, Sparkles
} from 'lucide-react';

interface RecipeCardProps {
    recipe: {
        name: string;
        type: string;
    };
    index: number;
}

// Advanced French Smart Icon Logic
const getSmartIcon = (name: string, type: string) => {
    const lowerName = name.toLowerCase();
    const lowerType = type.toLowerCase();

    // 1. Priority by Explicit Type from Google Sheets
    if (lowerType === 'fish' || lowerType === 'poisson') return Fish;
    if (lowerType === 'meats' || lowerType === 'viande') return Beef;
    if (lowerType === 'vegan') return Leaf;
    if (lowerType === 'vegetarian' || lowerType === 'végétarien') return Salad;

    // 2. Secondary Keyword Mapping (Deals with specific ingredients)
    if (lowerName.includes('poulet') || lowerName.includes('dinde') || lowerName.includes('volaille')) return Drumstick;
    if (lowerName.includes('saumon') || lowerName.includes('crevette') || lowerName.includes('cabillaud') || lowerName.includes('merlu')) return Fish;
    if (lowerName.includes('bœuf') || lowerName.includes('steak') || lowerName.includes('haché') || lowerName.includes('veau')) return Beef;
    if (lowerName.includes('pâtes') || lowerName.includes('spaghetti') || lowerName.includes('linguine') || lowerName.includes('tagliatelle')) return Wheat;
    if (lowerName.includes('soupe') || lowerName.includes('velouté') || lowerName.includes('bouillon')) return Soup;
    if (lowerName.includes('salade') || lowerName.includes('bowl') || lowerName.includes('césar')) return Salad;
    if (lowerName.includes('riz') || lowerName.includes('risotto')) return Wheat;
    if (lowerName.includes('mijotté') || lowerName.includes('ragoût') || lowerName.includes('daube')) return Flame;
    if (lowerName.includes('œuf') || lowerName.includes('omelette') || lowerName.includes('brouillés')) return Egg;
    if (lowerName.includes('dessert') || lowerName.includes('chocolat') || lowerName.includes('gâteau')) return Cookie;
    if (lowerName.includes('petit-déjeuner') || lowerName.includes('brunch')) return Coffee;

    return ChefHat; // Elegant fallback
};

const CATEGORY_TRANSLATIONS: Record<string, string> = {
    'Meats': 'Viandes',
    'Fish': 'Poissons',
    'Vegetarian': 'Végétarien',
    'Vegan': 'Vegan'
};

export function RecipeCard({ recipe, index }: RecipeCardProps) {
    const Icon = getSmartIcon(recipe.name, recipe.type);
    const translatedType = CATEGORY_TRANSLATIONS[recipe.type] || recipe.type;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group relative bg-white border border-stone-100/80 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-brand-rose/5 transition-all duration-500 overflow-hidden flex flex-col min-h-[220px]"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-brand-rose/5 flex items-center justify-center text-brand-rose group-hover:bg-brand-rose group-hover:text-white transition-all duration-500 shadow-sm">
                    <Icon className="h-7 w-7" />
                </div>
                {/* Category Badge */}
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300 group-hover:text-brand-rose transition-colors">
                    {translatedType}
                </span>
            </div>

            <h3 className="text-xl font-bold text-stone-900 leading-tight mb-4 group-hover:text-brand-rose transition-colors line-clamp-3">
                {recipe.name}
            </h3>

            <div className="mt-auto flex items-center gap-4 pt-6 border-t border-stone-50">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <Sparkles className="h-3 w-3 text-brand-gold" /> Frais
                </div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <Leaf className="h-3 w-3 text-emerald-500" /> Équilibré
                </div>
            </div>

            {/* Premium background accent */}
            <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-stone-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-700 -z-1 opacity-50" />
        </motion.div>
    );
}

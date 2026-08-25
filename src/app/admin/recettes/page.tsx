'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
    ChefHat, 
    ArrowLeft, 
    Check, 
    Save, 
    Plus, 
    Trash2, 
    Sparkles, 
    BookOpen, 
    Search, 
    Calendar, 
    ArrowRight, 
    RotateCcw,
    Eye,
    Utensils,
    Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { WeeklyDish, WeeklyMenuData, VaultRecipe, DishCategory } from '@/lib/types/cooking-ops';

const CATEGORIES: DishCategory[] = ['viande', 'Végétarien', 'Poisson', 'Végan'];

export default function WeeklyRecipeAndVaultPage() {
    const [activeTab, setActiveTab] = useState<'menu' | 'vault'>('menu');
    const [loading, setLoading] = useState(true);
    const [menu, setMenu] = useState<WeeklyMenuData | null>(null);
    const [vault, setVault] = useState<VaultRecipe[]>([]);
    const [selectedDishIndex, setSelectedDishIndex] = useState<number>(0);
    
    // Dish Editor state for the selected dish in current menu
    const [instructions, setInstructions] = useState<string[]>([]);
    const [chefNotes, setChefNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Vault search & category filter
    const [vaultSearch, setVaultSearch] = useState('');
    const [vaultCategory, setVaultCategory] = useState<string>('all');
    
    // Vault Recipe Detail Modal
    const [inspectedVaultRecipe, setInspectedVaultRecipe] = useState<VaultRecipe | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/cooking-ops/admin');
            if (!res.ok) throw new Error('Erreur de chargement');
            const data = await res.json();
            setMenu(data.weekMenu);
            setVault(data.vaultRecipes || []);
            
            if (data.weekMenu?.recipes?.length > 0) {
                const first = data.weekMenu.recipes[0];
                setInstructions(first.instructions || ['1. ']);
                setChefNotes(first.chefNotes || '');
            }
        } catch (e) {
            console.error('Error loading recipes & vault:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const selectDish = (index: number) => {
        if (!menu?.recipes?.[index]) return;
        setSelectedDishIndex(index);
        const dish = menu.recipes[index];
        setInstructions(dish.instructions && dish.instructions.length > 0 ? [...dish.instructions] : ['1. ']);
        setChefNotes(dish.chefNotes || '');
        setSaveSuccess(false);
    };

    const handleDishNameChange = (index: number, newName: string) => {
        if (!menu) return;
        const updated = [...menu.recipes];
        updated[index] = { ...updated[index], name: newName };
        setMenu({ ...menu, recipes: updated });
    };

    const handleDishCategoryChange = (index: number, newCategory: DishCategory) => {
        if (!menu) return;
        const updated = [...menu.recipes];
        updated[index] = { ...updated[index], category: newCategory };
        setMenu({ ...menu, recipes: updated });
    };

    // AI 1-Click Importer state
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPasteText, setAiPasteText] = useState('');

    const handleImportAiSteps = () => {
        if (!aiPasteText.trim()) return;

        const rawLines = aiPasteText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const parsedSteps = rawLines
            .map(line => {
                return line
                    .replace(/^(\d+[\.\)\-:]|\b(Étape|Etape|Step)\s*\d+[\.\)\-:]|\*+|\-+|\•)\s*/i, '')
                    .trim();
            })
            .filter(line => line.length > 3 && !/^(Ingrédients|Ingredients|Préparation|Preparation|Instructions|Étapes|Etapes)[\s:]*$/i.test(line));

        if (parsedSteps.length > 0) {
            setInstructions(parsedSteps);
            setAiPasteText('');
            setIsAiModalOpen(false);
        } else {
            alert('Aucune étape détectée. Vérifiez le texte collé.');
        }
    };

    const handleAddStep = () => {
        setInstructions(prev => [...prev, '']);
    };

    const handleRemoveStep = (index: number) => {
        setInstructions(prev => prev.filter((_, i) => i !== index));
    };

    const handleStepChange = (index: number, val: string) => {
        setInstructions(prev => {
            const next = [...prev];
            next[index] = val;
            return next;
        });
    };

    // Save individual recipe instructions for currently selected dish
    const handleSaveCurrentRecipe = async () => {
        if (!menu?.recipes?.[selectedDishIndex]) return;
        const currentDish = menu.recipes[selectedDishIndex];

        try {
            setIsSaving(true);
            const res = await fetch('/api/cooking-ops/admin/recipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dishId: currentDish.id,
                    name: currentDish.name,
                    category: currentDish.category,
                    instructions: instructions.filter(s => s.trim().length > 0),
                    chefNotes
                })
            });

            if (!res.ok) throw new Error('Erreur lors de l’enregistrement');
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);

            // Update local state
            const updated = [...menu.recipes];
            updated[selectedDishIndex] = {
                ...updated[selectedDishIndex],
                instructions,
                chefNotes
            };
            setMenu({ ...menu, recipes: updated });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erreur';
            alert(message);
        } finally {
            setIsSaving(false);
        }
    };

    // Save entire weekly menu (all 8 dishes names & categories)
    const handleSaveEntireMenu = async () => {
        if (!menu) return;
        try {
            setIsSaving(true);
            const res = await fetch('/api/cooking-ops/admin/recipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dishes: menu.recipes
                })
            });

            if (!res.ok) throw new Error('Erreur');
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
            loadData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erreur';
            alert(message);
        } finally {
            setIsSaving(false);
        }
    };

    // Import past recipe from vault into current menu slot
    const handleImportFromVault = (vaultRecipe: VaultRecipe, targetIndex?: number) => {
        if (!menu) return;
        const indexToUse = targetIndex !== undefined ? targetIndex : selectedDishIndex;
        const updated = [...menu.recipes];
        updated[indexToUse] = {
            ...updated[indexToUse],
            name: vaultRecipe.name,
            category: vaultRecipe.category,
            instructions: vaultRecipe.instructions || [],
            chefNotes: vaultRecipe.chefNotes || ''
        };
        setMenu({ ...menu, recipes: updated });
        setSelectedDishIndex(indexToUse);
        setInstructions(vaultRecipe.instructions || []);
        setChefNotes(vaultRecipe.chefNotes || '');
        setInspectedVaultRecipe(null);
        setActiveTab('menu');
    };

    const filteredVault = vault.filter(r => {
        const matchesCategory = vaultCategory === 'all' || r.category.toLowerCase() === vaultCategory.toLowerCase();
        const matchesSearch = !vaultSearch.trim() || r.name.toLowerCase().includes(vaultSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const currentDish = menu?.recipes?.[selectedDishIndex];

    const getCategoryBadgeClass = (cat: string) => {
        switch (cat.toLowerCase()) {
            case 'viande':
                return 'bg-amber-50 text-amber-900 border-amber-200';
            case 'poisson':
                return 'bg-blue-50 text-blue-900 border-blue-200';
            case 'végan':
                return 'bg-emerald-50 text-emerald-900 border-emerald-200';
            default:
                return 'bg-green-50 text-green-900 border-green-200';
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-28 font-sans">
            {/* Standardized Header */}
            <AdminPageHeader
                badgeText="ESPACE ADMIN • GESTION DU MENU"
                title="Gestion Menu & Recettes"
                subtitle="Composez les 8 plats de votre menu hebdomadaire, piochez dans vos 100+ recettes passées et générez votre visuel Instagram Stories."
                backHref="/admin"
                backLabel="Retour à l'admin"
                actionElement={
                    <Link href="/admin/menu-visuel">
                        <Button
                            size="sm"
                            className="bg-[#E1567A] hover:bg-[#c94567] text-white text-xs h-9 px-4 gap-2 shadow-xs font-semibold rounded-full"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Générer Visuel Instagram
                        </Button>
                    </Link>
                }
            />

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 space-y-6">

                {/* Sub-Header Tabs & Quick Actions */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-rose-50 text-[#E1567A] border-[#E1567A]/30 text-xs py-1 px-3 rounded-full font-bold">
                            {menu?.weekLabel || 'Menu Actif'}
                        </Badge>
                        <span className="text-xs text-stone-500 font-medium">
                            • 8 Plats au menu
                        </span>
                    </div>

                    {/* Tabs Switcher */}
                    <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-start md:self-auto">
                        <button
                            onClick={() => setActiveTab('menu')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === 'menu' 
                                    ? 'bg-white text-stone-900 shadow-xs' 
                                    : 'text-stone-500 hover:text-stone-900'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5 text-[#E1567A]" />
                            Menu Actif (8 Plats)
                        </button>
                        <button
                            onClick={() => setActiveTab('vault')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === 'vault' 
                                    ? 'bg-white text-stone-900 shadow-xs' 
                                    : 'text-stone-500 hover:text-stone-900'
                            }`}
                        >
                            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                            Banque de Recettes ({vault.length})
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-stone-500 border border-stone-200">
                        Chargement des recettes...
                    </div>
                ) : activeTab === 'menu' ? (
                    /* TAB 1: WEEKLY MENU & RECIPE DETAILS EDITOR */
                    <div className="space-y-6">
                        {/* Quick Visual Instagram Banner */}
                        <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 rounded-3xl p-5 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-[#E1567A] text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                                        Prêt à publier vos 8 plats sur les réseaux sociaux ?
                                    </h3>
                                    <p className="text-xs text-stone-600 mt-0.5">
                                        Téléchargez en 1 clic votre flyer 9:16 aux couleurs d&apos;Elisa pour Instagram Stories et WhatsApp.
                                    </p>
                                </div>
                            </div>

                            <Link href="/admin/menu-visuel">
                                <Button size="sm" className="bg-[#E1567A] hover:bg-[#c94567] text-white text-xs h-9 px-4 gap-1.5 rounded-full font-semibold shrink-0 shadow-xs">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    Voir le Flyer Instagram
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left: 8 Dishes List & Quick Renamer */}
                            <div className="lg:col-span-5 space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                                        Les 8 Plats de la semaine
                                    </h2>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={handleSaveEntireMenu}
                                        className="text-[11px] h-7 px-3 rounded-full border-stone-300 font-semibold"
                                    >
                                        Sauvegarder les 8 plats
                                    </Button>
                                </div>

                                <div className="space-y-2.5">
                                    {menu?.recipes.map((dish, idx) => {
                                        const isSelected = selectedDishIndex === idx;
                                        return (
                                            <div
                                                key={dish.id || idx}
                                                onClick={() => selectDish(idx)}
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-rose-50/70 border-[#E1567A] shadow-xs ring-2 ring-[#E1567A]/20'
                                                        : 'bg-white border-stone-200 hover:border-stone-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="text-[11px] font-bold text-[#E1567A] uppercase">
                                                        Plat #{idx + 1}
                                                    </span>
                                                    
                                                    {/* Category Selector */}
                                                    <select
                                                        value={dish.category}
                                                        onChange={e => handleDishCategoryChange(idx, e.target.value as DishCategory)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="text-[11px] font-semibold bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5 text-stone-700 focus:outline-none"
                                                    >
                                                        {CATEGORIES.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Editable Dish Title */}
                                                <input
                                                    type="text"
                                                    value={dish.name}
                                                    onChange={e => handleDishNameChange(idx, e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                    placeholder={`Nom du plat #${idx + 1}...`}
                                                    className="w-full text-xs font-serif font-bold text-stone-900 bg-transparent border-b border-stone-200 focus:border-[#E1567A] focus:outline-none pb-1"
                                                />

                                                <div className="flex items-center justify-between pt-2 text-[10px] text-stone-400">
                                                    <span>{dish.instructions?.length || 0} étapes de cuisson</span>
                                                    <span className="text-[#E1567A] font-semibold flex items-center gap-0.5">
                                                        Éditer la recette <ArrowRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Step-by-Step Cooking Instructions & Chef Notes */}
                            <div className="lg:col-span-7 space-y-4">
                                {currentDish ? (
                                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                                            <div>
                                                <Badge variant="outline" className="bg-rose-50 text-[#E1567A] border-[#E1567A]/30 text-xs mb-1.5 rounded-full">
                                                    Plat #{selectedDishIndex + 1} • {currentDish.category}
                                                </Badge>
                                                <h2 className="text-xl font-serif font-bold text-stone-900">
                                                    {currentDish.name}
                                                </h2>
                                            </div>

                                            <Button
                                                onClick={handleSaveCurrentRecipe}
                                                disabled={isSaving}
                                                className="bg-[#E1567A] hover:bg-[#c94567] text-white text-xs h-9 px-4 gap-1.5 shadow-sm font-semibold rounded-full shrink-0"
                                            >
                                                {saveSuccess ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-white" />
                                                        Enregistré ✓
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-3.5 h-3.5" />
                                                        {isSaving ? 'Enregistrement...' : 'Enregistrer cette recette'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Instructions Step-by-Step Editor */}
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                                                    Étapes de préparation & cuisson ({instructions.length})
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAiModalOpen(true)}
                                                        className="text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                                        ✨ Coller ChatGPT / Gemini
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddStep}
                                                        className="text-xs text-[#E1567A] hover:underline font-semibold flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Ajouter
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                {instructions.map((step, sIdx) => (
                                                    <div key={sIdx} className="flex items-start gap-2">
                                                        <span className="text-xs font-bold text-[#E1567A] bg-rose-50 border border-rose-200 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-2">
                                                            {sIdx + 1}
                                                        </span>
                                                        <textarea
                                                            rows={2}
                                                            value={step}
                                                            onChange={e => handleStepChange(sIdx, e.target.value)}
                                                            placeholder={`Détaillez l'étape ${sIdx + 1}...`}
                                                            className="flex-1 text-xs p-2.5 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                                        />
                                                        {instructions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveStep(sIdx)}
                                                                className="text-stone-400 hover:text-red-500 p-2 shrink-0 mt-1"
                                                                title="Supprimer cette étape"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chef Internal Notes */}
                                        <div className="pt-2">
                                            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                                                Notes & astuces cuisine (visible uniquement dans votre fiche cuisine)
                                            </label>
                                            <input
                                                type="text"
                                                value={chefNotes}
                                                onChange={e => setChefNotes(e.target.value)}
                                                placeholder="Ex: Garder la sauce au frais, cuisson à 58°C, attention aux arêtes..."
                                                className="w-full text-xs p-3 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                            />
                                        </div>

                                        <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('vault')}
                                                className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" /> Remplacer depuis la Banque de Recettes
                                            </button>

                                            <Button
                                                onClick={handleSaveCurrentRecipe}
                                                disabled={isSaving}
                                                className="bg-[#E1567A] hover:bg-[#c94567] text-white text-xs h-9 px-4 gap-1.5 shadow-sm font-semibold rounded-full"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                {isSaving ? 'Enregistrement...' : 'Enregistrer la recette'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                        </div>
                    </div>
                ) : (
                    /* TAB 2: CLEAN READABLE RECIPE VAULT TABLE */
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-stone-900">
                                    Banque de Recettes Historique ({filteredVault.length} plats)
                                </h2>
                                <p className="text-xs text-stone-500 mt-1">
                                    Toutes les recettes créées par Elisa depuis les débuts. Cliquez sur une ligne pour voir les détails ou l&apos;ajouter au menu.
                                </p>
                            </div>

                            {/* Search & Category Filter */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={vaultSearch}
                                        onChange={e => setVaultSearch(e.target.value)}
                                        placeholder="Rechercher un plat..."
                                        className="text-xs pl-8 pr-3 py-2 rounded-full border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#E1567A] w-48 sm:w-60 bg-stone-50"
                                    />
                                </div>

                                <select
                                    value={vaultCategory}
                                    onChange={e => setVaultCategory(e.target.value)}
                                    className="text-xs py-2 px-3 rounded-full border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#E1567A] bg-stone-50 text-stone-700 font-medium"
                                >
                                    <option value="all">Toutes les catégories</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Clean Table View */}
                        <div className="overflow-x-auto rounded-2xl border border-stone-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="py-3 px-4">Nom du Plat</th>
                                        <th className="py-3 px-4">Catégorie</th>
                                        <th className="py-3 px-4 text-center">Fois Préparé</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-150">
                                    {filteredVault.map((recipe) => (
                                        <tr 
                                            key={recipe.id}
                                            onClick={() => setInspectedVaultRecipe(recipe)}
                                            className="hover:bg-rose-50/40 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-3.5 px-4 font-serif font-bold text-stone-900 text-sm">
                                                {recipe.name}
                                                {recipe.chefNotes && (
                                                    <span className="block font-sans font-normal text-[11px] text-stone-500 italic mt-0.5 line-clamp-1">
                                                        {recipe.chefNotes}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <Badge variant="outline" className={`text-[11px] font-semibold rounded-full border ${getCategoryBadgeClass(recipe.category)}`}>
                                                    {recipe.category}
                                                </Badge>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="text-[11px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                                                    {recipe.timesUsed || 1}x
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setInspectedVaultRecipe(recipe)}
                                                    className="text-xs h-7 px-2.5 text-stone-600 hover:text-stone-900 rounded-full"
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                    Détails
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    onClick={() => handleImportFromVault(recipe)}
                                                    className="bg-[#E1567A] hover:bg-[#c94567] text-white text-[11px] h-7 px-3 rounded-full font-semibold"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Plat #{selectedDishIndex + 1}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </main>

            {/* Recipe Details Inspection Modal */}
            <Dialog open={!!inspectedVaultRecipe} onOpenChange={(open) => !open && setInspectedVaultRecipe(null)}>
                <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs rounded-full border ${inspectedVaultRecipe ? getCategoryBadgeClass(inspectedVaultRecipe.category) : ''}`}>
                                {inspectedVaultRecipe?.category}
                            </Badge>
                            {inspectedVaultRecipe?.timesUsed && (
                                <span className="text-xs text-stone-500 font-medium">
                                    Préparé {inspectedVaultRecipe.timesUsed} fois
                                </span>
                            )}
                        </div>
                        <DialogTitle className="font-serif text-xl font-bold text-stone-900 text-left">
                            {inspectedVaultRecipe?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-3 text-xs">
                        {/* Chef tips */}
                        {inspectedVaultRecipe?.chefNotes && (
                            <div className="bg-amber-50 text-amber-900 p-3 rounded-2xl border border-amber-200 italic">
                                <span className="font-semibold not-italic">Astuce chef :</span> {inspectedVaultRecipe.chefNotes}
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="space-y-2">
                            <h4 className="font-bold uppercase tracking-wider text-stone-600 text-[11px]">
                                Étapes de préparation enregistrées :
                            </h4>
                            <div className="space-y-1.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                                {inspectedVaultRecipe?.instructions && inspectedVaultRecipe.instructions.length > 0 ? (
                                    inspectedVaultRecipe.instructions.map((step, sIdx) => (
                                        <p key={sIdx} className="text-stone-700 leading-relaxed">
                                            {step}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-stone-400 italic">Aucune consigne spécifique détaillée.</p>
                                )}
                            </div>
                        </div>

                        {/* Slot selector for import */}
                        <div className="pt-2 border-t border-stone-200">
                            <label className="font-bold block text-stone-700 mb-2">
                                Placer ce plat dans le menu actif :
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[0, 1, 2, 3, 4, 5, 6, 7].map((slotIdx) => (
                                    <button
                                        key={slotIdx}
                                        type="button"
                                        onClick={() => inspectedVaultRecipe && handleImportFromVault(inspectedVaultRecipe, slotIdx)}
                                        className="py-1.5 px-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-[#E1567A] hover:text-white hover:border-[#E1567A] text-[11px] font-semibold transition-colors"
                                    >
                                        Plat #{slotIdx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AI 1-Click Steps Import Modal */}
            <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                <DialogContent className="sm:max-w-xl bg-white rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-600" />
                            Coller la réponse ChatGPT / Gemini
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2 text-xs">
                        <p className="text-stone-600 leading-relaxed">
                            Collez directement le texte brut ou la liste des étapes fournie par votre IA pour <strong>{menu?.recipes?.[selectedDishIndex]?.name || 'ce plat'}</strong>. Le système nettoiera et numérotera automatiquement chaque étape.
                        </p>
                        <textarea
                            rows={10}
                            value={aiPasteText}
                            onChange={e => setAiPasteText(e.target.value)}
                            placeholder={`Exemple :\n1. Cuire le rôti de veau à 58°C à cœur au four doux...\n2. Mixer le thon égoutté avec la mayonnaise, câpres et citron pour la sauce...\n3. Trancher finement et dresser avec les herbes...`}
                            className="w-full text-xs p-3.5 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none font-mono"
                        />
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsAiModalOpen(false)}
                                className="rounded-full text-xs h-9 px-4 border-stone-300"
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleImportAiSteps}
                                className="bg-[#E1567A] hover:bg-[#c94567] text-white rounded-full text-xs h-9 px-5 font-bold shadow-xs gap-1.5"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Importer & Numéroter les étapes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

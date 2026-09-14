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
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useConfirm } from '@/components/admin/useConfirm';
import { useToast } from '@/components/admin/useToast';
import { WeeklyDish, WeeklyMenuData, VaultRecipe, DishCategory, MenuStatus } from '@/lib/types/cooking-ops';

const CATEGORIES: DishCategory[] = ['Viande', 'Végétarien', 'Poisson', 'Végan'];

type VaultSort = 'recent' | 'oldest' | 'used' | 'name';

const VAULT_SORTS: { value: VaultSort; label: string }[] = [
    { value: 'recent', label: 'Plus récentes' },
    { value: 'oldest', label: 'Plus anciennes' },
    { value: 'used', label: 'Plus utilisées' },
    { value: 'name', label: 'Ordre alphabétique' }
];

const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit', timeZone: 'Europe/Paris' });
};

const MENU_SLOTS = 8;

function newDishId(): string {
    const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    return `dish_${random}`;
}

const emptyDish = (): WeeklyDish => ({ id: newDishId(), name: '', category: 'Viande', instructions: [], chefNotes: '' });

// The editor always shows 8 slots; empty slots are dropped when saving
function padToSlots(dishes: WeeklyDish[]): WeeklyDish[] {
    const padded = [...dishes];
    while (padded.length < MENU_SLOTS) padded.push(emptyDish());
    return padded;
}

const STATUS_LABELS: Record<MenuStatus, { label: string; className: string }> = {
    draft: { label: 'Brouillon — invisible pour les clients', className: 'bg-amber-50 text-amber-800 border-amber-300' },
    open: { label: 'Ouvert — les clients peuvent choisir', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    closed: { label: 'Clôturé — choix verrouillés', className: 'bg-stone-200 text-stone-700 border-stone-300' }
};

export default function WeeklyRecipeAndVaultPage() {
    const [activeTab, setActiveTab] = useState<'menu' | 'vault'>('menu');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    // Week being edited: 0 = this week, 1 = next week (default: menus are prepared in advance)
    const [weekOffset, setWeekOffset] = useState<number | null>(null);
    const [menu, setMenu] = useState<WeeklyMenuData | null>(null);
    const [vault, setVault] = useState<VaultRecipe[]>([]);
    const [selectedDishIndex, setSelectedDishIndex] = useState<number>(0);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Vault search & category filter
    const [vaultSearch, setVaultSearch] = useState('');
    const [vaultCategory, setVaultCategory] = useState<string>('all');
    const [vaultSort, setVaultSort] = useState<VaultSort>('recent');
    const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);

    const { confirm, alert, confirmDialog } = useConfirm();
    const { showToast, toastElement } = useToast();
    
    // Vault Recipe Detail Modal
    const [inspectedVaultRecipe, setInspectedVaultRecipe] = useState<VaultRecipe | null>(null);

    // Read ?offset= once (links from the planning / flyer pages)
    useEffect(() => {
        const param = new URLSearchParams(window.location.search).get('offset');
        const parsed = param !== null ? parseInt(param, 10) : NaN;
        setWeekOffset(isNaN(parsed) ? 1 : parsed);
    }, []);

    const loadData = async (offset: number) => {
        try {
            setLoading(true);
            setLoadError(null);
            const res = await fetch(`/api/cooking-ops/admin/menu?offset=${offset}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Erreur de chargement');
            setMenu({ ...data.menu, recipes: padToSlots(data.menu.recipes) });
            setVault(data.vault || []);
            setSelectedDishIndex(0);
            setIsDirty(false);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (weekOffset !== null) loadData(weekOffset);
    }, [weekOffset]);

    // Warn before leaving the page with unsaved changes
    useEffect(() => {
        if (!isDirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isDirty]);

    const changeWeek = async (delta: number) => {
        if (isDirty && !(await confirm({
            title: 'Modifications non enregistrées',
            description: 'Vos changements sur ce menu seront perdus si vous changez de semaine maintenant.',
            confirmLabel: 'Changer quand même',
            tone: 'danger'
        }))) return;
        setWeekOffset(w => (w ?? 1) + delta);
    };

    const updateDish = (index: number, patch: Partial<WeeklyDish>) => {
        setMenu(prev => {
            if (!prev) return prev;
            const recipes = [...prev.recipes];
            recipes[index] = { ...recipes[index], ...patch };
            return { ...prev, recipes };
        });
        setIsDirty(true);
        setSaveSuccess(false);
    };

    const currentDish = menu?.recipes?.[selectedDishIndex];
    const currentInstructions = currentDish?.instructions && currentDish.instructions.length > 0 ? currentDish.instructions : [''];
    const updateCurrentDish = (patch: Partial<WeeklyDish>) => updateDish(selectedDishIndex, patch);

    const selectDish = (index: number) => {
        if (!menu?.recipes?.[index]) return;
        setSelectedDishIndex(index);
        setSaveSuccess(false);
    };

    const handleDishNameChange = (index: number, newName: string) => updateDish(index, { name: newName });

    const handleDishCategoryChange = (index: number, newCategory: DishCategory) => updateDish(index, { category: newCategory });

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
            updateCurrentDish({ instructions: parsedSteps });
            setAiPasteText('');
            setIsAiModalOpen(false);
        } else {
            alert({ title: 'Aucune étape détectée', description: 'Vérifiez le texte collé : chaque étape doit être sur sa propre ligne.' });
        }
    };

    const handleAddStep = () => updateCurrentDish({ instructions: [...currentInstructions, ''] });

    const handleRemoveStep = (index: number) => updateCurrentDish({ instructions: currentInstructions.filter((_, i) => i !== index) });

    const handleStepChange = (index: number, val: string) => {
        const next = [...currentInstructions];
        next[index] = val;
        updateCurrentDish({ instructions: next });
    };

    const handleClearCurrentDish = async () => {
        if (currentDish?.name && !(await confirm({
            title: `Retirer « ${currentDish.name} » du menu ?`,
            description: 'Le plat reste dans la banque de recettes, il est seulement retiré de cette semaine.',
            confirmLabel: 'Retirer du menu',
            tone: 'danger'
        }))) return;
        updateDish(selectedDishIndex, emptyDish());
    };

    const handleDeleteVaultRecipe = async (recipe: VaultRecipe) => {
        if (!(await confirm({
            title: `Supprimer « ${recipe.name} » ?`,
            description: 'Cette recette sera retirée définitivement de la banque. Les menus qui l’utilisent déjà ne changent pas.',
            confirmLabel: 'Supprimer',
            tone: 'danger'
        }))) return;

        try {
            setDeletingRecipeId(recipe.id);
            const res = await fetch(`/api/cooking-ops/admin/vault/${encodeURIComponent(recipe.id)}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Suppression impossible');
            setVault(prev => prev.filter(r => r.id !== recipe.id));
            showToast(`« ${recipe.name} » supprimée de la banque`, 'check');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Suppression impossible', 'error');
        } finally {
            setDeletingRecipeId(null);
        }
    };

    // Saves all dishes of the week (names, categories, steps, notes) and updates the recipe bank
    const saveMenu = async (): Promise<boolean> => {
        if (!menu) return false;
        try {
            setIsSaving(true);
            setActionError(null);
            const res = await fetch('/api/cooking-ops/admin/menu', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekStart: menu.weekStart, dishes: menu.recipes })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Erreur lors de l’enregistrement');
            setMenu({ ...data.menu, recipes: padToSlots(data.menu.recipes) });
            setIsDirty(false);
            setSaveSuccess(true);
            showToast('Menu enregistré', 'check');
            setTimeout(() => setSaveSuccess(false), 2500);
            // Refresh the bank so new recipes / edited steps show up there
            fetch(`/api/cooking-ops/admin/menu?offset=${weekOffset}`).then(r => r.json()).then(d => d.vault && setVault(d.vault)).catch(() => undefined);
            return true;
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Erreur');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const changeStatus = async (status: MenuStatus) => {
        if (!menu) return;
        const dialogOptions = status === 'open'
            ? { title: 'Ouvrir le menu aux clients ?', description: `Les liens clients afficheront le menu de la ${menu.weekLabel.toLowerCase()} et les clients pourront envoyer leurs choix.`, confirmLabel: 'Ouvrir aux clients' }
            : status === 'closed'
                ? { title: 'Clôturer les choix ?', description: 'Les clients ne pourront plus envoyer ni modifier leur sélection.', confirmLabel: 'Clôturer', tone: 'danger' as const }
                : { title: 'Repasser en brouillon ?', description: 'Les liens clients n’afficheront plus ce menu.', confirmLabel: 'Repasser en brouillon', tone: 'danger' as const };
        if (!(await confirm(dialogOptions))) return;

        // Save pending edits first so clients see the latest version
        if (isDirty && !(await saveMenu())) return;

        try {
            setIsSaving(true);
            setActionError(null);
            const res = await fetch('/api/cooking-ops/admin/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekStart: menu.weekStart, status })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Erreur');
            setMenu({ ...data.menu, recipes: padToSlots(data.menu.recipes) });
            showToast(
                status === 'open' ? 'Menu ouvert aux clients' : status === 'closed' ? 'Choix clôturés' : 'Menu repassé en brouillon',
                'check'
            );
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Erreur');
        } finally {
            setIsSaving(false);
        }
    };

    // Import past recipe from vault into current menu slot (a new dish id: it's a different dish)
    const handleImportFromVault = (vaultRecipe: VaultRecipe, targetIndex?: number) => {
        if (!menu) return;
        const indexToUse = targetIndex !== undefined ? targetIndex : selectedDishIndex;
        updateDish(indexToUse, {
            id: newDishId(),
            name: vaultRecipe.name,
            category: vaultRecipe.category,
            instructions: vaultRecipe.instructions || [],
            chefNotes: vaultRecipe.chefNotes || ''
        });
        setSelectedDishIndex(indexToUse);
        setInspectedVaultRecipe(null);
        setActiveTab('menu');
    };

    const filteredVault = vault
        .filter(r => {
            const matchesCategory = vaultCategory === 'all' || r.category.toLowerCase() === vaultCategory.toLowerCase();
            const matchesSearch = !vaultSearch.trim() || r.name.toLowerCase().includes(vaultSearch.toLowerCase());
            return matchesCategory && matchesSearch;
        })
        .sort((a, b) => {
            switch (vaultSort) {
                case 'oldest': return (a.createdAt || '').localeCompare(b.createdAt || '');
                case 'used': return (b.timesUsed || 0) - (a.timesUsed || 0);
                case 'name': return a.name.localeCompare(b.name, 'fr');
                default: return (b.createdAt || '').localeCompare(a.createdAt || '');
            }
        });

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
                    <Link href={`/admin/menu-visuel?offset=${weekOffset ?? 1}`}>
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
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => changeWeek(-1)}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
                                title="Semaine précédente"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <Badge variant="outline" className="bg-rose-50 text-[#E1567A] border-[#E1567A]/30 text-xs py-1 px-3 rounded-full font-bold">
                                {menu?.weekLabel || 'Chargement...'}
                            </Badge>
                            <button
                                onClick={() => changeWeek(1)}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
                                title="Semaine suivante"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        {menu && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_LABELS[menu.status].className}`}>
                                    {STATUS_LABELS[menu.status].label}
                                </span>
                                {menu.status !== 'open' && (
                                    <Button size="sm" onClick={() => changeStatus('open')} disabled={isSaving}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-3 rounded-full font-bold">
                                        {menu.status === 'closed' ? 'Rouvrir aux clients' : 'Ouvrir aux clients'}
                                    </Button>
                                )}
                                {menu.status === 'open' && (
                                    <Button size="sm" variant="outline" onClick={() => changeStatus('closed')} disabled={isSaving}
                                        className="text-[11px] h-7 px-3 rounded-full font-bold border-stone-300">
                                        Clôturer les choix
                                    </Button>
                                )}
                                {menu.status !== 'draft' && (
                                    <button onClick={() => changeStatus('draft')} disabled={isSaving}
                                        className="text-[11px] text-stone-500 hover:text-stone-800 underline">
                                        Repasser en brouillon
                                    </button>
                                )}
                            </div>
                        )}
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

                {(loadError || actionError) && (
                    <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-3xl text-sm font-semibold">
                        {loadError || actionError}
                    </div>
                )}

                {menu?.status === 'open' && isDirty && (
                    <div className="bg-amber-50 text-amber-900 border border-amber-300 p-3 rounded-2xl text-xs font-semibold">
                        Ce menu est ouvert aux clients : vos modifications seront visibles dès l&apos;enregistrement. Si vous retirez un plat déjà choisi, prévenez les clients concernés.
                    </div>
                )}

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

                            <Link href={`/admin/menu-visuel?offset=${weekOffset ?? 1}`}>
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
                                        onClick={() => saveMenu()}
                                        disabled={isSaving || !isDirty}
                                        className={`text-[11px] h-7 px-3 rounded-full font-semibold ${isDirty ? 'bg-[#E1567A] hover:bg-[#c94567] text-white' : 'bg-stone-100 text-stone-500'}`}
                                    >
                                        {isSaving ? 'Enregistrement...' : isDirty ? 'Enregistrer le menu' : saveSuccess ? 'Enregistré ✓' : 'Menu enregistré'}
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
                                                <input
                                                    type="text"
                                                    value={currentDish.name}
                                                    onChange={e => updateCurrentDish({ name: e.target.value })}
                                                    placeholder={`Nom du plat #${selectedDishIndex + 1}...`}
                                                    className="text-xl font-serif font-bold text-stone-900 bg-transparent border-b border-dashed border-stone-300 focus:border-[#E1567A] focus:outline-none pb-1 w-full"
                                                    title="Cliquez pour modifier le nom du plat"
                                                />
                                            </div>

                                            <Button
                                                onClick={() => saveMenu()}
                                                disabled={isSaving || !isDirty}
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
                                                        {isSaving ? 'Enregistrement...' : 'Enregistrer le menu'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Instructions Step-by-Step Editor */}
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                                                    Étapes de préparation & cuisson ({currentInstructions.filter(st => st.trim()).length})
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
                                                {currentInstructions.map((step, sIdx) => (
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
                                                        {currentInstructions.length > 1 && (
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
                                                value={currentDish.chefNotes || ''}
                                                onChange={e => updateCurrentDish({ chefNotes: e.target.value })}
                                                placeholder="Ex: Garder la sauce au frais, cuisson à 58°C, attention aux arêtes..."
                                                className="w-full text-xs p-3 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                            />
                                        </div>

                                        <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                                            <div className="flex flex-col items-start gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('vault')}
                                                    className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" /> Remplacer depuis la Banque de Recettes
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleClearCurrentDish}
                                                    className="text-xs text-stone-400 hover:text-red-600 flex items-center gap-1 font-medium"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Retirer ce plat du menu
                                                </button>
                                            </div>

                                            <Button
                                                onClick={() => saveMenu()}
                                                disabled={isSaving || !isDirty}
                                                className="bg-[#E1567A] hover:bg-[#c94567] text-white text-xs h-9 px-4 gap-1.5 shadow-sm font-semibold rounded-full"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                {isSaving ? 'Enregistrement...' : 'Enregistrer le menu'}
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
                                    value={vaultSort}
                                    onChange={e => setVaultSort(e.target.value as VaultSort)}
                                    className="text-xs py-2 px-3 rounded-full border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#E1567A] bg-stone-50 text-stone-700 font-medium cursor-pointer"
                                    title="Trier les recettes"
                                >
                                    {VAULT_SORTS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>

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
                                        <th className="py-3 px-4 text-center whitespace-nowrap">Ajoutée le</th>
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
                                                    {recipe.timesUsed || 0}x
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center text-[11px] text-stone-500 whitespace-nowrap">
                                                {formatDate(recipe.createdAt)}
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

                                                <button
                                                    onClick={() => handleDeleteVaultRecipe(recipe)}
                                                    disabled={deletingRecipeId === recipe.id}
                                                    className="p-1.5 rounded-xl text-stone-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer align-middle"
                                                    title="Supprimer cette recette de la banque"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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

            {confirmDialog}
            {toastElement}

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

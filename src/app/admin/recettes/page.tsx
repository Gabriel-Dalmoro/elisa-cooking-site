'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Check,
    Save,
    Plus,
    Trash2,
    BookOpen,
    Search,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useConfirm } from '@/components/admin/useConfirm';
import { useToast } from '@/components/admin/useToast';
import RecipeBoxes from '@/components/admin/RecipeBoxes';
import DishDietPanel, { DietClient } from '@/components/admin/DishDietPanel';
import { DietIssue, dietLabel, dietsFromAllergies, DIET_KEYS, menuDietIssues } from '@/lib/diets';
import { splitRecipe } from '@/lib/grocery/parse';
import { WeeklyDish, WeeklyMenuData, VaultRecipe, DishCategory, MenuStatus, Season, SEASONS, SEASON_LABELS } from '@/lib/types/cooking-ops';
import { AutoTextarea, StorageFields, StorageBadges } from '@/components/admin/DishFields';

const CATEGORIES: DishCategory[] = ['Viande', 'Végétarien', 'Poisson', 'Végan'];

type VaultSort = 'recent' | 'oldest' | 'used' | 'chosen' | 'name';

const VAULT_SORTS: { value: VaultSort; label: string }[] = [
    { value: 'recent', label: 'Plus récentes' },
    { value: 'chosen', label: 'Plus choisies' },
    { value: 'used', label: 'Plus souvent au menu' },
    { value: 'oldest', label: 'Plus anciennes' },
    { value: 'name', label: 'A → Z' }
];

const MENU_SLOTS = 8;

function newDishId(): string {
    const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    return `dish_${random}`;
}

const emptyDish = (): WeeklyDish => ({ id: newDishId(), name: '', category: 'Viande', ingredients: '', instructions: [], chefNotes: '' });

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
    // Regular clients with a diet: every dish must suit them (adapted or replaced)
    const [dietClients, setDietClients] = useState<DietClient[]>([]);
    const [selectedDishIndex, setSelectedDishIndex] = useState<number>(0);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Vault search & category filter
    const [vaultSearch, setVaultSearch] = useState('');
    const [vaultCategory, setVaultCategory] = useState<string>('all');
    const [vaultSort, setVaultSort] = useState<VaultSort>('recent');
    const [vaultSeason, setVaultSeason] = useState<Season | 'all' | 'none'>('all');
    const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);

    const { confirm, confirmDialog } = useConfirm();
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
            setDietClients(data.dietClients || []);
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

    // What's still to adapt this week, per dish (every client must get 8 dishes that suit them)
    const dietIssues = useMemo(
        () => (menu ? menuDietIssues(menu.recipes.filter(d => d.name.trim()), dietClients) : []),
        [menu, dietClients]
    );
    const dietCounts = useMemo(() => {
        const counts = new Map<string, string[]>();
        for (const c of dietClients) for (const d of dietsFromAllergies(c.allergies)) counts.set(d, [...(counts.get(d) || []), c.name]);
        return DIET_KEYS.filter(d => counts.has(d)).map(d => ({ diet: d, clients: counts.get(d)! }));
    }, [dietClients]);

    const currentDish = menu?.recipes?.[selectedDishIndex];
    // The recipe is one free text (older recipes saved as separate steps are shown joined, one per line)
    const currentRecipeText = (currentDish?.instructions || []).join('\n');
    const updateCurrentDish = (patch: Partial<WeeklyDish>) => updateDish(selectedDishIndex, patch);

    const selectDish = (index: number) => {
        if (!menu?.recipes?.[index]) return;
        setSelectedDishIndex(index);
        setSaveSuccess(false);
    };

    const handleDishNameChange = (index: number, newName: string) => updateDish(index, { name: newName });

    const handleDishCategoryChange = (index: number, newCategory: DishCategory) => updateDish(index, { category: newCategory });

    const handleRecipeChange = ({ ingredients, steps }: { ingredients: string; steps: string }) =>
        updateCurrentDish({ ingredients, instructions: steps ? [steps] : [] });

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

    const describeIssues = (issues: DietIssue[]) =>
        issues.map(i => `• ${i.dishName} — ${i.diets.map(dietLabel).join(' + ')} (${i.clients.join(', ')})`).join('\n');

    const changeStatus = async (status: MenuStatus, force = false) => {
        if (!menu) return;
        const dialogOptions = status === 'open'
            ? { title: 'Ouvrir le menu aux clients ?', description: `Les liens clients afficheront le menu de la ${menu.weekLabel.toLowerCase()} et les clients pourront envoyer leurs choix. Si un autre menu est encore ouvert, chaque client choisira la semaine sur son lien (le même lien).`, confirmLabel: 'Ouvrir aux clients' }
            : status === 'closed'
                ? { title: 'Clôturer les choix ?', description: 'Les clients ne pourront plus envoyer ni modifier leur sélection.', confirmLabel: 'Clôturer', tone: 'danger' as const }
                : { title: 'Repasser en brouillon ?', description: 'Les liens clients n’afficheront plus ce menu.', confirmLabel: 'Repasser en brouillon', tone: 'danger' as const };
        if (!force && !(await confirm(dialogOptions))) return;

        // Save pending edits first so clients see the latest version
        if (isDirty && !(await saveMenu())) return;

        try {
            setIsSaving(true);
            setActionError(null);
            const res = await fetch('/api/cooking-ops/admin/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekStart: menu.weekStart, status, force })
            });
            const data = await res.json().catch(() => ({}));
            // Some clients would get a dish that doesn't suit them: Elisa decides
            if (res.status === 409 && Array.isArray(data.dietIssues)) {
                setIsSaving(false);
                const openAnyway = await confirm({
                    title: 'Certains plats ne conviennent pas encore à tous vos clients',
                    description: `${describeIssues(data.dietIssues)}\n\nAdaptez-les (ou remplacez-les) pour que chacun ait ses 8 plats, ou ouvrez quand même : ces clients verront le plat d'origine.`,
                    confirmLabel: 'Ouvrir quand même',
                    tone: 'danger'
                });
                if (openAnyway) await changeStatus('open', true);
                return;
            }
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
            ingredients: vaultRecipe.ingredients || '',
            instructions: vaultRecipe.instructions || [],
            chefNotes: vaultRecipe.chefNotes || '',
            freezable: vaultRecipe.freezable ?? null,
            fridgeDays: vaultRecipe.fridgeDays ?? null,
            // Its diet versions come back with it, ready for this week's clients
            variants: vaultRecipe.variants || [],
            dietOk: vaultRecipe.dietOk || []
        });
        setSelectedDishIndex(indexToUse);
        setInspectedVaultRecipe(null);
        setActiveTab('menu');
    };

    const filteredVault = vault
        .filter(r => {
            const matchesCategory = vaultCategory === 'all' || r.category.toLowerCase() === vaultCategory.toLowerCase();
            const matchesSearch = !vaultSearch.trim() || r.name.toLowerCase().includes(vaultSearch.toLowerCase());
            const seasons = r.seasons || [];
            const matchesSeason = vaultSeason === 'all' || (vaultSeason === 'none' ? seasons.length === 0 : seasons.includes(vaultSeason));
            return matchesCategory && matchesSearch && matchesSeason;
        })
        .sort((a, b) => {
            switch (vaultSort) {
                case 'oldest': return (a.createdAt || '').localeCompare(b.createdAt || '');
                case 'used': return (b.timesUsed || 0) - (a.timesUsed || 0);
                case 'chosen': return (b.chosenCount || 0) - (a.chosenCount || 0);
                case 'name': return a.name.localeCompare(b.name, 'fr');
                default: return (b.createdAt || '').localeCompare(a.createdAt || '');
            }
        });

    // Seasons and how it keeps, saved on the bank recipe right away
    const patchVaultRecipe = async (recipe: VaultRecipe, patch: { seasons?: Season[]; freezable?: boolean | null; fridgeDays?: number | null }) => {
        const optimistic = { ...recipe, ...patch };
        setVault(prev => prev.map(r => (r.id === recipe.id ? optimistic : r)));
        setInspectedVaultRecipe(prev => (prev?.id === recipe.id ? optimistic : prev));
        try {
            const res = await fetch(`/api/cooking-ops/admin/vault/${encodeURIComponent(recipe.id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Enregistrement impossible');
        } catch (err) {
            setVault(prev => prev.map(r => (r.id === recipe.id ? recipe : r)));
            setInspectedVaultRecipe(prev => (prev?.id === recipe.id ? recipe : prev));
            showToast(err instanceof Error ? err.message : 'Enregistrement impossible', 'error');
        }
    };

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

    const isEmptyDish = (d?: WeeklyDish) => !d || !d.name.trim();

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-28 font-sans">
            <AdminPageHeader title="Menu & recettes" />

            <main className="max-w-6xl mx-auto px-4 space-y-5">

                {/* Week, menu status, tabs */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => changeWeek(-1)} className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center" title="Semaine précédente">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-base font-semibold text-stone-900 px-1 min-w-[9rem] text-center">{menu?.weekLabel || 'Chargement…'}</span>
                            <button onClick={() => changeWeek(1)} className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center" title="Semaine suivante">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        {menu && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_LABELS[menu.status].className}`}>
                                    {STATUS_LABELS[menu.status].label}
                                </span>
                                {menu.status !== 'open' && (
                                    <Button size="sm" onClick={() => changeStatus('open')} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-full font-semibold">
                                        {menu.status === 'closed' ? 'Rouvrir aux clients' : 'Ouvrir aux clients'}
                                    </Button>
                                )}
                                {menu.status === 'open' && (
                                    <Button size="sm" variant="outline" onClick={() => changeStatus('closed')} disabled={isSaving} className="text-xs h-8 px-3 rounded-full font-semibold border-stone-300">
                                        Clôturer les choix
                                    </Button>
                                )}
                                {menu.status !== 'draft' && (
                                    <button onClick={() => changeStatus('draft')} disabled={isSaving} className="text-xs text-stone-500 hover:text-stone-800 underline">
                                        Repasser en brouillon
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center bg-stone-100 p-1 rounded-full border border-stone-200 self-start md:self-auto">
                        {([['menu', 'Menu de la semaine', Calendar], ['vault', `Banque de recettes (${vault.length})`, BookOpen]] as const).map(([tab, label, Icon]) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 h-9 text-sm font-semibold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                    activeTab === tab ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${tab === 'menu' ? 'text-[#E1567A]' : 'text-amber-600'}`} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {(loadError || actionError) && (
                    <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-2xl text-sm font-medium">
                        {loadError || actionError}
                    </div>
                )}

                {menu?.status === 'open' && isDirty && (
                    <div className="bg-amber-50 text-amber-900 border border-amber-300 p-3 rounded-2xl text-sm">
                        Menu ouvert aux clients : vos changements seront visibles dès l&apos;enregistrement.
                    </div>
                )}

                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-stone-500 border border-stone-200">Chargement…</div>
                ) : activeTab === 'menu' ? (
                    <div className="space-y-5">
                        {/* Diets this week: who needs an adapted menu, and what's left to adapt */}
                        {dietCounts.length > 0 && (
                            <div className={`rounded-2xl px-4 py-3 border flex flex-wrap items-center gap-x-4 gap-y-2 ${
                                dietIssues.length > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-200'
                            }`}>
                                <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                                    {dietIssues.length > 0
                                        ? <><AlertTriangle className="w-4 h-4 text-amber-600" /> {new Set(dietIssues.map(i => i.dishId)).size} plat{new Set(dietIssues.map(i => i.dishId)).size > 1 ? 's' : ''} à adapter</>
                                        : <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Menus adaptés pour tous</>}
                                </span>
                                <span className="flex flex-wrap gap-1.5">
                                    {dietCounts.map(({ diet, clients }) => (
                                        <span key={diet} title={clients.join(', ')} className="bg-white border border-stone-200 rounded-full px-2.5 py-0.5 text-xs font-medium text-stone-700">
                                            {dietLabel(diet)} · {clients.length} client{clients.length > 1 ? 's' : ''}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            {/* Left: the week's dishes */}
                            <div className="lg:col-span-5 space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="t-label">Plats de la semaine</h2>
                                    <Button
                                        size="sm"
                                        onClick={() => saveMenu()}
                                        disabled={isSaving || !isDirty}
                                        className={`text-xs h-8 px-3 rounded-full font-semibold ${isDirty ? 'bg-[#E1567A] hover:bg-[#c94567] text-white' : 'bg-stone-100 text-stone-500'}`}
                                    >
                                        {isSaving ? 'Enregistrement…' : isDirty ? 'Enregistrer' : saveSuccess ? 'Enregistré ✓' : 'Enregistré'}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {menu?.recipes.map((dish, idx) => {
                                        const isSelected = selectedDishIndex === idx;
                                        const hasRecipe = dish.instructions?.some(t => t.trim()) || dish.ingredients?.trim();
                                        const todo = dietIssues.filter(i => i.dishId === dish.id);
                                        const versions = dish.variants?.length || 0;
                                        return (
                                            <div
                                                key={dish.id || idx}
                                                onClick={() => selectDish(idx)}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                                    isSelected ? 'bg-rose-50/70 border-[#E1567A] ring-2 ring-[#E1567A]/15' : 'bg-white border-stone-200 hover:border-stone-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <span className="text-[11px] font-semibold text-[#E1567A] uppercase tracking-wider">Plat {idx + 1}</span>
                                                    <select
                                                        value={dish.category}
                                                        onChange={e => handleDishCategoryChange(idx, e.target.value as DishCategory)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="text-xs font-medium bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5 text-stone-700 focus:outline-none"
                                                    >
                                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                    </select>
                                                </div>

                                                {/* The whole name, on as many lines as it needs */}
                                                <AutoTextarea
                                                    value={dish.name}
                                                    onChange={v => handleDishNameChange(idx, v)}
                                                    onClick={e => e.stopPropagation()}
                                                    placeholder={`Nom du plat ${idx + 1}…`}
                                                    ariaLabel={`Nom du plat ${idx + 1}`}
                                                    className="t-card-title border-b border-stone-200 focus:border-[#E1567A] pb-1"
                                                />

                                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                                                        {hasRecipe ? 'Recette rédigée' : 'Recette à rédiger'}
                                                        {dish.name.trim() && !dish.ingredients?.trim() && (
                                                            splitRecipe((dish.instructions || []).join('\n')).found
                                                                ? <span>· ingrédients à séparer</span>
                                                                : <span className="text-amber-700 font-medium">· ingrédients manquants</span>
                                                        )}
                                                        <StorageBadges freezable={dish.freezable} fridgeDays={dish.fridgeDays} />
                                                    </span>
                                                    {dish.name.trim() && dietCounts.length > 0 && todo.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full border border-amber-300 bg-amber-50 text-amber-800 px-2 py-0.5">
                                                            <AlertTriangle className="w-3 h-3" /> À adapter : {[...new Set(todo.flatMap(i => i.diets))].map(dietLabel).join(', ')}
                                                        </span>
                                                    )}
                                                    {dish.name.trim() && dietCounts.length > 0 && todo.length === 0 && versions > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5">
                                                            <CheckCircle2 className="w-3 h-3" /> {versions} version{versions > 1 ? 's' : ''} adaptée{versions > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: the open dish */}
                            <div className="lg:col-span-7">
                                {currentDish ? (
                                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 space-y-5 lg:sticky lg:top-4">
                                        <div className="space-y-3 pb-4 border-b border-stone-200">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs font-semibold text-stone-500">Plat {selectedDishIndex + 1} · {currentDish.category}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setActiveTab('vault')}
                                                    className={`rounded-full text-xs h-8 gap-1.5 font-semibold ${isEmptyDish(currentDish) ? 'border-[#E1567A] text-[#E1567A] bg-rose-50 hover:bg-rose-100' : 'border-stone-300'}`}
                                                >
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    {isEmptyDish(currentDish) ? 'Choisir dans la banque' : 'Remplacer depuis la banque'}
                                                </Button>
                                            </div>
                                            <AutoTextarea
                                                value={currentDish.name}
                                                onChange={v => updateCurrentDish({ name: v })}
                                                placeholder={`Nom du plat ${selectedDishIndex + 1}…`}
                                                ariaLabel="Nom du plat"
                                                className="font-serif font-semibold text-2xl leading-tight text-stone-900 border-b border-dashed border-stone-300 focus:border-[#E1567A] pb-1"
                                            />
                                            {/* How it keeps: set with the name, clients see it when they choose */}
                                            <StorageFields
                                                freezable={currentDish.freezable}
                                                fridgeDays={currentDish.fridgeDays}
                                                onChange={patch => updateCurrentDish(patch)}
                                            />
                                        </div>

                                        <RecipeBoxes
                                            ingredients={currentDish.ingredients || ''}
                                            steps={currentRecipeText}
                                            onChange={handleRecipeChange}
                                            stepsRows={14}
                                        />

                                        <div className="space-y-2">
                                            <label className="t-label block">Notes & astuces cuisine</label>
                                            <input
                                                type="text"
                                                value={currentDish.chefNotes || ''}
                                                onChange={e => updateCurrentDish({ chefNotes: e.target.value })}
                                                placeholder="Ex : garder la sauce au frais, cuisson à 58 °C…"
                                                className="w-full text-sm p-3 rounded-2xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                            />
                                        </div>

                                        <DishDietPanel dish={currentDish} clients={dietClients} vault={vault} onChange={updateCurrentDish} />

                                        <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={handleClearCurrentDish}
                                                className="text-xs text-stone-500 hover:text-red-600 flex items-center gap-1 font-medium"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Retirer du menu
                                            </button>
                                            <Button
                                                onClick={() => saveMenu()}
                                                disabled={isSaving || !isDirty}
                                                className="bg-[#E1567A] hover:bg-[#c94567] text-white text-sm h-10 px-5 gap-1.5 font-semibold rounded-full"
                                            >
                                                {saveSuccess ? <><Check className="w-4 h-4" /> Enregistré</> : <><Save className="w-4 h-4" /> {isSaving ? 'Enregistrement…' : 'Enregistrer le menu'}</>}
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Recipe bank */
                    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <h2 className="t-card-title text-xl">
                                {filteredVault.length} recette{filteredVault.length > 1 ? 's' : ''}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={vaultSearch}
                                        onChange={e => setVaultSearch(e.target.value)}
                                        placeholder="Rechercher un plat…"
                                        className="text-sm h-9 pl-9 pr-3 rounded-full border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#E1567A] w-48 sm:w-56 bg-stone-50"
                                    />
                                </div>
                                <select value={vaultSeason} onChange={e => setVaultSeason(e.target.value as Season | 'all' | 'none')} className="text-sm h-9 px-3 rounded-full border border-stone-300 bg-stone-50 text-stone-700" title="Saison">
                                    <option value="all">Toutes les saisons</option>
                                    {SEASONS.map(se => <option key={se} value={se}>{SEASON_LABELS[se]}</option>)}
                                    <option value="none">Saison non renseignée</option>
                                </select>
                                <select value={vaultCategory} onChange={e => setVaultCategory(e.target.value)} className="text-sm h-9 px-3 rounded-full border border-stone-300 bg-stone-50 text-stone-700" title="Catégorie">
                                    <option value="all">Toutes les catégories</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={vaultSort} onChange={e => setVaultSort(e.target.value as VaultSort)} className="text-sm h-9 px-3 rounded-full border border-stone-300 bg-stone-50 text-stone-700" title="Trier">
                                    {VAULT_SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-stone-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr className="t-label">
                                        <th className="py-2.5 px-4 font-semibold">Plat</th>
                                        <th className="py-2.5 px-4 font-semibold">Catégorie</th>
                                        <th className="py-2.5 px-4 font-semibold text-center" title="Nombre de fois choisi par vos clients">Choisi</th>
                                        <th className="py-2.5 px-4 font-semibold text-center" title="Nombre de semaines au menu">Au menu</th>
                                        <th className="py-2.5 px-4 font-semibold text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredVault.map(recipe => (
                                        <tr key={recipe.id} onClick={() => setInspectedVaultRecipe(recipe)} className="hover:bg-rose-50/40 transition-colors cursor-pointer">
                                            <td className="py-3 px-4">
                                                <span className="t-card-title text-base">{recipe.name}</span>
                                                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                                    {(recipe.seasons || []).map(se => (
                                                        <span key={se} className="text-[11px] font-medium rounded-full bg-stone-100 text-stone-600 px-2 py-0.5">{SEASON_LABELS[se]}</span>
                                                    ))}
                                                    <StorageBadges freezable={recipe.freezable} fridgeDays={recipe.fridgeDays} />
                                                    {(recipe.variants?.length || 0) > 0 && (
                                                        <span title={recipe.variants!.map(v => `${v.name} (${v.diets.map(dietLabel).join(' + ')})`).join('\n')} className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5">
                                                            <CheckCircle2 className="w-3 h-3" /> {recipe.variants!.length} version{recipe.variants!.length > 1 ? 's' : ''} régime
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline" className={`text-xs font-medium rounded-full border ${getCategoryBadgeClass(recipe.category)}`}>{recipe.category}</Badge>
                                            </td>
                                            <td className="py-3 px-4 text-center tabular-nums font-semibold text-stone-800">{recipe.chosenCount || 0}</td>
                                            <td className="py-3 px-4 text-center tabular-nums text-stone-600">{recipe.timesUsed || 0}</td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                                <Button size="sm" onClick={() => handleImportFromVault(recipe)} className="bg-[#E1567A] hover:bg-[#c94567] text-white text-xs h-8 px-3 rounded-full font-semibold">
                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Plat {selectedDishIndex + 1}
                                                </Button>
                                                <button
                                                    onClick={() => handleDeleteVaultRecipe(recipe)}
                                                    disabled={deletingRecipeId === recipe.id}
                                                    className="ml-1 p-1.5 rounded-xl text-stone-300 hover:text-red-600 hover:bg-red-50 transition-colors align-middle"
                                                    title="Supprimer de la banque"
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

            {/* One bank recipe: details, seasons, how it keeps, place it in the menu */}
            <Dialog open={!!inspectedVaultRecipe} onOpenChange={open => !open && setInspectedVaultRecipe(null)}>
                <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs rounded-full border ${inspectedVaultRecipe ? getCategoryBadgeClass(inspectedVaultRecipe.category) : ''}`}>
                                {inspectedVaultRecipe?.category}
                            </Badge>
                            <span className="t-meta">
                                Choisi {inspectedVaultRecipe?.chosenCount || 0} fois · au menu {inspectedVaultRecipe?.timesUsed || 0} fois
                            </span>
                        </div>
                        <DialogTitle className="font-serif font-semibold text-2xl leading-tight text-stone-900 text-left">
                            {inspectedVaultRecipe?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {inspectedVaultRecipe && (
                        <div className="space-y-5 pt-2 text-sm">
                            <div className="space-y-3 rounded-2xl bg-stone-50 border border-stone-200 p-4">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-sm text-stone-700 mr-1">Saison</span>
                                    {SEASONS.map(se => {
                                        const on = (inspectedVaultRecipe.seasons || []).includes(se);
                                        return (
                                            <button
                                                key={se}
                                                type="button"
                                                aria-pressed={on}
                                                onClick={() => patchVaultRecipe(inspectedVaultRecipe, {
                                                    seasons: on ? (inspectedVaultRecipe.seasons || []).filter(x => x !== se) : [...(inspectedVaultRecipe.seasons || []), se]
                                                })}
                                                className={`h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${on ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'}`}
                                            >
                                                {SEASON_LABELS[se]}
                                            </button>
                                        );
                                    })}
                                </div>
                                <StorageFields
                                    freezable={inspectedVaultRecipe.freezable}
                                    fridgeDays={inspectedVaultRecipe.fridgeDays}
                                    onChange={patch => patchVaultRecipe(inspectedVaultRecipe, patch)}
                                />
                            </div>

                            {inspectedVaultRecipe.chefNotes && (
                                <p className="bg-amber-50 text-amber-900 p-3 rounded-2xl border border-amber-200">
                                    <span className="font-semibold">Astuce : </span>{inspectedVaultRecipe.chefNotes}
                                </p>
                            )}

                            {inspectedVaultRecipe.ingredients?.trim() && (
                                <div className="space-y-2">
                                    <h4 className="t-label">Ingrédients</h4>
                                    <p className="text-stone-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-stone-50 p-4 rounded-2xl border border-stone-200">
                                        {inspectedVaultRecipe.ingredients}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="t-label">Préparation</h4>
                                {inspectedVaultRecipe.instructions?.some(t => t.trim()) ? (
                                    <p className="text-stone-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto bg-stone-50 p-4 rounded-2xl border border-stone-200">
                                        {inspectedVaultRecipe.instructions.join('\n')}
                                    </p>
                                ) : (
                                    <p className="text-stone-400">Pas de préparation enregistrée.</p>
                                )}
                            </div>

                            {(inspectedVaultRecipe.variants?.length || 0) > 0 && (
                                <div className="space-y-2">
                                    <h4 className="t-label">Versions pour les régimes</h4>
                                    <ul className="space-y-1.5">
                                        {inspectedVaultRecipe.variants!.map(v => (
                                            <li key={v.id} className="bg-emerald-50/60 border border-emerald-200 rounded-xl px-3 py-2">
                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">
                                                    {v.kind === 'replacement' ? 'Remplacé' : 'Adapté'} · {v.diets.map(dietLabel).join(' + ')}
                                                </span>
                                                <span className="font-serif font-semibold text-stone-900">{v.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="pt-3 border-t border-stone-200 space-y-2">
                                <h4 className="t-label">Placer dans le menu</h4>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {(menu?.recipes || []).map((d, slotIdx) => (
                                        <button
                                            key={slotIdx}
                                            type="button"
                                            onClick={() => handleImportFromVault(inspectedVaultRecipe, slotIdx)}
                                            title={d.name || 'Vide'}
                                            className={`h-9 px-2 rounded-xl border text-xs font-semibold transition-colors hover:bg-[#E1567A] hover:text-white hover:border-[#E1567A] ${
                                                d.name.trim() ? 'border-stone-200 bg-stone-50 text-stone-700' : 'border-dashed border-[#E1567A]/50 bg-white text-[#E1567A]'
                                            }`}
                                        >
                                            Plat {slotIdx + 1}{!d.name.trim() && ' · vide'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {confirmDialog}
            {toastElement}
        </div>
    );
}

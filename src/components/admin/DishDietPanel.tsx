'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Pencil, Plus, Repeat, Trash2, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RecipeBoxes from '@/components/admin/RecipeBoxes';
import { DishCategory, DishVariant, VaultRecipe, WeeklyDish } from '@/lib/types/cooking-ops';
import { DietKey, DIET_KEYS, dietLabel, dietsFromAllergies, dishConflicts, menuDietIssues } from '@/lib/diets';

export interface DietClient {
    name: string;
    allergies: string[];
}

interface Props {
    dish: WeeklyDish;
    clients: DietClient[]; // regular clients with a diet (gluten, pork, halal…)
    vault: VaultRecipe[];
    onChange: (patch: Partial<WeeklyDish>) => void;
}

const CATEGORIES: DishCategory[] = ['Viande', 'Végétarien', 'Poisson', 'Végan'];

function newVariantId(): string {
    const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
    return `var_${random}`;
}

const dietList = (diets: DietKey[]) => diets.map(d => dietLabel(d).toLowerCase()).join(' et ');

/**
 * « Régimes » on a menu dish: which of Elisa's clients it doesn't suit (from the ingredients),
 * and the versions she wrote for them. Every client must end up with 8 dishes that suit them,
 * so a dish that doesn't suit a diet is adapted, or replaced by another dish for those clients.
 */
export default function DishDietPanel({ dish, clients, vault, onChange }: Props) {
    const [editing, setEditing] = useState<DishVariant | null>(null);
    const variants = dish.variants || [];

    const clientDiets = useMemo(() => [...new Set(clients.flatMap(c => dietsFromAllergies(c.allergies)))], [clients]);
    const conflicts = useMemo(() => dishConflicts(dish, clientDiets), [dish, clientDiets]);
    const issues = useMemo(() => (dish.name.trim() ? menuDietIssues([dish], clients) : []), [dish, clients]);
    const checkedOk = (dish.dietOk || []).filter(d => (conflicts[d as DietKey]?.length || 0) > 0) as DietKey[];

    // The same dish in the recipe bank, with versions written on an earlier menu
    const remembered = useMemo(() => {
        if (variants.length > 0) return null;
        const key = dish.name.trim().toLowerCase();
        const recipe = vault.find(r => r.name.trim().toLowerCase() === key);
        return recipe && ((recipe.variants?.length || 0) > 0) ? recipe : null;
    }, [dish.name, variants.length, vault]);

    if (clientDiets.length === 0 || !dish.name.trim()) return null;

    const saveVariant = (variant: DishVariant) => {
        const exists = variants.some(v => v.id === variant.id);
        onChange({ variants: exists ? variants.map(v => (v.id === variant.id ? variant : v)) : [...variants, variant] });
        setEditing(null);
    };
    const removeVariant = (id: string) => onChange({ variants: variants.filter(v => v.id !== id) });
    const markOk = (diet: DietKey) => onChange({ dietOk: [...new Set([...(dish.dietOk || []), diet])] });
    const unmarkOk = (diet: DietKey) => onChange({ dietOk: (dish.dietOk || []).filter(d => d !== diet) });

    const adapt = (diets: DietKey[]) => setEditing({
        id: newVariantId(),
        diets,
        kind: 'adapted',
        name: `${dish.name} (${dietList(diets)})`,
        category: dish.category,
        ingredients: dish.ingredients || '',
        instructions: dish.instructions || [],
        chefNotes: dish.chefNotes || ''
    });
    const replace = (diets: DietKey[]) => setEditing({
        id: newVariantId(), diets, kind: 'replacement', name: '', category: dish.category, ingredients: '', instructions: [], chefNotes: ''
    });

    return (
        <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Régimes de vos clients</h4>
                {issues.length === 0 && (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Convient à tous vos clients
                    </span>
                )}
            </div>

            {remembered && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sky-900">
                        <strong>Déjà adapté une autre semaine :</strong>{' '}
                        {remembered.variants!.map(v => `${v.name} (${v.diets.map(dietLabel).join(' + ').toLowerCase()})`).join(' · ')}
                    </span>
                    <button
                        type="button"
                        onClick={() => onChange({ variants: remembered.variants, dietOk: [...new Set([...(dish.dietOk || []), ...(remembered.dietOk || [])])] })}
                        className="rounded-full bg-sky-700 hover:bg-sky-800 text-white px-3 py-1.5 font-semibold"
                    >
                        Reprendre {remembered.variants!.length > 1 ? 'ces versions' : 'cette version'}
                    </button>
                </div>
            )}

            {/* To do: clients this dish (or its versions) doesn't suit yet */}
            {issues.map(issue => (
                <div key={issue.diets.join('+')} className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2 text-xs">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Ne convient pas : {issue.diets.map(dietLabel).join(' + ')}
                        <span className="font-normal text-amber-800">· {issue.clients.join(', ')}</span>
                    </p>
                    {issue.diets.map(d => (
                        <p key={d} className="text-amber-900 flex flex-wrap items-center gap-x-2">
                            <span><strong>{dietLabel(d)} :</strong> {(conflicts[d] || []).join(', ')}</span>
                            <button type="button" onClick={() => markOk(d)} className="text-[11px] text-amber-800 underline hover:text-amber-950">
                                C&apos;est bon, ça convient
                            </button>
                        </p>
                    ))}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <button type="button" onClick={() => adapt(issue.diets)} className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 text-white px-3 py-1.5 font-semibold">
                            <Wand2 className="w-3.5 h-3.5" /> Adapter ce plat
                        </button>
                        <button type="button" onClick={() => replace(issue.diets)} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white text-stone-800 px-3 py-1.5 font-semibold">
                            <Repeat className="w-3.5 h-3.5" /> Le remplacer par un autre plat
                        </button>
                    </div>
                </div>
            ))}

            {/* Versions already written */}
            {variants.map(v => (
                <div key={v.id} className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 text-xs flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            {v.kind === 'replacement' ? 'Remplacé' : 'Adapté'} · {v.diets.map(dietLabel).join(' + ')}
                        </p>
                        <p className="font-serif font-bold text-stone-900 text-sm truncate">{v.name}</p>
                    </div>
                    <div className="flex items-center shrink-0">
                        <button type="button" onClick={() => setEditing(v)} aria-label="Modifier cette version" className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-white">
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => removeVariant(v.id)} aria-label="Supprimer cette version" className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-white">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))}

            {checkedOk.length > 0 && (
                <p className="text-[11px] text-stone-500 flex flex-wrap items-center gap-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Vérifié par vous : convient {checkedOk.map(dietLabel).join(', ').toLowerCase()}
                    {checkedOk.map(d => (
                        <button key={d} type="button" onClick={() => unmarkOk(d)} className="underline hover:text-stone-800">
                            annuler ({dietLabel(d).toLowerCase()})
                        </button>
                    ))}
                </p>
            )}

            <button
                type="button"
                onClick={() => {
                    // Pre-ticks the diets this dish doesn't suit (or the first diet of her clients)
                    const flagged = clientDiets.filter(d => (conflicts[d]?.length || 0) > 0);
                    adapt(flagged.length > 0 ? flagged : [clientDiets[0]]);
                }}
                className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
                <Plus className="w-3 h-3" /> Ajouter une version pour un régime
            </button>

            <VariantEditor
                variant={editing}
                dishName={dish.name}
                diets={[...new Set([...clientDiets, ...(editing?.diets || [])])]}
                vault={vault}
                onCancel={() => setEditing(null)}
                onSave={saveVariant}
            />
        </div>
    );
}

function VariantEditor({ variant, dishName, diets, vault, onCancel, onSave }: {
    variant: DishVariant | null;
    dishName: string;
    diets: DietKey[];
    vault: VaultRecipe[];
    onCancel: () => void;
    onSave: (v: DishVariant) => void;
}) {
    const [draft, setDraft] = useState<DishVariant | null>(null);
    const [vaultQuery, setVaultQuery] = useState('');
    // Start from the variant each time the dialog opens
    const [openedFor, setOpenedFor] = useState<string | null>(null);
    if (variant && openedFor !== variant.id) {
        setOpenedFor(variant.id);
        setDraft(variant);
        setVaultQuery('');
    }
    if (!variant && openedFor !== null) setOpenedFor(null);

    const stillConflicting = useMemo(() => (draft ? dishConflicts(draft, draft.diets) : {}), [draft]);
    const vaultMatches = useMemo(() => {
        const q = vaultQuery.trim().toLowerCase();
        return q ? vault.filter(r => r.name.toLowerCase().includes(q)).slice(0, 6) : [];
    }, [vault, vaultQuery]);

    if (!draft) return null;
    const set = (patch: Partial<DishVariant>) => setDraft({ ...draft, ...patch });
    const toggleDiet = (d: DietKey) => set({ diets: draft.diets.includes(d) ? draft.diets.filter(x => x !== d) : [...draft.diets, d] });
    const leftover = Object.entries(stillConflicting).filter(([, items]) => items && items.length > 0) as [DietKey, string[]][];
    const canSave = draft.name.trim() && draft.diets.length > 0;

    return (
        <Dialog open={!!variant} onOpenChange={open => { if (!open) onCancel(); }}>
            <DialogContent className="sm:max-w-2xl bg-white rounded-3xl p-6">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl font-bold text-left">
                        {draft.kind === 'replacement' ? 'Plat de remplacement' : 'Version adaptée'} de « {dishName} »
                    </DialogTitle>
                    <p className="text-xs text-stone-500 text-left">
                        Les clients concernés verront ce plat à la place, avec le badge « {draft.kind === 'replacement' ? 'Spécial' : 'Adapté'} … pour vous ».
                    </p>
                </DialogHeader>

                <div className="space-y-4 text-xs">
                    <div>
                        <p className="font-bold text-stone-700 mb-1.5">Pour qui</p>
                        <div className="flex flex-wrap gap-1.5">
                            {DIET_KEYS.filter(d => diets.includes(d)).map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => toggleDiet(d)}
                                    className={`px-3 py-1.5 rounded-full border font-semibold ${draft.diets.includes(d) ? 'bg-[#E1567A] border-[#E1567A] text-white' : 'bg-white border-stone-300 text-stone-600'}`}
                                >
                                    {dietLabel(d)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {draft.kind === 'replacement' && (
                        <div className="relative">
                            <p className="font-bold text-stone-700 mb-1.5">Reprendre une recette de la banque (optionnel)</p>
                            <input
                                value={vaultQuery}
                                onChange={e => setVaultQuery(e.target.value)}
                                placeholder="Rechercher un plat…"
                                className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                            />
                            {vaultMatches.length > 0 && (
                                <ul className="mt-1 rounded-xl border border-stone-200 divide-y divide-stone-100 bg-white">
                                    {vaultMatches.map(r => (
                                        <li key={r.id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    set({ name: r.name, category: r.category, ingredients: r.ingredients || '', instructions: r.instructions || [], chefNotes: r.chefNotes || '' });
                                                    setVaultQuery('');
                                                }}
                                                className="w-full text-left px-3 py-2 hover:bg-rose-50 font-semibold text-stone-800"
                                            >
                                                {r.name} <span className="font-normal text-stone-400">· {r.category}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                        <div>
                            <p className="font-bold text-stone-700 mb-1.5">Nom vu par le client</p>
                            <input
                                value={draft.name}
                                onChange={e => set({ name: e.target.value })}
                                placeholder="Ex : Lasagnes de légumes sans gluten"
                                className="w-full p-2.5 rounded-xl border border-stone-300 font-serif font-bold text-sm focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                            />
                        </div>
                        <div>
                            <p className="font-bold text-stone-700 mb-1.5">Catégorie</p>
                            <select
                                value={draft.category || 'Viande'}
                                onChange={e => set({ category: e.target.value as DishCategory })}
                                className="p-2.5 rounded-xl border border-stone-300 bg-white"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <RecipeBoxes
                        ingredients={draft.ingredients || ''}
                        steps={(draft.instructions || []).join('\n')}
                        onChange={({ ingredients, steps }) => set({ ingredients, instructions: steps ? [steps] : [] })}
                        stepsRows={8}
                    />

                    <div>
                        <p className="font-bold text-stone-700 mb-1.5">Notes cuisine (fiche cuisine seulement)</p>
                        <input
                            value={draft.chefNotes || ''}
                            onChange={e => set({ chefNotes: e.target.value })}
                            placeholder="Ex : planche et ustensiles propres (cœliaque), pas de bouillon cube"
                            className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                        />
                    </div>

                    {leftover.length > 0 && (
                        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-amber-900">
                            <strong>Encore à vérifier :</strong>{' '}
                            {leftover.map(([d, items]) => `${dietLabel(d)} → ${items.join(', ')}`).join(' · ')}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full text-stone-600 hover:bg-stone-100 font-semibold">
                            Annuler
                        </button>
                        <button
                            type="button"
                            disabled={!canSave}
                            onClick={() => onSave({ ...draft, name: draft.name.trim() })}
                            className="px-4 py-2 rounded-full bg-[#E1567A] hover:bg-[#c94567] text-white font-bold disabled:opacity-40"
                        >
                            Garder cette version
                        </button>
                    </div>
                    <p className="text-[11px] text-stone-400 text-right">Pensez ensuite à « Enregistrer le menu ».</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

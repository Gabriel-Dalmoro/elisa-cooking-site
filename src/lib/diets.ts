import type { WeeklyDish, DishVariant } from './types/cooking-ops';
import type { IngredientTag } from './grocery/dictionary';
import { normalize, parseIngredients } from './grocery/parse';
import { effectiveRecipe } from './grocery/recipe';

/**
 * Diet-adapted menus. Elisa writes ONE menu of 8 dishes; a dish that doesn't suit a diet
 * (gluten for a coeliac client, pork for a halal one…) gets an adapted or replacement version
 * for that diet. Each client's link then shows their own 8 dishes, picked from their allergies.
 *
 * Conflicts are found with the grocery dictionary's ingredient tags (no AI): a helper for Elisa,
 * who has the final word (« C'est bon » when a flag is wrong).
 */

export type DietKey =
    | 'sans-gluten' | 'sans-porc' | 'halal' | 'sans-lactose' | 'vegetarien' | 'vegan'
    | 'sans-arachides' | 'sans-fruits-a-coque' | 'sans-crustaces' | 'sans-oeufs';

interface DietDef {
    key: DietKey;
    label: string; // « Sans gluten »
    tags: IngredientTag[]; // ingredient tags that don't suit it
    words?: RegExp; // extra ingredients caught by name (alcohol for halal)
}

// Alcohol in cooking, never « vinaigre de vin »
const ALCOHOL = /\b(vin|vins|biere|alcool|rhum|cognac|armagnac|calvados|porto|marsala|madere|kirsch|liqueur|cidre|champagne|whisky|vodka|gin|pastis|amaretto|grand marnier|cointreau|saint raphael|xeres|sake|mirin)\b/;

export const DIETS: DietDef[] = [
    { key: 'sans-gluten', label: 'Sans gluten', tags: ['gluten'] },
    { key: 'sans-porc', label: 'Sans porc', tags: ['porc'] },
    { key: 'halal', label: 'Halal', tags: ['porc'], words: ALCOHOL },
    { key: 'sans-lactose', label: 'Sans lactose', tags: ['lactose'] },
    { key: 'vegetarien', label: 'Végétarien', tags: ['viande', 'porc', 'poisson', 'crustaces'] },
    { key: 'vegan', label: 'Végan', tags: ['viande', 'porc', 'poisson', 'crustaces', 'lactose', 'oeuf', 'miel'] },
    { key: 'sans-arachides', label: 'Sans arachides', tags: ['arachide'] },
    { key: 'sans-fruits-a-coque', label: 'Sans fruits à coque', tags: ['fruits_a_coque'] },
    { key: 'sans-crustaces', label: 'Sans crustacés', tags: ['crustaces'] },
    { key: 'sans-oeufs', label: 'Sans œufs', tags: ['oeuf'] }
];
const DIET_BY_KEY = new Map(DIETS.map(d => [d.key, d]));
export const DIET_KEYS = DIETS.map(d => d.key);

export const dietLabel = (key: DietKey) => DIET_BY_KEY.get(key)?.label || key;
export const isDietKey = (value: unknown): value is DietKey => typeof value === 'string' && DIET_BY_KEY.has(value as DietKey);

/**
 * The diets behind a client's allergy tags, including ones typed by hand
 * (« Viande halal », « Cœliaque », « Kasher »…). Tags that aren't diets (« Le thym ») are ignored here:
 * the grocery list still warns about them.
 */
export function dietsFromAllergies(allergies: string[]): DietKey[] {
    const found = new Set<DietKey>();
    for (const raw of allergies) {
        const a = normalize(raw);
        if (/gluten|coeliaque|celiaque/.test(a)) found.add('sans-gluten');
        if (/halal/.test(a)) found.add('halal');
        if (/kasher|casher|cacher/.test(a)) { found.add('sans-porc'); found.add('sans-crustaces'); }
        if (/\bporc\b/.test(a)) found.add('sans-porc');
        if (/lactose|laitage|produit laitier/.test(a)) found.add('sans-lactose');
        if (/vegan|vegetalien/.test(a)) found.add('vegan');
        else if (/vegetarien/.test(a)) found.add('vegetarien');
        if (/arachide|cacahuete/.test(a)) found.add('sans-arachides');
        if (/fruit a coque|fruits a coque/.test(a)) found.add('sans-fruits-a-coque');
        if (/crustace/.test(a)) found.add('sans-crustaces');
        if (/\boeuf\b/.test(a)) found.add('sans-oeufs');
    }
    // Halal already excludes pork: no need for a separate « sans porc » version on top
    if (found.has('halal')) found.delete('sans-porc');
    // Vegan covers vegetarian
    if (found.has('vegan')) found.delete('vegetarien');
    return DIET_KEYS.filter(k => found.has(k));
}

type DishLike = Pick<WeeklyDish, 'ingredients' | 'instructions'>;

/**
 * For each diet asked about, the ingredients of the dish that don't suit it
 * (empty / missing = fine). Reads the ingredient list (or the ingredients part of the recipe).
 */
export function dishConflicts(dish: DishLike, diets: DietKey[]): Partial<Record<DietKey, string[]>> {
    if (diets.length === 0) return {};
    const { ingredients } = effectiveRecipe(dish.ingredients || '', (dish.instructions || []).join('\n'));
    const { items } = parseIngredients(ingredients);
    const out: Partial<Record<DietKey, string[]>> = {};
    for (const key of diets) {
        const def = DIET_BY_KEY.get(key);
        if (!def) continue;
        const hits = new Set<string>();
        for (const { line } of items) {
            const tags = line.entry?.tags || [];
            const name = line.entry?.name || line.name;
            if (tags.some(t => def.tags.includes(t))) hits.add(name);
            else if (def.words && !/vinaigre/.test(normalize(line.phrase)) && def.words.test(normalize(line.phrase))) hits.add(name);
        }
        if (hits.size > 0) out[key] = [...hits];
    }
    return out;
}

/** Diets of this client the dish's original doesn't suit (minus the ones Elisa said are fine). */
export function neededDiets(dish: WeeklyDish, clientDiets: DietKey[], conflicts = dishConflicts(dish, clientDiets)): DietKey[] {
    return clientDiets.filter(d => (conflicts[d]?.length || 0) > 0 && !(dish.dietOk || []).includes(d));
}

/**
 * The version of a dish for a client: the original when it suits all their diets, otherwise the
 * variant that covers all the diets it needs (the most specific one). `covered` is false when no
 * version covers everything: Elisa sees it as « à adapter » for that client.
 */
export function pickVariant(dish: WeeklyDish, clientDiets: DietKey[], conflicts?: Partial<Record<DietKey, string[]>>) {
    const needed = neededDiets(dish, clientDiets, conflicts);
    if (needed.length === 0) return { variant: undefined, needed, covered: true };
    const variants = dish.variants || [];
    const full = variants
        .filter(v => needed.every(d => v.diets.includes(d)))
        .sort((a, b) => a.diets.length - b.diets.length);
    if (full[0]) return { variant: full[0], needed, covered: true };
    // Nothing covers everything: the closest version is still better than the original
    const partial = variants
        .map(v => ({ v, overlap: needed.filter(d => v.diets.includes(d)).length }))
        .filter(x => x.overlap > 0)
        .sort((a, b) => b.overlap - a.overlap || a.v.diets.length - b.v.diets.length);
    return { variant: partial[0]?.v, needed, covered: false };
}

/** Badge shown to the client on their version: « Adapté sans gluten pour vous ». */
export function variantBadge(variant: DishVariant, clientDiets: DietKey[]): string {
    const diets = variant.diets.filter(d => clientDiets.includes(d));
    const words = (diets.length ? diets : variant.diets).map(d => dietLabel(d).toLowerCase());
    const list = words.length > 1 ? `${words.slice(0, -1).join(', ')} et ${words[words.length - 1]}` : words[0] || '';
    return variant.kind === 'replacement' ? `Spécial ${list} pour vous` : `Adapté ${list} pour vous`;
}

/** A variant written over its dish: same id (selections point to the dish), the variant's content. */
export function applyVariant(dish: WeeklyDish, variant: DishVariant | undefined): WeeklyDish {
    if (!variant) return dish;
    return {
        ...dish,
        name: variant.name || dish.name,
        category: variant.category || dish.category,
        description: variant.description ?? dish.description,
        ingredients: variant.ingredients ?? dish.ingredients,
        instructions: variant.instructions ?? dish.instructions,
        chefNotes: variant.chefNotes ?? dish.chefNotes
    };
}

/**
 * A client's own menu: each dish in their version, with the badge and the variant id
 * (kept with their choice, so the kitchen cooks exactly what they saw).
 */
export function menuForClient(dishes: WeeklyDish[], allergies: string[]) {
    const diets = dietsFromAllergies(allergies);
    return dishes.map(dish => {
        const { variant } = pickVariant(dish, diets);
        return { dish: applyVariant(dish, variant), variantId: variant?.id || '', badge: variant ? variantBadge(variant, diets) : '' };
    });
}

/**
 * The chosen dishes as the client saw them, from the variant ids saved with their choice
 * (no saved id = the original; a variant since deleted falls back to the original too).
 */
export function chosenVersion(dish: WeeklyDish, variantId: string | undefined): WeeklyDish {
    if (!variantId) return dish;
    return applyVariant(dish, (dish.variants || []).find(v => v.id === variantId));
}

export interface DietIssue {
    dishId: string;
    dishName: string;
    diets: DietKey[]; // diets still not covered for these clients
    clients: string[];
}

/** What's still to adapt before opening the menu: per dish, which clients would get a dish that doesn't suit them. */
export function menuDietIssues(dishes: WeeklyDish[], clients: { name: string; allergies: string[] }[]): DietIssue[] {
    const withDiets = clients.map(c => ({ name: c.name, diets: dietsFromAllergies(c.allergies) })).filter(c => c.diets.length > 0);
    const allDiets = [...new Set(withDiets.flatMap(c => c.diets))];
    const issues: DietIssue[] = [];
    for (const dish of dishes) {
        const conflicts = dishConflicts(dish, allDiets);
        const byKey = new Map<string, DietIssue>();
        for (const client of withDiets) {
            const { covered, needed, variant } = pickVariant(dish, client.diets, conflicts);
            if (covered) continue;
            const missing = needed.filter(d => !variant?.diets.includes(d));
            const key = missing.join('+');
            const issue = byKey.get(key) || { dishId: dish.id, dishName: dish.name, diets: missing, clients: [] };
            issue.clients.push(client.name);
            byKey.set(key, issue);
        }
        issues.push(...byKey.values());
    }
    return issues;
}

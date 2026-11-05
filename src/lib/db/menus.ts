import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '../supabase/admin';
import { DishVariant, MenuStatus, WeeklyDish, WeeklyMenuData } from '../types/cooking-ops';
import { isDietKey, menuDietIssues } from '../diets';
import { normalize } from '../grocery/parse';
import { getCurrentWeekStart, getWeekBoundsForStart, seasonOf } from '../dateUtils';
import { markDishesUsed, saveDishesToVault } from './vault';

/**
 * Weekly menus, one per week (keyed by the Monday, Paris time).
 */

interface MenuRow {
    week_start: string;
    status: MenuStatus;
    dishes: unknown;
    updated_at: string;
}

function rowToMenu(row: MenuRow): WeeklyMenuData {
    return {
        weekStart: row.week_start,
        weekLabel: getWeekBoundsForStart(row.week_start).weekLabel,
        status: row.status,
        recipes: Array.isArray(row.dishes) ? (row.dishes as WeeklyDish[]) : [],
        updatedAt: row.updated_at
    };
}

const cleanSteps = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string').map(s => s.trim()).filter(Boolean) : [];

/** Diet versions of a dish (lib/diets.ts): each needs a name and at least one diet. */
function sanitizeVariants(input: unknown): DishVariant[] {
    if (!Array.isArray(input)) return [];
    const seen = new Set<string>();
    const out: DishVariant[] = [];
    for (const raw of input.slice(0, 20)) {
        if (!raw || typeof raw !== 'object') continue;
        const v = raw as Record<string, unknown>;
        const name = typeof v.name === 'string' ? v.name.trim().slice(0, 300) : '';
        const diets = Array.isArray(v.diets) ? [...new Set(v.diets.filter(isDietKey))] : [];
        if (!name || diets.length === 0) continue;
        let id = typeof v.id === 'string' && /^[\w-]{1,64}$/.test(v.id) ? v.id : '';
        if (!id || seen.has(id)) id = `var_${randomUUID().slice(0, 8)}`;
        seen.add(id);
        out.push({
            id,
            diets,
            kind: v.kind === 'replacement' ? 'replacement' : 'adapted',
            name,
            category: typeof v.category === 'string' && v.category.trim() ? v.category.trim() : undefined,
            description: typeof v.description === 'string' ? v.description.trim() : undefined,
            ingredients: typeof v.ingredients === 'string' ? v.ingredients.trim().slice(0, 20000) : '',
            instructions: cleanSteps(v.instructions),
            chefNotes: typeof v.chefNotes === 'string' ? v.chefNotes.trim() : ''
        });
    }
    return out;
}

/**
 * Cleans dishes coming from the editor: trims text, drops unnamed slots,
 * and guarantees each dish has a unique id (selections point to it).
 */
export function sanitizeDishes(input: unknown): WeeklyDish[] {
    if (!Array.isArray(input)) return [];
    const seenIds = new Set<string>();
    const dishes: WeeklyDish[] = [];

    for (const raw of input) {
        if (!raw || typeof raw !== 'object') continue;
        const d = raw as Record<string, unknown>;
        const name = typeof d.name === 'string' ? d.name.trim().slice(0, 300) : '';
        if (!name) continue;

        let id = typeof d.id === 'string' && /^[\w-]{1,64}$/.test(d.id) ? d.id : '';
        if (!id || seenIds.has(id)) id = `dish_${randomUUID().slice(0, 8)}`;
        seenIds.add(id);

        dishes.push({
            id,
            name,
            category: typeof d.category === 'string' && d.category.trim() ? d.category.trim() : 'Végétarien',
            description: typeof d.description === 'string' ? d.description.trim() : undefined,
            ingredients: typeof d.ingredients === 'string' ? d.ingredients.trim().slice(0, 20000) : '',
            instructions: Array.isArray(d.instructions)
                ? d.instructions.filter((s): s is string => typeof s === 'string').map(s => s.trim()).filter(Boolean)
                : [],
            chefNotes: typeof d.chefNotes === 'string' ? d.chefNotes.trim() : '',
            variants: sanitizeVariants(d.variants),
            dietOk: Array.isArray(d.dietOk) ? [...new Set(d.dietOk.filter(isDietKey))] : []
        });
    }
    return dishes;
}

/**
 * The menu for a week, or an empty unsaved draft if Elisa hasn't started it yet.
 */
export async function getMenu(weekStart: string): Promise<WeeklyMenuData> {
    const { data, error } = await getSupabaseAdmin()
        .from('weekly_menus')
        .select('*')
        .eq('week_start', weekStart)
        .maybeSingle();
    if (error) throw new Error(`Lecture du menu impossible : ${error.message}`);
    if (data) return rowToMenu(data as MenuRow);
    return {
        weekStart,
        weekLabel: getWeekBoundsForStart(weekStart).weekLabel,
        status: 'draft',
        recipes: []
    };
}

/**
 * Clients' choices point to dishes by id: a dish that comes back with a new id (re-placed from the
 * recipe bank, or re-typed in its slot) keeps the id it already had on this week's menu.
 */
function keepDishIds(dishes: WeeklyDish[], stored: WeeklyDish[]): WeeklyDish[] {
    const key = (name: string) => normalize(name);
    const incomingIds = new Set(dishes.map(d => d.id));
    const used = new Set<string>();
    return dishes.map(dish => {
        if (stored.some(s => s.id === dish.id)) return dish;
        const previous = stored.find(s => key(s.name) === key(dish.name) && !incomingIds.has(s.id) && !used.has(s.id));
        if (!previous) return dish;
        used.add(previous.id);
        return { ...dish, id: previous.id };
    });
}

export async function saveMenuDishes(weekStart: string, dishesInput: unknown): Promise<WeeklyMenuData> {
    const dishes = keepDishIds(sanitizeDishes(dishesInput), (await getMenu(weekStart)).recipes);
    // Status is not in the payload, so saving never changes draft/open/closed
    const { data, error } = await getSupabaseAdmin()
        .from('weekly_menus')
        .upsert({ week_start: weekStart, dishes, updated_at: new Date().toISOString() }, { onConflict: 'week_start' })
        .select('*')
        .single();
    if (error) throw new Error(`Enregistrement du menu impossible : ${error.message}`);

    const menu = rowToMenu(data as MenuRow);
    await saveDishesToVault(menu.recipes);
    if (menu.status === 'open') {
        await markDishesUsed(menu.recipes.map(d => d.name), weekStart);
    }
    return menu;
}

export class DietIssuesError extends Error {
    constructor(public issues: ReturnType<typeof menuDietIssues>) {
        super('Certains plats ne conviennent pas encore à tous vos clients');
    }
}

/**
 * Opening the menu checks every client gets 8 dishes that suit them (clients list given by the
 * caller); `force` opens anyway, once Elisa has seen what's left.
 */
export async function setMenuStatus(
    weekStart: string,
    status: MenuStatus,
    options: { clients?: { name: string; allergies: string[] }[]; force?: boolean } = {}
): Promise<WeeklyMenuData> {
    const current = await getMenu(weekStart);
    if (status === 'open' && current.recipes.length === 0) {
        throw new Error('Ajoutez au moins un plat avant d’ouvrir le menu aux clients');
    }
    if (status === 'open' && !options.force && options.clients) {
        const issues = menuDietIssues(current.recipes, options.clients);
        if (issues.length > 0) throw new DietIssuesError(issues);
    }

    const { data, error } = await getSupabaseAdmin()
        .from('weekly_menus')
        .upsert({ week_start: weekStart, status, updated_at: new Date().toISOString() }, { onConflict: 'week_start' })
        .select('*')
        .single();
    if (error) throw new Error(`Changement de statut du menu impossible : ${error.message}`);

    const menu = rowToMenu(data as MenuRow);
    if (status === 'open') {
        await markDishesUsed(menu.recipes.map(d => d.name), weekStart);
    }
    return menu;
}

export type ClientFacingMenu =
    | { state: 'open'; menus: WeeklyMenuData[] }
    | { state: 'closed'; menu: WeeklyMenuData }
    | { state: 'none' };

/**
 * What a client link shows: every OPEN menu for this week or later, oldest first.
 * Two weeks can be open at once (Elisa opens next week early): the client then picks
 * which week they are choosing for, so nobody is locked out of the current week.
 * If none is open but one was closed, the client sees "choices closed".
 * Menus for past weeks are never shown (old links can't pick from a stale menu).
 */
export async function getClientFacingMenu(): Promise<ClientFacingMenu> {
    const { data, error } = await getSupabaseAdmin()
        .from('weekly_menus')
        .select('*')
        .in('status', ['open', 'closed'])
        .gte('week_start', getCurrentWeekStart())
        .order('week_start', { ascending: true });
    if (error) throw new Error(`Lecture du menu impossible : ${error.message}`);

    const menus = (data as MenuRow[]).map(rowToMenu);
    const open = menus.filter(m => m.status === 'open');
    if (open.length > 0) return { state: 'open', menus: open };
    if (menus.length > 0) return { state: 'closed', menu: menus[menus.length - 1] };
    return { state: 'none' };
}

/**
 * What the public /menu page shows: this week's menu once Elisa has published it
 * (open or closed). Before that, the nearest upcoming published menu. Drafts are never shown.
 */
export async function getPublicWeekMenu(): Promise<WeeklyMenuData | null> {
    const currentWeek = getCurrentWeekStart();
    const { data, error } = await getSupabaseAdmin()
        .from('weekly_menus')
        .select('*')
        .in('status', ['open', 'closed'])
        .gte('week_start', currentWeek)
        .order('week_start', { ascending: true })
        .limit(1);
    if (error) throw new Error(`Lecture du menu impossible : ${error.message}`);
    const menu = (data as MenuRow[]).map(rowToMenu)[0];
    return menu && menu.recipes.length > 0 ? menu : null;
}

export interface PastDish {
    weekStart: string; // the week it was on the menu
    dish: WeeklyDish;
}

/**
 * Dishes from menus before this week, in the same season (any year), most recent first,
 * one per dish name. Clients can pick one as their custom dish (Elisa only cooks seasonal produce).
 * Only menus that were shown to clients (open or closed) count, never drafts.
 */
export async function listPastSeasonDishes(weekStart: string): Promise<PastDish[]> {
    const { data, error } = await getSupabaseAdmin()
        .from('weekly_menus')
        .select('*')
        .in('status', ['open', 'closed'])
        .lt('week_start', weekStart)
        .order('week_start', { ascending: false });
    if (error) throw new Error(`Lecture des anciens menus impossible : ${error.message}`);

    const season = seasonOf(weekStart);
    const seen = new Set<string>();
    const out: PastDish[] = [];
    for (const menu of (data as MenuRow[]).map(rowToMenu)) {
        if (seasonOf(menu.weekStart) !== season) continue;
        for (const dish of menu.recipes) {
            const key = dish.name.trim().toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ weekStart: menu.weekStart, dish });
        }
    }
    return out;
}

/** One past dish, if it really is a same-season dish from an earlier published menu. */
export async function findPastSeasonDish(forWeekStart: string, fromWeekStart: string, dishId: string): Promise<WeeklyDish | null> {
    if (fromWeekStart >= forWeekStart || seasonOf(fromWeekStart) !== seasonOf(forWeekStart)) return null;
    const menu = await getMenu(fromWeekStart);
    if (menu.status === 'draft') return null;
    return menu.recipes.find(d => d.id === dishId) || null;
}

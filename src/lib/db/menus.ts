import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '../supabase/admin';
import { MenuStatus, WeeklyDish, WeeklyMenuData } from '../types/cooking-ops';
import { getCurrentWeekStart, getWeekBoundsForStart } from '../dateUtils';
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
            instructions: Array.isArray(d.instructions)
                ? d.instructions.filter((s): s is string => typeof s === 'string').map(s => s.trim()).filter(Boolean)
                : [],
            chefNotes: typeof d.chefNotes === 'string' ? d.chefNotes.trim() : ''
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

export async function saveMenuDishes(weekStart: string, dishesInput: unknown): Promise<WeeklyMenuData> {
    const dishes = sanitizeDishes(dishesInput);
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

export async function setMenuStatus(weekStart: string, status: MenuStatus): Promise<WeeklyMenuData> {
    const current = await getMenu(weekStart);
    if (status === 'open' && current.recipes.length === 0) {
        throw new Error('Ajoutez au moins un plat avant d’ouvrir le menu aux clients');
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
    | { state: 'open'; menu: WeeklyMenuData }
    | { state: 'closed'; menu: WeeklyMenuData }
    | { state: 'none' };

/**
 * What a client link shows: the most recent OPEN menu for this week or later.
 * If none is open but one was closed, the client sees "choices closed".
 * Menus for past weeks are never shown (old links can't pick from a stale menu).
 */
export async function getClientFacingMenu(): Promise<ClientFacingMenu> {
    const { data, error } = await getSupabaseAdmin()
        .from('weekly_menus')
        .select('*')
        .in('status', ['open', 'closed'])
        .gte('week_start', getCurrentWeekStart())
        .order('week_start', { ascending: false });
    if (error) throw new Error(`Lecture du menu impossible : ${error.message}`);

    const menus = (data as MenuRow[]).map(rowToMenu);
    const open = menus.find(m => m.status === 'open');
    if (open) return { state: 'open', menu: open };
    if (menus.length > 0) return { state: 'closed', menu: menus[0] };
    return { state: 'none' };
}

export type DishCategory = 'viande' | 'Végétarien' | 'Poisson' | 'Végan' | string;

export interface ClientProfile {
    id: string;
    token: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    accessCode?: string; // Door / building access code
    allergies: string[];
    dislikes?: string;
    defaultDishCount: number;
    personCount: number; // Household portions e.g. 2, 4 personnes
    notes?: string; // Kitchen & equipment notes (operational, visible to the client's chef)
    privateNotes?: string; // Owner only — never sent to a chef
    chefId?: string | null; // Chef in charge of this client (staff user id), null = Elisa
    isBookedThisWeek?: boolean;
    bookingDay?: string;
    createdAt: string;
}

export type TimeSlot = 'Matin' | 'Après-midi';

export interface BookingSession {
    id: string;
    clientId: string; // '' when the calendar event matches no client record
    clientName: string; // Client name, or the name read from the calendar event
    dateIso: string; // "YYYY-MM-DD" e.g. "2026-08-25"
    dayName: string; // "Lundi", "Mardi", etc.
    timeSlot: TimeSlot;
    startsAt?: string; // ISO timestamp from Google Calendar (arrival time)
    endsAt?: string;
    dishCount: number;
    personCount: number; // e.g. 2 personnes
    gcalEventId?: string;
    notes?: string; // Google Calendar event title
    assignedTo?: string | null; // Staff user id of the chef cooking this session (null = Elisa)
    seriesId?: string; // Set when the session comes from a recurring series
    // This session only (guests one week…): beats the client's profile; null/undefined = the profile applies
    personCountOverride?: number | null;
    dishCountOverride?: number | null;
    seriesDate?: string; // The date the series planned it for (kept when this one session is moved)
    // Migration 011
    sessionNote?: string; // for this session only (the client's notes are « for always »)
    arrivalTime?: string; // « 14:00 », set in the app (beats the Google event's start time)
    extraDishes?: ExtraDish[]; // dishes added for this session only, free
    createdAt: string;
}

/** A dish added to one session (e.g. offered after a mistake). Always free: it never changes the price. */
export interface ExtraDish {
    id: string; // « extra_xxxx »
    name: string;
    fromMenuDishId?: string; // picked from that week's menu (its recipe is copied below)
    ingredients?: string;
    instructions?: string[];
    chefNotes?: string;
}

/** « 9:5 », « 14h », « 14h30 » → « 09:05 », « 14:00 », « 14:30 »; null if not a time. */
export function cleanArrivalTime(v: unknown): string | null {
    if (typeof v !== 'string') return null;
    const m = v.trim().toLowerCase().match(/^(\d{1,2})\s*(?:[:h]\s*(\d{1,2})?)?$/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    if (h > 23 || min > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** « 14:00 » → « 14h », « 09:30 » → « 9h30 » (as written in French). */
export function formatTimeFr(time: string): string {
    const [h, m] = time.split(':');
    return `${Number(h)}h${m && m !== '00' ? m : ''}`;
}

/** The arrival time to show: the one set in the app, else the Google event's start (Paris time). */
export function arrivalTimeOf(session: Pick<BookingSession, 'arrivalTime' | 'startsAt'>): string | null {
    if (session.arrivalTime) return session.arrivalTime;
    if (!session.startsAt) return null;
    return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(new Date(session.startsAt));
}

export interface WeeklyDish {
    id: string; // Stable id within the menu: selections point to it
    name: string;
    category: DishCategory;
    description?: string;
    ingredients?: string; // Ingredient list only (one per line): read by the grocery list
    instructions?: string[];
    chefNotes?: string;
    tags?: string[];
    // How it keeps, shown to clients when they choose (estimates, set with the dish name)
    freezable?: boolean | null; // null/undefined = not said yet
    fridgeDays?: number | null; // ≈ days in the fridge
    // Diet-adapted menus (lib/diets.ts): versions of this dish for clients it doesn't suit,
    // and the diets Elisa checked the original is fine for (a wrong flag)
    variants?: DishVariant[];
    dietOk?: string[];
}

/** Another version of a menu dish for some diets: adapted from it, or a different dish replacing it. */
export interface DishVariant {
    id: string;
    diets: import('../diets').DietKey[];
    kind: 'adapted' | 'replacement';
    name: string;
    category?: DishCategory;
    description?: string;
    ingredients?: string;
    instructions?: string[];
    chefNotes?: string;
}

export type MenuStatus = 'draft' | 'open' | 'closed';

export interface WeeklyMenuData {
    weekStart: string; // Monday "YYYY-MM-DD" (Paris)
    weekLabel: string; // "Semaine du 28 septembre au 4 octobre"
    status: MenuStatus;
    recipes: WeeklyDish[];
    updatedAt?: string;
}

export interface ClientSelection {
    id: string;
    clientId: string;
    weekStart: string;
    selectedDishIds: string[];
    selectedDishNames: string[]; // Snapshot at submission (kept if a dish is later removed)
    dishNotes: Record<string, string>; // Keyed by dish id
    customDish?: string; // The one dish the client wrote themselves (replaces one menu dish)
    customDishFrom?: string; // Week (Monday) of the earlier menu the custom dish was picked from, if any
    variantIds?: Record<string, string>; // Diet version of each chosen dish the client saw (dish id → variant id). Staff only.
    titleOverrides?: Record<string, string>; // Dish titles renamed for this client's week only, keyed by dish id. Staff only.
    recipeOverrides: Record<string, string>; // Elisa's recipe adapted for this client only, keyed by dish id ('__custom__' = custom dish). Staff only.
    ingredientOverrides: Record<string, string>; // Same, for the ingredient list (feeds this client's grocery list). Staff only.
    groceryChecked: string[]; // Grocery list items ticked off and saved by Elisa (item keys). Staff only.
    groceryEdits: Record<string, string>; // Quantities corrected by hand on the grocery list (item key → amount). Staff only.
    groceryExtras: string[]; // Items added by hand on the grocery list, one line each (« 2 citrons »). Staff only.
    generalNote?: string;
    submittedAt: string;
    allergiesAtSubmission: string[];
    allergiesAdded: string[]; // Allergies the client added themselves from the link
}

export interface SlotSessionStatus {
    session: BookingSession;
    client: ClientProfile;
    isUnmatchedClient?: boolean; // Calendar event with no matching client record (placeholder, not saved)
    selection: ClientSelection | null;
    isSubmitted: boolean;
    selectedCount: number;
    // Other sessions of the same client on the same day and slot (e.g. Elisa's Google booking
    // and a session created again for a chef): almost always one booking entered twice
    duplicateSessionIds?: string[];
}

export interface VaultRecipe {
    id: string;
    name: string;
    category: DishCategory;
    ingredients?: string;
    instructions: string[];
    chefNotes?: string;
    timesUsed?: number;
    lastUsedWeek?: string; // Monday of the last week it was on an open menu
    createdAt: string;
    // Diet versions remembered from the menus it was on (migration 008)
    variants?: DishVariant[];
    dietOk?: string[];
    // Migration 011
    freezable?: boolean | null;
    fridgeDays?: number | null;
    seasons?: Season[];
    chosenCount?: number; // times clients picked it (all weeks)
}

export const SEASONS = ['printemps', 'ete', 'automne', 'hiver'] as const;
export type Season = typeof SEASONS[number];
export const SEASON_LABELS: Record<Season, string> = { printemps: 'Printemps', ete: 'Été', automne: 'Automne', hiver: 'Hiver' };
export const isSeason = (v: unknown): v is Season => typeof v === 'string' && (SEASONS as readonly string[]).includes(v);

/** Days in the fridge: whole number 1–30, anything else = not set. */
export function cleanFridgeDays(v: unknown): number | null {
    const n = typeof v === 'string' ? Number(v) : v;
    return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 30 ? n : null;
}

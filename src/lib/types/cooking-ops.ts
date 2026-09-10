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
    notes?: string; // Kitchen & equipment notes (operational, will be visible to an assistant chef)
    privateNotes?: string; // Owner only — never shown to an assistant
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
    assignedTo?: string | null; // Staff user id of an assistant chef (null = Elisa)
    createdAt: string;
}

export interface WeeklyDish {
    id: string; // Stable id within the menu: selections point to it
    name: string;
    category: DishCategory;
    description?: string;
    instructions?: string[];
    chefNotes?: string;
    tags?: string[];
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
}

export interface VaultRecipe {
    id: string;
    name: string;
    category: DishCategory;
    instructions: string[];
    chefNotes?: string;
    timesUsed?: number;
    lastUsedWeek?: string; // Monday of the last week it was on an open menu
    createdAt: string;
}

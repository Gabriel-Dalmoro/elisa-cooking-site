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

export interface BookingSession {
    id: string;
    clientId: string;
    clientName: string;
    dateIso: string; // "YYYY-MM-DD" e.g. "2026-08-25"
    dayName: string; // "Lundi", "Mardi", etc.
    timeSlot: 'Matin' | 'Après-midi';
    dishCount: number;
    personCount: number; // e.g. 2 personnes
    gcalEventId?: string;
    notes?: string;
    createdAt: string;
}

export interface WeeklyDish {
    id: string;
    name: string;
    category: DishCategory;
    description?: string;
    instructions?: string[];
    chefNotes?: string;
    tags?: string[];
}

export interface WeeklyMenuData {
    weekLabel: string;
    active: boolean;
    recipes: WeeklyDish[];
    updatedAt?: string;
}

export interface ClientSelection {
    id: string;
    clientId: string;
    weekLabel: string;
    selectedDishNames: string[];
    dishNotes: Record<string, string>;
    generalNote?: string;
    submittedAt: string;
    allergiesAtSubmission: string[];
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
    lastUsedWeek?: string;
    createdAt: string;
}

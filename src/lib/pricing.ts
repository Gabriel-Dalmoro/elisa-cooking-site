/**
 * The catalogue prices (per session, before the 50% tax credit).
 * Plain module, no React: used by the website's simulator and, on the server, to work out
 * what each session pays Elisa and her chefs (lib/remuneration).
 */

export interface TimeSavings {
    planning: number; // in minutes
    shoppingList: number;
    groceryRun: number;
    packing: number;
    cookingCleaning: number;
    total: string; // pre-formatted string like "4h 45min"
}

export interface PricingTier {
    id: string;
    label: string;
    basePrice: number;
    meals: number;
    isRecommended?: boolean;
    description?: string;
    savings: TimeSavings;
}

export const PRICING_CONFIG = {
    TIERS: {
        THREE: {
            id: 'three',
            label: "3 Recettes",
            basePrice: 120,
            meals: 3,
            savings: {
                planning: 20,
                shoppingList: 10,
                groceryRun: 60,
                packing: 15,
                cookingCleaning: 180,
                total: "4h 45min"
            }
        },
        FIVE: {
            id: 'five',
            label: "5 Recettes",
            basePrice: 200,
            meals: 5,
            savings: {
                planning: 35,
                shoppingList: 15,
                groceryRun: 60,
                packing: 15,
                cookingCleaning: 300,
                total: "7h 05min"
            }
        },
        SIX: {
            id: 'six',
            label: "6 Recettes",
            basePrice: 240,
            meals: 6,
            isRecommended: true,
            description: "Notre formule idéale pour une semaine complète.",
            savings: {
                planning: 40,
                shoppingList: 20,
                groceryRun: 60,
                packing: 15,
                cookingCleaning: 360,
                total: "8h 15min"
            }
        }
    } as Record<string, PricingTier>,
    EXTRA_PERSON_FEE: 10,
    MAX_PEOPLE: 6,
    SUB_DISCOUNT: 0.15,
};

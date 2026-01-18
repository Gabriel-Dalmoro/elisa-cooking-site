"use client";

import { useMemo } from "react";

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
    MAX_PEOPLE: 8,
    SUB_DISCOUNT: 0.15,
};

export const getGroceryUnitCost = (peopleCount: number) => {
    if (peopleCount === 1) return { min: 7.5, max: 10.0 };
    if (peopleCount === 2) return { min: 6.0, max: 8.5 };
    if (peopleCount === 3) return { min: 5.0, max: 7.5 };
    return { min: 4.0, max: 6.5 }; // 4+ people
};

export function usePricingCalculation(
    tierId: string,
    people: number,
    isSubscribed: boolean,
    frequency: 'weekly' | 'biweekly' | 'monthly' = 'weekly'
) {
    return useMemo(() => {
        const tier = Object.values(PRICING_CONFIG.TIERS).find(t => t.id === tierId) || PRICING_CONFIG.TIERS.SIX;

        // 1. Service Base Price (Base + Extra People)
        const serviceBase = tier.basePrice + (Math.max(0, people - 1) * PRICING_CONFIG.EXTRA_PERSON_FEE);

        // 2. Subscription Discount
        const serviceDiscount = isSubscribed ? serviceBase * PRICING_CONFIG.SUB_DISCOUNT : 0;

        // 3. Amount to pay Elisa (per visit)
        const amountToPayElisa = serviceBase - serviceDiscount;

        // 4. Tax Credit (50% of the invoice)
        const taxCredit = amountToPayElisa * 0.50;

        // 5. Final Real Cost (After Tax Credit)
        const finalPocketCost = amountToPayElisa - taxCredit;

        // 6. Grocery Estimate
        const groceryUnit = getGroceryUnitCost(people);
        const groceryRange = {
            min: tier.meals * people * groceryUnit.min,
            max: tier.meals * people * groceryUnit.max
        };

        // 7. Frequency Multiplier (for monthly average info if needed)
        const visitsPerMonth = frequency === 'weekly' ? 4 : frequency === 'biweekly' ? 2 : 1;

        return {
            serviceBase,
            serviceDiscount,
            amountToPayElisa,
            taxCredit,
            finalPocketCost,
            groceryRange,
            tier,
            visitsPerMonth
        };
    }, [tierId, people, isSubscribed, frequency]);
}

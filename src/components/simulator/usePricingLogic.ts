"use client";

import { useMemo } from "react";
import { PRICING_CONFIG } from "@/lib/pricing";

// Prices live in lib/pricing (plain module: the server reads them too, for the chefs' pay)
export { PRICING_CONFIG } from "@/lib/pricing";
export type { TimeSavings, PricingTier } from "@/lib/pricing";

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
    frequency: 'weekly' | 'biweekly' | 'monthly' = 'weekly',
    flashSaleDiscount: number = 0 // New parameter (0-100)
) {
    return useMemo(() => {
        const tier = Object.values(PRICING_CONFIG.TIERS).find(t => t.id === tierId) || PRICING_CONFIG.TIERS.SIX;

        // 1. Service Base Price (Base + Extra People)
        const originalServicePrice = tier.basePrice + (Math.max(0, people - 1) * PRICING_CONFIG.EXTRA_PERSON_FEE);

        // 2. Discount Logic: Flash Sale (Unique only) OR Subscription (Fixed 15%)
        let flashSaleAmount = 0;
        let serviceDiscount = 0;

        if (isSubscribed) {
            // Standard -15% for subscription
            serviceDiscount = originalServicePrice * PRICING_CONFIG.SUB_DISCOUNT;
        } else {
            // Flash sale only applies to Unique (One-time) purchases
            flashSaleAmount = (originalServicePrice * flashSaleDiscount) / 100;
        }

        // 3. Amount to pay Elisa (per visit)
        // Corrected: Subtract the applicable discount from the original price
        // We use exact values including decimals (as requested)
        const amountToPayElisa = originalServicePrice - serviceDiscount - flashSaleAmount;

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
            originalServicePrice,
            serviceDiscount,
            flashSaleAmount,
            amountToPayElisa,
            taxCredit,
            finalPocketCost,
            groceryRange,
            tier,
            visitsPerMonth
        };
    }, [tierId, people, isSubscribed, frequency, flashSaleDiscount]);
}

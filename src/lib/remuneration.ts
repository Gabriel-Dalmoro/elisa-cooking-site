import { PRICING_CONFIG } from './pricing';

/**
 * What each session pays Elisa and the chef who cooked it. Pure functions, no database:
 * the server uses them for the « Rémunération » page, the browser for the price grid.
 * Every amount is in cents (integers) so totals add up exactly to the cent.
 *
 * Phase 1 (the chef has no SAP number yet): Elisa invoices the client 100% (Avance Immédiate),
 * her URSSAF is taken on the full amount, and what is left is shared 80% chef / 20% Elisa.
 * The chef invoices Elisa for their part.
 *
 * Phase 2 (the chef's own SAP + Avance Immédiate are live): the chef invoices the client 100%
 * (they are the one in the client's kitchen) and pays Elisa a fee of 20% of the price
 * (clients, menus, recipes, software). Elisa keeps the same amount as in phase 1.
 *
 * Gift cards stay in phase 1: the buyer already paid Elisa.
 */

export type BillingPlan = 'abonnement' | 'ponctuel' | 'carte_cadeau' | 'prix_libre';

export const BILLING_PLANS: { id: BillingPlan; label: string; hint: string }[] = [
    { id: 'abonnement', label: 'Abonnement', hint: 'Prix du catalogue −15 %' },
    { id: 'ponctuel', label: 'Ponctuel', hint: 'Prix du catalogue' },
    { id: 'carte_cadeau', label: 'Carte cadeau', hint: 'Prix du catalogue, déjà payé à Elisa' },
    { id: 'prix_libre', label: 'Prix libre', hint: 'Un prix par séance fixé à la main' }
];

export const isBillingPlan = (v: unknown): v is BillingPlan => BILLING_PLANS.some(p => p.id === v);

export const ELISA_URSSAF_RATE = 0.212;
export const DEFAULT_CHEF_URSSAF_RATE = 0.212;
const PHASE1_CHEF_SHARE = 0.8; // of what is left after Elisa's URSSAF
const PHASE2_ELISA_FEE = 0.2; // of the client price

// Rounded to the cent (the tiny epsilon keeps 0.5 cent from flipping on float noise)
const cents = (value: number) => Math.round(value + 1e-9);

/** The dish counts the catalogue sells (3, 5, 6 recettes). Anything else needs a price set by hand. */
export function catalogueTier(dishCount: number) {
    return Object.values(PRICING_CONFIG.TIERS).find(t => t.meals === dishCount) || null;
}

/**
 * The client price of one session in cents, before the 50% tax credit.
 * null = no catalogue price for it (e.g. 4 dishes, or « prix libre » without a price): Elisa sets one.
 */
export function clientPriceCents(input: {
    dishCount: number;
    personCount: number;
    plan: BillingPlan;
    customPrice?: number | null; // euros, plan 'prix_libre'
    priceOverride?: number | null; // euros, this session only
}): number | null {
    if (input.priceOverride != null) return cents(input.priceOverride * 100);
    if (input.plan === 'prix_libre') return input.customPrice != null ? cents(input.customPrice * 100) : null;
    const tier = catalogueTier(input.dishCount);
    if (!tier) return null;
    const people = Math.max(1, input.personCount);
    const catalogue = (tier.basePrice + (people - 1) * PRICING_CONFIG.EXTRA_PERSON_FEE) * 100;
    return input.plan === 'abonnement' ? cents(catalogue * (1 - PRICING_CONFIG.SUB_DISCOUNT)) : catalogue;
}

export type Phase = 1 | 2;

/** Phase 2 from the day the chef's SAP is live, except gift cards (already paid to Elisa). */
export function phaseFor(dateIso: string, sapActiveSince: string | null | undefined, plan: BillingPlan): Phase {
    if (plan === 'carte_cadeau' || !sapActiveSince) return 1;
    return dateIso >= sapActiveSince ? 2 : 1;
}

export interface ChefSessionPay {
    phase1: {
        chefInvoice: number; // what the chef invoices Elisa
        chefKeeps: number; // after the chef's own URSSAF (estimate)
        elisaKeeps: number; // after Elisa's URSSAF
    };
    phase2: {
        elisaFee: number; // what the chef pays Elisa
        chefKeeps: number; // client price − the chef's own URSSAF − the fee (estimate)
        elisaKeeps: number;
    };
    boost: number; // phase2.chefKeeps − phase1.chefKeeps
}

/** Both phases for one chef session, so the chef can see what their SAP will add. */
export function chefSessionPay(priceCents: number, chefUrssafRate: number): ChefSessionPay {
    const elisaUrssaf = cents(priceCents * ELISA_URSSAF_RATE);
    const chefInvoice = cents((priceCents - elisaUrssaf) * PHASE1_CHEF_SHARE);
    const phase1 = {
        chefInvoice,
        chefKeeps: chefInvoice - cents(chefInvoice * chefUrssafRate),
        elisaKeeps: priceCents - elisaUrssaf - chefInvoice
    };
    const elisaFee = cents(priceCents * PHASE2_ELISA_FEE);
    const phase2 = {
        elisaFee,
        chefKeeps: priceCents - cents(priceCents * chefUrssafRate) - elisaFee,
        elisaKeeps: elisaFee - cents(elisaFee * ELISA_URSSAF_RATE)
    };
    return { phase1, phase2, boost: phase2.chefKeeps - phase1.chefKeeps };
}

/** A session Elisa cooks herself: all hers, after her URSSAF. */
export function elisaSessionKeeps(priceCents: number): number {
    return priceCents - cents(priceCents * ELISA_URSSAF_RATE);
}

/** 12608 → « 126,08 € » */
export function formatEuros(amountCents: number): string {
    const sign = amountCents < 0 ? '−' : '';
    const abs = Math.abs(amountCents);
    const euros = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${sign}${euros},${String(abs % 100).padStart(2, '0')} €`;
}

/** Who Lucas invoices in phase 1 (from the site's legal notice). */
export const ELISA_BILLING_IDENTITY = [
    'Elisa Curtelin — Elisa Batch Cooking',
    '245 Che du Champ Pequyan, 74000 Annecy',
    'SIRET 95318342300011'
];

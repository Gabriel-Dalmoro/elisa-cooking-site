/**
 * Single allergy / diet list shared by the CRM, the weekly planning and the client portal.
 * (Previously each screen had its own list, so some tags were invisible on some screens.)
 */
export const COMMON_ALLERGIES = [
    'Sans Gluten (Cœliaque)',
    'Sans Gluten',
    'Sans Lactose',
    'Sans Arachides',
    'Sans Fruits à coque',
    'Sans Porc',
    'Sans Crustacés',
    'Sans Œufs',
    'Végétarien',
    'Végan',
    'Faible en sel',
    'Femme enceinte (bien cuit)'
];

/**
 * Tags to show as buttons: the common list plus any custom ones already on the client
 * (e.g. "Halal" written by hand), so a custom tag can always be seen and removed.
 */
export function allergyOptions(...selected: string[][]): string[] {
    return Array.from(new Set([...COMMON_ALLERGIES, ...selected.flat()]));
}

/** Cleans a hand-written allergy: trimmed, first letter in capital, max 100 characters. */
export function cleanCustomAllergy(text: string): string {
    const t = text.trim().replace(/\s+/g, ' ').slice(0, 100);
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

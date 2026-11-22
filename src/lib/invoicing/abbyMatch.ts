/**
 * Finding a client's contact in Abby without ever creating a duplicate. Pure rules, no network.
 *
 * What Abby's API allows (https://docs.abby.fr/api/clients.md):
 * - GET /contacts?search= matches ONLY the first name, last name and organisation name.
 *   There is no e-mail filter and no field of ours (external id) we could set and search by.
 * - Each contact in the list comes with its `emails`, `archivedAt` and `test` flag.
 *
 * So the app searches by name, then decides here:
 * - exactly ONE active contact has the client's e-mail → it is this one (linked automatically);
 * - anything else (none, several, name only) → Elisa picks it once in the client's settings.
 * Once linked, the Abby id is saved (client_billing.abby_contact_id) and always reused.
 * The app never creates a contact on its own: only when Elisa clicks « Créer dans Abby ».
 */

export interface AbbyContactCandidate {
    id: string;
    fullname: string;
    emails: string[];
    organizationName: string | null;
    archived: boolean;
    test: boolean;
    hasBillings: boolean;
}

export interface ContactMatch {
    /** The contact to link without asking: only on a unique, exact e-mail match. */
    auto: AbbyContactCandidate | null;
    /** Active contacts to choose from, best first (same e-mail, then same name, then the rest). */
    candidates: (AbbyContactCandidate & { sameEmail: boolean; sameName: boolean })[];
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** « Marie-Hélène  DUPONT » and « dupont marie hélène » → the same key. */
export function nameKey(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .sort()
        .join(' ');
}

/** What to type in Abby's search: the full name, then each long-enough word (last name first). */
export function searchTermsFor(name: string): string[] {
    const words = name.trim().split(/\s+/).filter(w => w.length >= 3);
    const terms = [name.trim(), ...words.slice(1).reverse(), ...words.slice(0, 1)];
    return [...new Set(terms.filter(Boolean))].slice(0, 4);
}

export function matchAbbyContact(
    client: { name: string; email?: string | null },
    found: AbbyContactCandidate[]
): ContactMatch {
    const email = client.email ? normalizeEmail(client.email) : '';
    const key = nameKey(client.name);
    const unique = [...new Map(found.map(c => [c.id, c])).values()];
    const active = unique.filter(c => !c.archived && !c.test);

    const candidates = active
        .map(c => ({
            ...c,
            sameEmail: !!email && c.emails.some(e => normalizeEmail(e) === email),
            sameName: nameKey(c.fullname) === key
        }))
        .sort((a, b) =>
            Number(b.sameEmail) - Number(a.sameEmail)
            || Number(b.sameName) - Number(a.sameName)
            || a.fullname.localeCompare(b.fullname, 'fr'));

    const byEmail = candidates.filter(c => c.sameEmail);
    return { auto: byEmail.length === 1 ? byEmail[0] : null, candidates };
}

import { ALLERGY_TAGS, SECTIONS, type Section } from './dictionary';
import { DEFAULT_SERVINGS, type IngredientLine, type Qty, UNSORTED, findServings, normalize, parseIngredients } from './parse';

/**
 * Builds one client's grocery list from the ingredients of the dishes they chose:
 * scaled to their number of people (exact, never rounded), added up per ingredient,
 * sorted by supermarket section, and each total keeps where its amounts come from.
 */

export interface GroceryDishInput {
    name: string;
    ingredients: string; // the dish's ingredient text for this client
    recipeText?: string; // the rest of the recipe, only read to find « Pour N personnes »
    clientNote?: string; // the client's note on this dish
}

export interface GroceryInput {
    persons: number;
    dishes: GroceryDishInput[];
    allergies: string[];
    notes: { label: string; text: string }[]; // free-text restrictions: dislikes, message of the week
}

/** One client in a combined list (shopping for several clients at once). */
export interface GroceryClientInput extends GroceryInput {
    label: string; // client name shown in the combined list
    done?: string[]; // item keys already ticked on this client's own list (bought / the client has it)
}

export interface GroceryClientShare {
    client: string;
    amount: string | null; // this client's part, null if the recipe gives no amount
    done: boolean; // ticked on this client's own list: not counted in the total
}

export interface GrocerySource {
    dish: string; // short dish name, with the sub-recipe: « Suprême de volaille › Polenta »
    amount: string | null; // scaled amount from this dish, null if the recipe gives none
    raw: string; // line as written in the recipe (for the recipe's base number of people)
}

export interface GroceryItem {
    key: string;
    name: string;
    details: string[]; // how the recipes word it, when more precise than the name (« vinaigre de vin blanc »)
    total: string | null;
    sources: GrocerySource[];
    warnings: string[];
    byClient?: GroceryClientShare[]; // combined lists only: each client's part
    done?: boolean; // combined lists only: ticked for every client who needs it
}

export interface GrocerySection {
    name: Section | typeof UNSORTED;
    items: GroceryItem[];
}

export interface GroceryList {
    persons: number;
    sections: GrocerySection[];
    dishes: { name: string; servings: number; itemCount: number }[]; // what each dish was scaled from
    dishesWithoutIngredients: string[];
    unsortedCount: number;
    clients?: { label: string; persons: number }[]; // combined lists only
}

// ---------------------------------------------------------------------------
// Number and amount formatting (French, exact up to 2 decimals)

const fmt = (n: number, digits = 2) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits });

const range = (q: Qty, scale: (n: number) => number, digits = 2) =>
    q.min === q.max ? fmt(scale(q.min), digits) : `${fmt(scale(q.min), digits)}–${fmt(scale(q.max), digits)}`;

const plural = (word: string, value: number) =>
    value < 2 || /[sxz]$/.test(word) ? word : /eau$/.test(word) ? `${word}x` : `${word}s`;

export function formatAmount(unit: string, q: Qty): string {
    switch (unit) {
        case 'g':
            return q.max >= 1000 ? `${range(q, n => n / 1000, 3)} kg` : `${range(q, n => n)} g`;
        case 'ml':
            if (q.max >= 1000) return `${range(q, n => n / 1000, 3)} L`;
            if (q.max >= 10) return `${range(q, n => n / 10)} cl`;
            return `${range(q, n => n)} ml`;
        case 'cas':
            return `${range(q, n => n)} c. à soupe`;
        case 'cac':
            return `${range(q, n => n)} c. à café`;
        case 'piece':
            return range(q, n => n);
        default:
            return `${range(q, n => n)} ${plural(unit, q.max)}`;
    }
}

// ---------------------------------------------------------------------------
// Restrictions

// Ambiguous short words never matched in the client's free-text notes (« mais », « bar »…)
const NOTE_STOPWORDS = new Set(['mai', 'bar', 'lieu', 'bleu', 'loup', 'part', 'bol', 'pave', 'dos', 'cote']);

const containsWords = (haystack: string, needle: string) =>
    Boolean(needle) && ` ${haystack} `.includes(` ${needle} `);

function itemTerms(line: IngredientLine): string[] {
    const terms = line.entry
        ? line.entry.aliases.map(normalize)
        : [normalize(line.name)];
    return terms.filter(t => t.length >= 3 && !NOTE_STOPWORDS.has(t));
}

// ---------------------------------------------------------------------------

const shortDishName = (name: string) => {
    const short = name.split(/,| – | - /)[0].trim();
    return short.length > 45 ? `${short.slice(0, 44)}…` : short;
};

interface Contribution {
    line: IngredientLine;
    client: number; // index in the clients list
    scaled: Qty | null;
}

interface Accumulator {
    key: string;
    name: string;
    section: Section | typeof UNSORTED;
    contributions: Contribution[];
    sources: GrocerySource[];
    dishNames: Set<string>; // `${client index}|${dish name}`
}

// Adds amounts per unit; "selon recette" when some lines give no amount
function sumAmounts(contributions: Contribution[]): string | null {
    const totals = new Map<string, Qty>();
    let hasUnquantified = false;
    for (const { line, scaled } of contributions) {
        if (!scaled) {
            hasUnquantified = true;
            continue;
        }
        const prev = totals.get(line.unit);
        totals.set(line.unit, prev ? { min: prev.min + scaled.min, max: prev.max + scaled.max } : scaled);
    }
    const amounts = [...totals.entries()].map(([unit, q]) => formatAmount(unit, q));
    if (hasUnquantified && amounts.length > 0) amounts.push('selon recette');
    return amounts.length > 0 ? amounts.join(' + ') : null;
}

/** One client's list. */
export function buildGroceryList(input: GroceryInput): GroceryList {
    return buildLists([{ ...input, label: '' }], false);
}

/**
 * One list for several clients shopped together: each client's dishes are scaled to that client's
 * number of people, then everything is added up per ingredient. Each item keeps every client's part,
 * and allergy alerts only look at the dishes of the client who has the allergy.
 * Items already ticked on a client's own list are not counted for that client.
 */
export function buildMergedGroceryList(clients: GroceryClientInput[]): GroceryList {
    return buildLists(clients, true);
}

function buildLists(clients: GroceryClientInput[], merged: boolean): GroceryList {
    const items = new Map<string, Accumulator>();
    const dishes: GroceryList['dishes'] = [];
    const dishesWithoutIngredients: string[] = [];
    const personsOf = (c: GroceryClientInput) => (c.persons > 0 ? c.persons : DEFAULT_SERVINGS);
    const withClient = (c: GroceryClientInput, text: string) => (merged ? `${c.label} · ${text}` : text);

    clients.forEach((client, clientIdx) => {
        const persons = personsOf(client);
        for (const dish of client.dishes) {
            const parsed = parseIngredients(dish.ingredients || '');
            if (parsed.items.length === 0) {
                dishesWithoutIngredients.push(withClient(client, dish.name));
                continue;
            }
            const servings = parsed.servings ?? findServings(dish.recipeText || '') ?? DEFAULT_SERVINGS;
            const factor = persons / servings;
            const label = withClient(client, shortDishName(dish.name));
            dishes.push({ name: withClient(client, dish.name), servings, itemCount: parsed.items.length });

            for (const { line, part } of parsed.items) {
                if (line.section === null) continue; // water
                const scaled = line.qty && line.scales ? { min: line.qty.min * factor, max: line.qty.max * factor } : line.qty;

                let acc = items.get(line.key);
                if (!acc) {
                    acc = {
                        key: line.key,
                        name: line.name,
                        section: line.section,
                        contributions: [],
                        sources: [],
                        dishNames: new Set()
                    };
                    items.set(line.key, acc);
                }
                acc.contributions.push({ line, client: clientIdx, scaled });
                acc.dishNames.add(`${clientIdx}|${dish.name}`);
                if (line.section === 'Surgelés') acc.section = 'Surgelés';
                acc.sources.push({
                    dish: part ? `${label} › ${part}` : label,
                    amount: scaled ? formatAmount(line.unit, scaled) : null,
                    raw: line.raw
                });
            }
        }
    });

    // Restrictions, normalised once per client
    const restrictions = clients.map(client => {
        const suffix = merged ? ` (${client.label})` : '';
        return {
            suffix,
            allergyTags: client.allergies.map(a => ({ label: a, tags: ALLERGY_TAGS[a] })),
            customAllergies: client.allergies
                .filter(a => !(a in ALLERGY_TAGS))
                .map(a => ({ label: a, term: normalize(a.replace(/^\s*(?:sans|pas de|allergi(?:e|que)s?\s*(?:à|a|au|aux)?)\s+/i, '')) }))
                .filter(a => a.term.length >= 3),
            notes: client.notes.filter(n => n.text.trim()).map(n => ({ label: n.label, text: normalize(n.text) })),
            dishNotes: client.dishes
                .filter(d => d.clientNote?.trim())
                .map(d => ({ dish: d.name, label: `Demande du client (${shortDishName(d.name)})`, text: normalize(d.clientNote || '') })),
            done: new Set(client.done || [])
        };
    });

    const bySection = new Map<string, GroceryItem[]>();
    for (const acc of items.values()) {
        const warnings = new Set<string>();
        const clientIdxs = [...new Set(acc.contributions.map(c => c.client))];

        for (const idx of clientIdxs) {
            const r = restrictions[idx];
            const lines = acc.contributions.filter(c => c.client === idx).map(c => c.line);
            const tags = new Set(lines.flatMap(l => l.entry?.tags || []));
            for (const { label, tags: conflicting } of r.allergyTags) {
                if (conflicting?.some(t => tags.has(t))) warnings.add(`🚫 ${label}${r.suffix}`);
            }
            const texts = [normalize(acc.name), ...lines.map(l => normalize(l.raw))];
            for (const { label, term } of r.customAllergies) {
                if (texts.some(t => containsWords(t, term))) warnings.add(`🚫 ${label}${r.suffix}`);
            }
            const terms = [...new Set(lines.flatMap(itemTerms))];
            for (const note of r.notes) {
                if (terms.some(t => containsWords(note.text, t))) warnings.add(`💬 ${note.label}${r.suffix}`);
            }
            for (const note of r.dishNotes) {
                if (acc.dishNames.has(`${idx}|${note.dish}`) && terms.some(t => containsWords(note.text, t))) {
                    warnings.add(`💬 ${note.label}${r.suffix}`);
                }
            }
        }

        // Combined list: what's ticked on a client's own list isn't bought again for them
        const isDone = (idx: number) => merged && restrictions[idx].done.has(acc.key);
        const allDone = merged && clientIdxs.every(isDone);
        const counted = allDone ? acc.contributions : acc.contributions.filter(c => !isDone(c.client));

        const lines = acc.contributions.map(c => c.line);
        const item: GroceryItem = {
            key: acc.key,
            name: acc.name,
            details: [...new Map(lines.map(l => [normalize(l.phrase), l.phrase] as const)).entries()]
                .filter(([key]) => key && key !== normalize(acc.name))
                .map(([, phrase]) => phrase),
            total: sumAmounts(counted),
            sources: acc.sources,
            warnings: [...warnings]
        };
        if (merged) {
            item.byClient = clientIdxs.map(idx => ({
                client: clients[idx].label,
                amount: sumAmounts(acc.contributions.filter(c => c.client === idx)),
                done: isDone(idx)
            }));
            item.done = allDone;
        }
        if (!bySection.has(acc.section)) bySection.set(acc.section, []);
        bySection.get(acc.section)!.push(item);
    }

    // « À classer » first (it needs a look), then the supermarket order
    const order: (Section | typeof UNSORTED)[] = [UNSORTED, ...SECTIONS];
    const sections = order
        .filter(name => bySection.has(name))
        .map(name => ({
            name,
            items: bySection.get(name)!.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        }));

    return {
        persons: clients.reduce((sum, c) => sum + personsOf(c), 0),
        sections,
        dishes,
        dishesWithoutIngredients,
        unsortedCount: bySection.get(UNSORTED)?.length || 0,
        ...(merged ? { clients: clients.map(c => ({ label: c.label, persons: personsOf(c) })) } : {})
    };
}

/** Plain text version, to paste into WhatsApp / Notes. */
export function groceryListToText(list: GroceryList, title: string): string {
    const who = list.clients
        ? list.clients.map(c => `${c.label} (${c.persons} pers.)`).join(' + ')
        : `pour ${list.persons} personne${list.persons > 1 ? 's' : ''}`;
    const out = [`🛒 ${title} — ${who}`];
    for (const section of list.sections) {
        // Combined list: only what is left to buy
        const items = list.clients ? section.items.filter(i => !i.done) : section.items;
        if (items.length === 0) continue;
        out.push('', `*${section.name}*`);
        for (const item of items) {
            if (item.byClient) {
                const parts = item.byClient
                    .filter(c => !c.done)
                    .map(c => `${c.client} ${c.amount || 'selon recette'}`)
                    .join(' · ');
                const warn = item.warnings.length ? `  ⚠️ ${item.warnings.join(', ')}` : '';
                const name = item.details.length ? `${item.name} (${item.details.join(', ')})` : item.name;
                out.push(`- ${name}${item.total ? ` : ${item.total}` : ''} (${parts})${warn}`);
                continue;
            }
            const detail = item.sources.length > 1
                ? ` (${item.sources.map(s => (s.amount ? `${s.amount} ${s.dish}` : s.dish)).join(' · ')})`
                : ` — ${item.sources[0].dish}`;
            const warn = item.warnings.length ? `  ⚠️ ${item.warnings.join(', ')}` : '';
            const name = item.details.length ? `${item.name} (${item.details.join(', ')})` : item.name;
            out.push(`- ${name}${item.total ? ` : ${item.total}` : ''}${detail}${warn}`);
        }
    }
    return out.join('\n');
}

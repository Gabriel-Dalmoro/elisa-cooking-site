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

interface Accumulator {
    key: string;
    name: string;
    section: Section | typeof UNSORTED;
    lines: IngredientLine[];
    totals: Map<string, Qty>;
    hasUnquantified: boolean;
    sources: GrocerySource[];
    dishNames: Set<string>;
}

export function buildGroceryList(input: GroceryInput): GroceryList {
    const persons = input.persons > 0 ? input.persons : DEFAULT_SERVINGS;
    const items = new Map<string, Accumulator>();
    const dishes: GroceryList['dishes'] = [];
    const dishesWithoutIngredients: string[] = [];

    for (const dish of input.dishes) {
        const parsed = parseIngredients(dish.ingredients || '');
        if (parsed.items.length === 0) {
            dishesWithoutIngredients.push(dish.name);
            continue;
        }
        const servings = parsed.servings ?? findServings(dish.recipeText || '') ?? DEFAULT_SERVINGS;
        const factor = persons / servings;
        const label = shortDishName(dish.name);
        dishes.push({ name: dish.name, servings, itemCount: parsed.items.length });

        for (const { line, part } of parsed.items) {
            if (line.section === null) continue; // water
            const scaled = line.qty && line.scales ? { min: line.qty.min * factor, max: line.qty.max * factor } : line.qty;

            let acc = items.get(line.key);
            if (!acc) {
                acc = {
                    key: line.key,
                    name: line.name,
                    section: line.section,
                    lines: [],
                    totals: new Map(),
                    hasUnquantified: false,
                    sources: [],
                    dishNames: new Set()
                };
                items.set(line.key, acc);
            }
            acc.lines.push(line);
            acc.dishNames.add(dish.name);
            if (line.section === 'Surgelés') acc.section = 'Surgelés';
            if (scaled) {
                const prev = acc.totals.get(line.unit);
                acc.totals.set(line.unit, prev ? { min: prev.min + scaled.min, max: prev.max + scaled.max } : scaled);
            } else {
                acc.hasUnquantified = true;
            }
            acc.sources.push({
                dish: part ? `${label} › ${part}` : label,
                amount: scaled ? formatAmount(line.unit, scaled) : null,
                raw: line.raw
            });
        }
    }

    // Restrictions, normalised once
    const allergyTags = input.allergies.map(a => ({ label: a, tags: ALLERGY_TAGS[a] }));
    const customAllergies = input.allergies
        .filter(a => !(a in ALLERGY_TAGS))
        .map(a => ({ label: a, term: normalize(a.replace(/^\s*(?:sans|pas de|allergi(?:e|que)s?\s*(?:à|a|au|aux)?)\s+/i, '')) }))
        .filter(a => a.term.length >= 3);
    const notes = input.notes.filter(n => n.text.trim()).map(n => ({ label: n.label, text: normalize(n.text) }));
    const dishNotes = input.dishes
        .filter(d => d.clientNote?.trim())
        .map(d => ({ dish: d.name, label: `Demande du client (${shortDishName(d.name)})`, text: normalize(d.clientNote || '') }));

    const bySection = new Map<string, GroceryItem[]>();
    for (const acc of items.values()) {
        const warnings = new Set<string>();
        const tags = new Set(acc.lines.flatMap(l => l.entry?.tags || []));
        for (const { label, tags: conflicting } of allergyTags) {
            if (conflicting?.some(t => tags.has(t))) warnings.add(`🚫 ${label}`);
        }
        const texts = [normalize(acc.name), ...acc.lines.map(l => normalize(l.raw))];
        for (const { label, term } of customAllergies) {
            if (texts.some(t => containsWords(t, term))) warnings.add(`🚫 ${label}`);
        }
        const terms = [...new Set(acc.lines.flatMap(itemTerms))];
        for (const note of notes) {
            if (terms.some(t => containsWords(note.text, t))) warnings.add(`💬 ${note.label}`);
        }
        for (const note of dishNotes) {
            if (acc.dishNames.has(note.dish) && terms.some(t => containsWords(note.text, t))) warnings.add(`💬 ${note.label}`);
        }

        const amounts = [...acc.totals.entries()].map(([unit, q]) => formatAmount(unit, q));
        if (acc.hasUnquantified && amounts.length > 0) amounts.push('selon recette');

        const item: GroceryItem = {
            key: acc.key,
            name: acc.name,
            details: [...new Map(acc.lines.map(l => [normalize(l.phrase), l.phrase] as const)).entries()]
                .filter(([key]) => key && key !== normalize(acc.name))
                .map(([, phrase]) => phrase),
            total: amounts.length > 0 ? amounts.join(' + ') : null,
            sources: acc.sources,
            warnings: [...warnings]
        };
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
        persons,
        sections,
        dishes,
        dishesWithoutIngredients,
        unsortedCount: bySection.get(UNSORTED)?.length || 0
    };
}

/** Plain text version, to paste into WhatsApp / Notes. */
export function groceryListToText(list: GroceryList, title: string): string {
    const out = [`🛒 ${title} — pour ${list.persons} personne${list.persons > 1 ? 's' : ''}`];
    for (const section of list.sections) {
        out.push('', `*${section.name}*`);
        for (const item of section.items) {
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

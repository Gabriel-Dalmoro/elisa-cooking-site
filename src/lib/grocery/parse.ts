import { DICTIONARY, type DictionaryEntry, type Section } from './dictionary';

/**
 * Reads Elisa's ingredient text (typed, or pasted from ChatGPT / Gemini) line by line:
 * « 250 g de figues fraîches » → 250 g · Figues fraîches · Fruits & Légumes.
 * No AI: numbers, units and ingredient names are recognised by rules + the dictionary.
 */

export const DEFAULT_SERVINGS = 4;
export const UNSORTED = 'À classer' as const;

export interface Qty {
    min: number;
    max: number; // same as min unless the recipe gives a range (« 2 à 3 gousses »)
}

export interface IngredientLine {
    kind: 'item';
    raw: string; // the line as Elisa wrote it
    qty: Qty | null; // null = no quantity (« Sel », « Poivre »)
    unit: string; // 'g' | 'ml' | 'cas' | 'cac' | 'piece' | any counted word ('gousse', 'botte'…)
    scales: boolean; // false for a pinch: it stays a pinch whatever the number of people
    name: string;
    phrase: string; // the ingredient as worded in the recipe, without the amount (« vinaigre de vin blanc »)
    key: string; // what lines are added up by
    section: Section | typeof UNSORTED | null; // null = never bought (water)
    entry: DictionaryEntry | null;
}

export type ParsedLine =
    | IngredientLine
    | { kind: 'heading'; text: string } // sub-recipe inside a dish: « Polenta », « Beurre blanc »
    | { kind: 'servings'; count: number } // « Pour 4 personnes »
    | { kind: 'skip' }; // blank, « Ingrédients : », or a sentence of advice

// ---------------------------------------------------------------------------
// Text normalisation: lowercase, no accents, no punctuation, singular words.
// Applied the same way to the recipe and to the dictionary, so « Œufs » matches « oeuf ».

export function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .map(w => (w.length > 3 && /[sx]$/.test(w) ? w.slice(0, -1) : w))
        .join(' ');
}

interface Alias {
    words: string[];
    entry: DictionaryEntry;
}

const ALIASES: Alias[] = DICTIONARY.flatMap(entry =>
    entry.aliases.map(a => ({ words: normalize(a).split(' '), entry }))
);

function indexOfWords(haystack: string[], needle: string[]): number {
    outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
        for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
        return i;
    }
    return -1;
}

/** The dictionary ingredient named in a text: the match starting first wins, then the longest. */
export function findIngredient(text: string): { entry: DictionaryEntry; start: number; length: number } | null {
    const words = normalize(text).split(' ').filter(Boolean);
    let best: { entry: DictionaryEntry; start: number; length: number } | null = null;
    for (const alias of ALIASES) {
        const start = indexOfWords(words, alias.words);
        if (start < 0) continue;
        const length = alias.words.length;
        if (!best || start < best.start || (start === best.start && length > best.length)) {
            best = { entry: alias.entry, start, length };
        }
    }
    return best;
}

// ---------------------------------------------------------------------------
// Quantities

const WORD_NUMBERS: Record<string, number> = {
    un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, douze: 12,
    demi: 0.5, 'un demi': 0.5, 'une demi': 0.5
};

// Mixed and plain fractions first, so « 1/2 » isn't read as « 1 »
const NUM = String.raw`\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?`;
const QTY_RE = new RegExp(
    String.raw`^(${NUM})(?:\s*(?:à|a|-|–|—|ou)\s*(${NUM}))?\s*(.*)$`,
    'i'
);
const WORD_QTY_RE = new RegExp(String.raw`^(une? demi|${Object.keys(WORD_NUMBERS).join('|')})(?:[\s-]+)(.*)$`, 'i');

function parseNumber(s: string): number {
    const t = s.trim().replace(',', '.');
    const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    const frac = t.match(/^(\d+)\/(\d+)$/);
    if (frac) return Number(frac[1]) / Number(frac[2]);
    return Number(t);
}

// Measuring units written right after the number (« de » optional). factor converts to the base unit.
const MEASURES: { re: RegExp; unit: string; factor: number; scales?: false }[] = [
    { re: /^(kilos?|kilogrammes?|kg)(?=[\s.]|$)\.?/i, unit: 'g', factor: 1000 },
    { re: /^(grammes?|gr|g)(?=[\s.]|$)\.?/i, unit: 'g', factor: 1 },
    { re: /^(litres?|l)(?=[\s.]|$)\.?/i, unit: 'ml', factor: 1000 },
    { re: /^(dl)(?=[\s.]|$)\.?/i, unit: 'ml', factor: 100 },
    { re: /^(cl)(?=[\s.]|$)\.?/i, unit: 'ml', factor: 10 },
    { re: /^(ml)(?=[\s.]|$)\.?/i, unit: 'ml', factor: 1 },
    { re: /^(?:cuill[eè]res?|cuill?\.?|c)\s*\.?\s*(?:à|a)?\s*\.?\s*(?:soupe|s)(?=[\s.,)]|$)\.?|^tbsp(?=[\s.]|$)/i, unit: 'cas', factor: 1 },
    { re: /^(?:cuill[eè]res?|cuill?\.?|c)\s*\.?\s*(?:à|a)?\s*\.?\s*(?:caf[ée]|c)(?=[\s.,)]|$)\.?|^tsp(?=[\s.]|$)/i, unit: 'cac', factor: 1 },
    { re: /^(pinc[ée]es?)(?=[\s.]|$)/i, unit: 'pincée', factor: 1, scales: false }
];

// Counted words: « 2 gousses d'ail », « 1 noix de beurre », « 4 suprêmes de poulet »
const COUNT_WORDS = new Set([
    'gousse', 'brin', 'branche', 'bouquet', 'botte', 'feuille', 'tranche', 'boite', 'bocal', 'sachet', 'pot', 'brique',
    'filet', 'tete', 'cube', 'zeste', 'morceau', 'pave', 'supreme', 'cuisse', 'blanc', 'escalope', 'cote', 'tasse',
    'verre', 'rouleau', 'dos', 'magret', 'jaune', 'trait', 'goutte', 'cerneau', 'rondelle', 'lamelle', 'baton',
    'tablette', 'carre', 'part', 'bol', 'louche', 'poignee', 'noix', 'noisette', 'quartier', 'grappe', 'barquette',
    'paquet', 'boule', 'darne', 'pincee'
].map(normalize));

const SIZE_WORDS = new Set(['petite', 'grosse', 'grand', 'grande', 'petit', 'gros', 'belle', 'beau']);

function singular(word: string): string {
    const w = word.toLowerCase();
    if (/eaux$/.test(w)) return w.slice(0, -1);
    return w.length > 3 && /s$/.test(w) ? w.slice(0, -1) : w;
}

// ---------------------------------------------------------------------------
// One line

const cleanLine = (line: string) =>
    line
        .replace(/[’`]/g, "'")
        .replace(/½/g, ' 1/2').replace(/¼/g, ' 1/4').replace(/¾/g, ' 3/4').replace(/⅓/g, ' 1/3').replace(/⅔/g, ' 2/3')
        .replace(/^\s*(?:[-•*·–—▪◦>]|\d+[.)](?=\s+\D))\s*/, '') // bullets, « 1) » list markers
        .replace(/[*_#]+/g, '') // markdown
        .replace(/\s+/g, ' ')
        .trim();

const SERVINGS_RE = /^(?:pour\s+|portions?\s*:?\s*|pour\s*:?\s*)?(\d+)\s*(?:personnes?|pers\.?|portions?|couverts?|parts?)\b/i;
const SERVINGS_RE2 = /^(?:portions?|nombre de personnes|pour)\s*:\s*(\d+)\b/i;

const displayName = (text: string) => {
    const t = text.split(/[,(]/)[0].replace(/\s+(?:pour|selon|à|au|en)\s.*$/i, '').trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
};

function withEntry(raw: string, rest: string, qty: Qty | null, unit: string, scales: boolean): IngredientLine {
    const hit = findIngredient(rest) || findIngredient(raw);
    const frozen = /surgel/i.test(raw);
    const name = hit ? hit.entry.name : displayName(rest || raw);
    return {
        kind: 'item',
        raw,
        qty,
        unit,
        scales,
        name,
        phrase: displayName(rest || raw).toLowerCase(),
        key: hit ? `dict:${hit.entry.name}` : `new:${normalize(name)}`,
        section: hit ? (frozen && hit.entry.section ? 'Surgelés' : hit.entry.section) : frozen ? 'Surgelés' : UNSORTED,
        entry: hit?.entry || null
    };
}

export function parseLine(input: string): ParsedLine {
    let line = cleanLine(input);
    if (!line) return { kind: 'skip' };

    const servings = line.match(SERVINGS_RE) || line.match(SERVINGS_RE2);
    if (servings) return { kind: 'servings', count: Number(servings[1]) };

    if (/^ingr[ée]dients?\b/i.test(line)) return { kind: 'skip' };

    // « Beurre : 20 g » / « Farine – 200 g » / « Beurre (20 g) » → « 20 g Beurre »
    const trailing = line.match(new RegExp(String.raw`^([^\d:–—(]+?)\s*(?:[:–—]|\()\s*((?:${NUM})\s*[^)]*)\)?$`, 'i'));
    if (trailing && !/^pour\b/i.test(trailing[1])) line = `${trailing[2].trim()} ${trailing[1].trim()}`;

    const raw = cleanLine(input);

    // Quantity
    let qty: Qty | null = null;
    let rest = line;
    const m = line.match(QTY_RE);
    if (m) {
        const a = parseNumber(m[1]);
        const b = m[2] ? parseNumber(m[2]) : a;
        if (isFinite(a) && isFinite(b)) {
            qty = { min: Math.min(a, b), max: Math.max(a, b) };
            rest = m[3];
        }
    } else if (!/^un peu\b/i.test(line)) {
        const w = line.match(WORD_QTY_RE);
        if (w) {
            const value = WORD_NUMBERS[w[1].toLowerCase()];
            qty = { min: value, max: value };
            rest = w[2];
        }
    }

    if (!qty) {
        // No quantity: an ingredient without amount (« Sel », « Quelques brins de persil »),
        // a sub-recipe heading (« Polenta », « Pour la sauce : »), or a sentence of advice.
        const stripped = line.replace(/^(?:quelques|un peu d[e']|du|de la|des|de l')\s*/i, '');
        const qualified = stripped !== line;
        const hit = findIngredient(stripped);
        const words = line.split(' ').length;
        const endsWithColon = /:\s*$/.test(line);
        const isSentence = /[.!?]$/.test(line) || words > 9;

        if (endsWithColon || /^pour\s+(?:la|le|les|l')/i.test(line)) {
            const text = line.replace(/:\s*$/, '').replace(/^pour\s+(?:la|le|les|l')\s*/i, '').trim();
            return text ? { kind: 'heading', text: displayName(text) } : { kind: 'skip' };
        }
        if (isSentence && !hit?.entry.bare) return { kind: 'skip' };
        if (hit && (hit.entry.bare || qualified || words > 3)) return withEntry(raw, stripped, null, 'piece', true);
        if (!hit && words > 4) return withEntry(raw, stripped, null, 'piece', true);
        return { kind: 'heading', text: displayName(line) };
    }

    rest = rest.trim();

    // Measuring unit
    for (const measure of MEASURES) {
        const um = rest.match(measure.re);
        if (!um) continue;
        const after = rest.slice(um[0].length).trim().replace(/^(?:de|d'|du|des)\s*/i, '');
        const factor = measure.factor;
        return withEntry(raw, after, { min: qty.min * factor, max: qty.max * factor }, measure.unit, measure.scales !== false);
    }

    // Counted word: « 2 gousses d'ail » → unit « gousse »; « 2 échalotes » → pieces
    const counted = rest.match(/^((?:[a-zà-ÿœ]+\s+)?[a-zà-ÿœ]+)\s+(?:de|d'|du|des)\s*(.+)$/i);
    if (counted) {
        const unitWords = counted[1].toLowerCase().split(' ');
        const isCountWord = COUNT_WORDS.has(normalize(unitWords[unitWords.length - 1]));
        const remainderHit = findIngredient(counted[2]);
        const wholeHit = findIngredient(rest);
        // A counted word, or any word in front of a known ingredient (« 4 darnes de saumon »),
        // unless the whole text is itself an ingredient (« pomme de terre », « fond de volaille »).
        if (remainderHit && (isCountWord || !wholeHit || wholeHit.start > 0)) {
            const unit = unitWords.filter(w => !SIZE_WORDS.has(normalize(w))).map(singular).join(' ') || 'piece';
            return withEntry(raw, counted[2], qty, unit, true);
        }
    }

    // Leading size word: « 2 grosses carottes »
    const noSize = rest.replace(/^(?:petites?|grosses?|grands?|grandes?|gros|belles?|beaux?)\s+/i, '');
    return withEntry(raw, noSize, qty, 'piece', true);
}

// ---------------------------------------------------------------------------
// Whole recipe texts

/** « Pour 6 personnes » written anywhere in the text, else null. */
export function findServings(text: string): number | null {
    for (const line of text.split('\n')) {
        const cleaned = cleanLine(line);
        const m = cleaned.match(SERVINGS_RE) || cleaned.match(SERVINGS_RE2) || cleaned.match(/\bpour\s+(\d+)\s*(?:personnes?|pers\.?)\b/i);
        if (m) {
            const n = Number(m[1]);
            if (n > 0 && n <= 50) return n;
        }
    }
    return null;
}

const INGREDIENTS_HEADING = /^\W*ingr[ée]dients?\b/i;
const STEPS_HEADING = /^\W*(?:pr[ée]paration|instructions?|[ée]tapes?|m[ée]thode|recette|d[ée]roul[ée]|progression|r[ée]alisation|dressage|montage|cuisson|mode op[ée]ratoire)\b/i;
const FIRST_STEP = /^\s*(?:(?:étape|etape)\s*1\b|1\s*[.)]\s+[A-ZÀ-Ý])/;

/**
 * Splits a full pasted recipe into its ingredient list and the rest (steps, notes).
 * The ingredient part runs from an « Ingrédients » heading to the first step heading
 * (« Préparation », « Étapes »…). The « Pour N personnes » line is kept with the ingredients.
 * found = false when the text has no « Ingrédients » heading.
 */
export function splitRecipe(text: string): { ingredients: string; steps: string; found: boolean } {
    const lines = text.split('\n');
    const ingredientLines: string[] = [];
    const stepLines: string[] = [];
    let inIngredients = false;
    let found = false;
    let servingsLine: string | null = null;

    for (const line of lines) {
        if (INGREDIENTS_HEADING.test(line)) {
            inIngredients = true;
            found = true;
            continue;
        }
        if (inIngredients && (STEPS_HEADING.test(line) || FIRST_STEP.test(line))) inIngredients = false;
        if (!servingsLine && !inIngredients && parseLine(line).kind === 'servings') {
            servingsLine = line.trim();
            continue;
        }
        (inIngredients ? ingredientLines : stepLines).push(line);
    }

    if (!found) return { ingredients: '', steps: text, found: false };
    const trimBlank = (arr: string[]) => arr.join('\n').replace(/^\s*\n+/, '').replace(/\n{3,}/g, '\n\n').trim();
    return {
        ingredients: [servingsLine, trimBlank(ingredientLines)].filter(Boolean).join('\n\n'),
        steps: trimBlank(stepLines),
        found: true
    };
}

// « Sel et poivre » / « Sel, poivre, huile d'olive » → one line each
function splitSeasoningLines(text: string): string[] {
    return text.split('\n').flatMap(line => {
        if (/\d/.test(line)) return [line];
        const parts = cleanLine(line).split(/\s*,\s*|\s+et\s+/i).filter(Boolean);
        if (parts.length < 2) return [line];
        return parts.every(p => findIngredient(p)?.entry.bare) ? parts : [line];
    });
}

export interface ParsedIngredients {
    servings: number | null;
    // Each item with the sub-recipe heading it sits under (null when the dish has none)
    items: { line: IngredientLine; part: string | null }[];
}

export function parseIngredients(text: string): ParsedIngredients {
    let servings: number | null = null;
    let part: string | null = null;
    const items: ParsedIngredients['items'] = [];
    for (const raw of splitSeasoningLines(text)) {
        const parsed = parseLine(raw);
        if (parsed.kind === 'servings') servings ??= parsed.count;
        else if (parsed.kind === 'heading') part = parsed.text;
        else if (parsed.kind === 'item') items.push({ line: parsed, part });
    }
    return { servings, items };
}

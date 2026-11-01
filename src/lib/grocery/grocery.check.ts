/**
 * Checks how recipe lines are read for the shopping list. Run: npm run test:grocery
 * Every line here is a real way of writing an ingredient. When the list reads one wrong,
 * add it here with what it should be, then fix the dictionary (or the parser) until this passes.
 */
import { DICTIONARY } from './dictionary';
import { normalize, parseLine } from './parse';
import { buildGroceryList } from './list';

let failures = 0;
const fail = (message: string) => {
    failures++;
    console.error(`✗ ${message}`);
};

// ---------------------------------------------------------------------------
// 1. No word may point to two products: the first one would silently win.

const owner = new Map<string, string>();
for (const entry of DICTIONARY) {
    for (const alias of entry.aliases) {
        const key = normalize(alias);
        const previous = owner.get(key);
        if (previous && previous !== entry.name) fail(`« ${alias} » is both « ${previous} » and « ${entry.name} »`);
        owner.set(key, entry.name);
    }
    if (new Set(DICTIONARY.filter(e => e.name === entry.name)).size > 1) fail(`two rows named « ${entry.name} »`);
}

// ---------------------------------------------------------------------------
// 2. Recipe line → product on the list (and its amount when given)

const CASES: [line: string, name: string, amount?: string][] = [
    // Cheeses: each one is its own product
    ['200 g d\'halloumi', 'Halloumi', '200 g'],
    ['200 g de halloumi grillé', 'Halloumi'],
    ['150 g de cheddar râpé', 'Cheddar'],
    ['100 g de roquefort', 'Roquefort'],
    ['100 g de gorgonzola', 'Gorgonzola'],
    ['200 g de tomme de Savoie', 'Tomme'],
    ['1 reblochon', 'Reblochon'],
    ['400 g de fromage à raclette', 'Fromage à raclette'],
    ['150 g de beaufort', 'Beaufort'],
    ['1 camembert', 'Camembert'],
    ['200 g de comté râpé', 'Comté'],
    ['200 g d\'emmental râpé', 'Emmental'],
    ['100 g de gruyère', 'Gruyère'],
    ['200 g de feta (ou halloumi)', 'Feta'],
    ['1 boule de mozzarella', 'Mozzarella'],
    ['200 g de burrata', 'Burrata'],
    ['250 g de ricotta', 'Ricotta'],
    ['1 bûche de chèvre', 'Bûche de chèvre'],
    ['100 g de chèvre frais', 'Fromage de chèvre frais'],
    ['50 g de parmesan', 'Parmesan'],
    ['100 g de fromage râpé', 'Fromage râpé'],
    ['100 g de fromage', 'Fromage'],
    ['1 Mont d\'Or', 'Mont d\'Or'],
    ['300 g de tomme fraîche', 'Tomme fraîche (aligot)'],
    ['100 g de bleu d\'Auvergne', 'Bleu d\'Auvergne / fourme d\'Ambert'],
    // Dairy
    ['20 cl de crème liquide', 'Crème liquide entière', '20 cl'],
    ['2 c. à soupe de crème épaisse', 'Crème fraîche épaisse'],
    ['20 cl de crème fraîche', 'Crème fraîche'],
    ['10 cl de crème', 'Crème fraîche'],
    ['200 g de fromage blanc', 'Fromage blanc'],
    ['1 yaourt grec', 'Yaourt grec'],
    ['40 cl de lait', 'Lait'],
    ['40 cl de lait d\'amande', 'Lait d\'amande'],
    ['40 cl de lait d\'avoine', 'Lait d\'avoine'],
    ['20 cl de crème de soja', 'Crème de soja'],
    ['50 g de beurre', 'Beurre doux'],
    ['50 g de beurre demi-sel', 'Beurre demi-sel'],
    ['1 noix de beurre', 'Beurre doux'],
    ['3 œufs', 'Œufs'],
    ['3 jaunes d\'œufs', 'Œufs'],
    // Mushrooms
    ['150 g de shiitakés', 'Shiitakés'],
    ['200 g de girolles', 'Girolles'],
    ['200 g de cèpes', 'Cèpes'],
    ['200 g de champignons de Paris', 'Champignons de Paris'],
    ['200 g de champignons', 'Champignons'],
    ['20 g de cèpes séchés', 'Champignons séchés'],
    // Vegetables & fruit
    ['100 g de roquette', 'Roquette'],
    ['100 g de mâche', 'Mâche'],
    ['1 salade', 'Salade verte'],
    ['1 butternut', 'Courge butternut'],
    ['1 potimarron', 'Potimarron'],
    ['200 g de blettes', 'Blettes'],
    ['300 g de topinambours', 'Topinambours'],
    ['1 citron confit', 'Citrons confits'],
    ['1 citron', 'Citrons'],
    ['le jus d\'1 citron vert', 'Citrons verts'],
    ['2 gousses d\'ail', 'Ail', '2 gousses'],
    ['1 tête d\'ail', 'Ail'],
    ['2 échalotes', 'Échalotes', '2'],
    ['1 oignon rouge, émincé', 'Oignons rouges'],
    ['1 poivron rouge', 'Poivrons rouges'],
    ['500 g de pommes de terre', 'Pommes de terre'],
    ['500 g de pommes', 'Pommes'],
    ['1 blanc de poireau', 'Poireaux'],
    ['250 g de tomates cerises', 'Tomates cerises'],
    ['4 tomates', 'Tomates'],
    ['1 bouquet de persil', 'Persil plat'],
    ['1 botte de coriandre', 'Coriandre fraîche'],
    ['1 c. à café de coriandre en poudre', 'Coriandre en graines'],
    // Meat
    ['600 g de bavette', 'Bavette'],
    ['800 g de paleron', 'Paleron'],
    ['1 kg de bœuf bourguignon', 'Bœuf à braiser / bourguignon'],
    ['500 g de bœuf haché', 'Bœuf haché'],
    ['4 cuisses de poulet', 'Cuisses de poulet', '4 cuisses'],
    ['2 blancs de poulet', 'Blancs de poulet', '2 blancs'],
    ['4 suprêmes de volaille', 'Suprêmes de volaille'],
    ['600 g de poulet', 'Poulet'],
    ['1 poulet entier', 'Poulet entier'],
    ['500 g de filet mignon de veau', 'Filet mignon de veau'],
    ['500 g de filet mignon', 'Filet mignon de porc'],
    ['2 magrets de canard', 'Magrets de canard'],
    ['4 cuisses de canard confites', 'Cuisses de canard confites'],
    ['1 gigot d\'agneau', 'Gigot d\'agneau'],
    ['4 souris d\'agneau', 'Souris d\'agneau'],
    ['1 kg de jarret de veau', 'Jarret de veau (osso buco)'],
    ['100 g de lardons fumés', 'Lardons fumés'],
    ['2 tranches de jambon de Bayonne', 'Jambon cru'],
    ['4 tranches de jambon blanc', 'Jambon blanc'],
    ['100 g de pâté de campagne', 'Pâté de campagne'],
    ['4 diots', 'Diots'],
    ['1 saucisse de Morteau', 'Saucisses de Morteau / Montbéliard'],
    // Fish & seafood
    ['1 steak de thon', 'Thon frais'],
    ['4 pavés de saumon', 'Saumon'],
    ['200 g de saumon fumé', 'Saumon fumé'],
    ['200 g de morue', 'Morue salée'],
    ['600 g de cabillaud', 'Cabillaud'],
    ['200 g de lotte', 'Lotte'],
    ['4 filets de daurade', 'Daurade'],
    ['1 kg de moules', 'Moules'],
    ['300 g de gambas', 'Gambas'],
    ['200 g de crevettes cuites', 'Crevettes'],
    ['1 boîte de thon', 'Thon en boîte'],
    ['4 filets d\'anchois', 'Anchois'],
    // Dry goods
    ['250 g de riz basmati', 'Riz basmati'],
    ['300 g de riz arborio', 'Riz à risotto (arborio)'],
    ['200 g de riz', 'Riz'],
    ['4 feuilles de riz', 'Feuilles de riz'],
    ['1 c. à café de bicarbonate', 'Bicarbonate de soude'],
    ['1 sachet de levure chimique', 'Levure chimique'],
    ['20 g de levure de boulanger', 'Levure de boulanger'],
    ['200 g de lentilles corail', 'Lentilles corail'],
    ['200 g de lentilles vertes du Puy', 'Lentilles vertes'],
    ['200 g de lentilles', 'Lentilles'],
    ['1 bocal de pois chiches', 'Pois chiches'],
    ['200 g de spaghetti', 'Spaghetti'],
    ['200 g de penne', 'Penne'],
    ['250 g de pâtes', 'Pâtes'],
    ['200 g de coquillettes', 'Coquillettes'],
    ['200 g de crozets', 'Crozets'],
    ['250 g de farine', 'Farine de blé'],
    ['2 c. à soupe de sucre glace', 'Sucre glace'],
    ['50 g de cassonade', 'Sucre roux / cassonade'],
    ['100 g de sucre', 'Sucre en poudre'],
    ['100 g de chocolat noir', 'Chocolat noir'],
    ['2 c. à soupe de cacao', 'Cacao en poudre'],
    ['1 c. à soupe de graines de chia', 'Graines de chia'],
    ['2 c. à soupe de graines de sésame', 'Graines de sésame'],
    ['100 g de pâte d\'amande', 'Pâte d\'amande'],
    ['200 g de crème de marrons', 'Crème de marrons'],
    ['200 g de pain d\'épices', 'Pain d\'épices'],
    ['100 g de chapelure', 'Chapelure'],
    ['50 g de panko', 'Panko'],
    ['2 feuilles de gélatine', 'Gélatine'],
    ['1 c. à café de fleur d\'oranger', 'Fleur d\'oranger'],
    ['1 pâte feuilletée', 'Pâte feuilletée'],
    ['1 boîte de tomates concassées', 'Tomates concassées'],
    ['1 boîte de tomates', 'Tomates concassées'],
    ['1 boîte de maïs', 'Maïs en boîte'],
    ['40 cl de lait de coco', 'Lait de coco'],
    ['1 c. à soupe de sauce soja', 'Sauce soja salée'],
    ['1 c. à soupe de sauce tamari', 'Tamari (sans gluten)'],
    ['1 c. à soupe de moutarde à l\'ancienne', 'Moutarde à l\'ancienne'],
    ['1 c. à soupe de moutarde', 'Moutarde de Dijon'],
    ['2 c. à soupe de vinaigre balsamique', 'Vinaigre balsamique'],
    ['1 c. à soupe de vinaigre de cidre', 'Vinaigre de cidre'],
    ['1 c. à soupe de vinaigre', 'Vinaigre'],
    ['1 c. à café de paprika fumé', 'Paprika fumé'],
    ['2 c. à soupe de pesto', 'Pesto vert'],
    ['50 g de noix', 'Cerneaux de noix'],
    ['1 pincée de noix de muscade', 'Muscade'],
    ['30 g de pignons de pin', 'Pignons de pin'],
    ['1 c. à soupe d\'huile d\'olive', 'Huile d\'olive'],
    ['2 c. à soupe d\'huile de sésame', 'Huile de sésame'],
    ['10 cl de vin blanc', 'Vin blanc sec'],
    ['2 c. à soupe de vinaigre de vin blanc', 'Vinaigre de vin blanc'],
    ['1 cube de bouillon de volaille', 'Bouillon de volaille'],
    ['1 noix de coco', 'Noix de coco'],
    ['50 g de noix de coco râpée', 'Noix de coco râpée'],
    ['1 boîte de tomates pelées', 'Tomates pelées'],
    ['200 g de crème (ou du yaourt au lieu de crème)', 'Crème fraîche'],
    ['1 brique de crème liquide', 'Crème liquide entière'],
    ['1 saint-marcellin', 'Saint-Marcellin / Saint-Félicien'],
    ['1 c. à soupe de beurre de cacahuète', 'Beurre de cacahuète'],
    ['1 sachet de sucre vanillé', 'Sucre vanillé'],
    ['1 kg de pommes de terre grenaille', 'Pommes de terre grenaille']
];

for (const [line, name, amount] of CASES) {
    const parsed = parseLine(line);
    if (parsed.kind !== 'item') {
        fail(`« ${line} » → read as ${parsed.kind}, expected « ${name} »`);
        continue;
    }
    if (parsed.name !== name) fail(`« ${line} » → « ${parsed.name} », expected « ${name} »`);
    if (amount) {
        const list = buildGroceryList({ persons: 4, dishes: [{ name: 'Test', ingredients: `Pour 4 personnes\n${line}` }], allergies: [], notes: [] });
        const total = list.sections.flatMap(s => s.items)[0]?.total;
        if (total !== amount) fail(`« ${line} » → amount « ${total} », expected « ${amount} »`);
    }
}

// ---------------------------------------------------------------------------
// 3. Allergy alerts and the client's notes

function warningsFor(line: string, allergies: string[], dislikes = ''): string[] {
    const list = buildGroceryList({
        persons: 4,
        dishes: [{ name: 'Test', ingredients: `Pour 4 personnes\n${line}` }],
        allergies,
        notes: [{ label: 'N’aime pas', text: dislikes }]
    });
    return list.sections.flatMap(s => s.items).flatMap(i => i.warnings);
}

const ALERTS: [line: string, allergies: string[], dislikes: string, expected: boolean, why: string][] = [
    ['100 g de pâte d\'amande', ['Sans Fruits à coque'], '', true, 'nut allergy on almond paste'],
    ['100 g de pâté de campagne', ['Halal'], '', true, 'pork in pâté'],
    ['2 feuilles de gélatine', ['Végétarien'], '', true, 'gelatine is not vegetarian'],
    ['40 cl de lait d\'amande', ['Sans Lactose'], '', false, 'almond milk has no lactose'],
    ['1 c. à soupe de sauce tamari', ['Sans Gluten (Cœliaque)'], '', false, 'tamari is gluten-free'],
    ['1 c. à soupe de sauce soja', ['Sans Gluten (Cœliaque)'], '', true, 'soy sauce has wheat'],
    ['200 g d\'halloumi', ['Sans Lactose'], '', true, 'halloumi is dairy'],
    ['200 g de girolles', [], 'pas de champignons', true, 'dislike of mushrooms catches girolles'],
    ['200 g de lotte', [], 'pas de poisson', true, 'dislike of fish catches monkfish'],
    ['200 g de reblochon', [], 'pas de fromage', true, 'dislike of cheese catches reblochon'],
    ['200 g de girolles', ['Allergie champignons'], '', true, 'hand-typed allergy matches the family']
];

for (const [line, allergies, dislikes, expected, why] of ALERTS) {
    const warned = warningsFor(line, allergies, dislikes).length > 0;
    if (warned !== expected) fail(`${why}: « ${line} » ${expected ? 'should' : 'should not'} be flagged`);
}

// ---------------------------------------------------------------------------

const total = CASES.length + ALERTS.length;
if (failures > 0) {
    console.error(`\n${failures} problem(s) out of ${total} checks`);
    process.exit(1);
}
console.log(`✓ ${total} checks passed (${DICTIONARY.length} products in the dictionary)`);

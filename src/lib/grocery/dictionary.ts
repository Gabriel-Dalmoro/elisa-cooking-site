/**
 * Ingredient dictionary for the grocery list: canonical name, supermarket section, the words
 * that mean the same ingredient, and allergy tags (matched against the client's allergy tags).
 *
 * An ingredient missing from here still appears on the list, under « À classer ».
 * Aliases are matched as whole words, ignoring accents, case and plurals. The match that starts first
 * in the line wins, then the longest (so "vinaigre de vin blanc" is not read as "vin blanc").
 */

export const SECTIONS = [
    'Fruits & Légumes',
    'Boucherie & Poissonnerie',
    'Crèmerie & Œufs',
    'Épicerie',
    'Surgelés',
    'Boissons',
    'Placard (vérifier)'
] as const;

export type Section = typeof SECTIONS[number];

// Allergy tags carried by ingredients
export type IngredientTag =
    | 'gluten' | 'lactose' | 'arachide' | 'fruits_a_coque' | 'porc' | 'crustaces'
    | 'oeuf' | 'viande' | 'poisson' | 'miel' | 'sel';

export interface DictionaryEntry {
    name: string;
    section: Section | null; // null = never bought (water)
    aliases: string[];
    tags: IngredientTag[];
    bare: boolean; // may be listed without a quantity (seasonings, herbs, oils)
}

const FL: Section = 'Fruits & Légumes';
const BP: Section = 'Boucherie & Poissonnerie';
const CO: Section = 'Crèmerie & Œufs';
const EP: Section = 'Épicerie';
const SU: Section = 'Surgelés';
const BO: Section = 'Boissons';
const PL: Section = 'Placard (vérifier)';

// [name, section, aliases separated by |, tags separated by space, bare]
type Row = [string, Section | null, string, string?, boolean?];

const ROWS: Row[] = [
    // --- Fruits & Légumes
    ['Ail', FL, 'ail|gousse d ail|ail des ours'],
    ['Échalotes', FL, 'echalote|echalote grise'],
    ['Oignons', FL, 'oignon|oignon jaune|oignon blanc'],
    ['Oignons rouges', FL, 'oignon rouge'],
    ['Oignons nouveaux', FL, 'oignon nouveau|cebette|oignon vert'],
    ['Poireaux', FL, 'poireau'],
    ['Carottes', FL, 'carotte'],
    ['Pommes de terre', FL, 'pomme de terre|patate|grenaille'],
    ['Patates douces', FL, 'patate douce'],
    ['Courgettes', FL, 'courgette'],
    ['Aubergines', FL, 'aubergine'],
    ['Poivrons', FL, 'poivron'],
    ['Tomates', FL, 'tomate|tomate grappe|tomate coeur de boeuf'],
    ['Tomates cerises', FL, 'tomate cerise'],
    ['Concombre', FL, 'concombre'],
    ['Brocoli', FL, 'brocoli'],
    ['Chou-fleur', FL, 'chou fleur'],
    ['Chou', FL, 'chou|chou vert|chou rouge|chou pointu'],
    ['Chou kale', FL, 'kale|chou kale'],
    ['Choux de Bruxelles', FL, 'chou de bruxelles'],
    ['Épinards', FL, 'epinard|pousse d epinard'],
    ['Salade', FL, 'salade|laitue|mesclun|roquette|mache|sucrine|batavia|feuille de chene'],
    ['Endives', FL, 'endive'],
    ['Céleri branche', FL, 'celeri|celeri branche'],
    ['Céleri-rave', FL, 'celeri rave'],
    ['Fenouil', FL, 'fenouil'],
    ['Navets', FL, 'navet'],
    ['Panais', FL, 'panais'],
    ['Radis', FL, 'radis'],
    ['Betteraves', FL, 'betterave'],
    ['Potiron / courge', FL, 'potiron|courge|butternut|potimarron|courge butternut'],
    ['Champignons', FL, 'champignon|champignon de paris|shiitake|pleurote|girolle|cepe'],
    ['Haricots verts', FL, 'haricot vert'],
    ['Petits pois', FL, 'petit pois'],
    ['Asperges', FL, 'asperge'],
    ['Artichauts', FL, 'artichaut'],
    ['Avocats', FL, 'avocat'],
    ['Maïs', FL, 'mais|epi de mais'],
    ['Gingembre', FL, 'gingembre'],
    ['Piment frais', FL, 'piment|piment rouge|piment vert'],
    ['Citronnelle', FL, 'citronnelle'],
    ['Citrons', FL, 'citron|citron jaune'],
    ['Citrons verts', FL, 'citron vert|lime'],
    ['Oranges', FL, 'orange'],
    ['Pamplemousse', FL, 'pamplemousse'],
    ['Pommes', FL, 'pomme'],
    ['Poires', FL, 'poire'],
    ['Bananes', FL, 'banane'],
    ['Figues fraîches', FL, 'figue|figue fraiche'],
    ['Raisin', FL, 'raisin'],
    ['Fraises', FL, 'fraise'],
    ['Framboises', FL, 'framboise'],
    ['Myrtilles', FL, 'myrtille'],
    ['Mangue', FL, 'mangue'],
    ['Ananas', FL, 'ananas'],
    ['Grenade', FL, 'grenade'],
    ['Pêches / abricots', FL, 'peche|abricot|nectarine'],
    ['Prunes', FL, 'prune|quetsche|mirabelle'],
    ['Kiwis', FL, 'kiwi'],
    ['Persil', FL, 'persil|persil plat', '', true],
    ['Coriandre', FL, 'coriandre|coriandre fraiche', '', true],
    ['Basilic', FL, 'basilic', '', true],
    ['Ciboulette', FL, 'ciboulette', '', true],
    ['Menthe', FL, 'menthe', '', true],
    ['Aneth', FL, 'aneth', '', true],
    ['Estragon', FL, 'estragon', '', true],
    ['Cerfeuil', FL, 'cerfeuil', '', true],
    ['Thym', FL, 'thym', '', true],
    ['Romarin', FL, 'romarin', '', true],
    ['Sauge', FL, 'sauge', '', true],
    ['Laurier', FL, 'laurier|feuille de laurier', '', true],
    ['Herbes fraîches', FL, 'herbe fraiche|fine herbe', '', true],

    // --- Boucherie & Poissonnerie
    ['Poulet', BP, 'poulet|blanc de poulet|filet de poulet|cuisse de poulet|supreme de poulet|haut de cuisse|pilon|volaille|supreme de volaille', 'viande'],
    ['Dinde', BP, 'dinde|escalope de dinde', 'viande'],
    ['Canard', BP, 'canard|magret|magret de canard|cuisse de canard', 'viande'],
    ['Pintade', BP, 'pintade', 'viande'],
    ['Bœuf', BP, 'boeuf|bavette|entrecote|rumsteck|faux filet|paleron|joue de boeuf|basse cote|steak', 'viande'],
    ['Bœuf haché', BP, 'boeuf hache|viande hachee|steak hache', 'viande'],
    ['Veau', BP, 'veau|escalope de veau|blanquette', 'viande'],
    ['Agneau', BP, 'agneau|souris d agneau|gigot|epaule d agneau|carre d agneau', 'viande'],
    ['Porc', BP, 'porc|filet mignon|echine|cote de porc|poitrine de porc|travers', 'viande porc'],
    ['Lardons', BP, 'lardon', 'viande porc'],
    ['Jambon', BP, 'jambon|jambon blanc|jambon cru|jambon de bayonne|jambon de parme|prosciutto', 'viande porc'],
    ['Chorizo', BP, 'chorizo', 'viande porc'],
    ['Saucisses', BP, 'saucisse|chipolata|merguez|saucisse de toulouse', 'viande porc'],
    ['Pancetta / bacon', BP, 'pancetta|bacon|guanciale', 'viande porc'],
    ['Saumon', BP, 'saumon|pave de saumon|filet de saumon', 'poisson'],
    ['Saumon fumé', BP, 'saumon fume', 'poisson'],
    ['Cabillaud', BP, 'cabillaud|dos de cabillaud|morue', 'poisson'],
    ['Lieu', BP, 'lieu|lieu noir', 'poisson'],
    ['Merlu', BP, 'merlu|colin', 'poisson'],
    ['Truite', BP, 'truite', 'poisson'],
    ['Thon', BP, 'thon|thon frais', 'poisson'],
    ['Dorade / bar', BP, 'dorade|daurade|bar|loup', 'poisson'],
    ['Maquereau', BP, 'maquereau', 'poisson'],
    ['Sardines', BP, 'sardine', 'poisson'],
    ['Poisson blanc', BP, 'poisson blanc|filet de poisson', 'poisson'],
    ['Crevettes', BP, 'crevette|gambas', 'crustaces'],
    ['Moules', BP, 'moule', 'crustaces'],
    ['Saint-Jacques', BP, 'saint jacques|noix de saint jacques', 'crustaces'],

    // --- Crèmerie & Œufs
    ['Beurre', CO, 'beurre|beurre doux|beurre demi sel|beurre doux froid', 'lactose'],
    ['Lait', CO, 'lait|lait entier|lait demi ecreme', 'lactose'],
    ['Crème fraîche', CO, 'creme|creme fraiche|creme liquide|creme entiere|creme epaisse|creme fleurette', 'lactose'],
    ['Yaourt', CO, 'yaourt|yaourt grec|yogourt|skyr|fromage blanc', 'lactose'],
    ['Œufs', CO, 'oeuf|jaune d oeuf|blanc d oeuf', 'oeuf'],
    ['Parmesan', CO, 'parmesan|parmigiano|grana padano', 'lactose'],
    ['Feta', CO, 'feta', 'lactose'],
    ['Mozzarella', CO, 'mozzarella|burrata|mozzarella di bufala', 'lactose'],
    ['Chèvre', CO, 'chevre|fromage de chevre|buche de chevre', 'lactose'],
    ['Comté / gruyère', CO, 'comte|gruyere|emmental|fromage rape', 'lactose'],
    ['Ricotta', CO, 'ricotta', 'lactose'],
    ['Mascarpone', CO, 'mascarpone', 'lactose'],
    ['Fromage frais', CO, 'fromage frais|philadelphia|saint moret|cream cheese', 'lactose'],
    ['Reblochon / raclette', CO, 'reblochon|raclette|tomme|cheddar|roquefort|bleu|gorgonzola|halloumi', 'lactose'],
    ['Tofu', CO, 'tofu|tofu ferme|tofu soyeux'],
    ['Pâte feuilletée', CO, 'pate feuilletee', 'gluten lactose'],
    ['Pâte brisée', CO, 'pate brisee', 'gluten lactose'],
    ['Pâte à pizza', CO, 'pate a pizza', 'gluten'],
    ['Gnocchis', CO, 'gnocchi', 'gluten'],

    // --- Épicerie
    ['Farine', EP, 'farine|farine de ble|farine t55|farine t45', 'gluten'],
    ['Farine sans gluten', EP, 'farine de riz|farine de sarrasin|farine de mais|farine de pois chiche|farine de coco'],
    ['Maïzena', EP, 'maizena|fecule de mais|fecule'],
    ['Sucre', EP, 'sucre|sucre en poudre|sucre blanc|sucre roux|cassonade|sucre glace|sucre vanille'],
    ['Miel', EP, 'miel', 'miel'],
    ['Sirop d\'érable', EP, 'sirop d erable'],
    ['Levure', EP, 'levure|levure chimique|bicarbonate'],
    ['Chocolat', EP, 'chocolat|chocolat noir|chocolat au lait|pepite de chocolat|cacao'],
    ['Vanille', EP, 'vanille|gousse de vanille|extrait de vanille'],
    ['Riz', EP, 'riz|riz basmati|riz long|riz rond|riz arborio|riz thai|riz complet|riz a risotto'],
    ['Pâtes', EP, 'pate|spaghetti|penne|tagliatelle|linguine|fusilli|rigatoni|orzo|coquillette|lasagne|macaroni', 'gluten'],
    ['Nouilles', EP, 'nouille|nouille de riz|vermicelle|udon|soba'],
    ['Semoule', EP, 'semoule|couscous', 'gluten'],
    ['Boulgour', EP, 'boulgour|boulgour d engrain', 'gluten'],
    ['Quinoa', EP, 'quinoa'],
    ['Polenta', EP, 'polenta|polenta fine'],
    ['Lentilles', EP, 'lentille|lentille corail|lentille verte'],
    ['Pois chiches', EP, 'pois chiche'],
    ['Haricots secs', EP, 'haricot rouge|haricot blanc|haricot noir|flageolet'],
    ['Pain', EP, 'pain|baguette|pain de mie|pain rassis|chapelure|panko|croutons', 'gluten'],
    ['Tortillas', EP, 'tortilla|wrap|pain pita|naan', 'gluten'],
    ['Tomates concassées', EP, 'tomate concassee|pulpe de tomate|coulis de tomate|passata|tomate pelee|sauce tomate'],
    ['Concentré de tomate', EP, 'concentre de tomate|double concentre'],
    ['Lait de coco', EP, 'lait de coco|creme de coco'],
    ['Bouillon de légumes', EP, 'bouillon de legume|bouillon'],
    ['Bouillon de volaille', EP, 'bouillon de volaille|bouillon de poulet|fond de volaille|fond blanc', 'viande'],
    ['Fond de veau / bœuf', EP, 'fond de veau|fond brun|bouillon de boeuf', 'viande'],
    ['Fumet de poisson', EP, 'fumet de poisson|fumet', 'poisson'],
    ['Moutarde', EP, 'moutarde|moutarde a l ancienne|moutarde de dijon'],
    ['Mayonnaise', EP, 'mayonnaise', 'oeuf'],
    ['Sauce soja', EP, 'sauce soja|soja|tamari|shoyu', 'gluten'],
    ['Sauce nuoc-mâm', EP, 'nuoc mam|sauce poisson', 'poisson'],
    ['Pâte de curry', EP, 'pate de curry|curry vert|curry rouge'],
    ['Harissa', EP, 'harissa'],
    ['Tahini', EP, 'tahini|tahin|creme de sesame'],
    ['Pesto', EP, 'pesto', 'lactose fruits_a_coque'],
    ['Câpres', EP, 'capre'],
    ['Olives', EP, 'olive|olive noire|olive verte'],
    ['Cornichons', EP, 'cornichon'],
    ['Anchois', EP, 'anchois', 'poisson'],
    ['Thon en boîte', EP, 'thon en boite|thon au naturel', 'poisson'],
    ['Tomates séchées', EP, 'tomate sechee'],
    ['Fruits secs', EP, 'raisin sec|abricot sec|datte|cranberry|pruneau|figue sechee'],
    ['Amandes', EP, 'amande|amande effilee|poudre d amande', 'fruits_a_coque'],
    ['Noisettes', EP, 'noisette|poudre de noisette', 'fruits_a_coque'],
    ['Noix', EP, 'noix|cerneau de noix', 'fruits_a_coque'],
    ['Noix de cajou', EP, 'noix de cajou|cajou', 'fruits_a_coque'],
    ['Pistaches', EP, 'pistache', 'fruits_a_coque'],
    ['Pignons de pin', EP, 'pignon|pignon de pin', 'fruits_a_coque'],
    ['Noix de pécan', EP, 'noix de pecan|pecan', 'fruits_a_coque'],
    ['Noix de coco râpée', EP, 'noix de coco|coco rapee'],
    ['Cacahuètes', EP, 'cacahuete|arachide|beurre de cacahuete', 'arachide'],
    ['Graines', EP, 'graine|graine de sesame|sesame|graine de courge|graine de tournesol|graine de lin|graine de chia'],
    ['Vinaigre', EP, 'vinaigre|vinaigre de vin|vinaigre de vin blanc|vinaigre de vin rouge|vinaigre de cidre|vinaigre de xeres|vinaigre balsamique|balsamique|vinaigre de riz'],
    ['Cumin', EP, 'cumin', '', true],
    ['Paprika', EP, 'paprika|paprika doux|paprika fume', '', true],
    ['Curry en poudre', EP, 'curry|curry en poudre', '', true],
    ['Curcuma', EP, 'curcuma', '', true],
    ['Cannelle', EP, 'cannelle', '', true],
    ['Muscade', EP, 'muscade|noix de muscade', '', true],
    ['Piment d\'Espelette', EP, 'piment d espelette|espelette', '', true],
    ['Piment en poudre', EP, 'piment en poudre|piment de cayenne|cayenne|flocon de piment', '', true],
    ['Gingembre en poudre', EP, 'gingembre en poudre', '', true],
    ['Coriandre en poudre', EP, 'coriandre en poudre|graine de coriandre', '', true],
    ['Ras el hanout', EP, 'ras el hanout', '', true],
    ['Garam masala', EP, 'garam masala', '', true],
    ['Herbes de Provence', EP, 'herbe de provence|origan|origan seche', '', true],
    ['Clou de girofle', EP, 'clou de girofle|girofle', '', true],
    ['Badiane', EP, 'badiane|anis etoile', '', true],
    ['Safran', EP, 'safran', '', true],
    ['Zaatar / sumac', EP, 'zaatar|sumac', '', true],
    ['Cardamome', EP, 'cardamome', '', true],
    ['Épices', EP, 'epice|melange d epices|cinq epices|quatre epices', '', true],

    // --- Surgelés (a line containing « surgelé » also goes here, see parse.ts)
    ['Légumes surgelés', SU, 'legume surgele|poelee surgelee'],

    // --- Boissons
    ['Vin blanc', BO, 'vin blanc|vin blanc sec'],
    ['Vin rouge', BO, 'vin rouge'],
    ['Porto / madère', BO, 'porto|madere|marsala|xeres'],
    ['Cognac / rhum', BO, 'cognac|armagnac|rhum|calvados|whisky'],
    ['Bière', BO, 'biere', 'gluten'],
    ['Cidre', BO, 'cidre'],
    ['Jus de fruits', BO, 'jus d orange|jus de pomme|jus de fruit'],

    // --- Placard (vérifier)
    ['Sel', PL, 'sel|sel fin|gros sel|fleur de sel|sel de guerande', 'sel', true],
    ['Poivre', PL, 'poivre|poivre noir|poivre blanc|poivre du moulin|baie rose|poivre de sichuan', '', true],
    ['Huile d\'olive', PL, 'huile d olive|huile d olive vierge extra', '', true],
    ['Huile neutre', PL, 'huile|huile neutre|huile vegetale|huile de tournesol|huile de colza|huile de pepin de raisin', '', true],
    ['Huile de sésame', PL, 'huile de sesame', '', true],

    // --- Never bought
    ['Eau', null, 'eau|eau froide|eau chaude|eau tiede|glacon', '', true]
];

export const DICTIONARY: DictionaryEntry[] = ROWS.map(([name, section, aliases, tags, bare]) => ({
    name,
    section,
    aliases: aliases.split('|').map(a => a.trim()).filter(Boolean),
    tags: (tags || '').split(' ').filter(Boolean) as IngredientTag[],
    bare: Boolean(bare)
}));

/**
 * Client allergy tags (lib/allergies.ts) → ingredient tags that conflict with them.
 * Allergies not listed here (typed by hand, e.g. « Kiwi ») are matched on the ingredient's name.
 */
export const ALLERGY_TAGS: Record<string, IngredientTag[]> = {
    'Sans Gluten (Cœliaque)': ['gluten'],
    'Sans Gluten': ['gluten'],
    'Sans Lactose': ['lactose'],
    'Sans Arachides': ['arachide'],
    'Sans Fruits à coque': ['fruits_a_coque'],
    'Sans Porc': ['porc'],
    'Sans Crustacés': ['crustaces'],
    'Sans Œufs': ['oeuf'],
    'Végétarien': ['viande', 'porc', 'poisson', 'crustaces'],
    'Végan': ['viande', 'porc', 'poisson', 'crustaces', 'lactose', 'oeuf', 'miel'],
    'Faible en sel': ['sel'],
    // Not in the button list, but often typed by hand with « Autre »
    'Halal': ['porc'],
    'Kasher': ['porc', 'crustaces'],
    'Casher': ['porc', 'crustaces'],
    // Pregnancy is about cooking, not ingredients: shown in the allergy banner, not flagged per item
    'Femme enceinte (bien cuit)': []
};

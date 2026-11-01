/**
 * Ingredient dictionary for the grocery list: one row = one product to buy, with its supermarket
 * section, the words that mean exactly that product, and allergy tags (matched against the
 * client's allergy tags).
 *
 * The golden rule: two words share a row only when buying either one is fine for the recipe
 * (« gousse d'ail » = « ail », « daurade » = « dorade »). Close but different products get their own
 * row (halloumi ≠ raclette, girolles ≠ champignons de Paris, crème liquide ≠ crème épaisse,
 * basmati ≠ arborio): a wrong swap on the list changes the dish.
 *
 * `family` holds the general words for the product (« fromage », « champignon », « poisson »): never
 * shown, only used to spot it in the client's notes (« pas de champignons » flags girolles).
 *
 * An ingredient missing from here still appears on the list, as worded in the recipe, under « À classer ».
 * Aliases are matched as whole words, ignoring accents, case and plurals. The match that starts first
 * in the line wins, then the longest (so "vinaigre de vin blanc" is not read as "vin blanc").
 * Checked by `npm run test:grocery` (src/lib/grocery/grocery.check.ts): add a line there for every fix.
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
    family: string[]; // general words for it, only used to match the client's notes
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

// Rows of one family share its general words (see `family` above)
interface Group {
    family: string; // separated by |
    rows: Row[];
}

const GROUPS: Group[] = [
    // ===================== Fruits & Légumes
    { family: 'ail', rows: [
        ['Ail', FL, 'ail|gousse d ail|tete d ail|ail rose|ail blanc|ail violet'],
        ['Ail nouveau', FL, 'ail nouveau'],
        ['Ail des ours', FL, 'ail des ours', '', true]
    ] },
    { family: 'oignon', rows: [
        ['Échalotes', FL, 'echalote|echalote grise|echalote longue'],
        ['Oignons', FL, 'oignon|oignon jaune|oignon blanc|oignon doux|oignon des cevennes'],
        ['Oignons rouges', FL, 'oignon rouge'],
        ['Oignons nouveaux', FL, 'oignon nouveau|cebette|oignon vert|ciboule'],
        ['Petits oignons grelots', FL, 'oignon grelot|petit oignon grelot|petit oignon blanc|petit oignon']
    ] },
    { family: 'legume', rows: [
        ['Poireaux', FL, 'poireau|blanc de poireau'],
        ['Carottes', FL, 'carotte|carotte orange'],
        ['Carottes nouvelles', FL, 'carotte nouvelle|carotte fane|botte de carotte'],
        ['Carottes jaunes / violettes', FL, 'carotte jaune|carotte violette|carotte de couleur'],
        ['Courgettes', FL, 'courgette|courgette verte'],
        ['Courgettes jaunes', FL, 'courgette jaune'],
        ['Aubergines', FL, 'aubergine'],
        ['Poivrons', FL, 'poivron'],
        ['Poivrons rouges', FL, 'poivron rouge'],
        ['Poivrons jaunes', FL, 'poivron jaune'],
        ['Poivrons verts', FL, 'poivron vert'],
        ['Concombre', FL, 'concombre'],
        ['Brocoli', FL, 'brocoli|tete de brocoli|fleurette de brocoli'],
        ['Chou-fleur', FL, 'chou fleur|fleurette de chou fleur'],
        ['Chou romanesco', FL, 'romanesco|chou romanesco'],
        ['Épinards', FL, 'epinard|epinard frais'],
        ['Pousses d\'épinard', FL, 'pousse d epinard|jeune pousse d epinard'],
        ['Blettes', FL, 'blette|bette|cote de blette'],
        ['Endives', FL, 'endive|chicon'],
        ['Céleri branche', FL, 'celeri|celeri branche|branche de celeri'],
        ['Céleri-rave', FL, 'celeri rave|boule de celeri'],
        ['Fenouil', FL, 'fenouil|bulbe de fenouil'],
        ['Navets', FL, 'navet|navet nouveau'],
        ['Panais', FL, 'panais'],
        ['Rutabaga', FL, 'rutabaga'],
        ['Topinambours', FL, 'topinambour'],
        ['Salsifis', FL, 'salsifis'],
        ['Radis', FL, 'radis|radis rose'],
        ['Radis noir', FL, 'radis noir'],
        ['Radis daikon', FL, 'daikon|radis blanc|radis japonais'],
        ['Betteraves crues', FL, 'betterave crue|betterave chioggia'],
        ['Betteraves cuites', FL, 'betterave|betterave cuite|betterave rouge'],
        ['Haricots verts', FL, 'haricot vert|haricot extra fin'],
        ['Haricots plats / beurre', FL, 'haricot plat|haricot beurre|haricot mange tout'],
        ['Pois gourmands', FL, 'pois gourmand|mange tout'],
        ['Petits pois', FL, 'petit pois'],
        ['Fèves', FL, 'feve|feve fraiche'],
        ['Asperges vertes', FL, 'asperge|asperge verte'],
        ['Asperges blanches', FL, 'asperge blanche'],
        ['Artichauts', FL, 'artichaut|artichaut violet|fond d artichaut'],
        ['Avocats', FL, 'avocat'],
        ['Maïs', FL, 'mais|epi de mais|mais doux'],
        ['Gingembre frais', FL, 'gingembre|gingembre frais|racine de gingembre'],
        ['Curcuma frais', FL, 'curcuma frais|racine de curcuma'],
        ['Piment frais', FL, 'piment|piment rouge|piment vert|piment frais|piment oiseau|jalapeno'],
        ['Citronnelle', FL, 'citronnelle|baton de citronnelle|tige de citronnelle'],
        ['Cresson', FL, 'cresson|botte de cresson'],
        ['Oseille', FL, 'oseille'],
        ['Cardons', FL, 'cardon'],
        ['Pâtissons', FL, 'patisson']
    ] },
    { family: 'pomme de terre|patate', rows: [
        ['Pommes de terre', FL, 'pomme de terre|patate|pomme de terre a chair ferme|pomme de terre farineuse'],
        ['Pommes de terre grenaille', FL, 'grenaille|pomme de terre grenaille|pomme de terre nouvelle|ratte'],
        ['Patates douces', FL, 'patate douce']
    ] },
    { family: 'tomate', rows: [
        ['Tomates', FL, 'tomate|tomate grappe|tomate ronde|tomate mure'],
        ['Tomates cœur de bœuf', FL, 'tomate coeur de boeuf|coeur de boeuf'],
        ['Tomates anciennes', FL, 'tomate ancienne|tomate noire de crimee|tomate green zebra'],
        ['Tomates cerises', FL, 'tomate cerise|tomate cocktail'],
        ['Tomates allongées (Roma)', FL, 'tomate allongee|tomate roma|olivette']
    ] },
    { family: 'chou', rows: [
        ['Chou vert', FL, 'chou|chou vert|chou frise|chou de milan'],
        ['Chou rouge', FL, 'chou rouge'],
        ['Chou blanc', FL, 'chou blanc|chou pointu|chou a choucroute'],
        ['Chou chinois', FL, 'chou chinois|chou napa'],
        ['Pak choï', FL, 'pak choi|bok choy|pak choy'],
        ['Chou kale', FL, 'kale|chou kale'],
        ['Choux de Bruxelles', FL, 'chou de bruxelles'],
        ['Chou-rave', FL, 'chou rave']
    ] },
    { family: 'salade', rows: [
        ['Salade verte', FL, 'salade|salade verte|laitue|feuille de salade'],
        ['Roquette', FL, 'roquette'],
        ['Mâche', FL, 'mache'],
        ['Mesclun', FL, 'mesclun|jeune pousse|melange de jeunes pousses'],
        ['Sucrine', FL, 'sucrine|coeur de sucrine'],
        ['Romaine', FL, 'romaine|salade romaine|coeur de romaine'],
        ['Batavia', FL, 'batavia'],
        ['Feuille de chêne', FL, 'feuille de chene'],
        ['Frisée', FL, 'frisee|salade frisee|chicoree frisee'],
        ['Scarole', FL, 'scarole'],
        ['Trévise', FL, 'trevise|radicchio'],
        ['Pissenlit', FL, 'pissenlit'],
        ['Pousses / graines germées', FL, 'graine germee|pousse de soja|germe de soja|pousse de radis|pousse d alfalfa']
    ] },
    { family: 'courge|potiron', rows: [
        ['Courge butternut', FL, 'butternut|courge butternut|doubeurre|courge doubeurre'],
        ['Potimarron', FL, 'potimarron'],
        ['Potiron', FL, 'potiron|citrouille'],
        ['Courge', FL, 'courge|courge d hiver'],
        ['Courge spaghetti', FL, 'courge spaghetti']
    ] },
    { family: 'champignon', rows: [
        ['Champignons', FL, 'champignon|champignon frais'],
        ['Champignons de Paris', FL, 'champignon de paris|champignon blanc|champignon brun|champignon de couche'],
        ['Shiitakés', FL, 'shiitake|shiitake frais'],
        ['Pleurotes', FL, 'pleurote'],
        ['Girolles', FL, 'girolle|chanterelle'],
        ['Cèpes', FL, 'cepe|bolet'],
        ['Morilles', FL, 'morille'],
        ['Trompettes de la mort', FL, 'trompette de la mort|trompette'],
        ['Mousserons', FL, 'mousseron'],
        ['Champignons de saison (mélange)', FL, 'champignon des bois|poelee forestiere|melange forestier|champignon sauvage|champignon forestier'],
        ['Champignons séchés', EP, 'champignon seche|cepe seche|morille sechee|shiitake seche']
    ] },
    { family: 'fruit', rows: [
        ['Citrons', FL, 'citron|citron jaune|citron non traite|citron bio'],
        ['Citrons verts', FL, 'citron vert|lime'],
        ['Citrons confits', EP, 'citron confit'],
        ['Oranges', FL, 'orange|orange non traitee'],
        ['Oranges sanguines', FL, 'orange sanguine'],
        ['Clémentines / mandarines', FL, 'clementine|mandarine'],
        ['Pamplemousse', FL, 'pamplemousse'],
        ['Pommes', FL, 'pomme|pomme golden|pomme granny|pomme reinette|pomme gala|pomme a cuire'],
        ['Poires', FL, 'poire|poire williams|poire conference'],
        ['Coings', FL, 'coing'],
        ['Bananes', FL, 'banane'],
        ['Figues fraîches', FL, 'figue|figue fraiche'],
        ['Raisin', FL, 'raisin|grain de raisin|raisin blanc|raisin noir'],
        ['Fraises', FL, 'fraise|fraise gariguette|fraise des bois'],
        ['Framboises', FL, 'framboise'],
        ['Myrtilles', FL, 'myrtille'],
        ['Mûres', FL, 'mure'],
        ['Cassis', FL, 'cassis'],
        ['Groseilles', FL, 'groseille'],
        ['Cerises', FL, 'cerise|griotte'],
        ['Fruits rouges (mélange)', FL, 'fruit rouge|baie'],
        ['Mangue', FL, 'mangue'],
        ['Ananas', FL, 'ananas'],
        ['Grenade', FL, 'grenade|grain de grenade'],
        ['Pêches', FL, 'peche|peche jaune|peche blanche|peche plate'],
        ['Nectarines', FL, 'nectarine|brugnon'],
        ['Abricots', FL, 'abricot'],
        ['Prunes', FL, 'prune|prune rouge'],
        ['Quetsches', FL, 'quetsche'],
        ['Mirabelles', FL, 'mirabelle'],
        ['Reines-claudes', FL, 'reine claude'],
        ['Kiwis', FL, 'kiwi'],
        ['Melon', FL, 'melon|melon charentais'],
        ['Pastèque', FL, 'pasteque'],
        ['Fruits de la passion', FL, 'fruit de la passion|maracuja'],
        ['Litchis', FL, 'litchi'],
        ['Kakis', FL, 'kaki'],
        ['Rhubarbe', FL, 'rhubarbe|tige de rhubarbe'],
        ['Noix de coco fraîche', FL, 'noix de coco fraiche|noix de coco entiere']
    ] },
    { family: 'herbe|herbes', rows: [
        ['Persil plat', FL, 'persil|persil plat', '', true],
        ['Persil frisé', FL, 'persil frise', '', true],
        ['Coriandre fraîche', FL, 'coriandre|coriandre fraiche|feuille de coriandre', '', true],
        ['Basilic', FL, 'basilic|feuille de basilic|basilic frais', '', true],
        ['Basilic thaï', FL, 'basilic thai', '', true],
        ['Ciboulette', FL, 'ciboulette', '', true],
        ['Menthe', FL, 'menthe|menthe fraiche|feuille de menthe', '', true],
        ['Aneth', FL, 'aneth', '', true],
        ['Estragon', FL, 'estragon', '', true],
        ['Cerfeuil', FL, 'cerfeuil', '', true],
        ['Thym', FL, 'thym|thym frais|branche de thym|brin de thym', '', true],
        ['Romarin', FL, 'romarin|branche de romarin|brin de romarin', '', true],
        ['Sauge', FL, 'sauge|feuille de sauge', '', true],
        ['Laurier', FL, 'laurier|feuille de laurier', '', true],
        ['Origan frais', FL, 'origan frais', '', true],
        ['Marjolaine', FL, 'marjolaine', '', true],
        ['Sarriette', FL, 'sarriette', '', true],
        ['Livèche', FL, 'liveche', '', true],
        ['Bouquet garni', FL, 'bouquet garni', '', true],
        ['Verveine', FL, 'verveine|verveine fraiche', '', true],
        ['Fines herbes', FL, 'herbe fraiche|fine herbe|melange d herbes fraiches', '', true]
    ] },

    // ===================== Boucherie & Poissonnerie
    { family: 'poulet|volaille|viande', rows: [
        ['Poulet', BP, 'poulet|poulet fermier|poulet jaune|morceau de poulet', 'viande'],
        ['Poulet entier', BP, 'poulet entier|poulet a rotir|poulet roti', 'viande'],
        ['Blancs de poulet', BP, 'blanc de poulet|filet de poulet|escalope de poulet|aiguillette de poulet|emince de poulet', 'viande'],
        ['Suprêmes de volaille', BP, 'supreme de poulet|supreme de volaille', 'viande'],
        ['Cuisses de poulet', BP, 'cuisse de poulet|haut de cuisse|haut de cuisse de poulet|cuisse de volaille', 'viande'],
        ['Pilons de poulet', BP, 'pilon|pilon de poulet', 'viande'],
        ['Ailes de poulet', BP, 'aile de poulet|aileron de poulet', 'viande'],
        ['Volaille', BP, 'volaille', 'viande'],
        ['Dinde', BP, 'dinde|escalope de dinde|filet de dinde|blanc de dinde|emince de dinde|sauté de dinde', 'viande'],
        ['Pintade', BP, 'pintade|supreme de pintade|cuisse de pintade', 'viande'],
        ['Caille', BP, 'caille', 'viande'],
        ['Pigeon', BP, 'pigeon|pigeonneau', 'viande'],
        ['Lapin', BP, 'lapin|rable de lapin|cuisse de lapin', 'viande'],
        ['Foies de volaille', BP, 'foie de volaille|foie de poulet', 'viande'],
        ['Gésiers', BP, 'gesier|gesier confit', 'viande']
    ] },
    { family: 'canard|volaille|viande', rows: [
        ['Magrets de canard', BP, 'magret|magret de canard', 'viande'],
        ['Cuisses de canard', BP, 'cuisse de canard', 'viande'],
        ['Cuisses de canard confites', BP, 'confit de canard|cuisse de canard confite', 'viande'],
        ['Aiguillettes de canard', BP, 'aiguillette de canard|filet de canard', 'viande'],
        ['Canard', BP, 'canard|canard entier', 'viande'],
        ['Foie gras', BP, 'foie gras|foie gras de canard|foie gras cru', 'viande']
    ] },
    { family: 'boeuf|viande|viande rouge', rows: [
        ['Bœuf', BP, 'boeuf|viande de boeuf', 'viande'],
        ['Bœuf haché', BP, 'boeuf hache|steak hache|viande de boeuf hachee', 'viande'],
        ['Viande hachée', BP, 'viande hachee|hache', 'viande'],
        ['Steaks', BP, 'steak|steak de boeuf', 'viande'],
        ['Bavette', BP, 'bavette|bavette d aloyau|bavette de flanchet', 'viande'],
        ['Onglet', BP, 'onglet', 'viande'],
        ['Hampe', BP, 'hampe', 'viande'],
        ['Entrecôte', BP, 'entrecote', 'viande'],
        ['Faux-filet', BP, 'faux filet|contre filet', 'viande'],
        ['Filet de bœuf', BP, 'filet de boeuf|tournedos|chateaubriand', 'viande'],
        ['Rumsteck', BP, 'rumsteck|rumsteak|pave de rumsteck', 'viande'],
        ['Côte de bœuf', BP, 'cote de boeuf', 'viande'],
        ['Rôti de bœuf', BP, 'roti de boeuf', 'viande'],
        ['Paleron', BP, 'paleron', 'viande'],
        ['Macreuse', BP, 'macreuse', 'viande'],
        ['Gîte', BP, 'gite|gite a la noix', 'viande'],
        ['Joue de bœuf', BP, 'joue de boeuf', 'viande'],
        ['Plat de côtes', BP, 'plat de cote|plat de cotes', 'viande'],
        ['Basse côte', BP, 'basse cote', 'viande'],
        ['Queue de bœuf', BP, 'queue de boeuf', 'viande'],
        ['Bœuf à braiser / bourguignon', BP, 'boeuf bourguignon|boeuf a braiser|boeuf a bourguignon|viande a bourguignon|boeuf a pot au feu|pot au feu', 'viande'],
        ['Carpaccio de bœuf', BP, 'carpaccio de boeuf', 'viande']
    ] },
    { family: 'veau|viande', rows: [
        ['Veau', BP, 'veau|viande de veau', 'viande'],
        ['Escalopes de veau', BP, 'escalope de veau', 'viande'],
        ['Veau à blanquette', BP, 'blanquette|veau a blanquette|blanquette de veau|epaule de veau|tendron|tendron de veau', 'viande'],
        ['Jarret de veau (osso buco)', BP, 'jarret de veau|osso buco|osso bucco', 'viande'],
        ['Rôti de veau', BP, 'roti de veau|noix de veau|quasi de veau', 'viande'],
        ['Côtes de veau', BP, 'cote de veau', 'viande'],
        ['Filet mignon de veau', BP, 'filet mignon de veau', 'viande'],
        ['Veau haché', BP, 'veau hache|viande de veau hachee', 'viande']
    ] },
    { family: 'agneau|viande', rows: [
        ['Agneau', BP, 'agneau|viande d agneau', 'viande'],
        ['Gigot d\'agneau', BP, 'gigot|gigot d agneau|tranche de gigot', 'viande'],
        ['Épaule d\'agneau', BP, 'epaule d agneau', 'viande'],
        ['Souris d\'agneau', BP, 'souris d agneau|souris', 'viande'],
        ['Côtelettes d\'agneau', BP, 'cotelette|cotelette d agneau|cote d agneau|carre d agneau', 'viande'],
        ['Collier d\'agneau', BP, 'collier d agneau|navarin', 'viande'],
        ['Agneau haché', BP, 'agneau hache|viande d agneau hachee', 'viande']
    ] },
    { family: 'porc|cochon|viande', rows: [
        ['Porc', BP, 'porc|viande de porc', 'viande porc'],
        ['Filet mignon de porc', BP, 'filet mignon|filet mignon de porc', 'viande porc'],
        ['Échine de porc', BP, 'echine|echine de porc', 'viande porc'],
        ['Côtes de porc', BP, 'cote de porc|cotelette de porc', 'viande porc'],
        ['Rôti de porc', BP, 'roti de porc|carre de porc|longe de porc', 'viande porc'],
        ['Poitrine de porc', BP, 'poitrine de porc|poitrine fraiche|poitrine', 'viande porc'],
        ['Travers de porc', BP, 'travers|travers de porc|ribs', 'viande porc'],
        ['Joue de porc', BP, 'joue de porc', 'viande porc'],
        ['Jarret de porc', BP, 'jarret de porc|jambonneau', 'viande porc'],
        ['Épaule de porc', BP, 'epaule de porc|palette de porc', 'viande porc'],
        ['Porc haché', BP, 'porc hache|chair a saucisse|viande de porc hachee', 'viande porc'],
        ['Sauté de porc', BP, 'saute de porc|emince de porc', 'viande porc']
    ] },
    { family: 'charcuterie|porc|viande', rows: [
        ['Lardons fumés', BP, 'lardon|lardon fume', 'viande porc'],
        ['Lardons nature', BP, 'lardon nature|lardon non fume', 'viande porc'],
        ['Poitrine fumée', BP, 'poitrine fumee|lard fume|lard', 'viande porc'],
        ['Jambon blanc', BP, 'jambon|jambon blanc|jambon de paris|jambon cuit|jambon braise', 'viande porc'],
        ['Jambon cru', BP, 'jambon cru|jambon de bayonne|jambon de savoie|jambon serrano|jambon sec', 'viande porc'],
        ['Jambon de Parme / prosciutto', BP, 'jambon de parme|prosciutto|speck', 'viande porc'],
        ['Chorizo', BP, 'chorizo', 'viande porc'],
        ['Saucisses de Toulouse', BP, 'saucisse de toulouse', 'viande porc'],
        ['Saucisses de Morteau / Montbéliard', BP, 'saucisse de morteau|saucisse de montbeliard|morteau|montbeliard', 'viande porc'],
        ['Diots', BP, 'diot|diot de savoie', 'viande porc'],
        ['Chipolatas', BP, 'chipolata', 'viande porc'],
        ['Merguez', BP, 'merguez', 'viande'],
        ['Saucisses', BP, 'saucisse|saucisse fumee|saucisse de strasbourg|knack', 'viande porc'],
        ['Saucisson', BP, 'saucisson|saucisson sec|rosette', 'viande porc'],
        ['Boudin noir', BP, 'boudin noir|boudin', 'viande porc'],
        ['Boudin blanc', BP, 'boudin blanc', 'viande porc'],
        ['Andouillette', BP, 'andouillette', 'viande porc'],
        ['Pancetta', BP, 'pancetta', 'viande porc'],
        ['Guanciale', BP, 'guanciale', 'viande porc'],
        ['Bacon', BP, 'bacon|tranche de bacon', 'viande porc'],
        ['Coppa', BP, 'coppa', 'viande porc'],
        ['Rillettes', BP, 'rillette|rillette de porc', 'viande porc'],
        ['Pâté de campagne', BP, 'pate de campagne|pate en croute|terrine de campagne|pate de foie', 'viande porc']
    ] },
    { family: 'poisson', rows: [
        ['Saumon', BP, 'saumon|pave de saumon|filet de saumon|dos de saumon|saumon frais|steak de saumon', 'poisson'],
        ['Saumon fumé', BP, 'saumon fume|tranche de saumon fume', 'poisson'],
        ['Truite', BP, 'truite|filet de truite', 'poisson'],
        ['Truite fumée', BP, 'truite fumee', 'poisson'],
        ['Cabillaud', BP, 'cabillaud|dos de cabillaud|filet de cabillaud', 'poisson'],
        ['Morue salée', BP, 'morue|morue salee|brandade', 'poisson'],
        ['Églefin / haddock', BP, 'eglefin|haddock', 'poisson'],
        ['Lieu', BP, 'lieu|lieu noir|lieu jaune|filet de lieu', 'poisson'],
        ['Merlu / colin', BP, 'merlu|colin|filet de colin', 'poisson'],
        ['Merlan', BP, 'merlan', 'poisson'],
        ['Lotte', BP, 'lotte|queue de lotte|baudroie', 'poisson'],
        ['Sole', BP, 'sole|filet de sole', 'poisson'],
        ['Turbot', BP, 'turbot', 'poisson'],
        ['Saint-Pierre', BP, 'saint pierre', 'poisson'],
        ['Rouget', BP, 'rouget|filet de rouget|rouget barbet', 'poisson'],
        ['Raie', BP, 'raie|aile de raie', 'poisson'],
        ['Thon frais', BP, 'thon|thon frais|steak de thon|pave de thon|longe de thon|thon rouge|thon albacore', 'poisson'],
        ['Daurade', BP, 'dorade|daurade|dorade royale|daurade royale|filet de dorade|filet de daurade', 'poisson'],
        ['Bar (loup)', BP, 'bar|loup|filet de bar|loup de mer', 'poisson'],
        ['Maquereau', BP, 'maquereau|filet de maquereau', 'poisson'],
        ['Sardines', BP, 'sardine|sardine fraiche', 'poisson'],
        ['Hareng', BP, 'hareng|hareng fume|filet de hareng', 'poisson'],
        ['Féra / omble chevalier', BP, 'fera|omble chevalier|omble', 'poisson'],
        ['Perche', BP, 'perche|filet de perche', 'poisson'],
        ['Brochet', BP, 'brochet', 'poisson'],
        ['Poisson blanc', BP, 'poisson blanc|filet de poisson blanc|poisson|filet de poisson', 'poisson'],
        ['Œufs de poisson', BP, 'oeuf de saumon|oeuf de truite|oeuf de lump|tarama', 'poisson']
    ] },
    { family: 'fruit de mer|fruits de mer|crustace|coquillage', rows: [
        ['Crevettes', BP, 'crevette|crevette rose|crevette cuite|crevette decortiquee', 'crustaces'],
        ['Gambas', BP, 'gambas|gamba|crevette crue|crevette tigree|crevette sauvage', 'crustaces'],
        ['Langoustines', BP, 'langoustine', 'crustaces'],
        ['Homard', BP, 'homard', 'crustaces'],
        ['Crabe / tourteau', BP, 'crabe|tourteau|chair de crabe', 'crustaces'],
        ['Moules', BP, 'moule|moule de bouchot', 'crustaces'],
        ['Palourdes / coques', BP, 'palourde|coque|vongole', 'crustaces'],
        ['Huîtres', BP, 'huitre', 'crustaces'],
        ['Saint-Jacques', BP, 'saint jacques|noix de saint jacques|coquille saint jacques', 'crustaces'],
        ['Calamars / encornets', BP, 'calamar|calmar|encornet|anneau de calamar', 'crustaces'],
        ['Seiche', BP, 'seiche', 'crustaces'],
        ['Poulpe', BP, 'poulpe|pieuvre', 'crustaces'],
        ['Surimi', BP, 'surimi|baton de surimi', 'poisson oeuf'],
        ['Fruits de mer (mélange)', BP, 'fruit de mer|cocktail de fruits de mer', 'crustaces']
    ] },

    // ===================== Crèmerie & Œufs
    { family: 'beurre', rows: [
        ['Beurre doux', CO, 'beurre|beurre doux|beurre doux froid|beurre pommade|beurre fondu|beurre mou|beurre froid', 'lactose'],
        ['Beurre demi-sel', CO, 'beurre demi sel|beurre sale|beurre salé', 'lactose'],
        ['Beurre clarifié', CO, 'beurre clarifie|ghee', 'lactose']
    ] },
    { family: 'lait|laitage', rows: [
        ['Lait', CO, 'lait|lait entier|lait demi ecreme|lait ecreme|lait frais', 'lactose'],
        ['Lait ribot / fermenté', CO, 'lait ribot|lait fermente|babeurre|buttermilk', 'lactose'],
        ['Lait concentré sucré', EP, 'lait concentre|lait concentre sucre', 'lactose'],
        ['Lait en poudre', EP, 'lait en poudre', 'lactose']
    ] },
    { family: 'lait vegetal', rows: [
        ['Lait d\'amande', CO, 'lait d amande|boisson amande|boisson a l amande', 'fruits_a_coque'],
        ['Lait d\'avoine', CO, 'lait d avoine|boisson avoine|boisson a l avoine', 'gluten'],
        ['Lait de soja', CO, 'lait de soja|boisson soja|boisson au soja'],
        ['Lait de riz', CO, 'lait de riz|boisson riz|boisson au riz'],
        ['Crème de soja', CO, 'creme de soja|creme vegetale|creme soja'],
        ['Crème d\'avoine', CO, 'creme d avoine', 'gluten']
    ] },
    { family: 'creme', rows: [
        ['Crème fraîche', CO, 'creme|creme fraiche', 'lactose'],
        ['Crème fraîche épaisse', CO, 'creme epaisse|creme fraiche epaisse|creme fraiche d isigny|creme crue|creme double', 'lactose'],
        ['Crème liquide entière', CO, 'creme liquide|creme entiere|creme liquide entiere|creme fleurette|creme fraiche liquide|creme a fouetter|creme fouettee|creme chantilly|creme 30', 'lactose'],
        ['Crème allégée', CO, 'creme legere|creme allegee|creme fraiche legere|creme 15', 'lactose']
    ] },
    { family: 'yaourt|laitage', rows: [
        ['Yaourt nature', CO, 'yaourt|yaourt nature|yogourt|yoghourt', 'lactose'],
        ['Yaourt grec', CO, 'yaourt grec|yaourt a la grecque|yogourt grec', 'lactose'],
        ['Skyr', CO, 'skyr', 'lactose'],
        ['Fromage blanc', CO, 'fromage blanc|fromage blanc 0|fromage blanc battu', 'lactose'],
        ['Faisselle', CO, 'faisselle', 'lactose'],
        ['Petits-suisses', CO, 'petit suisse', 'lactose'],
        ['Kéfir', CO, 'kefir', 'lactose']
    ] },
    { family: 'oeuf', rows: [
        ['Œufs', CO, 'oeuf|jaune d oeuf|blanc d oeuf|oeuf entier|oeuf frais|gros oeuf|oeuf bio|oeuf plein air', 'oeuf'],
        ['Œufs de caille', CO, 'oeuf de caille', 'oeuf']
    ] },
    { family: 'fromage', rows: [
        ['Parmesan', CO, 'parmesan|parmigiano|parmigiano reggiano|copeau de parmesan', 'lactose'],
        ['Grana Padano', CO, 'grana padano', 'lactose'],
        ['Pecorino', CO, 'pecorino|pecorino romano', 'lactose'],
        ['Feta', CO, 'feta', 'lactose'],
        ['Halloumi', CO, 'halloumi|haloumi|halloumi grille', 'lactose'],
        ['Mozzarella', CO, 'mozzarella|boule de mozzarella|mozzarella di bufala|mozzarella de bufflonne|mini mozzarella|billes de mozzarella', 'lactose'],
        ['Mozzarella râpée (pizza)', CO, 'mozzarella rapee', 'lactose'],
        ['Burrata', CO, 'burrata|burratina', 'lactose'],
        ['Stracciatella', CO, 'stracciatella', 'lactose'],
        ['Ricotta', CO, 'ricotta', 'lactose'],
        ['Brousse', CO, 'brousse', 'lactose'],
        ['Mascarpone', CO, 'mascarpone', 'lactose'],
        ['Fromage frais à tartiner', CO, 'fromage frais|fromage a tartiner|philadelphia|saint moret|cream cheese|carre frais', 'lactose'],
        ['Fromage de chèvre frais', CO, 'chevre frais|fromage de chevre frais|petit chevre frais', 'lactose'],
        ['Bûche de chèvre', CO, 'chevre|fromage de chevre|buche de chevre|buchette de chevre|sainte maure', 'lactose'],
        ['Crottin de chèvre', CO, 'crottin|crottin de chavignol|crottin de chevre|picodon|rocamadour|valencay', 'lactose'],
        ['Comté', CO, 'comte|comte rape|comte affine', 'lactose'],
        ['Gruyère', CO, 'gruyere|gruyere rape', 'lactose'],
        ['Emmental', CO, 'emmental|emmental rape|emmenthal', 'lactose'],
        ['Fromage', CO, 'fromage|fromage a pate dure|fromage de montagne', 'lactose'],
        ['Fromage râpé', CO, 'fromage rape|fromage a gratiner|melange de fromages rapes', 'lactose'],
        ['Beaufort', CO, 'beaufort', 'lactose'],
        ['Abondance', CO, 'abondance', 'lactose'],
        ['Reblochon', CO, 'reblochon', 'lactose'],
        ['Fromage à raclette', CO, 'raclette|fromage a raclette|tranche de raclette', 'lactose'],
        ['Tomme', CO, 'tomme|tomme de savoie|tomme de montagne|tomme des pyrenees', 'lactose'],
        ['Tomme fraîche (aligot)', CO, 'tomme fraiche', 'lactose'],
        ['Morbier', CO, 'morbier', 'lactose'],
        ['Mont d\'Or', CO, 'mont d or|vacherin mont d or|vacherin', 'lactose'],
        ['Saint-Nectaire', CO, 'saint nectaire', 'lactose'],
        ['Cantal / Salers', CO, 'cantal|salers', 'lactose'],
        ['Ossau-Iraty', CO, 'ossau iraty|brebis basque|tomme de brebis|fromage de brebis', 'lactose'],
        ['Camembert', CO, 'camembert', 'lactose'],
        ['Brie', CO, 'brie|brie de meaux|coulommiers', 'lactose'],
        ['Munster', CO, 'munster', 'lactose'],
        ['Maroilles', CO, 'maroilles', 'lactose'],
        ['Époisses', CO, 'epoisses', 'lactose'],
        ['Roquefort', CO, 'roquefort', 'lactose'],
        ['Bleu d\'Auvergne / fourme d\'Ambert', CO, 'bleu|bleu d auvergne|fourme d ambert|fourme|bleu de gex', 'lactose'],
        ['Gorgonzola', CO, 'gorgonzola', 'lactose'],
        ['Cheddar', CO, 'cheddar|cheddar rape', 'lactose'],
        ['Manchego', CO, 'manchego', 'lactose'],
        ['Scamorza / provola', CO, 'scamorza|provola', 'lactose'],
        ['Saint-Marcellin / Saint-Félicien', CO, 'saint marcellin|saint felicien', 'lactose']
    ] },
    { family: 'soja|vegetarien', rows: [
        ['Tofu ferme', CO, 'tofu|tofu ferme|tofu nature'],
        ['Tofu soyeux', CO, 'tofu soyeux'],
        ['Tofu fumé', CO, 'tofu fume'],
        ['Tempeh', CO, 'tempeh'],
        ['Seitan', CO, 'seitan', 'gluten'],
        ['Steaks végétaux', CO, 'steak vegetal|steak de soja|steak vegetarien']
    ] },
    { family: 'pate|pate a tarte', rows: [
        ['Pâte feuilletée', CO, 'pate feuilletee|rouleau de pate feuilletee|pate feuilletee pur beurre', 'gluten lactose'],
        ['Pâte brisée', CO, 'pate brisee|rouleau de pate brisee', 'gluten lactose'],
        ['Pâte sablée', CO, 'pate sablee|pate sucree', 'gluten lactose oeuf'],
        ['Pâte à pizza', CO, 'pate a pizza', 'gluten'],
        ['Pâte filo', CO, 'pate filo|pate phyllo|feuille de filo', 'gluten'],
        ['Feuilles de brick', CO, 'feuille de brick|brick', 'gluten'],
        ['Gnocchis', CO, 'gnocchi', 'gluten'],
        ['Pâtes fraîches', CO, 'pate fraiche|tagliatelle fraiche|tortellini|ravioli|raviole|ravioles du dauphine', 'gluten oeuf']
    ] },

    // ===================== Épicerie
    { family: 'farine', rows: [
        ['Farine de blé', EP, 'farine|farine de ble|farine t55|farine t45|farine t65|farine blanche|farine fluide', 'gluten'],
        ['Farine complète', EP, 'farine complete|farine t80|farine t110|farine t150|farine semi complete', 'gluten'],
        ['Farine d\'épeautre', EP, 'farine d epeautre', 'gluten'],
        ['Farine de riz', EP, 'farine de riz'],
        ['Farine de sarrasin', EP, 'farine de sarrasin|farine de ble noir'],
        ['Farine de maïs', EP, 'farine de mais'],
        ['Farine de pois chiche', EP, 'farine de pois chiche'],
        ['Farine de châtaigne', EP, 'farine de chataigne'],
        ['Farine de coco', EP, 'farine de coco'],
        ['Fécule de maïs (Maïzena)', EP, 'maizena|fecule de mais|amidon de mais'],
        ['Fécule de pomme de terre', EP, 'fecule|fecule de pomme de terre'],
        ['Poudre d\'amande', EP, 'poudre d amande|amande en poudre|amande moulue', 'fruits_a_coque'],
        ['Poudre de noisette', EP, 'poudre de noisette|noisette en poudre', 'fruits_a_coque']
    ] },
    { family: 'sucre', rows: [
        ['Sucre en poudre', EP, 'sucre|sucre en poudre|sucre blanc|sucre semoule|sucre fin'],
        ['Sucre roux / cassonade', EP, 'sucre roux|cassonade|sucre de canne|sucre brun'],
        ['Sucre glace', EP, 'sucre glace'],
        ['Sucre vanillé', EP, 'sucre vanille|sachet de sucre vanille'],
        ['Sucre muscovado / complet', EP, 'muscovado|sucre muscovado|sucre complet|rapadura|vergeoise'],
        ['Sucre de coco', EP, 'sucre de coco'],
        ['Sucre perlé', EP, 'sucre perle|sucre en grain'],
        ['Miel', EP, 'miel|miel liquide|miel d acacia|miel de fleurs', 'miel'],
        ['Sirop d\'érable', EP, 'sirop d erable'],
        ['Sirop d\'agave', EP, 'sirop d agave|agave'],
        ['Mélasse', EP, 'melasse'],
        ['Confiture', EP, 'confiture|gelee de groseille'],
        ['Pâte à tartiner', EP, 'pate a tartiner|nutella', 'fruits_a_coque lactose']
    ] },
    { family: 'levure|patisserie', rows: [
        // Most French baking powders contain wheat starch: flagged for a gluten-free client to check the label
        ['Levure', EP, 'levure|sachet de levure', 'gluten'],
        ['Levure chimique', EP, 'levure chimique|poudre a lever', 'gluten'],
        ['Bicarbonate de soude', EP, 'bicarbonate|bicarbonate de soude|bicarbonate alimentaire'],
        ['Levure de boulanger', EP, 'levure de boulanger|levure boulangere|levure fraiche|levure seche|levure de boulangerie'],
        ['Levure maltée / nutritionnelle', EP, 'levure maltee|levure nutritionnelle|levure de biere'],
        ['Gélatine', EP, 'gelatine|feuille de gelatine|gelatine en poudre', 'viande porc'],
        ['Agar-agar', EP, 'agar agar|agar'],
        ['Pâte d\'amande', EP, 'pate d amande', 'fruits_a_coque'],
        ['Pralin / praliné', EP, 'pralin|praline|pate de praline', 'fruits_a_coque'],
        ['Crème de marrons', EP, 'creme de marron|confiture de marron'],
        ['Marrons / châtaignes cuits', EP, 'marron|chataigne|marron cuit|chataigne cuite|marron glace'],
        ['Fleur d\'oranger', EP, 'fleur d oranger|eau de fleur d oranger'],
        ['Eau de rose', EP, 'eau de rose'],
        ['Vanille (gousse)', EP, 'gousse de vanille|vanille|vanille en gousse'],
        ['Extrait de vanille', EP, 'extrait de vanille|arome vanille|vanille liquide|pate de vanille'],
        ['Colorant alimentaire', EP, 'colorant|colorant alimentaire']
    ] },
    { family: 'chocolat', rows: [
        ['Chocolat', EP, 'chocolat|chocolat patissier|chocolat dessert'],
        ['Chocolat noir', EP, 'chocolat noir|chocolat noir 70|chocolat noir patissier'],
        ['Chocolat au lait', EP, 'chocolat au lait', 'lactose'],
        ['Chocolat blanc', EP, 'chocolat blanc', 'lactose'],
        ['Pépites de chocolat', EP, 'pepite de chocolat|copeau de chocolat'],
        ['Cacao en poudre', EP, 'cacao|cacao en poudre|cacao non sucre|poudre de cacao']
    ] },
    { family: 'riz|cereale', rows: [
        ['Riz basmati', EP, 'riz basmati|basmati'],
        ['Riz thaï / jasmin', EP, 'riz thai|riz jasmin|riz parfume'],
        ['Riz', EP, 'riz|riz long|riz blanc|riz long grain|riz etuve'],
        ['Riz rond', EP, 'riz rond|riz au lait|riz dessert'],
        ['Riz à risotto (arborio)', EP, 'riz arborio|arborio|riz a risotto|riz carnaroli|carnaroli|riz pour risotto'],
        ['Riz complet', EP, 'riz complet|riz brun|riz semi complet'],
        ['Riz rouge / noir / sauvage', EP, 'riz rouge|riz noir|riz venere|riz sauvage|riz de camargue'],
        ['Riz à sushi', EP, 'riz a sushi|riz sushi|riz gluant'],
        ['Feuilles de riz', EP, 'feuille de riz|galette de riz|papier de riz'],
        ['Quinoa', EP, 'quinoa|quinoa blanc|quinoa rouge|quinoa noir'],
        ['Boulgour', EP, 'boulgour|boulgour d engrain|bulgur', 'gluten'],
        ['Semoule de couscous', EP, 'semoule|couscous|graine de couscous|semoule fine|semoule moyenne', 'gluten'],
        ['Polenta', EP, 'polenta|polenta fine|polenta instantanee|semoule de mais'],
        ['Épeautre / petit épeautre', EP, 'epeautre|petit epeautre', 'gluten'],
        ['Sarrasin (graines)', EP, 'sarrasin|kasha|graine de sarrasin'],
        ['Orge perlé', EP, 'orge|orge perle', 'gluten'],
        ['Millet', EP, 'millet'],
        ['Flocons d\'avoine', EP, 'flocon d avoine|avoine|porridge', 'gluten'],
        ['Muesli / granola', EP, 'muesli|granola', 'gluten fruits_a_coque']
    ] },
    { family: 'pate|pates', rows: [
        ['Pâtes', EP, 'pate|pate seche|pate courte|pate longue', 'gluten'],
        ['Spaghetti', EP, 'spaghetti|spaghettoni', 'gluten'],
        ['Linguine', EP, 'linguine', 'gluten'],
        ['Tagliatelles sèches', EP, 'tagliatelle', 'gluten oeuf'],
        ['Fettuccine', EP, 'fettuccine', 'gluten oeuf'],
        ['Pappardelle', EP, 'pappardelle', 'gluten oeuf'],
        ['Penne', EP, 'penne|penne rigate', 'gluten'],
        ['Rigatoni', EP, 'rigatoni', 'gluten'],
        ['Fusilli', EP, 'fusilli|torsade', 'gluten'],
        ['Farfalle', EP, 'farfalle|papillon', 'gluten'],
        ['Conchiglie', EP, 'conchiglie|conchiglioni', 'gluten'],
        ['Orecchiette', EP, 'orecchiette', 'gluten'],
        ['Orzo / pâtes langues d\'oiseau', EP, 'orzo|risoni|langue d oiseau', 'gluten'],
        ['Coquillettes', EP, 'coquillette', 'gluten'],
        ['Macaroni', EP, 'macaroni', 'gluten'],
        ['Feuilles de lasagne', EP, 'lasagne|feuille de lasagne', 'gluten'],
        ['Cannelloni', EP, 'cannelloni', 'gluten'],
        ['Crozets', EP, 'crozet', 'gluten'],
        ['Pâtes sans gluten', EP, 'pate sans gluten'],
        ['Nouilles de riz', EP, 'nouille de riz|vermicelle de riz|pad thai'],
        ['Nouilles de blé (chinoises / ramen)', EP, 'nouille|nouille chinoise|nouille aux oeufs|nouille de ble|ramen|nouille ramen', 'gluten'],
        ['Udon', EP, 'udon|nouille udon', 'gluten'],
        ['Soba', EP, 'soba|nouille soba', 'gluten'],
        ['Vermicelles', EP, 'vermicelle|cheveu d ange', 'gluten']
    ] },
    { family: 'legumineuse|legume sec', rows: [
        ['Lentilles', EP, 'lentille|lentille seche'],
        ['Lentilles vertes', EP, 'lentille verte|lentille du puy|lentille verte du puy'],
        ['Lentilles corail', EP, 'lentille corail|lentille rouge'],
        ['Lentilles béluga', EP, 'lentille beluga|lentille noire'],
        ['Lentilles blondes', EP, 'lentille blonde'],
        ['Pois chiches', EP, 'pois chiche|pois chiche cuit|pois chiche sec'],
        ['Pois cassés', EP, 'pois casse'],
        ['Haricots rouges', EP, 'haricot rouge|haricot rouge cuit'],
        ['Haricots blancs', EP, 'haricot blanc|haricot tarbais|lingot|haricot coco|coco de paimpol|cannellini'],
        ['Haricots noirs', EP, 'haricot noir'],
        ['Flageolets', EP, 'flageolet'],
        ['Fèves sèches', EP, 'feve seche|feve cassee'],
        ['Edamame', SU, 'edamame']
    ] },
    { family: 'pain', rows: [
        ['Pain', EP, 'pain|pain de campagne|pain au levain|miche|pain rassis|pain complet|pain aux cereales', 'gluten'],
        ['Baguette', EP, 'baguette|baguette tradition', 'gluten'],
        ['Pain de mie', EP, 'pain de mie|tranche de pain de mie', 'gluten'],
        ['Pains à burger', EP, 'pain a burger|pain burger|bun|pain a hamburger', 'gluten'],
        ['Pain d\'épices', EP, 'pain d epice', 'gluten miel'],
        ['Chapelure', EP, 'chapelure', 'gluten'],
        ['Panko', EP, 'panko|chapelure panko', 'gluten'],
        ['Croûtons', EP, 'crouton', 'gluten'],
        ['Biscottes', EP, 'biscotte', 'gluten'],
        ['Tortillas de blé', EP, 'tortilla|wrap|galette de ble|tortilla de ble', 'gluten'],
        ['Tortillas de maïs', EP, 'tortilla de mais'],
        ['Pains pita', EP, 'pain pita|pita', 'gluten'],
        ['Naans', EP, 'naan|pain naan', 'gluten'],
        ['Galettes de sarrasin', EP, 'galette de sarrasin|galette de ble noir|galette bretonne'],
        ['Brioche', EP, 'brioche|pain brioche|tranche de brioche', 'gluten oeuf lactose'],
        ['Blinis', EP, 'blini', 'gluten oeuf lactose'],
        ['Croûtes de vol-au-vent', EP, 'vol au vent|croute de vol au vent|bouchee a la reine', 'gluten lactose'],
        ['Biscuits', EP, 'biscuit|speculoos|petit beurre|boudoir|biscuit cuillere', 'gluten']
    ] },
    { family: 'tomate', rows: [
        ['Tomates concassées', EP, 'tomate concassee|tomate en morceau|tomate en des|boite de tomate'],
        ['Tomates pelées', EP, 'tomate pelee|tomate entiere pelee'],
        ['Coulis / passata', EP, 'coulis de tomate|passata|pulpe de tomate|puree de tomate'],
        ['Sauce tomate', EP, 'sauce tomate|sauce tomate cuisinee'],
        ['Concentré de tomate', EP, 'concentre de tomate|double concentre|double concentre de tomate|tube de concentre'],
        ['Tomates séchées', EP, 'tomate sechee|tomate confite|tomate sechee a l huile'],
        ['Ketchup', EP, 'ketchup']
    ] },
    { family: 'coco', rows: [
        ['Lait de coco', EP, 'lait de coco'],
        ['Crème de coco', EP, 'creme de coco'],
        ['Noix de coco', EP, 'noix de coco'],
        ['Noix de coco râpée', EP, 'coco rapee|noix de coco rapee|copeau de coco']
    ] },
    { family: 'bouillon', rows: [
        ['Bouillon de légumes', EP, 'bouillon de legume|bouillon|cube de bouillon|bouillon cube|bouillon de legumes bio'],
        ['Bouillon de volaille', EP, 'bouillon de volaille|bouillon de poulet|fond de volaille|fond blanc|bouillon de volaille cube', 'viande'],
        ['Bouillon de bœuf', EP, 'bouillon de boeuf|bouillon de pot au feu', 'viande'],
        ['Fond de veau', EP, 'fond de veau|fond brun|fond brun de veau', 'viande'],
        ['Fumet de poisson', EP, 'fumet de poisson|fumet|bouillon de poisson', 'poisson'],
        ['Bouillon dashi', EP, 'dashi|bouillon dashi', 'poisson']
    ] },
    { family: 'condiment|sauce', rows: [
        ['Moutarde de Dijon', EP, 'moutarde|moutarde de dijon|moutarde forte|moutarde fine'],
        ['Moutarde à l\'ancienne', EP, 'moutarde a l ancienne|moutarde en grain|moutarde a grains'],
        ['Moutarde au miel', EP, 'moutarde au miel', 'miel'],
        ['Mayonnaise', EP, 'mayonnaise|mayo', 'oeuf'],
        ['Sauce soja salée', EP, 'sauce soja|soja|shoyu|sauce soja salee|sauce soja claire', 'gluten'],
        ['Sauce soja sucrée', EP, 'sauce soja sucree|kecap manis', 'gluten'],
        ['Tamari (sans gluten)', EP, 'tamari|sauce tamari'],
        ['Sauce nuoc-mâm', EP, 'nuoc mam|sauce poisson|sauce de poisson|nam pla', 'poisson'],
        ['Sauce d\'huître', EP, 'sauce d huitre|sauce huitre', 'crustaces'],
        ['Sauce hoisin', EP, 'sauce hoisin|hoisin'],
        ['Sauce Worcestershire', EP, 'worcestershire|sauce worcestershire|worcester', 'poisson'],
        ['Sriracha', EP, 'sriracha|sauce sriracha'],
        ['Tabasco', EP, 'tabasco|sauce piquante'],
        ['Mirin', EP, 'mirin'],
        ['Sauce teriyaki', EP, 'teriyaki|sauce teriyaki', 'gluten'],
        ['Houmous', EP, 'houmous|hoummos|hummus'],
        ['Sauce caramel', EP, 'caramel|sauce caramel|caramel au beurre sale', 'lactose'],
        ['Miso', EP, 'miso|pate de miso|miso blanc|miso brun'],
        ['Gochujang', EP, 'gochujang'],
        ['Pâte de curry rouge', EP, 'pate de curry rouge|curry rouge'],
        ['Pâte de curry vert', EP, 'pate de curry vert|curry vert'],
        ['Pâte de curry jaune', EP, 'pate de curry jaune|curry jaune|pate de curry'],
        ['Harissa', EP, 'harissa'],
        ['Pâte de piment', EP, 'pate de piment|sambal|sambal oelek'],
        ['Tahini (purée de sésame)', EP, 'tahini|tahin|creme de sesame|puree de sesame'],
        ['Beurre de cacahuète', EP, 'beurre de cacahuete|beurre d arachide|puree de cacahuete', 'arachide'],
        ['Purée d\'amande', EP, 'puree d amande|beurre d amande|puree d amande blanche|puree d amande complete', 'fruits_a_coque'],
        ['Purée de noisette', EP, 'puree de noisette', 'fruits_a_coque'],
        ['Pesto vert', EP, 'pesto|pesto vert|pesto alla genovese|pesto au basilic', 'lactose fruits_a_coque'],
        ['Pesto rouge', EP, 'pesto rouge', 'lactose fruits_a_coque'],
        ['Tapenade', EP, 'tapenade|tapenade noire|tapenade verte', 'poisson'],
        ['Câpres', EP, 'capre|capre au vinaigre'],
        ['Olives', EP, 'olive|olive denoyautee'],
        ['Olives noires', EP, 'olive noire|olive de nyons|olive kalamata'],
        ['Olives vertes', EP, 'olive verte|olive picholine|olive lucques'],
        ['Cornichons', EP, 'cornichon'],
        ['Pickles / oignons au vinaigre', EP, 'pickle|oignon au vinaigre'],
        ['Raifort / wasabi', EP, 'raifort|wasabi'],
        ['Anchois', EP, 'anchois|filet d anchois|anchois a l huile', 'poisson'],
        ['Thon en boîte', EP, 'thon en boite|thon au naturel|thon a l huile|boite de thon|thon en conserve', 'poisson'],
        ['Sardines en boîte', EP, 'sardine en boite|sardine a l huile|boite de sardine', 'poisson'],
        ['Maquereaux en boîte', EP, 'maquereau en boite|maquereau au vin blanc|boite de maquereau', 'poisson'],
        ['Poivrons grillés en bocal', EP, 'poivron grille|poivron marine|poivron en bocal'],
        ['Artichauts marinés', EP, 'artichaut marine|coeur d artichaut|artichaut a l huile'],
        ['Maïs en boîte', EP, 'mais en boite|mais en conserve|boite de mais']
    ] },
    { family: 'fruit sec', rows: [
        ['Raisins secs', EP, 'raisin sec|raisin de corinthe|raisin sultanine'],
        ['Abricots secs', EP, 'abricot sec'],
        ['Dattes', EP, 'datte|datte medjool|datte deglet nour'],
        ['Cranberries séchées', EP, 'cranberry|cranberries|canneberge|cranberry sechee'],
        ['Pruneaux', EP, 'pruneau|pruneau d agen'],
        ['Figues sèches', EP, 'figue seche|figue sechee'],
        ['Baies de goji', EP, 'goji|baie de goji']
    ] },
    { family: 'noix|fruit a coque|oleagineux', rows: [
        ['Amandes entières', EP, 'amande|amande entiere|amande emondee|amande blanchie', 'fruits_a_coque'],
        ['Amandes effilées', EP, 'amande effilee', 'fruits_a_coque'],
        ['Amandes bâtonnets', EP, 'amande en baton|amande batonnet', 'fruits_a_coque'],
        ['Noisettes', EP, 'noisette|noisette entiere|noisette torrefiee|noisette concassee', 'fruits_a_coque'],
        ['Cerneaux de noix', EP, 'noix|cerneau de noix|noix de grenoble|cerneau', 'fruits_a_coque'],
        ['Noix de cajou', EP, 'noix de cajou|cajou', 'fruits_a_coque'],
        ['Pistaches', EP, 'pistache|pistache decortiquee', 'fruits_a_coque'],
        ['Pignons de pin', EP, 'pignon|pignon de pin', 'fruits_a_coque'],
        ['Noix de pécan', EP, 'noix de pecan|pecan', 'fruits_a_coque'],
        ['Noix du Brésil', EP, 'noix du bresil', 'fruits_a_coque'],
        ['Noix de macadamia', EP, 'macadamia|noix de macadamia', 'fruits_a_coque'],
        ['Cacahuètes', EP, 'cacahuete|arachide|cacahuete grillee', 'arachide']
    ] },
    { family: 'graine', rows: [
        ['Graines de sésame', EP, 'sesame|graine de sesame|sesame blanc|sesame dore|sesame noir|graine de sesame noir'],
        ['Graines de courge', EP, 'graine de courge|pepin de courge'],
        ['Graines de tournesol', EP, 'graine de tournesol'],
        ['Graines de lin', EP, 'graine de lin|lin'],
        ['Graines de chia', EP, 'graine de chia|chia'],
        ['Graines de pavot', EP, 'graine de pavot|pavot'],
        ['Graines (mélange)', EP, 'graine|melange de graines']
    ] },
    { family: 'vinaigre', rows: [
        ['Vinaigre', EP, 'vinaigre|vinaigre de vin'],
        ['Vinaigre de vin rouge', EP, 'vinaigre de vin rouge'],
        ['Vinaigre de vin blanc', EP, 'vinaigre de vin blanc|vinaigre blanc|vinaigre d alcool'],
        ['Vinaigre de cidre', EP, 'vinaigre de cidre'],
        ['Vinaigre de Xérès', EP, 'vinaigre de xeres'],
        ['Vinaigre balsamique', EP, 'vinaigre balsamique|balsamique|vinaigre de modene'],
        ['Crème de balsamique', EP, 'creme de balsamique|creme balsamique|reduction balsamique'],
        ['Vinaigre de riz', EP, 'vinaigre de riz'],
        ['Vinaigre de framboise', EP, 'vinaigre de framboise']
    ] },
    { family: 'epice|epices', rows: [
        ['Cumin', EP, 'cumin|cumin en poudre|graine de cumin', '', true],
        ['Carvi', EP, 'carvi', '', true],
        ['Paprika doux', EP, 'paprika|paprika doux', '', true],
        ['Paprika fumé', EP, 'paprika fume|pimenton', '', true],
        ['Curry en poudre', EP, 'curry|curry en poudre|curry doux|curry fort|poudre de curry', '', true],
        ['Curcuma', EP, 'curcuma|curcuma en poudre', '', true],
        ['Cannelle', EP, 'cannelle|cannelle en poudre|baton de cannelle', '', true],
        ['Muscade', EP, 'muscade|noix de muscade', '', true],
        ['Piment d\'Espelette', EP, 'piment d espelette|espelette', '', true],
        ['Piment de Cayenne', EP, 'piment en poudre|piment de cayenne|cayenne|chili en poudre', '', true],
        ['Flocons de piment', EP, 'flocon de piment|piment concasse|piment seche', '', true],
        ['Gingembre en poudre', EP, 'gingembre en poudre|gingembre moulu', '', true],
        ['Coriandre en graines', EP, 'coriandre en poudre|graine de coriandre|coriandre moulue', '', true],
        ['Ras el hanout', EP, 'ras el hanout', '', true],
        ['Garam masala', EP, 'garam masala', '', true],
        ['Épices tandoori', EP, 'tandoori|epice tandoori', '', true],
        ['Colombo', EP, 'colombo', '', true],
        ['Herbes de Provence', EP, 'herbe de provence', '', true],
        ['Origan séché', EP, 'origan|origan seche', '', true],
        ['Thym séché', EP, 'thym seche', '', true],
        ['Clous de girofle', EP, 'clou de girofle|girofle', '', true],
        ['Badiane', EP, 'badiane|anis etoile', '', true],
        ['Anis vert / fenouil graines', EP, 'anis vert|graine de fenouil|graine d anis', '', true],
        ['Safran', EP, 'safran|pistil de safran|dose de safran', '', true],
        ['Zaatar', EP, 'zaatar|za atar', '', true],
        ['Sumac', EP, 'sumac', '', true],
        ['Dukkah', EP, 'dukkah', 'fruits_a_coque', true],
        ['Cardamome', EP, 'cardamome|gousse de cardamome', '', true],
        ['Fenugrec', EP, 'fenugrec', '', true],
        ['Nigelle', EP, 'nigelle|graine de nigelle', '', true],
        ['Baies de genièvre', EP, 'genievre|baie de genievre', '', true],
        ['Quatre-épices', EP, 'quatre epice', '', true],
        ['Cinq-épices', EP, 'cinq epice', '', true],
        ['Mélange d\'épices', EP, 'epice|melange d epices', '', true],
        ['Ail en poudre', EP, 'ail en poudre|ail semoule', '', true],
        ['Oignon en poudre', EP, 'oignon en poudre|oignon frit|oignon seche', '', true]
    ] },
    { family: 'surgele', rows: [
        ['Légumes surgelés', SU, 'legume surgele|poelee surgelee|melange de legumes surgeles'],
        ['Glace', SU, 'glace|creme glacee|sorbet', 'lactose']
    ] },

    // ===================== Boissons (alcohol and juice for cooking)
    { family: 'alcool|vin', rows: [
        ['Vin blanc sec', BO, 'vin blanc|vin blanc sec'],
        ['Vin rouge', BO, 'vin rouge'],
        ['Vin de Savoie', BO, 'vin de savoie|apremont|jacquere'],
        ['Champagne / crémant', BO, 'champagne|cremant|vin petillant|prosecco'],
        ['Porto', BO, 'porto'],
        ['Madère', BO, 'madere'],
        ['Marsala', BO, 'marsala'],
        ['Xérès', BO, 'xeres|sherry'],
        ['Cognac / armagnac', BO, 'cognac|armagnac'],
        ['Rhum', BO, 'rhum|rhum ambre|rhum brun'],
        ['Calvados', BO, 'calvados'],
        ['Whisky', BO, 'whisky'],
        ['Kirsch', BO, 'kirsch'],
        ['Grand Marnier / Cointreau', BO, 'grand marnier|cointreau|liqueur d orange|triple sec'],
        ['Bière', BO, 'biere|biere blonde|biere brune', 'gluten'],
        ['Cidre', BO, 'cidre|cidre brut'],
        ['Saké', BO, 'sake']
    ] },
    { family: 'jus|boisson', rows: [
        ['Jus d\'orange', BO, 'jus d orange'],
        ['Jus de pomme', BO, 'jus de pomme'],
        ['Jus de fruits', BO, 'jus de fruit|nectar']
    ] },

    // ===================== Placard (vérifier)
    { family: 'sel', rows: [
        ['Sel fin', PL, 'sel|sel fin|sel de table', 'sel', true],
        ['Gros sel', PL, 'gros sel|sel gris|gros sel de guerande', 'sel', true],
        ['Fleur de sel', PL, 'fleur de sel|sel de guerande', 'sel', true],
        ['Sel fumé', PL, 'sel fume', 'sel', true]
    ] },
    { family: 'poivre', rows: [
        ['Poivre noir', PL, 'poivre|poivre noir|poivre du moulin|poivre noir moulu|poivre mignonnette', '', true],
        ['Poivre blanc', PL, 'poivre blanc', '', true],
        ['Baies roses', PL, 'baie rose|poivre rose', '', true],
        ['Poivre de Sichuan', PL, 'poivre de sichuan|poivre du sichuan|poivre de setchouan', '', true],
        ['Poivre vert', PL, 'poivre vert', '', true]
    ] },
    { family: 'huile', rows: [
        ['Huile d\'olive', PL, 'huile d olive|huile d olive vierge extra|huile d olive extra vierge|filet d huile d olive', '', true],
        ['Huile neutre', PL, 'huile|huile neutre|huile vegetale|huile de tournesol|huile de colza|huile de pepin de raisin|huile de friture|huile de cuisson', '', true],
        ['Huile de sésame', PL, 'huile de sesame|huile de sesame grille', '', true],
        ['Huile de noix', PL, 'huile de noix', 'fruits_a_coque', true],
        ['Huile de noisette', PL, 'huile de noisette', 'fruits_a_coque', true],
        ['Huile de coco', PL, 'huile de coco|graisse de coco', '', true],
        ['Huile de truffe', PL, 'huile de truffe|huile truffee', '', true],
        ['Huile pimentée', PL, 'huile pimentee|huile de piment', '', true],
        ['Graisse de canard', PL, 'graisse de canard|graisse d oie', 'viande', true]
    ] },

    // ===================== Never bought
    { family: '', rows: [
        ['Eau', null, 'eau|eau froide|eau chaude|eau tiede|eau bouillante|glacon|eau du robinet', '', true]
    ] }
];

export const DICTIONARY: DictionaryEntry[] = GROUPS.flatMap(({ family, rows }) =>
    rows.map(([name, section, aliases, tags, bare]) => ({
        name,
        section,
        aliases: aliases.split('|').map(a => a.trim()).filter(Boolean),
        tags: (tags || '').split(' ').filter(Boolean) as IngredientTag[],
        bare: Boolean(bare),
        family: family.split('|').map(f => f.trim()).filter(Boolean)
    }))
);

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

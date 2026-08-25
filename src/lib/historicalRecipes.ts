import { VaultRecipe, DishCategory } from './types/cooking-ops';

// Raw parsed dishes from Elisa's historical spreadsheet
const rawDishesData: { name: string; type?: string }[] = [
    { name: "Blanquette de poulet revisitée", type: "Meats" },
    { name: "Parmentier de confit de canard", type: "Meats" },
    { name: "Dahl de lentilles de corail coco, kale et cheese naan maison", type: "Vegetarian" },
    { name: "Velouté de butternut, noisettes et grilled cheese comté, épinard", type: "Vegetarian" },
    { name: "Crumble salé aux légumes d'hiver, feta et noix", type: "Vegetarian" },
    { name: "Truite aux herbes et câpres, purée et carottes glacées", type: "Fish" },
    { name: "Crevettes sautées à l’ail et moutarde, riz parfumé, carottes vichy", type: "Fish" },
    { name: "Tarte fine aux légumes d'hiver", type: "Vegan" },
    { name: "Canard à l’orange, polenta crémeuse et champignons aux herbes", type: "Meats" },
    { name: "Bœuf bourguignon léger et pommes vapeur", type: "Meats" },
    { name: "Soupe champignons, marrons et grilled cheese oignon confit et fromage à raclette", type: "Vegetarian" },
    { name: "Risotto asperges et champignons, parmesan & amandes torréfiées", type: "Vegetarian" },
    { name: "Falafels maison, sauce tahini et polenta crémeuse", type: "Vegetarian" },
    { name: "Lieu noir sauce moutarde, haricots à l’ail et patatas bravas", type: "Fish" },
    { name: "Cabillaud sauce coco-curry doux, légumes et riz basmati", type: "Fish" },
    { name: "Tian de légumes d'hiver, fromage végan", type: "Vegan" },
    { name: "Tarte tatin poireaux, fêta, thon", type: "Fish" },
    { name: "Risotto de topinambour, noisettes torréfiée, parmesan", type: "Vegetarian" },
    { name: "Filet mignon, sauce à la bière et moutarde, purée de panais", type: "Meats" },
    { name: "Ballottines de poulet au jambon sec, sauce aux champignons, riz pilaf", type: "Meats" },
    { name: "Gnocchis maison, shiitaké fondant et parmesan", type: "Vegetarian" },
    { name: "Velouté chou-fleur et chorizo, éclat de noisettes", type: "Vegetarian" },
    { name: "Aile de raie au court-bouillon, sauce aux agrumes d’hiver et carottes glacées", type: "Fish" },
    { name: "Filet de merlan en croûte d’herbes & citron, petits légumes verts sautés", type: "Fish" },
    { name: "Cordon bleu façon banger, frites de patate douce", type: "Meats" },
    { name: "Quiche au chèvre et aux poires", type: "Vegetarian" },
    { name: "Falafels, sauce yaourt et orzo à la méditerranéenne", type: "Vegetarian" },
    { name: "Velouté de poireaux, avec son grilled cheese épinard", type: "Vegetarian" },
    { name: "Filets de saumon, sauce à la crème d’estragon et purée de céleri-rave", type: "Fish" },
    { name: "Risotto d'épeautre, champignons et oignons caramélisés", type: "Vegetarian" },
    { name: "Shawarma d'agneau avec marinade et légumes d'hiver", type: "Meats" },
    { name: "Pizza poireaux fondants, courge rôtie, comté & thym", type: "Vegetarian" },
    { name: "Filets de merlu, sauce curry coco et coriandre", type: "Fish" },
    { name: "Poireaux braisés, houmous tiède, épeautre au citron et noisettes grillées", type: "Vegan" },
    { name: "Boudin noir, pomme cannelle, purée de pomme de terre", type: "Meats" },
    { name: "Tourte de légumes à l'irlandaise", type: "Vegetarian" },
    { name: "Cocotte de légumes d'hiver, châtaignes et quinoa", type: "Vegetarian" },
    { name: "Dos de lieu noir, tombée d'épinards au lait de coco et quinoa", type: "Fish" },
    { name: "Truite laquée soja, miel & gingembre et topinambour rôti, haricots verts", type: "Fish" },
    { name: "Galettes croustillantes de panais & pois chiches, salade tiède de chou", type: "Vegan" },
    { name: "Porc fondant au caramel, choux de Bruxelles rôtis & carottes et panais dorés", type: "Meats" },
    { name: "Rigatoni sauce au bleu, épinards & champignons", type: "Vegetarian" },
    { name: "Quiche ricotta, épinards et olives", type: "Vegetarian" },
    { name: "Curry de patates douces, lentilles et pois chiches", type: "Vegan" },
    { name: "Parmentier de haddock, patate douce & fondue de poireaux", type: "Fish" },
    { name: "Steak de chou-fleur rôti, purée de panais & sauce tahini-citron", type: "Vegan" },
    { name: "Ballotines de poulet farcies aux marrons et frites de patate douce", type: "Meats" },
    { name: "Boulettes d’agneau aux épices douces, asperges et yaourt aux herbes", type: "Meats" },
    { name: "Brownie salé épinard-feta", type: "Vegetarian" },
    { name: "Friands au céleri-rave, pomme et noisette et patates au paprika", type: "Vegetarian" },
    { name: "Parmentier de haddock, purée de pomme de terre & fondue de poireaux", type: "Fish" },
    { name: "Blanquette de la mer aux crustacés", type: "Fish" },
    { name: "Tarte fine aux oignons confits, blettes & crème d’amande", type: "Vegan" },
    { name: "Saucisson brioché maison, salade de lentilles fraîches", type: "Meats" },
    { name: "Mafé revisité poulet, cacahuètes & gingembre, riz coco, légumes rôtis", type: "Meats" },
    { name: "Tarte tatin de poireaux, fêta et crème citronnée", type: "Vegetarian" },
    { name: "Vol-au-vent végé, champignons à la crème & asperges vertes", type: "Vegetarian" },
    { name: "Patate douce farcie à la mexicaine", type: "Vegetarian" },
    { name: "Maquereau grillé, fenouil confit, pommes rôties & grenaille, yaourt citron-aneth", type: "Fish" },
    { name: "Tofu au curry coco et carottes, naan vegan maison", type: "Vegan" },
    { name: "Empanadas maison au bœuf, coleslaw citron vert & herbes fraîches", type: "Meats" },
    { name: "Bavette à l’échalote, purée de pomme de terre", type: "Meats" },
    { name: "Risotto au cresson, noisettes torréfiées & œuf mollet", type: "Vegetarian" },
    { name: "Quiche aux trois fromages ultra crémeuse", type: "Vegetarian" },
    { name: "Blanquette végétarienne de légumes racines & haricots blancs", type: "Vegetarian" },
    { name: "Brandade de morue maison", type: "Fish" },
    { name: "Travers de porc confit, laque miel et moutarde, et légumes fondants", type: "Meats" },
    { name: "Poulet aux pois gourmands, polenta crémeuse", type: "Meats" },
    { name: "Crumble de chou-fleur & pois chiches au parmesan et noisettes", type: "Vegetarian" },
    { name: "Croque-monsieur à l'ail des ours et fondue de poireaux, taboulé de persil aux amandes", type: "Vegetarian" },
    { name: "Curry d'épinards et de pommes de terre, pain cheese naan maison", type: "Vegetarian" },
    { name: "Penne aux crevettes et à la coriandre", type: "Fish" },
    { name: "Croquettes de patate douce et reblochon pané, saumon snacké", type: "Fish" },
    { name: "Wok de tofu mariné, brocolis croquants et infusion de coco au gingembre", type: "Vegan" },
    { name: "Tajine de poulet à la marocaine aux citrons confits", type: "Meats" },
    { name: "Sauté d'agneau au curry, semoule aux fruits secs & carottes rôties", type: "Meats" },
    { name: "Pizza printanière, asperges, ricotta et pesto d'ail des ours", type: "Vegetarian" },
    { name: "Orzotto aux morilles, ail nouveau & parmesan", type: "Vegetarian" },
    { name: "Cake printanier (feta, noix, épinard) et tartare de betterave à l'aneth", type: "Vegetarian" },
    { name: "Millefeuille de pommes de terre, cabillaud, crème citronnée au yaourt", type: "Fish" },
    { name: "Dos de merlu en papillote, écrasé de grenailles et fèves fraîches à la menthe", type: "Fish" },
    { name: "Linguine à la bolognaise de lentilles Beluga, épinards frais et éclats de noix", type: "Vegan" },
    { name: "Bœuf sauté façon Lok Lak et son riz rouge à l’ail, légumes croquants", type: "Meats" },
    { name: "Filet mignon en croûte, jardinière de jeunes légumes infusée à la menthe", type: "Meats" },
    { name: "Carpaccio de betterave, pommes vertes et noix & smashed potatoes croustillantes", type: "Vegetarian" },
    { name: "Bun burger maison, bacon végétal, oignons caramélisés, raclette & frites au paprika", type: "Vegetarian" },
    { name: "Clafoutis salé aux poireaux et Comté affiné, salade de lentilles à l'ancienne", type: "Vegetarian" },
    { name: "Quinoa aux herbes, crevettes saisies au chorizo et fèves de printemps", type: "Fish" },
    { name: "Pavé de saumon à l'oseille fraîche, escorté d'asperges blanches fondantes", type: "Fish" },
    { name: "Soba froides au beurre de cacahuète et jeunes poireaux", type: "Vegan" },
    { name: "Côte de bœuf marinée du boucher & salade de fenouil braisé à l'orange", type: "Meats" },
    { name: "Poulet coco curry vert, vermicelles et légumes croquants printaniers", type: "Meats" },
    { name: "Socca-pizza au crémeux de ricotta citronné, asperges vertes et oignons fondants", type: "Vegetarian" },
    { name: "Brique artichaut-parmesan-olive & salade de lentilles aux tomates rôties", type: "Vegetarian" },
    { name: "Clafoutis à la ratatouille & fromage de brebis", type: "Vegetarian" },
    { name: "Dos de cabillaud façon blanquette printanière", type: "Fish" },
    { name: "Brochettes de crevettes & courgettes, quinoa aux herbes", type: "Fish" },
    { name: "Shakshuka verte avec asperges, épinards et tofu soyeux", type: "Vegan" },
    { name: "Courgettes farcies au bœuf, sauce tomate et parmesan & riz tomate estragon", type: "Meats" },
    { name: "Suprême de volaille sauce moutarde à l’ancienne, pommes de terre suédoises", type: "Meats" },
    { name: "Lasagnes ouvertes aux asperges, ricotta citronnée et pesto d’herbes", type: "Vegetarian" },
    { name: "Cake salé aux tomates séchées, parmesan & coleslaw au fenouil et radis", type: "Vegetarian" },
    { name: "Tartare de truite aux radis et concombre croquants, blinis et crème aneth", type: "Fish" },
    { name: "Filet de maquereau à la rhubarbe, dahl de lentilles corail au coco et cumin", type: "Fish" },
    { name: "Pièce du boucher, sauce roquefort, écrasé de pommes de terre à l’huile d’olive", type: "Meats" },
    { name: "Lapin rôti à la moutarde, légumes de printemps rôtis", type: "Meats" },
    { name: "Risotto vert aux petits pois, menthe et pecorino", type: "Vegetarian" },
    { name: "Orzotto de courgettes, citron, parmesan & noisettes torréfiées", type: "Végétarien" },
    { name: "Millefeuille de légumes rôtis, chèvre frais et pesto fanes de carottes", type: "Vegetarian" },
    { name: "Parmentier de merlu, asperges vertes et crème d’oseille", type: "Fish" },
    { name: "Saint-Jacques snackées, purée de carottes aux épices et chou-fleur rôti", type: "Fish" },
    { name: "Asperges braisées, houmous tiède, épeautre au citron et noisettes grillées", type: "Vegan" },
    { name: "Poulet aux olives à la méditerranéenne, semoule parfumée et éclats d'amandes", type: "Meats" },
    { name: "Escalope de dinde à la crème de noisettes, mousseline de céleri-rave", type: "Meats" },
    { name: "Penne, crème de betterave, feta, noix & persil", type: "Vegetarian" },
    { name: "Spanakopita grecque aux épinards et feta", type: "Vegetarian" },
    { name: "Friand carotte-chèvre et sa salade de pois chiches rôtis", type: "Vegetarian" },
    { name: "Pissaladière traditionnelle aux oignons confits, anchois et olives", type: "Fish" },
    { name: "Rouleaux de printemps aux crevettes et aïoli maison, noodles au sésame", type: "Fish" },
    { name: "Buddha bowl de printemps : quinoa, houmous de petits pois, tofu et épinards", type: "Vegan" },
    { name: "Boulettes de bœuf caramélisées, écrasé de patate douce coco et citron vert", type: "Meats" },
    { name: "Ballotine de dinde sauge & abricot, polenta onctueuse au parmesan", type: "Meats" },
    { name: "Falafels maison aux herbes fraîches, sauce yaourt-menthe, taboulé de chou-fleur", type: "Vegetarian" },
    { name: "Cheesecake salé au chèvre frais et herbes, base sablée au parmesan", type: "Vegetarian" },
    { name: "Velouté de petits pois à la menthe et œuf poché", type: "Végétarien" },
    { name: "Dos de cabillaud en croûte de chorizo et zestes d'orange, risotto aux poireaux", type: "Fish" },
    { name: "Encornets farcis à la niçoise, riz noir au citron vert", type: "Fish" },
    { name: "Lasagnes aux légumes verts & béchamel au lait d'amande", type: "Vegan" },
    { name: "Keftas de bœuf à la menthe fraîche, salade de pois chiches au sumac, feta et grenade", type: "Meats" },
    { name: "Fondant de porc au caramel de pomme douce, grenailles et carottes fanes au miel", type: "Meats" },
    { name: "Halloumi doré au miel & thym frais, caponata sicilienne", type: "Vegetarian" },
    { name: "Mille-feuille de polenta grillée, courgettes et caviar de tomates séchées", type: "Vegetarian" },
    { name: "L’Aubergine façon lasagne, haché végétal à l'origan & Mozzarella di Bufala", type: "Vegetarian" },
    { name: "Salade de poulpe tiède, pommes de terre fondantes, tomates au four et olives", type: "Fish" },
    { name: "Brochettes de lotte au lard fumé & romarin, gratin de courgettes au mascarpone", type: "Fish" },
    { name: "Mijoté d'artichauts poivrade à la Barigoule, tempeh doré", type: "Vegan" },
    { name: "Filet d'agneau en croûte et tomate séchée, salade de riz au curry", type: "Meats" },
    { name: "Crumble de légumes rôtis, feta, olives et crumble aux amandes", type: "Vegetarian" },
    { name: "Salade pêche snackée, patate douce rôtie, halloumi grillé, pois chiches croustillants", type: "Vegetarian" },
    { name: "Falafels de lentilles corail aux épices douces, tzatziki de courgettes à la menthe", type: "Vegetarian" },
    { name: "Saumon au pesto de basilic, tian de légumes d'été", type: "Fish" },
    { name: "Beignets de truite, slaw croquant de fenouil et céleri, yaourt citron vert", type: "Fish" },
    { name: "Orzo au pesto de roquette maison, fèves fraîches, cœurs d'artichauts et pignons", type: "Vegan" },
    { name: "Filet mignon sauce curry vert, courgettes fondantes et polenta à la tomme", type: "Meats" },
    { name: "Entrecôte de veau, beurre d'anchois, grenailles rôties, courgettes fondantes", type: "Meats" },
    { name: "Tarte fine aux tomates anciennes, asperges vertes, pesto rouge et burrata", type: "Vegetarian" },
    { name: "Shawarma végétarien aux pois chiches rôtis, légumes croquants et sauce tahini", type: "Vegetarian" },
    { name: "Lieu noir sauce moutarde, carottes fanes rôties à l'ail et patatas bravas", type: "Poisson" },
    { name: "Thon snacké en croûte de sésame mariné au gingembre, jeune jardinière", type: "Fish" },
    { name: "Salade tiède de betteraves rôties, lentilles parfumées et yaourt aux herbes", type: "Vegan" },
    { name: "Poulet laqué façon Général Tao, brocolis verts et riz jasmin", type: "Meats" },
    { name: "Magret de canard laqué au vinaigre balsamique et framboises fraîches, mousseline patate douce", type: "Meats" },
    { name: "Flammekueche montagnarde aux oignons et reblochon", type: "Vegetarian" },
    { name: "Croquettes de pommes de terre et petits pois, courgettes grillées, ricotta citronnée", type: "Vegetarian" },
    { name: "Gaspacho d'été et sa bruschetta d'halloumi grillé aux pêches rôties", type: "Vegetarian" },
    { name: "Gambas sautées à l'ail et au piment d'Espelette, semoule aux épices douces et abricots", type: "Fish" },
    { name: "Dos de cabillaud en croûte d’amandes, ratatouille rôtie", type: "Fish" },
    { name: "Curry vert de légumes d'été et pois chiches, boulgour aux herbes", type: "Vegan" },
    { name: "Salade César au poulet grillé, œuf mollet, copeaux de parmesan et croûtons à l'ail", type: "Meats" },
    { name: "Faux-filet grillé, sauce poivron-citron, écrasé de chou-fleur à l'huile d'olive", type: "Meats" },
    { name: "Lentilles au caviar d'aubergine, tomates et sauce yaourt", type: "Vegetarian" },
    { name: "Scones à la feta, tomates séchées, salade fraîche de melon, concombre et menthe", type: "Vegetarian" },
    { name: "Buddha bowl d’été : quinoa, chèvre frais, tofu mariné, tomates cerises et aneth", type: "Vegetarian" },
    { name: "Parmentier de haddock, purée de céleri-rave & fondue de poireaux", type: "Fish" },
    { name: "Tartare de truite au citron vert, radis roses et cébette, crème à l’aneth", type: "Fish" },
    { name: "Aubergines laquées au miso, nouilles soba et concombre au sésame", type: "Vegan" },
    { name: "Filet mignon façon orloff à la coppa, mozzarella et poêlée de haricots verts", type: "Meats" },
    { name: "Aiguillettes de poulet panées aux graines, frites de carottes et sauce creamy", type: "Meats" },
    { name: "Keftas de lentilles corail à la feta, grenailles croustillantes et sauce blanche", type: "Vegetarian" },
    { name: "Salade de riz parfumée à la menthe, grenade, feta, noix et olives", type: "Vegetarian" },
    { name: "Tacos aux croquettes de poisson croustillantes, slaw croquant au chou rouge", type: "Fish" },
    { name: "Curry de patates douces, pois chiches et lait de coco, graines de courge", type: "Vegan" },
    { name: "Pavé du boucher mariné à l'ail confit, gratin de pommes de terre", type: "Meats" },
    { name: "Clafoutis estival aux tomates cerises, feta & origan, mesclun aux noix", type: "Vegetarian" },
    { name: "Boulgour à la tomate, aux aubergines et au yaourt citronné", type: "Vegetarian" },
    { name: "Velouté de maïs doux au piment d'Espelette, œuf poché coulant", type: "Vegetarian" },
    { name: "Pavé de saumon, crème à l'aneth, polenta crémeuse au parmesan et poivrons doux", type: "Fish" },
    { name: "Tatin d'aubergines confites au balsamique, tapenade de tomates", type: "Vegan" },
    { name: "Vitello tonnato, et sa salade estivale de haricots verts, tomates cerises & basilic", type: "viande" },
    { name: "Salade \"Spring Roll\" déstructurée au porc caramélisé & sauce cacahuète", type: "viande" },
    { name: "Galettes de maïs frais, cheddar & ciboulette, compotée de tomates au basilic", type: "Végétarien" },
    { name: "Maquereau façon teriyaki, aubergines grillées & riz japonais", type: "Poisson" },
    { name: "Poivrons farcis au boulgour, pois chiches & raisins secs", type: "Végan" },
    { name: "Mini-courgettes farcies à la ricotta, citron & menthe sur lit de boulgour", type: "Vegetarian" },
    { name: "Gaspacho de melon, concombre, poivron et bruschetta d'halloumi grillé", type: "Vegetarian" },
    { name: "Empanadas au maïs, poivrons & fromage, salsa Pico de Gallo aux pêches", type: "Vegetarian" },
    { name: "Parmentier de cabillaud, poireaux et patate douce", type: "Fish" },
    { name: "Paëlla traditionnelle d'été au poulet doré, calamars, crevettes et riz safrané", type: "Fish" },
    { name: "Tian de légumes d'été au pesto de basilic maison, socca croustillante", type: "Vegan" },
    { name: "Effiloché de porc aux épices douces, écrasé de patate douce coco et oignons frits", type: "Meats" },
    { name: "Tarte tatin de tomates au balsamique, oignons confits, mozzarella et burrata", type: "Vegetarian" },
    { name: "Crumble croustillant aux graines, poivrons & aubergines confites, feta fouettée", type: "Vegetarian" },
    { name: "Galettes de courgettes feta et menthe, tzatziki et salade de pois chiches", type: "Vegetarian" },
    { name: "Tataki de thon mariné à la verveine & citron, haricots verts, pêche et noisettes", type: "Fish" },
    { name: "Pavé de saumon en croûte d'amandes, crémeux de maïs au citron vert et courgettes", type: "Fish" },
    { name: "Fatayers chèvre, miel et oignon fondant avec sa salade Fattouche d'été", type: "Vegetarian" },
    { name: "Mini-courgettes farcies à la feta fouettée, tomates séchées & noisettes, riz basmati", type: "Vegetarian" },
    { name: "Cheesecake d'été au chèvre, poivrons rôtis sur sablé au parmesan", type: "Vegetarian" },
    { name: "Filet de maquereau, sauce vierge pistache, orzo sauté aux tomates cerises", type: "Fish" },
    { name: "Croquettes de poisson croustillantes, salade de grenailles aux herbes, tartare légère", type: "Fish" },
    { name: "Aubergines laquées au miso doux, quinoa aux herbes et sauce crémeuse au tahini", type: "Vegan" },
    { name: "Bavette grillée & sa sauce au poivre, gratin de courgettes fondues", type: "Meats" },
    { name: "Quesadillas aux poivrons grillés, maïs frais, haricots rouges & cheddar", type: "Vegetarian" },
    { name: "Halloumi grillé & son taboulé oriental de lentilles aux tomates, persil & menthe", type: "Vegetarian" },
    { name: "Croquettes de Saint-Marcellin coulant, salade fraîcheur de tomates et pêches", type: "Vegetarian" },
    { name: "Tartare de truite, sauce aneth-citron et pommes de terre grenailles rôties", type: "Fish" },
    { name: "Dos de cabillaud rôti & vierge de tomates au basilic, orzo façon risotto", type: "Fish" },
    { name: "Falafels maison, taboulé de quinoa aux herbes & sauce tahini citronnée", type: "Vegan" },
    { name: "Boulettes de bœuf à la méditerranéenne, semoule aux herbes & sauce yaourt citronnée", type: "viande" },
    { name: "Poulet à la moutarde avec son gratin dauphinois", type: "viande" },
    { name: "Muffins moelleux au Roquefort, tomates séchées & noix, roquette aux noix", type: "Végétarien" },
    { name: "Cordon bleu d'aubergine panée, mozzarella & tomates séchées, purée de pommes de terre", type: "Végétarien" },
    { name: "Risotto d'épeautre à la crème de carottes rôties au cumin, noisettes & persil", type: "Végétarien" },
    { name: "Dos de Lieu Noir en croûte d'herbes & parmesan, tian de légumes d'été", type: "Poisson" },
    { name: "Moqueca brésilienne : Mijoté de poisson blanc & crevettes coco, poivrons et riz", type: "Poisson" },
    { name: "Risotto de petit épeautre d'été aux maïs rôti, poivrons doux & basilic frais", type: "Végétarien" }
];

function normalizeCategory(type?: string): DishCategory {
    if (!type) return 'Végétarien';
    const lower = type.toLowerCase().trim();
    if (lower.includes('meat') || lower.includes('viande') || lower.includes('boeuf') || lower.includes('porc') || lower.includes('poulet') || lower.includes('canard') || lower.includes('agneau')) return 'viande';
    if (lower.includes('fish') || lower.includes('poisson') || lower.includes('saumon') || lower.includes('cabillaud') || lower.includes('truite') || lower.includes('thon') || lower.includes('crevette') || lower.includes('merlu') || lower.includes('lieu')) return 'Poisson';
    if (lower.includes('vegan') || lower.includes('végan')) return 'Végan';
    return 'Végétarien';
}

function cleanDishName(name: string): string {
    return name
        .replace(/^["']|["']$/g, '')
        .replace(/""/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

// Generate unique, deduplicated, enriched recipe vault items
export function getInitialHistoricalRecipeVault(): VaultRecipe[] {
    const countsMap = new Map<string, { count: number; category: DishCategory; rawName: string }>();

    rawDishesData.forEach(item => {
        const cleaned = cleanDishName(item.name);
        if (!cleaned || cleaned.length < 3) return;

        const key = cleaned.toLowerCase();
        const existing = countsMap.get(key);
        const cat = normalizeCategory(item.type);

        if (existing) {
            existing.count += 1;
        } else {
            countsMap.set(key, { count: 1, category: cat, rawName: cleaned });
        }
    });

    const vault: VaultRecipe[] = [];
    let i = 1;

    countsMap.forEach((val, _) => {
        vault.push({
            id: `vault_elisa_${i++}`,
            name: val.rawName,
            category: val.category,
            instructions: [
                `1. Préparer et tailler les ingrédients frais pour "${val.rawName}".`,
                `2. Cuisson douce, assaisonnement soigné et dressage soigné.`,
                `3. Conditionnement dans les contenants du client.`
            ],
            chefNotes: `Recette signature Elisa (${val.category}).`,
            timesUsed: val.count,
            createdAt: '2026-01-01'
        });
    });

    // Sort by times used descending (most popular dishes first)
    vault.sort((a, b) => (b.timesUsed || 1) - (a.timesUsed || 1));
    return vault;
}

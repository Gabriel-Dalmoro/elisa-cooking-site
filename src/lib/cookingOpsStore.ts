import { 
    ClientProfile, 
    BookingSession, 
    ClientSelection, 
    SlotSessionStatus, 
    WeeklyDish, 
    WeeklyMenuData, 
    VaultRecipe 
} from './types/cooking-ops';
import { isSupabaseConfigured, supabaseFetch } from './db/supabase';
import { getInitialHistoricalRecipeVault } from './historicalRecipes';

// Recipe Vault with all past recipes from Elisa's spreadsheet history
const recipeVaultStore: VaultRecipe[] = getInitialHistoricalRecipeVault();

// Active weekly dishes
let activeWeeklyDishesStore: WeeklyDish[] = [
    {
        id: 'dish_1',
        name: 'Vitello tonnato, et sa salade estivale de haricots verts, tomates cerises & basilic',
        category: 'viande',
        instructions: [
            '1. Cuire le rôti de veau à 58°C à cœur ou pocher délicatement.',
            '2. Mixer le thon égoutté, mayonnaise légère, câpres, anchois et filet de citron pour la sauce tonnato.',
            '3. Cuire les haricots verts al dente et refroidir en eau glacée.',
            '4. Trancher très finement le veau et dresser avec la sauce, les tomates cerises rôties et le basilic.'
        ],
        chefNotes: 'Garder la sauce tonnato bien fraîche au frais avant de napper.'
    },
    {
        id: 'dish_2',
        name: 'Salade "Spring Roll" déstructurée au porc caramélisé & sauce cacahuète',
        category: 'viande',
        instructions: [
            '1. Faire mariner les émincés de porc avec sauce soja, ail, miel et cinq-épices.',
            '2. Saisir à feu très vif dans la poêle pour caraméliser les bords.',
            '3. Réhydrater les vermicelles de riz 4 min à l’eau bouillante.',
            '4. Préparer la sauce au beurre de cacahuète, citron vert et sauce soja.',
            '5. Assembler les bols avec herbes fraîches (menthe, coriandre).'
        ],
        chefNotes: 'Laisser tiédir le porc avant d’assembler pour ne pas flétrir les herbes.'
    },
    {
        id: 'dish_3',
        name: 'Galettes de maïs frais, cheddar & ciboulette, compotée de tomates au basilic',
        category: 'Végétarien',
        instructions: [
            '1. Égrener les épis de maïs ou égoutter le maïs doux.',
            '2. Mélanger avec la farine, œuf, cheddar râpé, ciboulette ciselée, sel et poivre.',
            '3. Poêler des petits tas dans une poêle chaude huilée 3-4 min de chaque côté.',
            '4. Compoter les tomates concassées avec huile d’olive, ail et basilic pendant 20 min.'
        ],
        chefNotes: 'Servir la compotée tiède ou froide à côté des galettes.'
    },
    {
        id: 'dish_4',
        name: 'Orzotto de courgettes, citron, parmesan & noisettes torréfiées',
        category: 'Végétarien',
        instructions: [
            '1. Faire revenir l’échalote et les dés de courgettes dans l’huile d’olive.',
            '2. Ajouter les pâtes orzo, nacrer 2 min puis mouiller avec le bouillon chaud par étapes.',
            '3. Cuire 10-12 min jusqu’à texture crémeuse.',
            '4. Hors du feu, lier avec le parmesan râpé, le jus et zeste de citron jaune.',
            '5. Parsemer généreusement de noisettes concassées torréfiées.'
        ],
        chefNotes: 'Ne pas surcuire les courgettes pour conserver un léger croquant.'
    },
    {
        id: 'dish_5',
        name: 'Velouté de petits pois à la menthe et oeuf poché',
        category: 'Végétarien',
        instructions: [
            '1. Suer les oignons blancs au beurre doux.',
            '2. Ajouter les petits pois et couvrir de bouillon de légumes chaud.',
            '3. Cuire 8 min seulement pour garder la belle couleur verte vive.',
            '4. Mixer très finement avec les feuilles de menthe fraîche et une pointe de crème.',
            '5. Pocher les œufs 3 min dans l’eau frémissante vinaigrée et déposer au centre.'
        ],
        chefNotes: 'Passer au chinois fin pour un soyeux parfait.'
    },
    {
        id: 'dish_6',
        name: 'Lieu noir sauce moutarde, carottes fanes rôties à l\'ail et patatas bravas',
        category: 'Poisson',
        instructions: [
            '1. Disposer les carottes fanes sur plaque avec huile d’olive, ail et thym. Rôtir 25 min à 190°C.',
            '2. Rôtir les cubes de pommes de terre au four avec paprika doux.',
            '3. Préparer la sauce crémeuse : crème, moutarde de Dijon et moutarde à l’ancienne.',
            '4. Cuire les portions de lieu noir au four 10-12 min à 180°C.'
        ],
        chefNotes: 'Napper la sauce au moment du conditionnement en barquette.'
    },
    {
        id: 'dish_7',
        name: 'Maquereau façon teriyaki, aubergines grillées & riz japonais',
        category: 'Poisson',
        instructions: [
            '1. Quadriller la chair des aubergines, badigeonner d’huile et rôtir à 200°C 25 min.',
            '2. Faire réduire la sauce teriyaki (sauce soja, mirin, sucre roux, gingembre râpé).',
            '3. Saisir les filets de maquereau côté peau d’abord, puis laquer avec la sauce teriyaki.',
            '4. Cuire le riz japonais et assaisonner au vinaigre de riz et graines de sésame.'
        ],
        chefNotes: 'Attention aux arêtes sur les filets de maquereau.'
    },
    {
        id: 'dish_8',
        name: 'Poivrons farcis au boulgour, pois chiches & raisins secs',
        category: 'Végan',
        instructions: [
            '1. Couper les chapeaux des poivrons et retirer les pépins.',
            '2. Cuire le boulgour dans un bouillon aux épices (cumin, cannelle, coriandre).',
            '3. Mélanger avec les pois chiches cuits, raisins secs blonds, pignons et persil plat.',
            '4. Farcir les poivrons, replacer les chapeaux et enfourner 35 min à 180°C.'
        ],
        chefNotes: 'Ajouter un filet d’huile d’olive sur la peau des poivrons avant d’enfourner.'
    }
];

// Initial baseline clients from Elisa's regular schedule
const INITIAL_CLIENTS: ClientProfile[] = [
    {
        id: 'client_thibault',
        token: 'thibault',
        name: 'Thibault',
        phone: '+33 6 12 34 56 78',
        email: 'thibault@email.com',
        address: '15 rue Saint-Antoine, 75004 Paris',
        allergies: [],
        dislikes: '',
        defaultDishCount: 5,
        personCount: 2,
        notes: 'Plaques vitrocéramique, chien calme',
        createdAt: new Date().toISOString()
    },
    {
        id: 'client_audrey',
        token: 'audrey',
        name: 'Audrey',
        phone: '+33 6 98 76 54 32',
        email: 'audrey@email.com',
        address: '28 avenue Parmentier, 75011 Paris',
        allergies: ['Sans Gluten (Cœliaque)'],
        dislikes: 'Pas de coriandre',
        defaultDishCount: 5,
        personCount: 2,
        notes: 'Four vapeur, plaques induction',
        createdAt: new Date().toISOString()
    },
    {
        id: 'client_romain_amelie',
        token: 'romain-amelie',
        name: 'Romain & Amélie',
        phone: '+33 6 45 67 89 01',
        email: 'romain.amelie@email.com',
        address: '8 rue de Charonne, 75011 Paris',
        allergies: ['Sans Arachides'],
        dislikes: 'Pas de porc',
        defaultDishCount: 6,
        personCount: 2,
        notes: 'Contenants en verre sur le plan de travail',
        createdAt: new Date().toISOString()
    },
    {
        id: 'client_quentin',
        token: 'quentin',
        name: 'Quentin',
        phone: '+33 6 23 45 67 89',
        email: 'quentin@email.com',
        address: '45 boulevard Voltaire, 75011 Paris',
        allergies: [],
        dislikes: 'Pas d\'oignons crus',
        defaultDishCount: 6,
        personCount: 2,
        notes: 'Digicode 2489A',
        createdAt: new Date().toISOString()
    },
    {
        id: 'client_marie_laure',
        token: 'marie-laure',
        name: 'Marie-Laure',
        phone: '+33 6 34 56 78 90',
        email: 'marielaure@email.com',
        address: '12 rue Lepic, 75018 Paris',
        allergies: ['Sans Lactose'],
        dislikes: '',
        defaultDishCount: 4,
        personCount: 4,
        notes: 'Famille 4 personnes',
        createdAt: new Date().toISOString()
    }
];

// In-Memory Stores
let clientsStore: ClientProfile[] = [...INITIAL_CLIENTS];
let bookingSessionsStore: BookingSession[] = [];
const selectionsStore: ClientSelection[] = [];

export async function getActiveWeeklyMenu(): Promise<WeeklyMenuData> {
    return {
        weekLabel: 'Menu de la semaine active',
        active: true,
        recipes: activeWeeklyDishesStore,
        updatedAt: new Date().toISOString()
    };
}

export function getRecipeVault(): VaultRecipe[] {
    return [...recipeVaultStore];
}

export function saveVaultRecipe(recipe: Partial<VaultRecipe> & { name: string; category: string }): VaultRecipe {
    const existingIndex = recipeVaultStore.findIndex(r => r.id === recipe.id || r.name.toLowerCase() === recipe.name.toLowerCase());
    
    if (existingIndex >= 0) {
        const updated = {
            ...recipeVaultStore[existingIndex],
            ...recipe,
            timesUsed: (recipeVaultStore[existingIndex].timesUsed || 1) + 1
        };
        recipeVaultStore[existingIndex] = updated;
        return updated;
    } else {
        const newRecipe: VaultRecipe = {
            id: recipe.id || `vault_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: recipe.name,
            category: recipe.category,
            instructions: recipe.instructions || ['1. '],
            chefNotes: recipe.chefNotes || '',
            timesUsed: recipe.timesUsed || 1,
            createdAt: new Date().toISOString()
        };
        recipeVaultStore.unshift(newRecipe);
        return newRecipe;
    }
}

export function updateWeeklyMenuDishes(dishes: WeeklyDish[]): WeeklyDish[] {
    activeWeeklyDishesStore = [...dishes];
    
    dishes.forEach(d => {
        saveVaultRecipe({
            name: d.name,
            category: d.category,
            instructions: d.instructions || [],
            chefNotes: d.chefNotes || ''
        });
    });

    return activeWeeklyDishesStore;
}

export function updateWeeklyDishRecipe(dishId: string, updates: { instructions?: string[]; chefNotes?: string; name?: string; category?: string }): WeeklyDish | null {
    const dish = activeWeeklyDishesStore.find(d => d.id === dishId || d.name.toLowerCase() === updates.name?.toLowerCase());
    if (dish) {
        if (updates.instructions) dish.instructions = updates.instructions;
        if (updates.chefNotes !== undefined) dish.chefNotes = updates.chefNotes;
        if (updates.name) dish.name = updates.name;
        if (updates.category) dish.category = updates.category;

        saveVaultRecipe({
            name: dish.name,
            category: dish.category,
            instructions: dish.instructions || [],
            chefNotes: dish.chefNotes || ''
        });

        return dish;
    }
    return null;
}

// --- CLIENT PROFILE OPERATIONS ---

export function toggleClientBookedWeek(clientId: string, isBooked: boolean, bookingDay?: string): ClientProfile | null {
    const client = clientsStore.find(c => c.id === clientId);
    if (!client) return null;
    client.isBookedThisWeek = isBooked;
    if (bookingDay !== undefined) client.bookingDay = bookingDay;
    return client;
}

export async function getAllClientsAsync(): Promise<ClientProfile[]> {
    if (isSupabaseConfigured) {
        try {
            const data = await supabaseFetch<any[]>('clients?select=*&order=created_at.desc');
            if (data && Array.isArray(data)) {
                const mappedClients: ClientProfile[] = data.map(c => ({
                    id: c.id,
                    token: c.token || c.id,
                    name: c.name,
                    phone: c.phone || '',
                    email: c.email || '',
                    address: c.address || '',
                    allergies: Array.isArray(c.allergies) ? c.allergies : [],
                    dislikes: c.dislikes || '',
                    defaultDishCount: c.default_dish_count || 4,
                    personCount: 2,
                    notes: c.notes || '',
                    isBookedThisWeek: Boolean(c.is_booked_this_week),
                    bookingDay: c.booking_day || undefined,
                    createdAt: c.created_at || new Date().toISOString()
                }));

                // Update clientsStore cache
                clientsStore = mappedClients;
            }
        } catch (e) {
            console.error('Error fetching clients from Supabase:', e);
        }
    }
    return [...clientsStore];
}

export function getAllClients(): ClientProfile[] {
    return [...clientsStore];
}

export function getClientByToken(token: string): ClientProfile | null {
    if (!token) return null;
    const cleanToken = decodeURIComponent(token).trim().toLowerCase();
    
    // 1. Exact match by token
    const exact = clientsStore.find(c => c.token.toLowerCase() === cleanToken);
    if (exact) return exact;

    // 2. Match by ID
    const byId = clientsStore.find(c => c.id.toLowerCase() === cleanToken);
    if (byId) return byId;

    // 3. Match by name slug (e.g. "thibault-martin-123" or "thibault" -> "thibault")
    const cleanAlpha = cleanToken.replace(/[^a-z0-9]/g, '');
    const bySlug = clientsStore.find(c => {
        const nameAlpha = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const tokenAlpha = c.token.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanAlpha.includes(nameAlpha) || nameAlpha.includes(cleanAlpha) || cleanAlpha.includes(tokenAlpha) || tokenAlpha.includes(cleanAlpha);
    });
    if (bySlug) return bySlug;

    // 4. Match if token starts with a client's first name
    const byFirstName = clientsStore.find(c => {
        const firstName = c.name.toLowerCase().split(/[\s&_-]+/)[0];
        return firstName.length >= 3 && cleanToken.startsWith(firstName);
    });
    if (byFirstName) return byFirstName;

    // 5. Dynamic auto-provision: If token is a new name slug, automatically create and register client
    if (cleanToken.length >= 2) {
        const formattedName = cleanToken
            .split(/[-_]+/)
            .filter(w => w.length > 0 && !/^\d+$/.test(w))
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        
        if (formattedName.length >= 2) {
            return saveClient({
                name: formattedName,
                token: cleanToken,
                defaultDishCount: 4,
                personCount: 2
            });
        }
    }

    return null;
}

export function getClientById(id: string): ClientProfile | null {
    if (!id) return null;
    return clientsStore.find(c => c.id === id) || null;
}

export function saveClient(clientData: Partial<ClientProfile> & { name: string }): ClientProfile {
    const cleanName = clientData.name.trim();
    const existingIndex = clientsStore.findIndex(
        c => c.id === clientData.id || 
             (clientData.token && c.token === clientData.token) ||
             (c.name.toLowerCase() === cleanName.toLowerCase())
    );
    
    if (existingIndex >= 0) {
        const updated = {
            ...clientsStore[existingIndex],
            ...clientData,
            name: cleanName,
            personCount: clientData.personCount || clientsStore[existingIndex].personCount || 2
        };
        clientsStore[existingIndex] = updated;

        if (isSupabaseConfigured) {
            supabaseFetch(`clients?id=eq.${updated.id}`, {
                method: 'PATCH',
                body: {
                    name: updated.name,
                    phone: updated.phone,
                    email: updated.email,
                    address: updated.address,
                    allergies: updated.allergies,
                    dislikes: updated.dislikes,
                    default_dish_count: updated.defaultDishCount,
                    notes: updated.notes
                }
            }).catch(err => console.error('Supabase update client error:', err));
        }

        return updated;
    } else {
        const id = clientData.id || `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const token = clientData.token || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(36).substring(2, 6)}`;
        const newClient: ClientProfile = {
            id,
            token,
            name: cleanName,
            phone: clientData.phone || '',
            email: clientData.email || '',
            address: clientData.address || '',
            allergies: clientData.allergies || [],
            dislikes: clientData.dislikes || '',
            defaultDishCount: clientData.defaultDishCount || 4,
            personCount: clientData.personCount || 2,
            notes: clientData.notes || '',
            createdAt: new Date().toISOString()
        };
        clientsStore.push(newClient);

        if (isSupabaseConfigured) {
            supabaseFetch('clients', {
                method: 'POST',
                body: {
                    id: newClient.id,
                    token: newClient.token,
                    name: newClient.name,
                    phone: newClient.phone,
                    email: newClient.email,
                    address: newClient.address,
                    allergies: newClient.allergies,
                    dislikes: newClient.dislikes,
                    default_dish_count: newClient.defaultDishCount,
                    notes: newClient.notes
                }
            }).catch(err => console.error('Supabase insert client error:', err));
        }

        return newClient;
    }
}

export function deleteClient(clientId: string): boolean {
    const initialLen = clientsStore.length;
    clientsStore = clientsStore.filter(c => c.id !== clientId);
    bookingSessionsStore = bookingSessionsStore.filter(s => s.clientId !== clientId);
    
    if (isSupabaseConfigured) {
        supabaseFetch(`clients?id=eq.${clientId}`, { method: 'DELETE' })
            .catch(err => console.error('Supabase delete client error:', err));
    }

    return clientsStore.length < initialLen;
}

// --- BOOKING SESSION OPERATIONS (ISOLATED PER DATE) ---

export function upsertBookingSession(sessionData: {
    id?: string;
    clientId: string;
    clientName: string;
    dateIso: string; // "YYYY-MM-DD"
    dayName: string;
    timeSlot: 'Matin' | 'Après-midi';
    dishCount: number;
    personCount?: number;
    gcalEventId?: string;
    notes?: string;
}): BookingSession {
    const existingIndex = bookingSessionsStore.findIndex(s => 
        (sessionData.gcalEventId && s.gcalEventId === sessionData.gcalEventId) ||
        (s.dateIso === sessionData.dateIso && s.timeSlot === sessionData.timeSlot)
    );

    const session: BookingSession = {
        id: sessionData.id || (existingIndex >= 0 ? bookingSessionsStore[existingIndex].id : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`),
        clientId: sessionData.clientId,
        clientName: sessionData.clientName,
        dateIso: sessionData.dateIso,
        dayName: sessionData.dayName,
        timeSlot: sessionData.timeSlot,
        dishCount: sessionData.dishCount || 4,
        personCount: sessionData.personCount || (existingIndex >= 0 ? bookingSessionsStore[existingIndex].personCount : 2),
        gcalEventId: sessionData.gcalEventId,
        notes: sessionData.notes,
        createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        bookingSessionsStore[existingIndex] = session;
    } else {
        bookingSessionsStore.push(session);
    }

    return session;
}

export function deleteBookingSession(sessionId: string): boolean {
    const initialLen = bookingSessionsStore.length;
    bookingSessionsStore = bookingSessionsStore.filter(s => s.id !== sessionId);
    return bookingSessionsStore.length < initialLen;
}

export function clearSessionsForDateRange(startDateIso: string, endDateIso: string) {
    bookingSessionsStore = bookingSessionsStore.filter(s => s.dateIso < startDateIso || s.dateIso > endDateIso);
}

export function getSessionsForWeek(startDateIso: string, endDateIso: string): SlotSessionStatus[] {
    const weekMenuLabel = 'Menu de la semaine active';
    const sessions = bookingSessionsStore.filter(s => s.dateIso >= startDateIso && s.dateIso <= endDateIso);

    return sessions.map(session => {
        let client = getClientById(session.clientId);
        if (!client) {
            client = saveClient({
                id: session.clientId,
                name: session.clientName,
                defaultDishCount: session.dishCount,
                personCount: session.personCount
            });
        }

        const selection = getClientSelection(client.id, weekMenuLabel);
        const isSubmitted = !!(selection && selection.selectedDishNames && selection.selectedDishNames.length > 0);

        return {
            session,
            client,
            selection,
            isSubmitted,
            selectedCount: selection ? selection.selectedDishNames.length : 0
        };
    });
}

// --- CLIENT MEAL SELECTIONS ---

export function saveClientSelection(selectionData: {
    clientId: string;
    weekLabel: string;
    selectedDishNames: string[];
    dishNotes?: Record<string, string>;
    generalNote?: string;
    updatedAllergies?: string[];
    updatedDislikes?: string;
}): ClientSelection {
    const client = getClientById(selectionData.clientId);
    if (client && selectionData.updatedAllergies) {
        saveClient({
            id: client.id,
            name: client.name,
            allergies: selectionData.updatedAllergies,
            dislikes: selectionData.updatedDislikes
        });
    }

    const existingIndex = selectionsStore.findIndex(
        s => s.clientId === selectionData.clientId && s.weekLabel === selectionData.weekLabel
    );

    const selection: ClientSelection = {
        id: existingIndex >= 0 ? selectionsStore[existingIndex].id : `sel_${Date.now()}`,
        clientId: selectionData.clientId,
        weekLabel: selectionData.weekLabel,
        selectedDishNames: selectionData.selectedDishNames,
        dishNotes: selectionData.dishNotes || {},
        generalNote: selectionData.generalNote || '',
        submittedAt: new Date().toISOString(),
        allergiesAtSubmission: client ? [...client.allergies] : []
    };

    if (existingIndex >= 0) {
        selectionsStore[existingIndex] = selection;
    } else {
        selectionsStore.push(selection);
    }

    if (isSupabaseConfigured) {
        supabaseFetch('client_selections', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates' },
            body: {
                id: selection.id,
                client_id: selection.clientId,
                week_label: selection.weekLabel,
                selected_dish_names: selection.selectedDishNames,
                dish_notes: selection.dishNotes,
                general_note: selection.generalNote,
                allergies_at_submission: selection.allergiesAtSubmission,
                submitted_at: selection.submittedAt
            }
        }).catch(err => console.error('Supabase upsert selection error:', err));
    }

    return selection;
}

export function getClientSelection(clientId: string, weekLabel: string): ClientSelection | null {
    return selectionsStore.find(s => s.clientId === clientId && s.weekLabel === weekLabel) || null;
}

export async function getWeeklyOverview(): Promise<{
    weekMenu: WeeklyMenuData;
    clients: ClientProfile[];
    sessions: BookingSession[];
    vaultRecipes: VaultRecipe[];
}> {
    const weekMenu = await getActiveWeeklyMenu();
    return {
        weekMenu,
        clients: getAllClients(),
        sessions: [...bookingSessionsStore],
        vaultRecipes: getRecipeVault()
    };
}

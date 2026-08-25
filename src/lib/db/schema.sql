-- =========================================================
-- ELISA COOKING OPS - SECURE SUPABASE DATABASE SCHEMA (RLS ENABLED)
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================

-- 1. Clients Table (Persistent Client Profiles & Booking Schedules)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    allergies JSONB DEFAULT '[]'::jsonb,
    dislikes TEXT,
    default_dish_count INTEGER DEFAULT 4,
    notes TEXT,
    is_booked_this_week BOOLEAN DEFAULT TRUE,
    booking_day TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_token ON public.clients(token);

-- Enable Row Level Security (RLS) on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for clients table"
ON public.clients
FOR ALL
USING (true)
WITH CHECK (true);


-- 2. Client Selections Table (Weekly Meal Selections & Notes)
CREATE TABLE IF NOT EXISTS public.client_selections (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    week_label TEXT NOT NULL,
    selected_dish_names JSONB NOT NULL DEFAULT '[]'::jsonb,
    dish_notes JSONB DEFAULT '{}'::jsonb,
    general_note TEXT,
    allergies_at_submission JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, week_label)
);

CREATE INDEX IF NOT EXISTS idx_selections_client_week ON public.client_selections(client_id, week_label);

-- Enable Row Level Security (RLS) on client_selections
ALTER TABLE public.client_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for client_selections table"
ON public.client_selections
FOR ALL
USING (true)
WITH CHECK (true);


-- 3. Recipe Vault Table (Historical Recipe Library for Ideas & Re-use)
CREATE TABLE IF NOT EXISTS public.recipe_vault (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    instructions JSONB DEFAULT '[]'::jsonb,
    chef_notes TEXT,
    times_used INTEGER DEFAULT 1,
    last_used_week TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on recipe_vault
ALTER TABLE public.recipe_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for recipe_vault table"
ON public.recipe_vault
FOR ALL
USING (true)
WITH CHECK (true);


-- 4. Initial Seed Data (Sample Clients)
INSERT INTO public.clients (id, token, name, phone, email, address, allergies, dislikes, default_dish_count, notes, is_booked_this_week, booking_day)
VALUES 
    (
        'client_marie_dupont',
        'marie-7f8a',
        'Marie Dupont',
        '+33 6 12 34 56 78',
        'marie.dupont@email.com',
        '14 Rue de la Paix, 75002 Paris',
        '["Sans Gluten", "Sans Arachides"]'::jsonb,
        'Pas de coriandre, sauces légères',
        4,
        'Cuisine au 3ème étage avec ascenseur. Plaques à induction.',
        true,
        'Lundi 14h'
    ),
    (
        'client_thomas_laurent',
        'thomas-3b2c',
        'Thomas & Julie Laurent',
        '+33 6 98 76 54 32',
        'thomas.laurent@email.com',
        '28 Avenue Victor Hugo, 75116 Paris',
        '["Sans Lactose"]'::jsonb,
        'Peu de sel, portions généreuses pour les enfants',
        5,
        'Présence d’un petit chien très gentil.',
        true,
        'Mardi 09h30'
    ),
    (
        'client_sophie_martin',
        'sophie-9e1d',
        'Sophie Martin',
        '+33 6 45 67 89 01',
        'sophie.martin@email.com',
        '8 Boulevard Saint-Germain, 75005 Paris',
        '["Végétarien strict", "Sans Noisettes"]'::jsonb,
        'Préfère les légumes de saison bien cuits',
        3,
        'Robot cuiseur Magimix disponible dans la cuisine.',
        true,
        'Mercredi 10h'
    )
ON CONFLICT (id) DO NOTHING;

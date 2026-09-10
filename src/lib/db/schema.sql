-- =========================================================
-- ELISA COOKING OPS — REFERENCE SCHEMA (state after supabase/migrations/001)
-- Do NOT run this against production: changes go in supabase/migrations/ as numbered files.
-- RLS is enabled with NO policies: only the server (service-role key) can read/write.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    access_code TEXT,
    allergies JSONB DEFAULT '[]'::jsonb,
    dislikes TEXT,
    default_dish_count INTEGER DEFAULT 4,
    person_count INTEGER NOT NULL DEFAULT 2,
    notes TEXT,          -- kitchen / equipment notes (assistant-visible)
    private_notes TEXT,  -- Elisa only
    is_booked_this_week BOOLEAN DEFAULT TRUE,
    booking_day TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_token ON public.clients(token);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE public.client_selections ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE public.recipe_vault ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.staff (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'assistant')),
    display_name TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

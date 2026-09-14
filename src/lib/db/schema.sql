-- =========================================================
-- ELISA COOKING OPS — REFERENCE SCHEMA (state after supabase/migrations/003)
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

CREATE TABLE IF NOT EXISTS public.weekly_menus (
    week_start DATE PRIMARY KEY,                       -- Monday (Paris)
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
    dishes JSONB NOT NULL DEFAULT '[]'::jsonb,         -- [{ id, name, category, instructions[], chefNotes }]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.weekly_menus ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.client_selections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_label TEXT,                                   -- legacy, unused
    selected_dish_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    selected_dish_names JSONB NOT NULL DEFAULT '[]'::jsonb,
    dish_notes JSONB DEFAULT '{}'::jsonb,              -- keyed by dish id
    general_note TEXT,
    allergies_at_submission JSONB DEFAULT '[]'::jsonb,
    allergies_added JSONB NOT NULL DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT client_selections_client_week_key UNIQUE (client_id, week_start)
);
ALTER TABLE public.client_selections ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.recipe_vault (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    instructions JSONB DEFAULT '[]'::jsonb,
    chef_notes TEXT,
    times_used INTEGER DEFAULT 0,
    last_used_week DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS recipe_vault_name_key ON public.recipe_vault (lower(name));
ALTER TABLE public.recipe_vault ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.staff (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'assistant')),
    display_name TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cooking_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    gcal_event_id TEXT UNIQUE,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    calendar_title TEXT,
    display_name TEXT NOT NULL,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL CHECK (time_slot IN ('Matin', 'Après-midi')),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    dish_count INTEGER NOT NULL DEFAULT 4,
    person_count INTEGER NOT NULL DEFAULT 2,
    assigned_to UUID REFERENCES public.staff(user_id) ON DELETE SET NULL,
    ignored BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.cooking_sessions(date);
ALTER TABLE public.cooking_sessions ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 002 — Weekly menus, client selections, sessions, recipe vault
-- Everything that used to live in server memory now lives here.
-- Run ONCE in Supabase Dashboard > SQL Editor, then run 003 (recipe seed).
-- =========================================================

begin;

-- 1. Weekly menus: one per week (Monday, Paris time).
--    draft = Elisa is composing | open = clients can choose | closed = choices locked
create table if not exists public.weekly_menus (
    week_start date primary key,
    status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
    dishes jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
alter table public.weekly_menus enable row level security;

-- 2. Client selections: now keyed by (client, week) and by dish id.
--    Existing rows only come from testing the old code (fixed label "Menu de la semaine active",
--    no week), so they are removed.
alter table public.client_selections add column if not exists week_start date;
alter table public.client_selections add column if not exists selected_dish_ids jsonb not null default '[]'::jsonb;
alter table public.client_selections add column if not exists allergies_added jsonb not null default '[]'::jsonb;
alter table public.client_selections add column if not exists updated_at timestamptz not null default now();
delete from public.client_selections where week_start is null;
alter table public.client_selections drop constraint if exists client_selections_client_id_week_label_key;
alter table public.client_selections alter column week_label drop not null;
alter table public.client_selections alter column week_start set not null;
alter table public.client_selections alter column id set default gen_random_uuid()::text;
alter table public.client_selections
    add constraint client_selections_client_week_key unique (client_id, week_start);
drop index if exists public.idx_selections_client_week;

-- 3. Cooking sessions, synced from Google Calendar.
--    Several sessions can share a slot (two chefs). assigned_to = future assistant chef (null = Elisa).
--    ignored = calendar event that is not a cooking session (dentist, personal...).
create table if not exists public.cooking_sessions (
    id text primary key default gen_random_uuid()::text,
    gcal_event_id text unique,
    client_id text references public.clients(id) on delete set null,
    calendar_title text,
    display_name text not null,
    date date not null,
    time_slot text not null check (time_slot in ('Matin', 'Après-midi')),
    starts_at timestamptz,
    ends_at timestamptz,
    dish_count integer not null default 4,
    person_count integer not null default 2,
    assigned_to uuid references public.staff(user_id) on delete set null,
    ignored boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_sessions_date on public.cooking_sessions(date);
alter table public.cooking_sessions enable row level security;

-- 4. Recipe vault: real date for last use, unique names (case-insensitive).
alter table public.recipe_vault
    alter column last_used_week type date
    using case when last_used_week ~ '^\d{4}-\d{2}-\d{2}$' then last_used_week::date end;
alter table public.recipe_vault alter column times_used set default 0;
alter table public.recipe_vault alter column id set default gen_random_uuid()::text;
alter table public.recipe_vault add column if not exists updated_at timestamptz not null default now();
create unique index if not exists recipe_vault_name_key on public.recipe_vault (lower(name));

commit;

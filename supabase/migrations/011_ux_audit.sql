-- =========================================================
-- 011 — From the UX audit with Elisa (22 Nov 2026)
-- Run ONCE in Supabase Dashboard > SQL Editor. Additive only, safe to re-run,
-- safe to run before the matching code is deployed (the current site ignores the new columns).
-- =========================================================

begin;

-- 1. Recipe bank: how each dish keeps (shown to clients when they choose) and its seasons.
--    The week's menu keeps the same information on each dish (weekly_menus.dishes, no change needed).
alter table public.recipe_vault add column if not exists freezable boolean;        -- null = not said yet
alter table public.recipe_vault add column if not exists fridge_days integer;      -- estimated days in the fridge
alter table public.recipe_vault add column if not exists seasons text[] not null default '{}';

-- 2. Sessions: a note for this session only, an arrival time, and dishes added for this session
--    (e.g. a free dish to make up for a mistake). The client's own notes stay « for always ».
alter table public.cooking_sessions add column if not exists session_note text;
alter table public.cooking_sessions add column if not exists arrival_time text;    -- « 14:00 »
alter table public.cooking_sessions add column if not exists extra_dishes jsonb not null default '[]'::jsonb;

-- Checks, added only if missing (safe to re-run)
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'recipe_vault_fridge_days_check') then
        alter table public.recipe_vault add constraint recipe_vault_fridge_days_check
            check (fridge_days is null or fridge_days between 1 and 30);
    end if;
    if not exists (select 1 from pg_constraint where conname = 'cooking_sessions_arrival_time_check') then
        alter table public.cooking_sessions add constraint cooking_sessions_arrival_time_check
            check (arrival_time is null or arrival_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
    end if;
end $$;

-- 3. « Lien envoyé »: the menu link was sent to this client for this week.
create table if not exists public.menu_link_sends (
    client_id text not null references public.clients(id) on delete cascade,
    week_start date not null,
    sent_at timestamptz not null default now(),
    sent_by uuid,
    primary key (client_id, week_start)
);

-- Same rule as the other tables: RLS on, no policies, only the server (service role) reads and writes.
alter table public.menu_link_sends enable row level security;
revoke all on table public.menu_link_sends from anon;

commit;

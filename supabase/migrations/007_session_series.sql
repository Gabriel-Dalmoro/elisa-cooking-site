-- =========================================================
-- 007 — Recurring sessions (e.g. a client every Tuesday morning, cooked by Lucas)
-- Run ONCE in Supabase Dashboard > SQL Editor. Additive only, safe to re-run,
-- safe to run before the matching code is deployed.
-- =========================================================

begin;

-- 1. A series = "this client, this day, this slot, every N weeks, cooked by this chef".
--    The app creates the actual sessions ahead of time from it.
create table if not exists public.session_series (
    id uuid primary key default gen_random_uuid(),
    client_id text not null references public.clients(id) on delete cascade,
    assigned_to uuid references public.staff(user_id) on delete set null,
    time_slot text not null check (time_slot in ('Matin', 'Après-midi')),
    every_weeks integer not null default 1 check (every_weeks in (1, 2, 4)),
    start_date date not null,          -- first session; its weekday is the series' weekday
    end_date date,                     -- null = until stopped
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_series_client on public.session_series(client_id);
alter table public.session_series enable row level security;

-- 2. Each generated session remembers its series and the date it was planned for.
--    A cancelled week is kept as ignored (so it is not created again); a moved one keeps its planned date.
alter table public.cooking_sessions add column if not exists series_id uuid references public.session_series(id) on delete set null;
alter table public.cooking_sessions add column if not exists series_date date;
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'cooking_sessions_series_date_key') then
        alter table public.cooking_sessions add constraint cooking_sessions_series_date_key unique (series_id, series_date);
    end if;
end $$;

commit;

-- =========================================================
-- RLS stays enabled with no policies: only the server reads and writes these tables.
-- =========================================================

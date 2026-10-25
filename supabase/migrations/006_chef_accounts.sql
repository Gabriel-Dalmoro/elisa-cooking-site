-- =========================================================
-- 006 — Chef accounts (Lucas first, more chefs and cities later)
-- Run ONCE in Supabase Dashboard > SQL Editor. Additive only, safe to re-run,
-- safe to run before the matching code is deployed (the current site ignores the new columns).
-- =========================================================

begin;

-- 1. Staff roles: 'owner' (Elisa, sees everything) and 'chef' (sees only what is assigned to them).
--    The old, never-used 'assistant' role becomes 'chef'.
alter table public.staff drop constraint if exists staff_role_check;
update public.staff set role = 'chef' where role = 'assistant';
alter table public.staff add constraint staff_role_check check (role in ('owner', 'chef'));

-- 2. Chef profile: where they work and how to reach them (the email also receives their clients' choices).
alter table public.staff add column if not exists email text;
alter table public.staff add column if not exists phone text;
alter table public.staff add column if not exists city text;
alter table public.staff add column if not exists updated_at timestamptz not null default now();

-- 3. Each client belongs to one chef (null = Elisa). Removing a chef hands their clients back to Elisa.
alter table public.clients add column if not exists chef_id uuid references public.staff(user_id) on delete set null;
create index if not exists idx_clients_chef on public.clients(chef_id);

-- 4. Sessions: assigned_to already exists (null = Elisa). Sessions created in the app for a chef
--    have no Google Calendar event (gcal_event_id is null), so the Google sync never touches them.
create index if not exists idx_sessions_assigned on public.cooking_sessions(assigned_to);

commit;

-- =========================================================
-- Chef logins are created from the admin (« Équipe » page), nothing else to do by hand.
-- RLS stays enabled with no policies: only the server reads and writes these tables.
-- =========================================================

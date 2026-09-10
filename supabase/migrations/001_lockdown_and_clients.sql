-- =========================================================
-- 001 — Lock down the database + make client records complete
-- Run ONCE in Supabase Dashboard > SQL Editor, BEFORE deploying the matching code.
-- (Optional) Take a CSV export of the `clients` table first (Table Editor > clients > Export).
-- =========================================================

begin;

-- 1. Client fields that the admin form already collects but were never stored.
alter table public.clients add column if not exists person_count integer not null default 2;
alter table public.clients add column if not exists access_code text;
-- `notes` = kitchen/equipment notes (a future assistant chef will see these);
-- `private_notes` = Elisa only (billing, family situation, anything not needed to cook).
alter table public.clients add column if not exists private_notes text;

-- 2. Remove the 3 demo clients seeded by the old schema.sql (fake Paris data).
delete from public.clients
where id in ('client_marie_dupont', 'client_thomas_laurent', 'client_sophie_martin');

-- 3. Replace every client link token with a 128-bit random one.
--    Old tokens were "name-xxxx" and guessable. No link has been used yet
--    (client_selections is empty), so nothing real breaks.
update public.clients set token = replace(gen_random_uuid()::text, '-', '');
alter table public.clients alter column token set default replace(gen_random_uuid()::text, '-', '');

-- 4. Remove the "allow everything" policies. RLS stays enabled with no policies,
--    so the public anon key can no longer read or write anything.
--    The server uses the service-role key, which bypasses RLS, so the app keeps working.
drop policy if exists "Enable all operations for clients table" on public.clients;
drop policy if exists "Enable all operations for client_selections table" on public.client_selections;
drop policy if exists "Enable all operations for recipe_vault table" on public.recipe_vault;

-- 5. Staff accounts: who may use the admin, and with which role.
--    Revoking someone = set active = false (or delete their row).
create table if not exists public.staff (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('owner', 'assistant')),
    display_name text,
    active boolean not null default true,
    created_at timestamptz not null default now()
);
alter table public.staff enable row level security;

commit;

-- =========================================================
-- AFTER running the above:
-- 1. Authentication > Sign In / Providers: turn OFF "Allow new users to sign up".
-- 2. Authentication > Users > "Add user" > create Elisa's account
--    (email + password, tick "Auto Confirm User").
-- 3. Give her the owner role (replace the email):
--
--    insert into public.staff (user_id, role, display_name)
--    select id, 'owner', 'Elisa' from auth.users where email = 'elisa@example.com';
--
-- 4. AFTER the new code is deployed: clients created by the OLD code in the meantime
--    still have guessable tokens. Replace them:
--
--    update public.clients set token = replace(gen_random_uuid()::text, '-', '')
--    where token !~ '^[a-f0-9]{32}$';
-- =========================================================

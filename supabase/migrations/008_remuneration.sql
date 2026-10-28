-- =========================================================
-- 008 — Rémunération: what each session pays Elisa and her chefs
-- Run ONCE in Supabase Dashboard > SQL Editor. Additive only, safe to re-run,
-- safe to run before the matching code is deployed (the current site ignores the new columns).
-- =========================================================

begin;

-- 1. How a client pays. Most clients are on a subscription, so that is the default.
--    'prix_libre' = a price agreed by hand (custom_price, per session, before the tax credit).
alter table public.clients add column if not exists billing_plan text not null default 'abonnement';
alter table public.clients add column if not exists custom_price numeric(8, 2);
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'clients_billing_plan_check') then
        alter table public.clients add constraint clients_billing_plan_check
            check (billing_plan in ('abonnement', 'ponctuel', 'carte_cadeau', 'prix_libre'));
    end if;
end $$;

-- 2. One session at a different price (flash sale, special deal…). Null = the client's usual price.
--    The Google Calendar sync never writes this column, so it survives every re-sync.
alter table public.cooking_sessions add column if not exists price_override numeric(8, 2);

-- 3. Per chef: the day their own SAP number + Avance Immédiate are live (null = not yet),
--    and their own URSSAF rate (used only to estimate what they keep after their charges).
alter table public.staff add column if not exists sap_active_since date;
alter table public.staff add column if not exists urssaf_rate numeric(5, 4) not null default 0.212;

commit;

-- =========================================================
-- RLS stays enabled with no policies: only the server reads and writes these tables.

-- =========================================================
-- 010 — Facturation: billing tracked per session, invoices grouped in the app,
-- and the fields a future Abby connection will need (never used while the provider is "manual").
-- Run ONCE in Supabase Dashboard > SQL Editor. Additive only, safe to re-run,
-- safe to run before the matching code is deployed (nothing else reads these tables).
--
-- Prices and invoices live ONLY in these tables (never on clients / cooking_sessions, which chefs
-- work with), and Row Level Security lets only an active owner read or write them.
-- =========================================================

begin;

-- 0. Who is an active owner (Elisa). Used by every policy below.
--    security definer: reads staff even though staff itself has RLS with no policies.
create or replace function public.is_active_owner() returns boolean
    language sql stable security definer set search_path = public
as $$
    select exists (
        select 1 from public.staff
        where user_id = auth.uid() and role = 'owner' and active
    );
$$;
revoke all on function public.is_active_owner() from public;
grant execute on function public.is_active_owner() to authenticated;

-- 1. How each client is billed. One row per client (created the first time Elisa sets it;
--    no row = defaults: monthly, subscription price).
create table if not exists public.client_billing (
    client_id text primary key references public.clients(id) on delete cascade,
    -- when an invoice is due: after each session, every week, every 2 weeks, every month
    rhythm text not null default 'monthly'
        check (rhythm in ('per_session', 'weekly', 'biweekly', 'monthly')),
    -- how the price is worked out: subscription (catalogue −15 %), one-off (catalogue),
    -- gift card (already paid: nothing to invoice), agreed price (custom_price_cents per session)
    plan text not null default 'abonnement'
        check (plan in ('abonnement', 'ponctuel', 'carte_cadeau', 'prix_libre')),
    custom_price_cents integer check (custom_price_cents is null or custom_price_cents >= 0),
    -- Abby (future): the contact this client is in Abby, and when it was last synced
    abby_contact_id text,
    abby_synced_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Invoices grouped in the app. Status:
--    draft     = grouped here, not yet created in Abby (« À créer dans Abby »)
--    invoiced  = created in Abby / sent (« Facturé »)
--    paid      = paid (« Payé »)
--    cancelled = cancelled; its sessions go back to « À facturer »
create table if not exists public.invoices (
    id uuid primary key default gen_random_uuid(),
    client_id text references public.clients(id) on delete set null,
    client_name text not null,                 -- kept even if the client is deleted
    status text not null default 'draft'
        check (status in ('draft', 'invoiced', 'paid', 'cancelled')),
    total_cents integer not null check (total_cents >= 0),
    -- the lines as grouped (date, label, amount): kept as they were, even after a cancel
    lines jsonb not null default '[]'::jsonb,
    period_start date,
    period_end date,
    notes text,
    external_number text,                      -- the invoice number in Abby (typed by Elisa, or from Abby)
    invoiced_at timestamptz,
    paid_at timestamptz,
    cancelled_at timestamptz,
    -- Abby (future)
    provider text not null default 'manual' check (provider in ('manual', 'abby')),
    abby_invoice_id text,
    abby_state text,                           -- Abby's own state: draft, finalized, paid…
    abby_payment_request_status text,          -- URSSAF avance immédiate status, as Abby reports it
    sync_status text not null default 'not_synced'
        check (sync_status in ('not_synced', 'pending', 'synced', 'error')),
    sync_error text,
    synced_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_invoices_client on public.invoices(client_id);
create index if not exists idx_invoices_status on public.invoices(status);
create unique index if not exists invoices_abby_invoice_id_key on public.invoices(abby_invoice_id) where abby_invoice_id is not null;

-- 3. Billing of each session: a snapshot taken when the session goes into an invoice (or is
--    marked « ne pas facturer »), so the history stays right even if the session is later moved
--    or deleted from the planning. A completed session with no row here is « À facturer ».
--    status: to_invoice (in a draft invoice), invoiced, paid, skipped (not to be invoiced)
create table if not exists public.session_billing (
    id uuid primary key default gen_random_uuid(),
    session_id text unique references public.cooking_sessions(id) on delete set null,
    client_id text references public.clients(id) on delete set null,
    session_date date not null,
    time_slot text,
    dish_count integer,
    person_count integer,
    label text not null,                       -- the invoice line, as shown to Elisa
    price_cents integer not null check (price_cents >= 0),
    status text not null default 'to_invoice'
        check (status in ('to_invoice', 'invoiced', 'paid', 'skipped')),
    invoice_id uuid references public.invoices(id) on delete set null,
    status_changed_at timestamptz not null default now(),
    invoiced_at timestamptz,
    paid_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_session_billing_invoice on public.session_billing(invoice_id);
create index if not exists idx_session_billing_client on public.session_billing(client_id, session_date);

-- 4. Settings: from which date sessions are tracked (earlier ones were invoiced by hand before
--    this page existed and never show as « À facturer »).
create table if not exists public.billing_settings (
    key text primary key,
    value text not null,
    updated_at timestamptz not null default now()
);
insert into public.billing_settings (key, value) values ('tracking_start', '2026-11-01')
    on conflict (key) do nothing;

-- 5. Row Level Security: only an active owner. Chefs (authenticated, role chef) and anonymous
--    visitors get nothing, whatever the app does. The server uses the service role (bypasses RLS)
--    and checks the owner role on every route itself.
do $$
declare t text;
begin
    foreach t in array array['client_billing', 'invoices', 'session_billing', 'billing_settings'] loop
        execute format('alter table public.%I enable row level security', t);
        execute format('revoke all on table public.%I from anon', t);
        execute format('drop policy if exists owner_only on public.%I', t);
        execute format(
            'create policy owner_only on public.%I for all to authenticated using (public.is_active_owner()) with check (public.is_active_owner())',
            t
        );
    end loop;
end $$;

commit;

-- =========================================================
-- Check (optional): as a chef, `select * from invoices` returns 0 rows; as Elisa, all rows.
-- =========================================================

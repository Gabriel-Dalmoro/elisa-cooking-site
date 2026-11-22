# Facturation page — where we are (paused 22 Nov 2026)

Branch `feat/nov19-facturation` · PR #1 · version 1.3.0 (not merged, Vercel preview only).
Abby connection: **written, switched off.** Details of the Abby API: `docs/abby-integration.md`.

## What we're trying to do

Elisa invoices her regular clients by hand in Abby. She has no single place that tells her
**who to invoice, for which sessions, and how much**. The Facturation page (`/admin/facturation`, Elisa only)
does that, and later can create the invoice in Abby for her.

- n8n only handles the **onboarding** of new clients (it creates them in Abby).
  Regular invoices are done by hand in Abby today. This page is for those.
- The assistant chef must never see this page, prices or invoices. That's enforced in Supabase
  RLS (migration 010), not only in the screens.
- No Abby API key in the code. It goes in an environment variable only, when we switch on.

## Done

- **Migration 010** (billing tables, owner-only RLS). Elisa/Gabriel ran it in Supabase. It was rewritten so
  the SQL Editor doesn't flag it (no DROP, RLS written table by table).
- **Page tabs:**
  - **À facturer:** clients with sessions waiting, overdue/due first.
  - **Factures:** history with filters.
  - **Export CSV:** a spreadsheet of any date range.
- **Client window:**
  - billing rhythm (each session / weekly / 2 weeks / monthly) and price type
  - tick sessions, edit the **amount** and the **text** of each line (e.g. "4 recettes" one week)
  - "Regrouper en une facture" and "Ne pas facturer"
- **Each invoice:**
  - a summary to copy into Abby
  - "Facturé" then "Payé", each step can be undone, and the invoice can be cancelled
- **Abby provider (off):**
  - creates a draft only, never finalises (finalising sends to URSSAF and can't be undone)
  - client matching without duplicates: Abby can't search by e-mail, so the app links automatically
    only on a unique e-mail match. Otherwise Elisa picks the client once ("Client dans Abby" box).
  - it never creates an Abby client unless she clicks
  - "Renvoyer vers Abby" reuses a half-made draft
- **Checks:**
  - logic checks
  - a fake-Abby test (0 duplicates, no second draft)
  - the RLS test on a local Postgres (chef sees 0 rows)
  - the production build

## Feedback from the walkthrough (Gabriel + Elisa)

- Good start; grouping sessions and editing prices work well.
- Some redundancy and confusing steps. The main issue: invoices are tracked twice
  (here and in Abby).

## To do next

1. **Simplify the page** (proposed, not started):
   - one to-do list: client, sessions, amount, due date → "Copier pour Abby" (later "Créer dans Abby")
     → "C'est fait"
   - drop "Payé" tracking (Abby/URSSAF already know)
   - move rhythm / price type behind a ⚙️ on each client
   - remove the 4 counter cards, the start-date editor and the "à venir" noise
   - Confirm with Elisa before building.
2. **Merge to main** when Elisa has tested the preview.
   - Main is 1.2.2 (login fix), this branch is 1.3.0: fix the version line in `package.json` /
     `package-lock.json` at the merge.
   - Overlap with `feat/oct28-remuneration`: both add a price plan per client (`clients.billing_plan`
     there, `client_billing.plan` here). Pick one when both are merged.
3. **Switch Abby on** (after the page is simplified and in use). Follow `docs/abby-integration.md` §6:
   - one test invoice on the preview to answer the unknowns: which host (`api.abby.fr` or
     `api.app-abby.com`), the "Forfait" unit code, and whether a browser User-Agent is required
   - then set `INVOICING_PROVIDER=abby` and `ABBY_API_KEY` in Vercel (Preview first)
   - link the clients once (most will auto-link by e-mail)
4. **Later, if Abby documents them:** reading an invoice's status (auto "Payé"), the "mark as paid"
   body, webhooks.

## Related, separate

- 20 Nov: production login fix (v1.2.2, merged). The admin no longer hangs with a 504 when Supabase
  answers a login renewal oddly; it shows "Réessayer" instead.
- Idea, not started: alerts when the site errors (uptime monitor on `/admin/login` plus a Vercel log
  alert on `[middleware]` messages, to email or WhatsApp).

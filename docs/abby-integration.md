# Abby connection: what it can do, and how to switch it on

**Status: OFF.** The app uses the "manual" provider. Elisa groups sessions into an invoice on the
Facturation page, copies the summary, and creates the invoice in Abby herself.
The Abby provider is written (`src/lib/invoicing/providers/abby.ts`) but nothing loads it until
the switch below is set. No Abby API call was made while building it, from the app or from tests.

Every claim below has a source. When the docs don't say, it is marked **UNKNOWN**: test it on
one invoice before relying on it.

Sources used:

| Short name | Link |
| --- | --- |
| Docs index | https://docs.abby.fr/llms.txt |
| Auth | https://docs.abby.fr/api/authentification.md |
| Clients | https://docs.abby.fr/api/clients.md |
| Invoices | https://docs.abby.fr/api/factures.md |
| Credit notes | https://docs.abby.fr/api/avoirs.md |
| Products | https://docs.abby.fr/api/produits.md |
| Errors | https://docs.abby.fr/concepts/erreurs.md |
| Pagination | https://docs.abby.fr/concepts/pagination.md |
| Organisations | https://docs.abby.fr/reference-de-lapi/organisations.md |
| URSSAF declarations (MCP) | https://docs.abby.fr/mcp/declarations-urssaf.md |
| Help: avance immédiate | https://aide.abby.fr/fr/collections/3677710-sap-avance-immediate-et-credit-d-impot |
| Help: activate the service | https://aide.abby.fr/fr/collections/16081295-activer-et-utiliser-le-service |
| Help: link a client and invoice them | https://aide.abby.fr/fr/articles/6657420 |
| Help: connection form | https://aide.abby.fr/fr/articles/10391909 |
| Help: activation email | https://aide.abby.fr/fr/articles/12818112 |
| Help: compatible article | https://aide.abby.fr/fr/articles/12840337 |
| Help: SEPA mandate | https://aide.abby.fr/fr/articles/11563394 |
| Help: registration statuses | https://aide.abby.fr/fr/articles/15276376 |
| n8n | `Elisa_Booking_Workflow` (the booking workflow already running, credential "Elisa Abby API") |

These pages could not be reached (DNS failure): `docs.app-abby.com`, `developers.abby.fr`, `help.abby.fr`.

---

## 1. Direct from the app, or through n8n?

**Recommendation: call Abby directly from the app (server side), not through n8n.**

- **One source of truth.** The invoice, its sessions and its status live in Supabase. If n8n
  created the Abby invoice, the app would have to wait for n8n to write the Abby id back.
- **One copy of the key.** Today the key sits in the n8n credential. Through the app it sits in
  one Vercel environment variable. Through both, it is in two places.
- **Tested in code.** The field mapping (`toAbbyContact`, `toAbbyLines`) is plain TypeScript with
  checks. In n8n it lives in expressions inside nodes, which are hard to test.
- **One less hop.** No webhook between Vercel and n8n that can time out or fail on its own.

n8n stays useful for what it already does (the booking flow). Nothing here changes it.

---

## 2. What the API can do

### Login

- Bearer key in the `Authorization` header. The key is created in Abby under
  Settings → Integrations (`https://my.app-abby.com/settings/integrations`). [Auth]
- **API host: UNKNOWN which one is official.** n8n calls `https://api.app-abby.com` and it works.
  The OpenAPI blocks in the docs list `https://api.abby.fr`. [n8n] [Invoices]
  The app defaults to the one n8n proves works (`ABBY_API_BASE_URL` changes it).
- n8n sends a browser-like `User-Agent`. **UNKNOWN** whether Abby requires it. The app sends
  its own name, and `ABBY_USER_AGENT` can copy the n8n value if calls get refused. [n8n]
- Errors come back as `{ type, code, message, param }`. [Errors]

### Clients (Abby calls them "contacts")

| What | Endpoint | Source |
| --- | --- | --- |
| Search | `GET /contacts?search=…&page=1&limit=100` → `{ docs: [{ id, fullname, emails, organization, archivedAt, test, hasBillings }] }`. `page` and `limit` are required, `limit` ≤ 100. Archived contacts are left out unless `archived=true`. | [Clients] [Pagination] [n8n] |
| Create | `POST /contact` (`firstname` and `lastname` required) | [Clients] [n8n] |
| Read one | `GET /contact/{id}` → the contact with `archivedAt`; 404 "Contact not found" | [Clients] |
| Update | `PUT /contact/{id}`: **replaces the whole contact** (fields left out are emptied) | [Clients] |

**Limits that matter for finding the right client** [Clients] [Errors]:
- `search` only looks at **first name, last name and organisation name**. It does **not** search e-mails.
- There is **no e-mail filter** and **no field of ours** (external id, reference) we could store on a
  contact and search by later. `notes` can be written but can't be searched.
- Abby does **not** say it refuses a second contact with the same e-mail (NOT DOCUMENTED), so
  creating blindly can make duplicates.
- No idempotency key (NOT DOCUMENTED) and no published rate limit; 429 means "too many requests".

### Finding the right client, without duplicates

What the app does (`src/lib/invoicing/abbyMatch.ts`, `resolveContact` in `abby.ts`):

1. **Already linked?** Each client's Abby id is saved once (`client_billing.abby_contact_id`) and
   always reused. Before each invoice the app checks it still exists and isn't archived
   (`GET /contact/{id}`). If it's gone, it stops and asks Elisa to link again.
2. **Not linked yet:** it searches Abby by name (full name, then last name, then first name), drops
   archived and test contacts, and compares e-mails itself (the list gives each contact's `emails`).
   - **Exactly one** contact with the client's e-mail → linked automatically.
   - Anything else (none, several, same name only) → **nothing is sent**. The invoice shows
     "Client pas encore relié à Abby", and Elisa picks the contact once in the client's
     "Client dans Abby" box (same e-mail / same name / already invoiced are shown to help).
3. **Creating a contact** happens only when Elisa clicks "Pas dans la liste : créer dans Abby"
   (with a confirmation), and is refused if the client is already linked.
4. **Retry is safe.** If Abby fails halfway, the draft's id is kept; "Renvoyer vers Abby" fills
   that same draft instead of making a second one.

Because the n8n onboarding already creates new clients in Abby, most clients will be found and
linked by e-mail. The others take one click each, once.

### Invoices

| What | Endpoint | Source |
| --- | --- | --- |
| Create a draft for a client | `POST /v2/billing/invoice/{customerId}` (no body) | [Invoices] [n8n] |
| Set the lines | `PATCH /v2/billing/{billingId}/lines` | [Invoices] [n8n] |
| Turn on online payment | `PATCH /v2/billing/invoice/{id}/general-informations` with `isOnlinePaymentActivated` | [n8n] |
| Set the date | `PATCH /v2/billing/invoice/{id}/timeline` (`emittedAt` in seconds) | [n8n] |
| Finalise | `PATCH /v2/billing/{id}/finalize` | [Invoices] [n8n] |
| Download the PDF | `GET /v2/billing/{id}/download` | [Docs index] (summary only) |
| Mark as paid | `POST /v2/accounting-billing/invoice/{id}/reconciliate`. **Body UNKNOWN.** | [Invoices] |
| Mark as unpaid | `POST /v2/accounting-billing/invoice/{id}/mark-as-unpaid` | [Invoices] |
| Cancel a finalised invoice | Only by a credit note (avoir) | [Credit notes] |

A line holds `designation`, `quantity`, `quantityUnit`, `unitPrice` **in cents**, `vatCode`
(n8n uses `FR_00HT`: no VAT), `type` (n8n uses `service_delivery`) and, optionally,
`personalServiceActivity`. [n8n] [Invoices]

Invoice states: `draft`, `finalized`, `signed`, `refused`, `paid`, plus `canceledAt` and
`paidAt` dates (**unit UNKNOWN**: seconds or milliseconds). [Invoices]

### What the API does NOT do (or the docs don't show)

- **Avance immédiate: no API.** Nothing in the public API enrolls a client with URSSAF or turns
  on "Activer l'avance de crédit d'impôt" on an invoice. It is done in the Abby app (section 3).
  [Docs index] [Invoices] [Help: link a client and invoice them]
  The invoice does carry read-only URSSAF data in `paymentRequest` (`idDemandePaiement`,
  `statut` with codes such as `ERR_PARTICULIER_INCONNU`, `mntVirement`…). [Invoices]
- **Read one invoice / list invoices: UNKNOWN.** No such endpoint found in the pages read.
  So the app can't yet check by itself whether Abby says "paid".
- **Send the invoice by email from the API: UNKNOWN.** n8n builds a client-portal link
  (`https://app.abby.fr/clientPortal?id={customer.legacyId}&billing={id}&token={customer.token}`)
  and sends it itself. [n8n]
- **Webhooks (Abby tells the app "paid"): UNKNOWN.** None found in the docs.
- **The `quantityUnit` value for a "Forfait" line: UNKNOWN.** Avance immédiate needs the unit to
  be "Heure" or "Forfait". [Help: compatible article] The API code for "Forfait" isn't in the
  pages read. The app sends `unit` by default; `ABBY_QUANTITY_UNIT` changes it.

---

## 3. What stays manual (in Abby), even once switched on

The app only creates a **draft**. Elisa finishes it in Abby, on purpose:

1. **Enrolling a client for avance immédiate** (once per client). [Help: activate the service]
   - Tick the box on the client in Abby and fill in the URSSAF fields. [Help: connection form]
   - URSSAF takes 48 to 72 hours to sync. [Help: registration statuses]
   - The client gets an activation email and has 7 days to validate it. [Help: activation email]
   - The SEPA mandate then lasts 36 months. [Help: SEPA mandate]
2. **On each invoice for such a client:**
   - tick "Activer l'avance de crédit d'impôt" [Help: link a client and invoice them]
   - use a compatible article (unit "Heure" or "Forfait", "compatible" box ticked) [Help: compatible article]
3. **Finalising.** For an avance immédiate client, "Finaliser" sends the payment request to
   URSSAF straight away, and the invoice **can't be changed afterwards**.
   [Help: link a client and invoice them]
   That's why the app never finalises: a wrong amount would go to URSSAF with no way back.
4. **Payment.** Avance immédiate: URSSAF pays and the status shows in Abby. Other clients: Elisa
   sees the payment in Abby. Either way she clicks "Payé" on the Facturation page (the
   "mark as paid" endpoint body is UNKNOWN, see section 2).
5. **Cancelling a finalised invoice:** a credit note, in Abby. [Credit notes]

---

## 4. Data mapping (our data → Abby)

| Ours | Abby | Note |
| --- | --- | --- |
| `clients.name` | contact `firstname` + `lastname` | First word → first name, the rest → last name. One word → used for both (both are required). |
| `clients.email` | contact `emails[0]` | Also compared with each found contact's `emails` to link automatically (Abby can't search by e-mail). |
| `clients.phone` | contact `phone` | |
| `clients.address` | contact `billingAddress` `{ address, zipCode, city, country: 'FR' }` | Only when a 5-digit postcode is found. No "Annecy" fallback, unlike n8n. |
| `client_billing.abby_contact_id` | contact `id` | Saved once (auto e-mail match or Elisa's pick), then always reused. |
| one session of the invoice | one line | `quantity: 1`, `unitPrice` = amount in cents, `vatCode: 'FR_00HT'`, `type: 'service_delivery'` |
| `session_billing.label` + date | line `designation` | "Batch cooking à domicile — 5 recettes pour 2 personnes — séance du 03/11/2026". Elisa can change the text per session before grouping (e.g. 4 recettes that week). |
| `invoices.abby_invoice_id` | invoice `id` | |
| `invoices.external_number` | invoice `number` | Filled by hand today ("N° de facture Abby"). |
| `invoices.abby_state` | invoice `state` | |
| `invoices.abby_payment_request_status` | `paymentRequest.statut` | Field ready; nothing fills it until a "read one invoice" endpoint is confirmed. |
| `invoices.sync_status` / `sync_error` | (ours) | `not_synced`, `pending`, `synced`, `error` + the Abby message. |

---

## 5. How it is built (so it can't switch on by accident)

- `INVOICING_PROVIDER` decides. Unset or anything other than `abby` → manual. In manual, the Abby
  file is **never imported** (`src/lib/invoicing/providers/index.ts`).
- Every Abby call checks again that `INVOICING_PROVIDER=abby` **and** that `ABBY_API_KEY` is set,
  or it refuses (`abbyConfig()` in `abby.ts`).
- The key is read from the environment only. It is not in the code, the database or the browser.
- Push failures don't block anything: the invoice is saved in the app with `sync_status = error`
  and the Abby message shows on the invoice card.
- The billing tables are owner-only in Supabase Row Level Security
  (`supabase/migrations/010_invoicing.sql`). The assistant chef can't read them, even with their own login.

---

## 6. Switching it on, step by step

1. **Check the unknowns on one test invoice** (in a Vercel preview, with a test client in Abby):
   - which host answers: `api.app-abby.com` (n8n) or `api.abby.fr` (docs)
   - the `quantityUnit` value Abby uses for "Forfait"
   - whether calls fail without a browser `User-Agent`
2. **Create a key** in Abby: Settings → Integrations (`https://my.app-abby.com/settings/integrations`).
   A separate key from the n8n one, so either can be revoked alone.
3. **In Vercel → Project → Settings → Environment Variables**, set (Preview first, Production later):
   - `INVOICING_PROVIDER` = `abby`
   - `ABBY_API_KEY` = the key (mark it "Sensitive")
   - optional: `ABBY_API_BASE_URL` (default `https://api.app-abby.com`)
   - optional: `ABBY_QUANTITY_UNIT` (default `unit`)
   - optional: `ABBY_USER_AGENT` (copy the n8n one if calls get refused)
4. **Redeploy** (environment variables apply on the next deploy).
5. **Test with one client:** on Facturation, group one session into an invoice. Check:
   - the line at the top of the page reads "Abby (connexion API)" instead of "Abby non connecté"
   - the invoice card shows no Abby error
   - the client's "Client dans Abby" box shows the right contact (pick it if asked)
   - in Abby: no new duplicate contact, and the draft has the right lines, amounts and online payment
6. **Finish that draft in Abby by hand** (section 3), then click "Facturé" / "Payé" in the app.
7. Only then repeat steps 3–4 for Production.

**To switch off:** remove `INVOICING_PROVIDER` (or set it to `manual`) and redeploy. Nothing else
changes; invoices already pushed keep their Abby id.

---

## 7. Later, once the unknowns are answered

- **Read one invoice** (endpoint to confirm) → `refreshInvoice` fills `abby_state`, the number
  and `paymentRequest.statut`, so "Payé" can tick itself.
- **Mark as paid** body confirmed → `recordPayment` mirrors the app's "Payé" into Abby.
- **Webhooks**, if Abby has them → no polling at all.

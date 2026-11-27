# Booking in the app (no more Google Calendar, no more n8n): design

Status: **design, agreed 27 Nov 2026**. Nothing built yet.
Alpha for Elisa Batch Cooking, built from the start to become a SaaS for other chef businesses.

---

## 1. Today (what we replace)

**A. Lead capture**: n8n webhook `lead-submit`, called by the price simulator
(`src/components/simulator/SimulatorForm.tsx`).
- **The website sends:** name, e-mail, phone, address, distance, dishes, people, subscription and
  frequency, price, the URSSAF share, the grocery estimate, gift card details, consents and the week's menu.
- **n8n then (per Gabriel):**
  1. logs the lead in a Google Sheet
  2. e-mails a link to book a « Rencontre Chef à Domicile » on Elisa's Google Calendar
  3. follows up
- ⚠️ This workflow's JSON hasn't been reviewed yet; we have it for workflow B only.

**B. Booking → invoice → follow-up**: n8n « Elisa Booking Workflow » (reviewed).
1. **Booking detected.** It checks Elisa's Google Calendar every minute for a new
   « Rencontre Chef à Domicile » event, and colours it yellow « ⚠️ En Attente ⚠️ ».
2. **Finds the lead.** It reads name and e-mail from the event description and looks them up in the
   Sheet. If not found, it sends a Telegram alert to Gabriel.
3. **Abby.** It finds or creates the contact, then creates the invoice, adds the lines, turns on
   online payment, finalises it and downloads the PDF.
4. **Sends the invoice.** A Gmail with the invoice goes to the client, and the Sheet status becomes
   « Payment Email Sent ».
5. **Follow-up.** After 24 h, if the Sheet status isn't « Paid and Confirmed », it sends a follow-up
   e-mail and the status becomes « Payment followup sent ».

**C. Gift cards**: a separate n8n webhook. Out of scope here.

**Why it has to change:**
- **Only Elisa's calendar is bookable.** It's full, while Lucas and the next chef have free time.
- **Automatic finalised invoices break the avance immédiate.** The client has to be registered with
  URSSAF, and Elisa has to tick the option before finalising.
- **Three places for the same clients.** Leads in the Sheet, clients in Supabase, invoices in Abby.
- **Fragile matching.** It reads the event description and matches by e-mail/name, hence the
  Telegram alerts.

---

## 2. Decisions (Gabriel, 27 Nov)

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Capacity | **One client per chef per slot.** Two slots a day: **Matin** and **Après-midi**. |
| 2 | Assignment | **Nobody is assigned automatically.** The client sees a slot when at least one chef is free in it, and never sees which chef. Elisa gets an e-mail for each new lead or booking and assigns the chef herself. |
| 3 | Distance | **Not a filter.** The distance is just shown in Elisa's notification (and on the lead). No km limit per chef for now. |
| 4 | Invoicing | **Abby, everywhere** (simplest for Elisa's taxes). |
| 5 | Confirmation | **A slot is confirmed only once paid.** An unpaid booking holds the slot **24 h max**, then frees it. |
| 6 | Recurring | **A client can book a recurring slot straight away** (weekly / every 2 weeks / monthly, as in the simulator). |
| 7 | Scope | **Everything moves in-house, end to end**, inside the admin, packaged later as the SaaS. E-mails and messaging get their own page later (like a competitor does), which is a separate conversation. |
| 8 | Leads | **Leads live in the admin**, with their statuses: one place for a chef's leads, bookings and clients. **The Google Sheet keeps working** in parallel until we're sure. |
| 9 | Alerts | **New lead → an e-mail to Elisa** (replaces the Telegram alert to Gabriel). |
| 10 | Switch-over | **n8n keeps running.** The new system is tested in parallel, and each n8n workflow is switched off only once we're confident. |

### Two clashes to settle

**A. "Confirmed once paid" vs avance immédiate.**
- **Why it clashes:** an avance-immédiate client doesn't pay upfront. Registration takes 48–72 h,
  the client has 7 days to validate, and URSSAF pays when the invoice is finalised.
- **Proposal:**
  - *Without* avance immédiate: pay online (Abby link) to confirm, slot held 24 h.
  - *With* avance immédiate: the slot is held 24 h, and **Elisa confirms it** in the admin once the
    client has started the registration. No payment needed to confirm.

**B. Knowing an invoice is paid.**
- **Why it's a problem:** Abby's public docs show no way to read an invoice's status, and no webhook
  (see `docs/abby-integration.md`). n8n reads « Paid and Confirmed » from the Sheet, which is set by hand.
- **Proposal:**
  - Elisa clicks « Payé » in the admin (the Facturation page already does this).
  - We test once, with a real key, whether Abby has an endpoint to read one invoice. If it does, the
    status updates by itself.

---

## 3. What we build

### 3.1 Data (Supabase; every table has `business_id` from day one, for the SaaS)

- **`businesses`**: one row for now (Elisa Batch Cooking). It holds the name, logo, sender e-mail,
  booking slug, base address and settings.
- **`leads`**:
  - every simulator submission, with its answers
  - status: `new` → `slot_held` → `confirmed` (→ client), or `expired`, `lost`
  - avance immédiate yes/no, distance, source, timestamps
  - link to the client once converted
- **`booking_holds`**: a slot held for a lead (date, slot, `expires_at` = +24 h, recurring rule).
  Released by a scheduled job if not confirmed.
- **Chef availability**:
  - **`chef_availability`**: each chef's weekly working days and slots.
  - **`chef_time_off`**: dates and slots blocked. This replaces Elisa's « Bloc » events in Google.
- **Existing tables:** `cooking_sessions`, `session_series` and the invoicing tables are reused. A
  confirmed booking becomes a session (or a series), unassigned until Elisa assigns it.

### 3.2 Availability rule

A slot (date + Matin/Après-midi) is **open** when **at least one chef**:
- works that day and slot,
- has no time off then,
- has no session and no live hold then.

For recurring bookings, the slot must be open on the next N occurrences (proposal: the next 4).

### 3.3 The client's journey (public)

1. **Price simulator**, as today. It saves a `lead` in Supabase **and** still calls n8n (parallel run).
2. **Booking page** `/reserver/[slug]`:
   - shows the next weeks' open slots, Matin/Après-midi, without chef names
   - the client picks one, chooses "une fois" or "récurrent", and answers **« Avance immédiate
     (crédit d'impôt) ? »**
3. **The slot is held 24 h.**
   - **No avance immédiate:** an Abby invoice with an online payment link is sent by e-mail. The
     client pays, and Elisa (or an automatic check) marks it paid → confirmed.
   - **Avance immédiate:** an e-mail explains the URSSAF registration. Elisa registers them in Abby
     and confirms in the admin.
4. **After 24 h unconfirmed:** the hold is released, and one follow-up e-mail with a fresh booking
   link goes out (today's « On bloque votre créneau cuisine ? »).
5. **On confirmation:** a confirmation e-mail, and the session(s) appear in the planning, to assign.

### 3.4 Elisa's side (admin)

- **New page « Leads »**: a pipeline of Nouveau → Créneau réservé (with a countdown) → Confirmé →
  Client, plus Expiré / Perdu.
  - Each card shows the answers, the distance, the avance immédiate answer and the price.
  - Actions: confirm, mark paid, release the slot, call or e-mail, turn into a client.
- **E-mail to Elisa** for every new lead and every new booking: name, slot, distance, formula,
  avance immédiate yes/no, and a link to the lead.
- **Planning:** confirmed bookings arrive **unassigned** (a "à attribuer" badge), and Elisa picks the
  chef. Chefs' time off is set in the planning or the Équipe page.
- **Facturation:** the first invoice comes from the booking; recurring sessions are then invoiced
  with the existing Facturation rhythm.

### 3.5 E-mails

The app sends its own e-mails through a transactional e-mail service with Elisa's address, replacing
Gmail-through-n8n.
- **To clients:** booking held, invoice with payment link, avance immédiate steps, follow-up,
  confirmation.
- **To Elisa:** new lead, new booking.

The e-mail texts and design are copied from today's n8n e-mails. A full « Messages » page (like the
competitor) comes later.

### 3.6 Abby

Reuse the research and code from `docs/abby-integration.md` (in the history of `feat/nov19-facturation`):
- **Finding the client:** linked automatically only on a unique e-mail match, never a silent duplicate.
- **Without avance immédiate:** draft → lines → online payment → **finalise** (allowed here: no
  URSSAF involved) → e-mail with the payment link.
- **With avance immédiate:** no automatic invoice. Elisa does it in Abby.
- **The API key goes in an environment variable only.**

---

## 4. Running in parallel, then switching off n8n

| Step | What changes | n8n |
| --- | --- | --- |
| 1 | The simulator also saves leads in Supabase; the **Leads** page and the e-mail to Elisa go live. | A and B unchanged (Sheet still filled). |
| 2 | Chef availability and time off in the admin. Elisa stops using « Bloc » in Google. | Unchanged. |
| 3 | The booking page goes live **on a private link**: tests with Gabriel, Elisa and a few real clients. | Unchanged. |
| 4 | n8n workflow A's e-mail sends **our booking link** instead of the Google Calendar one. | B stops being triggered (no new Google events), but stays on as a backup. |
| 5 | Our e-mails replace A's e-mails; the simulator stops calling n8n. | A and B switched **off** once confident. The Sheet stays read-only, or synced, as long as wanted. |

---

## 5. SaaS from the start (without slowing the alpha)

- **`business_id` everywhere:** every new table, and the existing ones get it in the same migration.
- **No hard-coded business details:** Elisa's e-mail, logo, prices and texts move into
  `businesses` and its settings.
- **Booking page per business:** `/reserver/[slug]`, later a subdomain.
- **Later:** sign-up and onboarding (dishes per menu, rhythm, weekends, slots), per-business
  invoicing (Abby, or another tool), and the « Messages » page.

---

## 6. Still needed

- **Workflow A's JSON** (lead capture), to copy its e-mails and follow-ups exactly.
- **Gabriel's answer on clashes A and B** (section 2).
- **An Abby test key** (later, step 3) to check the payment link and the "read one invoice" endpoint.
- **The e-mail service and sender address** for the app (e.g. a Resend account on Elisa's domain).

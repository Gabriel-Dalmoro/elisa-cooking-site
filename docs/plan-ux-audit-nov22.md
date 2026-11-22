# UX/UI audit with Elisa (22 Nov 2026): plan

Source: the recorded walkthrough of the admin with Elisa (Gabriel's transcript).
Goal: make the admin simpler and obvious for Elisa today, and shape it so it can become a
standalone app for other chefs (SaaS) later.

The main theme: **too much explanation on every page.** Elisa knows the app and ignores the
subtitles. A new chef will need help at first, so help becomes something you can switch off,
not text on every screen.

Phases are ordered by value for Elisa now versus effort and risk. Each phase is its own branch and
Vercel preview, merged only when you say so.

---

## Phase 1: cleanup and quick wins (no database change)

**1. Remove the explanations (all admin pages)**

- `AdminPageHeader`: the subtitle becomes optional, and it's removed on every page
  (recettes, semaine, clients, courses, aujourd'hui, équipe, cuisine, menu-visuel).
- Recettes: remove these texts:
  - "Composez les 8 plats…"
  - the "Prêt à publier vos 8 plats…" banner
  - "Chaque client reçoit le même lien…"
  - "(visible uniquement dans votre fiche cuisine)"
  - "Ingrédients pour la liste des courses"
  - Keep the useful parts: diet counts and "À adapter" badges.
- Planning: remove the subtitle.
- Later (Phase 5): "Afficher les aides" (show help) per user, on during a new chef's onboarding and
  off for Elisa. The texts aren't deleted from the plan, only from the screens.

**2. One look for Elisa and the chefs**

- Lucas's home page (`ChefDashboard`) becomes the same design as Elisa's (`AdminDashboard`):
  - the same big "Aujourd'hui / En route" button
  - the same tiles, with only fewer tiles for a chef
- One component, with the tiles chosen by role.

**3. Instagram flyer moves to the home page**

- Out of the recettes page (header button and banner).
- On Elisa's home page: a direct "Flyer Instagram" tile.

**4. Recettes page**

- **Full dish names:** dish names wrap onto several lines on the small cards (no more cut-off
  "Mille-feuilles de pommes de…"). The full name also shows at the top of the open dish.
- **"Choisir dans la banque" moves to the top of the dish editor**, as a clear button, instead of a
  small link at the bottom. An empty dish shows it first.

**5. Planning page**

- **Default view:** whoever is logged in sees their own planning first. Elisa sees Elisa's, and Lucas
  sees his (as today). Elisa can still switch to "Tous" (everyone) or to Lucas.
- **List view removed.** Elisa never uses it. The tabs become Calendrier | Aujourd'hui.
- **Clearer session cards:** the whole card opens the session details, and that has to be visible
  (hover, a "Détails ›" hint). The pencil stays for the client sheet.
- **Client details from the planning:** Elisa looks up phone, e-mail and address from the planning
  every day. The session details get a client contact block: tap to call, tap to e-mail, copy the
  address.
- **Week stats in the header hidden** ("9 / 10 choix", number of sessions). Elisa doesn't look at
  them. The "Récapitulatif des choix" at the bottom stays: she uses it every week for her
  Instagram story.
- **Google Calendar, faster week changes:** today every week change waits for Google. It syncs
  only when the week was last synced more than 10 minutes ago, plus the manual button. (Phase 3
  removes Google Calendar entirely.)

---

## Phase 2: new things to store (one migration, 011)

**6. "Congelable" and "Se conserve X jours" on each dish (asked as urgent)**

- **Where Elisa sets it:** in the menu, next to the dish name, before writing the recipe:
  - a "Congelable" checkbox (freezable)
  - "≈ X jours au frigo" (an estimate, confirmed later)
- **Where it's stored:** on the dish in the weekly menu (`weekly_menus.dishes`), and copied to the
  banque (`recipe_vault`: `freezable`, `fridge_days`), so it comes back next time.
- **Where clients see it:** on the client link (`/choisir/[token]`), under each dish: "❄️ Se congèle"
  or "Ne se congèle pas" and "≈ 3 jours au frigo". That way, someone cooking on Thursday for Monday
  chooses well.
- **Later:** an AI suggestion from the dish name (Phase 4).

**7. "Lien envoyé" (link sent) per client and per week**

- Clicking "Lien" (copy) or "WhatsApp" marks the client "Lien envoyé ✓" for that week, and a click
  takes it back.
- Shown on the session card.
- Stored in a new table `menu_link_sends` (client, week, sent_at, by whom).

**8. Note "pour cette fois" (for this session only)**

- The client's note stays "for always".
- Each session gets its own note for that session only (e.g. "arrive at 2pm, code changed").
- Shown on the card and in the dish sheet.
- Stored on `cooking_sessions.session_note`.

**9. Arrival time on a session**

- Optional, e.g. 14:00, set in the session details. It shows on the card ("Après-midi · 14h") and in
  the dish sheet, so Lucas knows when to arrive.
- Morning and afternoon stay as the slots.
- Stored on `cooking_sessions.starts_at` (already there for Google events, now editable for all).

**10. Adding a dish to one session**

- Example: Elisa made a mistake and offers a bonus dish.
- In the session details: "Ajouter un plat", picked from the week's menu or typed in by hand,
  marked "offert" (free).
- It appears in the dish sheet and the shopping list, and doesn't change the price.
- Stored on `cooking_sessions.extra_dishes` (jsonb).

**11. Banque de recettes: seasons and popularity**

- **Seasons:** Printemps, Été, Automne, Hiver, Toute l'année (more than one allowed), with a
  filter, so "velouté de petits pois" doesn't show in winter.
- **Popularity:** "choisi N fois" (chosen N times, across all weeks) and "cuisiné N fois" (cooked N
  times), sortable. Worked out from past client choices.
- Stored on `recipe_vault.seasons` (text[]).

---

## Phase 3: booking without Google Calendar (big; to design together first)

What came out of the conversation:
- **The app becomes the only work calendar** for Elisa, Lucas and the next chef. Google Calendar
  sync stops (it stays personal).
- **New clients book in the website:** after the price simulator, they see the team's free slots. A
  slot is free if at least one chef is free. The client doesn't choose the chef; the app assigns one.
- **Distance limit for Lucas** (no car): a maximum number of kilometres around his base. Too far →
  that slot isn't offered (or Elisa is alerted).
- **One question to the client:** "Avance immédiate (crédit d'impôt) ?"
  - Yes → Elisa handles the invoice in Abby.
  - No → automatic invoice and payment link.
- **The n8n onboarding workflow** (emails, follow-ups) is moved into the app, step by step, then n8n
  is switched off for it.

Needs its own design session (rules for which chef gets assigned, travel distance, emails) before
any code.

---

## Phase 4: client space and storage guide

- **Reheating and storage guide:** for each dish, "how to reheat" and "how to store" (fridge days,
  freezer).
  - After the session, the client link shows "Votre guide" for the dishes cooked, so there's no
    document to make each week.
  - An AI step can suggest the texts from the recipe, and Elisa confirms.
- **Client space with login:** past choices, favourites and dish ratings, plus the guide.

---

## Phase 5: getting ready for other chefs (SaaS)

- **Onboarding questions** that set up the app:
  - how many dishes per menu (8 today; others do 12)
  - how often the menu changes (week, month, season)
  - weekends shown or not
- **"Afficher les aides"** (show help) switch.
- **One standard font set** (today: Playfair, Geist, Dancing Script, plus several weights mixed on
  one page).
- **Several companies on one app:** each chef business sees only its own data. This is a major
  architecture change, to plan separately.

---

## Round 2 (not covered yet in the walkthrough)

Clients page (Elisa rarely uses it; she goes through the planning), Courses, Aujourd'hui, Équipe,
Facturation (see `docs/facturation-status.md`), Calculateur, Carte cadeau.

## Notes

- Versions: Phase 1 is a minor version (new layout). The Facturation branch is also waiting at
  1.3.0. Whichever merges first takes 1.3.0, and the other moves to 1.4.0.
- Elisa liked and keeps: the 8-dish menu page, the dish type dropdown, the diet versions, the
  "Notes & astuces" for chefs, and the "Récapitulatif des choix".

---
date: 2026-09-28
status: draft
category: feature
---

# Dashboard module purchase — add a module in the editor, pay when you save

## What was asked

> « il faudrait juste pouvoir rajouter des modules facilement et intégrer Stripe
> sur dashboard »

> « ça me dérange qu'on change de page, on peut pas faire ajouter un module et
> renseigner les infos et une fois l'enregistrement il faut payer ? »

Decisions taken with the user on 2026-09-28:

| Question | Answer |
|---|---|
| Price of a module added after the purchase | the checkout's rule (`landing/src/lib/pricing.ts`), nothing new |
| One module per payment, or several | several, one payment, one invoice |
| Where the payment happens | inside the editor, Stripe's own form |
| Can the couple see it before paying | yes, on their own invitation, in the live preview |
| When the couple pays | after filling it in, when they save — never blocking the save |

A clickable mock-up of the flow (real Ciao Amore captures in the preview,
desktop and phone) was reviewed and approved. One correction came out of it:
on a phone, nothing may sit beside the editor's title — the "to pay" reminder
squeezed "Mon faire-part" onto three lines.

## What is wrong today

A purchase flow exists in the dashboard (`/modules` → « 10 € » →
`BuyModuleDialog`), but it cannot work and is priced wrong:

- **The payment form cannot load.** `dashboard/next.config.ts` sends a
  `frame-src` that allows neither `js.stripe.com` nor `hooks.stripe.com`; the
  Payment Element is an iframe from `js.stripe.com`.
- **Wrong price.** 10 € for everyone (`api/create-module-payment-intent/route.ts:8`,
  `purchase-module-actions.ts:60,110`, the JSX, the 9 message files). A
  Sur-mesure or Prestige couple pays for a module their plan includes; a
  Signature couple pays 10 € for what the checkout sells at 5 €. `sites.plan_id`
  is read nowhere in the dashboard.
- **No safety net.** The intent carries no email, so the landing webhook skips
  it (`webhooks/stripe/route.ts:134-138`). A tab closed between the payment and
  `activatePurchasedModule` leaves a couple who paid without the module.
- **No invoice, no `purchases` row.** `issueInvoiceForPayment` requires
  `metadata.plan`. French law requires an invoice per sale.
- **The route reads `profiles.email`, a column that does not exist**, so the
  intent never gets a Stripe customer. Each opening of the dialog creates a new
  PaymentIntent.
- **Lost updates.** `sites.modules` is read, appended to in JS and written
  back; two purchases at once can drop one.
- **Couples can grant themselves modules.** The `sites` update policy has no
  column restriction (`00000000000000_full_db_reset.sql:66`), so any logged-in
  couple can `PATCH /rest/v1/sites` with every module, or another `plan_id`,
  with the public anon key. A paywall is decorative until this is closed.
- **Unrenderable modules are sold.** Neither the studio nor the dashboard
  filters on the theme's `supports`; a guestbook can be bought on a theme that
  will never draw it.
- **The editor sends the couple away.** « Ajouter un module » is a link to
  `/modules`, whose « Aperçu » is a generic mock-up, not their theme. Its
  `canBuyMore` counts `countdown`, which `/modules` never lists, so a couple can
  be sent to an empty page.

## Decisions

### D1 — Add in the editor, fill it in, pay when saving

```
[+ Ajouter un module]  →  menu: modules this theme draws, each with its price
        │                    (« 5 € » or « Inclus »)
        ▼
new tab « Galerie  5 € » opens; the preview scrolls to the section, drawn with
sample content marked « Exemple »; the form says it is visible to guests only
after payment
        │  the couple fills it in — their content replaces the sample
        ▼
[Enregistrer]  →  everything is saved, always
        │
        ├─ nothing to pay (plan includes it)  →  the module goes live, toast
        │
        └─ something to pay  →  dialog « Publiez votre galerie »
                 order summary · CGV checkbox · [Plus tard] [Payer 5,00 €]
                    │                        │
                    │                        └─ Stripe Payment Element (card,
                    │                           PayPal, Klarna) → « en ligne ! »
                    ▼
            module kept, saved, invisible to guests: tab badge « À régler »,
            banner with [Payer] in its form, reminder in the header
```

Rules the mock-up settled:

- **The price is visible before anything is added** — in the menu, then as a
  badge on the tab. The payment dialog never announces a price the couple has
  not already seen.
- **Saving is never held hostage.** The couple who fixed a typo in the venue
  while a gallery is unpaid saves without paying. The dialog opens once, on the
  save that first stores an unpaid module; later saves only toast.
- **Nothing typed is lost.** An unpaid module is stored (D3) and is still there
  at the next visit, with its badge and its pay button.
- **Removing is always possible** while a module is not live: « Retirer ce
  module » in its form, confirmed, deletes it and its content.
- **Reminders by screen size.** Desktop: a chip « 1 module à régler · 5 € » in
  the header row. Phone: a strip under the tabs, hidden on the unpaid module's
  own tab (its banner already says it). The title stays on one line and
  truncates, as it does today.
- **Menu by screen size.** Desktop: a popover under the button. Phone: a bottom
  sheet.

### D2 — One price rule, shared with the checkout

`landing/src/lib/pricing.ts` moves to `shared/lib/pricing.ts`; the landing file
re-exports it so its importers do not change. A new function prices an add-on
against the same allowance the checkout applies:

```ts
/**
 * Prices `addedCount` modules for a wedding that already owns `ownedCount`.
 * The first ones take whatever is left of the plan's allowance, in order.
 */
export function addOnQuote(
  planId: string | null | undefined,
  ownedCount: number,
  addedCount: number,
): { included: number; billable: number; totalEuros: number };
```

- Sur-mesure, Prestige: everything included.
- Signature: included while `ownedCount + n ≤ FREE_MODULES_LIMIT` (4), then
  `EXTRA_MODULE_PRICE` (5 €) each. This is exactly the difference between the
  checkout totals with and without the added modules.
- **Legacy plan ids.** Production (read-only count, 2026-09-28) holds 6 sites:
  3 `premium`, 2 `signature`, 1 `sur-mesure`. `premium` is the old 575 € plan
  sold as « Tout inclus (Blocs illimités) », so it is priced as Prestige;
  `experience`, the old 175 € plan with « 4 blocs d'informations inclus », as
  Signature.
- **Any other `plan_id`** (the column defaults to `'essential'`, which is no
  plan) **is priced as Signature**, not as unlimited — giving every module away
  is the expensive mistake.
- `ownedCount` is the length of `sites.modules`, every id counted, as the
  checkout counted the basket.

The browser uses the function to display prices; the server recomputes at save
and at payment. No price ever travels from the browser.

### D3 — A module's life: draft → unpaid → live

| State | Where it lives | Guests see it |
|---|---|---|
| draft | only in the editor's draft (`draft.modules[id]`) | no |
| unpaid | `sites.pending_modules` + its `site_modules` row | no |
| live | `sites.modules` | yes |

- New column `sites.pending_modules text[] not null default '{}'`, in the order
  the modules were added.
- **Save** (`saveInvitationDraft`): a module unit for an id that is neither
  owned nor unpaid is accepted only if the id is a known module and the
  couple's theme draws it (D9); it is appended to `pending_modules` and its
  config row is written. **This happens even with an empty config** — today an
  unchanged config returns early. Then the unpaid list is priced (D2): the
  modules that fit in the allowance are granted at once (D5, price 0); the rest
  stay unpaid.
- `SaveResult` gains the new module lists and what is due:
  `modules: { owned: string[]; pending: string[] }` and
  `due: { modules: string[]; amountCents: number } | null`. The editor keeps
  `meta` in state and updates it from there, and opens the payment dialog when
  the save moved at least one module from draft to unpaid (D1: once).
- **Remove** (`removePendingModule(id)`): deletes the `site_modules` row and the
  id from `pending_modules`. Uploaded files are left in storage, as the editor
  does for any removed photo today.

### D4 — Payment: one PaymentIntent for everything unpaid

`startModulePayment()` (server action, no arguments):

1. Reads the couple's site and prices the `pending_modules` the theme draws
   (D2, D9), with the same helper the save uses: any that fit the allowance are
   granted free first. Nothing left to bill → returns `{ nothing: true }`.
2. Finds or creates the Stripe customer **by the account's email**
   (`auth.getUser()`), as the checkout does. `profiles.stripe_customer_id` is
   not trusted: couples can write it.
3. Reuses the customer's open intent for the same site, modules and amount
   when there is one — reopening the dialog must not mint another — else
   creates the PaymentIntent: amount = billable × 500 cents, `eur`,
   `automatic_payment_methods: { enabled: true }`, `receipt_email`, a
   description (« Modules supplémentaires : Galerie photo »). (A Stripe
   idempotency key was considered and rejected: it fails when any parameter
   differs, and the metadata legitimately changes — names, locale.)
4. Metadata (shared builder/parser in `shared/lib/module-addon.ts`):
   `kind=module_addon`, `wedding_id`, `site_id`, `user_id`, `modules`
   (comma-joined, billable only), `unit_price_cents`, `amount_cents`, `plan_id`,
   `email`, `first_name`, `last_name`, `partner_name`, `locale`. Deliberately no
   `plan` key: that key is how the webhook recognises a checkout.

The dialog: summary step (lines, total, CGV checkbox — the same substance as
the checkout's acceptance and CGV §4 on immediate access to digital content),
then the Payment Element mounted with the intent's `client_secret`,
`confirmPayment({ redirect: "if_required" })` with a `return_url` back to
`/invitation?section=<first module>`.

`completeModulePayment(paymentIntentId)` (server action) is the fast path:

- retrieves the intent with the secret key and checks: `succeeded`,
  `kind=module_addon`, `site_id` is the couple's site, `currency=eur`,
  `amount_received === amount_cents` (metadata is written by our server and
  cannot be changed from a browser);
- calls `grant_modules` (D5) with the service role — the couple's session must
  never be able to grant, which is the one reason to use the admin client here;
- returns the fresh module lists. `processing` → « paiement en cours de
  confirmation », the webhook finishes.

PayPal and Klarna redirect: on return the editor reads `payment_intent` from
the URL, calls `completeModulePayment`, then removes the parameters. Because
the save happened *before* payment, the redirect loses nothing.

### D5 — Granting: one SQL function, idempotent per payment

```sql
grant_modules(p_site_id uuid, p_modules text[],
              p_payment_intent_id text default null,
              p_unit_price_cents int default 0) returns text[]
```

`security definer`, `search_path = public`, execute revoked from `public`,
`anon`, `authenticated`, granted to `service_role`. In one transaction, under
`select … for update` on the site row:

1. If `p_payment_intent_id` already has `purchases` rows, return their
   `item_id`s — a replay (fast path then webhook, or a Stripe redelivery)
   changes nothing and reports the same result.
2. Keep the ids that exist in `public.modules` and are not in `sites.modules`,
   deduplicated, in the caller's order.
3. Append them to `sites.modules` and remove them from `pending_modules` — in
   SQL, so two grants can no longer overwrite each other.
4. Insert missing `site_modules` rows (`on conflict do nothing`), at the
   module's `public.modules.default_order`, as the editor's insert does.
5. Insert one `purchases` row per module: `item_type 'module'`, `price_paid` in
   **cents** (documented on the column; nothing reads it today), `currency
   'EUR'`, `stripe_payment_intent_id`.
6. Return the ids granted.

`purchases` gains `stripe_payment_intent_id text` and a unique index on
`(stripe_payment_intent_id, item_id)` where the intent is not null.

### D6 — Safety net: the landing webhook

The landing's `/api/webhooks/stripe` stays the only Stripe endpoint. In
`payment_intent.succeeded`, **before** the checkout path — which now finds an
email on the intent and would otherwise run its checkout logic on an add-on:

```ts
if (isModuleAddOn(intent)) { await fulfilModuleAddOn(intent); break; }
```

`fulfilModuleAddOn`:

1. parses and checks the metadata as D4 does;
2. `grant_modules(…)` → the modules this payment actually granted;
3. upserts `billing` on the intent: `user_id` from metadata, amount in cents,
   `plan_name « Modules : Galerie photo, FAQ »` (what the billing screen shows);
4. **refunds the modules it could not grant** — already owned through another
   payment (two tabs paying the same basket): one refund of
   `count × unit_price_cents` with an idempotency key per intent, before the
   invoice, logged `[ADDON_DOUBLE_PAYMENT]`;
5. issues the invoice (D7) for the granted modules, when there are any.

A transient failure (database, Stripe API) throws → 500 → Stripe retries;
`stripe_events` already guards the event itself. A verification mismatch is
permanent: logged `[ADDON_VERIFY_FAILED]`, answered 200, nothing granted — a
retry cannot fix it, and support can. Intents from the old dialog (`type=extra_module`, no `kind`) keep
being logged and ignored.

### D7 — Invoice for an add-on

Same numbering (`next_invoice_number()`), PDF, bucket and `billing.invoice_url`
as a checkout. `issueInvoiceForPayment` accepts the lines and the customer name
from its caller; the checkout path keeps building them from `parseOrderMetadata`
as today. Add-on lines, built from the granted modules:

- « Modules supplémentaires (Galerie photo, FAQ) » — quantity, 5 € unit price.

Free modules granted at save are not a sale and get no invoice (their
`purchases` row at 0 remains). The existing reconciliation compares the lines
with the amount charged **net of the refund** of D6.

### D8 — The preview shows the module before it is paid

`editor:render` (`shared/types/editor-preview.ts`) gains two optional lists,
checked by the guard like the rest:

- `samples: string[]` — modules to draw with sample content **when the
  couple's content for them is empty**, marked « Exemple · ajoutez vos … »;
- `notLive: string[]` — modules drawn but not visible to guests, marked « Pas
  encore visible par vos invités » once they have content.

The editor sends every draft and unpaid module in `rows.site.modules` of the
preview rows (never in the saved rows), and lists them in `samples` and
`notLive`.

In the landing's `EditorPreview`, after `toInvitationData`, each sampled field
that is empty is filled from `theme.demoData`, else from a shared sample set
(`editor-preview/module-samples.ts`). The demos cover most fields but none has
a `gallery`, a `menu` or an `introVideo`, and not every theme has `gifts` or a
`playlist` — those get samples. Samples use images already in
`landing/public/themes/`. Themes are not edited. The marks are an outline on
the section (an attribute on its `[data-editor-section]` element, like the
existing hover outline) and a badge in the preview's own overlay layer,
positioned over the section's top edge — not a pseudo-element, because the
themes already use every section's `::before`/`::after`
(`editor-preview.css` says why).

Module → field: `gallery→gallery`, `menu→menu`, `intro-video→introVideo`,
`gift-list→gifts`, `playlist→playlist`, `faq→faq`, `dress-code→dressCode`,
`accommodation→stays`, `timeline→schedule`, `transport→venue.access`. `map`,
`rsvp` and `countdown` draw from data every wedding has and need none.

### D9 — Only modules the theme draws

`npm run themes:sync -w landing` also writes `shared/data/theme-modules.ts`
(`THEME_MODULES: Record<themeId, readonly ModuleId[]>`) from each
`theme.config.ts`'s `supports`; `themes:check` fails when it is stale. Adding a
theme still edits no existing file. The dashboard uses it:

- the menu and `/modules` offer only modules of the couple's theme, not owned,
  not unpaid (so no guestbook, which no theme draws; `countdown` is offered like
  any other when missing);
- save and payment refuse or ignore anything else.

`EditorMeta` gains `planId` and `pendingModules`; the editor reads the theme's
modules from `shared/data/theme-modules.ts` directly, on both sides.

### D10 — Security

One migration (`supabase/migrations/20260928120000_module_addons.sql`):

- `revoke insert, update, delete on public.sites from anon, authenticated;`
  `grant update (status, pending_modules) on public.sites to authenticated;`
  and the insert policy is dropped — sites are only created by the service role
  at checkout. `setSitePublished` (`status`) is the only couple-side write
  today and keeps working; the save writes `pending_modules` under the couple's
  session, which is harmless: nothing in it is shown or granted without D5.
- `public_module_configs` returns only rows whose `module_id` is in
  `sites.modules`: unpaid content must not be readable by anyone holding the
  wedding id (today it returns every row of a published site).
- `grant_modules` as in D5; `pending_modules`; `purchases` column and index.
- `shared/types/supabase.ts` regenerated. Applying it to production needs the
  user's go-ahead (`db push`).

Outside the database: the dashboard's `frame-src` gains `https://js.stripe.com`
and `https://hooks.stripe.com`.

### D11 — `/modules` becomes a door to the editor

- « Modules non inclus » lists the modules of D9 with their price (D2); its
  button opens `/invitation?add=<id>`, which adds the module to the draft and
  opens its tab.
- Removed: `BuyModuleDialog`, `LockedModulePreviewDialog`, the buy and preview
  buttons of `LockedModuleCard`, `module-preview-defaults.ts`,
  `api/create-module-payment-intent`, `purchase-module-actions.ts`, and the
  uncalled `module-config-actions.ts` functions (confirmed uncalled first). Their
  message keys go from all 9 locales.
- `dashboard/.env.example` stops calling Stripe « lecture seule ».

## Components

| Unit | Does | Depends on |
|---|---|---|
| `shared/lib/pricing.ts` | prices orders and add-ons | — |
| `shared/data/theme-modules.ts` (generated) | modules each theme draws | `sync-themes.mjs` |
| `shared/lib/module-addon.ts` | builds, parses and checks add-on intent metadata; `isModuleAddOn` | Stripe types |
| migration `…_module_addons.sql` | column, grant function, privileges, RPC filter | — |
| dashboard `module-purchase-actions.ts` | `startModulePayment`, `completeModulePayment`, `removePendingModule` | the four above |
| dashboard `invitation-editor-actions.ts` | reads unpaid modules, stores new ones, grants free ones at save | pricing, theme-modules, `grant_modules` |
| dashboard editor UI | `AddModuleMenu`, tab badges, `ModuleStatusBanner`, due chip / strip, `ModulePaymentDialog` | Stripe Elements, the actions |
| landing `EditorPreview` + `module-samples.ts` | samples and marks | protocol |
| landing webhook + `invoice.ts` | `fulfilModuleAddOn`, add-on invoice lines, refund | `module-addon.ts`, `grant_modules` |

## Error handling

| Situation | Behaviour |
|---|---|
| Card declined, 3DS failed | Stripe's message in the dialog; the module stays unpaid; retry or « Plus tard » |
| Tab closed after paying | the webhook grants within seconds; the next visit shows it live |
| Two tabs pay the same basket | the second payment's modules are refunded before its invoice (D6) |
| Metadata or amount do not match | nothing granted, `[ADDON_VERIFY_FAILED]` logged; the webhook returns 200 without retrying — a retry cannot fix a mismatch |
| Theme does not draw the module | refused at save with a message; ignored at payment |
| Part of a save fails | the existing per-unit errors; an unpaid module whose unit failed stays a draft |
| Stripe keys missing | `stripe.ts` already refuses; the pay button reports « Paiement indisponible » |
| Invoice identity (`COMPANY_*`) missing | existing behaviour: no invoice, `[INVOICE_CONFIG]` logged |

## Testing

- **Unit (`npm test`)**:
  - `addOnQuote`: each plan; an allowance partly left; an unknown plan id;
  - add-on metadata round-trip and checks, including a tampered amount;
  - `isModuleAddOn` against a checkout intent and an old-dialog intent;
  - add-on invoice lines, and their reconciliation with a partial refund;
  - `theme-modules.ts` generation from a fixture config;
  - the editor's section list with owned, unpaid and draft modules;
  - the preview rows' `samples` and `notLive`;
  - the protocol guard with the new fields.
- **Database (script against local Supabase)**:
  - `grant_modules` replayed with one intent grants once;
  - two intents for the same module grant it once, and the second returns `{}`;
  - an `authenticated` session cannot update `sites.modules` or `plan_id`, can
    update `status` and `pending_modules`;
  - `public_module_configs` hides unpaid rows;
  - `anon` and `authenticated` cannot execute `grant_modules`.
- **End to end**:
  - Setup: local Supabase and Stripe test mode, with `stripe listen` forwarding
    to the landing webhook.
  - Scenarios:
    - card;
    - 3DS card;
    - PayPal redirect;
    - « Plus tard » then pay on the next visit;
    - included module;
    - Signature with one included module left;
    - tab closed right after paying (webhook only);
    - two tabs paying at once (refund);
    - removal.
  - Screens: fr, de and ar; desktop and 375 px.

The dashboard's `.env.local` points at the production database: purchases are
never tested there (a test payment would burn a real invoice number of a
gapless sequence and grant modules on a real wedding).

## Out of scope

Languages and options after purchase; promo codes; refunds from the dashboard;
changing theme; reminder emails for unpaid modules; several weddings per
account; the broken `charge.dispute.created` handler (a separate bug, noted in
the vault).

## Before implementation

- ~~Read-only query on production for the distinct `sites.plan_id` values~~ —
  done 2026-09-28, folded into D2.
- Rotate the test webhook secret that was printed in this session.

# n8n Workflows Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 7 n8n workflows (heartbeat, error monitor, Stripe events, UI scraping, E2E tests, DB monitor, business report) to automate monitoring, alerting, and reporting for The Studio wedding SaaS.

**Architecture:** Each workflow is created directly in the n8n UI at `http://localhost:5678` via JSON import. Workflows are also exported as JSON files in `n8n/workflows/` for version control. Playwright specs are created in `landing/tests/` for the E2E workflow. One Supabase migration creates the `stripe_events` log table.

**Tech Stack:** n8n 2.12 (native, localhost:5678), Supabase REST API, Stripe API v1, Resend API, Playwright 1.x, Next.js 16 (landing :3002, dashboard :3003)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `n8n/workflows/wf0-heartbeat.json` | Create | n8n workflow JSON export |
| `n8n/workflows/wf1-error-monitor.json` | Create | n8n workflow JSON export |
| `n8n/workflows/wf2-stripe-events.json` | Create | n8n workflow JSON export |
| `n8n/workflows/wf3-ui-scraping.json` | Create | n8n workflow JSON export |
| `n8n/workflows/wf4-e2e-tests.json` | Create | n8n workflow JSON export |
| `n8n/workflows/wf5-db-monitor.json` | Create | n8n workflow JSON export |
| `n8n/workflows/wf6-business-report.json` | Create | n8n workflow JSON export |
| `landing/tests/configurator.spec.ts` | Create | Playwright E2E — tunnel configurateur |
| `landing/tests/rsvp.spec.ts` | Create | Playwright E2E — invitation + RSVP |
| `landing/playwright.config.ts` | Create | Playwright config |
| `supabase/migrations/20260324110000_stripe_events_log.sql` | Create | Table stripe_events pour WF2 |

---

## Prerequisites

Before starting any task, verify:
- n8n is running: `curl http://localhost:5678` → returns HTML
- landing app running on port 3002: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3002`
- `.env.local` at repo root has `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
- `landing/.env.local` has `STRIPE_SECRET_KEY` (note: Stripe key is in landing/, not root)

---

## Task 1: Setup — Credentials n8n + dossier workflows

**Files:**
- Create: `n8n/workflows/.gitkeep`

> Les credentials sont créés dans l'UI n8n (ils contiennent des secrets). Cette tâche crée la structure de dossiers et les 3 credentials réutilisables.

- [ ] **Step 1: Créer le dossier n8n/workflows**

```bash
mkdir -p /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/n8n/workflows
touch /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/n8n/workflows/.gitkeep
```

- [ ] **Step 2: Lire les secrets depuis les deux .env.local**

```bash
grep -E "SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY" /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/.env.local
grep "STRIPE_SECRET_KEY" /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing/.env.local
```

Copier les valeurs — elles seront utilisées dans les steps suivants.

- [ ] **Step 3: Créer le credential `resend-api` dans n8n UI**

Ouvrir `http://localhost:5678` > Settings (engrenage) > Credentials > Add credential
- Type: **HTTP Header Auth**
- Name: `resend-api`
- Name (header): `Authorization`
- Value: `Bearer <RESEND_API_KEY>`
- Sauvegarder

- [ ] **Step 4: Créer le credential `supabase-rest` dans n8n UI**

> Supabase REST requiert 2 headers. n8n HTTP Header Auth n'en supporte qu'un. On crée le credential pour `apikey`, et on ajoutera `Authorization` manuellement dans chaque nœud HTTP Request via "Generic Credential Type".

Add credential:
- Type: **HTTP Header Auth**
- Name: `supabase-rest`
- Name (header): `apikey`
- Value: `<SUPABASE_SERVICE_ROLE_KEY>`
- Sauvegarder

**Dans chaque nœud HTTP Request Supabase** (rappel pour implémentation) : activer "Include Response Headers and Status Code" dans Options + ajouter un header supplémentaire `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` dans "Headers".

- [ ] **Step 5: Créer le credential `stripe-api` dans n8n UI**

Add credential:
- Type: **HTTP Header Auth**
- Name: `stripe-api`
- Name (header): `Authorization`
- Value: `Bearer <STRIPE_SECRET_KEY depuis landing/.env.local>`
- Sauvegarder

- [ ] **Step 6: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add n8n/
git commit -m "chore: add n8n workflows directory structure"
```

---

## Task 2: Migration Supabase — Table stripe_events

**Files:**
- Create: `supabase/migrations/20260324110000_stripe_events_log.sql`

- [ ] **Step 1: Créer la migration SQL**

```sql
-- supabase/migrations/20260324110000_stripe_events_log.sql
create table if not exists public.stripe_events (
  id uuid default gen_random_uuid() primary key,
  stripe_event_id text unique not null,
  event_type text not null,
  payment_intent_id text,
  customer_email text,
  amount_cents integer,
  currency text,
  status text not null,
  raw_payload jsonb,
  created_at timestamptz default now() not null
);

alter table public.stripe_events enable row level security;

create policy "service_role_only" on public.stripe_events
  using (auth.role() = 'service_role');
```

- [ ] **Step 2: Appliquer la migration**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npx supabase db push
```

Expected: `Applying migration 20260324110000_stripe_events_log.sql`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260324110000_stripe_events_log.sql
git commit -m "feat: add stripe_events log table migration"
```

---

## Task 3: WF0 — Heartbeat

**Files:**
- Create: `n8n/workflows/wf0-heartbeat.json`

- [ ] **Step 1: Créer le workflow dans n8n UI**

New Workflow > Rename: `WF0 — Heartbeat`

**Nœud 1 — Schedule Trigger**
- Rule: Every 30 minutes

**Nœud 2 — HTTP Request**
- Method: GET
- URL: `https://api.resend.com/domains`
- Authentication: Predefined Credential Type → `resend-api`
- Continue on Fail: ON
- Options > Include Response Headers and Status Code: ON

- [ ] **Step 2: Activer + exporter**

Toggle "Active" ON. Menu `...` > Download > sauvegarder sous `n8n/workflows/wf0-heartbeat.json`

- [ ] **Step 3: Commit**

```bash
git add n8n/workflows/wf0-heartbeat.json
git commit -m "feat: add WF0 n8n heartbeat workflow"
```

---

## Task 4: WF1 — Error Monitor

**Files:**
- Create: `n8n/workflows/wf1-error-monitor.json`

- [ ] **Step 1: Créer le workflow dans n8n UI**

New Workflow > Rename: `WF1 — Error Monitor`

**Nœud 1 — Schedule Trigger**
- Every 15 minutes

**Pour chacun des 3 nœuds HTTP Request suivants, activer dans Options :**
- "Continue on Fail": ON
- "Include Response Headers and Status Code": ON ← **obligatoire** pour que `$json.statusCode` soit disponible

**Nœud 2 — HTTP Request "Check Supabase"**
- Method: GET
- URL: `https://pftvcpxwbprmphhgwvxc.supabase.co/rest/v1/`
- Authentication: Generic Credential Type → supabase-rest
- Header supplémentaire: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

**Nœud 3 — HTTP Request "Check Landing 3002"**
- Method: GET
- URL: `http://localhost:3002`

**Nœud 4 — HTTP Request "Check Dashboard 3003"**
- Method: GET
- URL: `http://localhost:3003`

**Nœud 5 — Merge**
- Mode: Combine All (Append)
- Inputs: nœuds 2, 3, 4

**Nœud 6 — IF "Any Error"**
- Condition: `{{ $json.statusCode }}` Not Equal `200`

**Nœud 7 — HTTP Request "Send Alert" (branche true)**
- Method: POST
- URL: `https://api.resend.com/emails`
- Authentication: resend-api
- Body (JSON):
```json
{
  "from": "contact@thestudiopapeteriedigitale.fr",
  "to": ["contact@thestudiopapeteriedigitale.fr"],
  "subject": "🔴 Service en erreur — The Studio",
  "html": "<p><strong>Service en erreur détecté</strong></p><p>Status: {{ $json.statusCode }}<br>Timestamp: {{ $now }}</p>"
}
```

- [ ] **Step 2: Test manuel**

"Test workflow" → Vérifier que les 3 HTTP Requests retournent `statusCode: 200` et que l'IF reste en branche false.

- [ ] **Step 3: Activer + exporter**

`n8n/workflows/wf1-error-monitor.json`

- [ ] **Step 4: Commit**

```bash
git add n8n/workflows/wf1-error-monitor.json
git commit -m "feat: add WF1 error monitor workflow"
```

---

## Task 5: WF2 — Stripe Payment Events

**Files:**
- Create: `n8n/workflows/wf2-stripe-events.json`

> Ce workflow nécessite un `STRIPE_WEBHOOK_SECRET` **distinct** de celui de l'app Next.js. Chaque endpoint Stripe génère son propre signing secret.

- [ ] **Step 1: Préparer le webhook Stripe**

1. Ouvrir `https://dashboard.stripe.com/test/webhooks` > Add endpoint
2. URL: `http://localhost:5678/webhook/stripe-events`
   ⚠️ Pour exposer localhost à Stripe en dev: `ngrok http 5678` → utiliser l'URL ngrok
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copier le **Signing secret** (`whsec_...`) généré

- [ ] **Step 2: Ajouter STRIPE_WEBHOOK_SECRET_N8N dans n8n**

n8n > Settings > Environment Variables > Add:
- Key: `STRIPE_WEBHOOK_SECRET_N8N`
- Value: `<signing secret copié à l'étape précédente>`

⚠️ Utiliser `STRIPE_WEBHOOK_SECRET_N8N` (pas `STRIPE_WEBHOOK_SECRET`) pour ne pas confondre avec le secret de la route Next.js `/api/webhooks/stripe`.

- [ ] **Step 3: Créer le workflow dans n8n UI**

New Workflow > Rename: `WF2 — Stripe Payment Events`

**Nœud 1 — Webhook Trigger**
- HTTP Method: POST
- Path: `stripe-events`
- Response Mode: Respond immediately (200)
- Options > **"Raw Body": ON** ← obligatoire pour la vérification de signature

**Nœud 2 — Code "Verify Stripe Signature"**

> n8n 2.x Code nodes n'ont pas accès à `require('stripe')`. On utilise `crypto` (built-in Node.js) pour vérifier manuellement la signature HMAC-SHA256.

```javascript
const crypto = require('crypto');

// En n8n 2.x, avec "Raw Body" ON, le corps brut est dans binary.data (base64)
// On le décode pour obtenir la string brute nécessaire à la vérification HMAC
const binaryData = $input.first().binary?.data;
const rawBody = binaryData
  ? Buffer.from(binaryData.data, 'base64').toString('utf-8')
  : JSON.stringify($input.first().body);
const sigHeader = $input.first().headers['stripe-signature'];
const secret = process.env.STRIPE_WEBHOOK_SECRET_N8N || '';

// Parser le header stripe-signature: "t=1234,v1=abcdef,v0=..."
const parts = Object.fromEntries(
  sigHeader.split(',').map(p => p.split('='))
);
const timestamp = parts.t;
const expectedSig = parts.v1;

if (!timestamp || !expectedSig) {
  throw new Error('Missing stripe-signature fields');
}

const payload = `${timestamp}.${rawBody}`;
const computedSig = crypto
  .createHmac('sha256', secret)
  .update(payload, 'utf8')
  .digest('hex');

const computedBuf = Buffer.from(computedSig, 'hex');
const expectedBuf = Buffer.from(expectedSig, 'hex');

if (computedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(computedBuf, expectedBuf)) {
  throw new Error('Stripe signature mismatch');
}

const event = JSON.parse(rawBody);
return [{ json: event }];
```

**Nœud 3 — Switch "Event Type"**
- Value: `{{ $json.type }}`
- Routes:
  - Route 0: `payment_intent.succeeded`
  - Route 1: `payment_intent.payment_failed`

**--- Branche SUCCÈS (Route 0) ---**

**Nœud 4a — HTTP Request "Expand Charges"**
- Method: GET
- URL: `https://api.stripe.com/v1/payment_intents/{{ $json.data.object.id }}?expand[]=charges`
- Authentication: stripe-api
- Options > Include Response Headers and Status Code: ON

**Nœud 5a — Code "Extract Client Email"**
```javascript
const pi = $input.first().json;
const email =
  pi.charges?.data?.[0]?.billing_details?.email ||
  pi.receipt_email ||
  'client inconnu';
const amount = (pi.amount / 100).toFixed(2);
const currency = (pi.currency || 'eur').toUpperCase();
return [{ json: { email, amount, currency, paymentIntentId: pi.id } }];
```

**Nœud 6a — HTTP Request "Email Client Confirmation"**
- Method: POST
- URL: `https://api.resend.com/emails`
- Authentication: resend-api
- Body (JSON):
```json
{
  "from": "contact@thestudiopapeteriedigitale.fr",
  "to": ["{{ $json.email }}"],
  "subject": "✅ Votre commande est confirmée — The Studio",
  "html": "<p style='font-family:sans-serif'>Bonjour,</p><p style='font-family:sans-serif'>Votre paiement de <strong>{{ $json.amount }} {{ $json.currency }}</strong> a bien été reçu. Vous recevrez vos accès très bientôt.</p><p style='font-family:sans-serif'>— L'équipe The Studio</p>"
}
```

**Nœud 7a — HTTP Request "Log to Supabase"**
- Method: POST
- URL: `https://pftvcpxwbprmphhgwvxc.supabase.co/rest/v1/stripe_events`
- Authentication: supabase-rest
- Header supplémentaire: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- Header: `Prefer: return=minimal`
- Body (JSON) — noter l'absence de guillemets autour des valeurs numériques:
```json
{
  "stripe_event_id": "{{ $('Verify Stripe Signature').item.json.id }}",
  "event_type": "payment_intent.succeeded",
  "payment_intent_id": "{{ $json.paymentIntentId }}",
  "customer_email": "{{ $json.email }}",
  "amount_cents": {{ $('Expand Charges').item.json.amount }},
  "currency": "{{ $json.currency }}",
  "status": "succeeded"
}
```

**--- Branche ÉCHEC (Route 1) ---**

**Nœud 4b — Code "Extract Failure Info"**
```javascript
const obj = $input.first().json.data.object;
const email =
  obj.last_payment_error?.payment_method?.billing_details?.email ||
  obj.receipt_email ||
  'email inconnu';
const amount = (obj.amount / 100).toFixed(2);
const currency = (obj.currency || 'eur').toUpperCase();
const reason = obj.last_payment_error?.message || 'raison inconnue';
return [{ json: { email, amount, currency, reason } }];
```

**Nœud 5b — HTTP Request "Alert Admin Echec"**
- Method: POST
- URL: `https://api.resend.com/emails`
- Authentication: resend-api
- Body (JSON):
```json
{
  "from": "contact@thestudiopapeteriedigitale.fr",
  "to": ["contact@thestudiopapeteriedigitale.fr"],
  "subject": "⚠️ Paiement échoué — The Studio",
  "html": "<p style='font-family:sans-serif'><strong>Paiement échoué</strong></p><ul style='font-family:sans-serif'><li>Client : {{ $json.email }}</li><li>Montant : {{ $json.amount }} {{ $json.currency }}</li><li>Raison : {{ $json.reason }}</li></ul>"
}
```

- [ ] **Step 4: Activer + exporter**

`n8n/workflows/wf2-stripe-events.json`

- [ ] **Step 5: Commit**

```bash
git add n8n/workflows/wf2-stripe-events.json
git commit -m "feat: add WF2 Stripe payment events workflow with HMAC verification"
```

---

## Task 6: WF5 — Supabase DB Monitor

**Files:**
- Create: `n8n/workflows/wf5-db-monitor.json`

- [ ] **Step 1: Créer le workflow dans n8n UI**

New Workflow > Rename: `WF5 — Supabase DB Monitor`

**Nœud 1 — Schedule Trigger**
- Cron: `0 7 * * *`

**Nœud 2 — HTTP Request "Count Purchases 48h"**
- Method: GET
- URL: `https://pftvcpxwbprmphhgwvxc.supabase.co/rest/v1/purchases?created_at=gte.{{ new Date(Date.now() - 48*60*60*1000).toISOString() }}&select=id`
- Authentication: supabase-rest (Generic Credential Type)
- Header supplémentaire: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- Header: `Prefer: count=exact`
- Options > **Include Response Headers and Status Code: ON** ← nécessaire pour lire `content-range`
- Continue on Fail: ON

**Nœud 3 — Code "Extract Count"**
```javascript
const headers = $input.first().headers;
const contentRange = headers['content-range'] || '*/0';
// Format: "0-9/42" ou "*/0" si vide
const total = parseInt(contentRange.split('/')[1]) || 0;
const today = new Date();
const dayOfWeek = today.getDay(); // 0=dim, 6=sam
const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
return [{ json: { count: total, isWeekday } }];
```

**Nœud 4 — IF "Zero + Weekday"**
- Condition 1: `{{ $json.count }}` Equal `0`
- Condition 2: `{{ $json.isWeekday }}` Equal `true`
- Combiner: AND

**Nœud 5 — HTTP Request "Alert No Conversion" (branche true)**
- Method: POST
- URL: `https://api.resend.com/emails`
- Authentication: resend-api
- Body:
```json
{
  "from": "contact@thestudiopapeteriedigitale.fr",
  "to": ["contact@thestudiopapeteriedigitale.fr"],
  "subject": "⚠️ Aucune conversion depuis 48h — The Studio",
  "html": "<p style='font-family:sans-serif'>Aucun achat enregistré dans les 48 dernières heures.</p><p style='font-family:sans-serif'>Timestamp : {{ $now }}</p>"
}
```

- [ ] **Step 2: Test manuel**

"Test workflow" → Vérifier que le Code node retourne un `count` numérique (pas NaN).

- [ ] **Step 3: Activer + exporter**

`n8n/workflows/wf5-db-monitor.json`

- [ ] **Step 4: Commit**

```bash
git add n8n/workflows/wf5-db-monitor.json
git commit -m "feat: add WF5 Supabase DB monitor workflow"
```

---

## Task 7: WF6 — Rapport Business hebdomadaire

**Files:**
- Create: `n8n/workflows/wf6-business-report.json`

- [ ] **Step 1: Créer le workflow dans n8n UI**

New Workflow > Rename: `WF6 — Rapport Business Hebdomadaire`

**Nœud 1 — Schedule Trigger**
- Cron: `30 7 * * 1`

**Nœud 2 — Code "Compute Week Range"**
```javascript
const now = new Date();
const dayOfWeek = now.getUTCDay(); // 0=dim, 1=lun ... 6=sam
// Lundi = 1. Quand on est lundi matin, daysToLastMonday=7 (semaine précédente)
const daysToLastMonday = dayOfWeek === 1 ? 7 : (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

const lastMonday = new Date(now);
lastMonday.setUTCDate(now.getUTCDate() - daysToLastMonday);
lastMonday.setUTCHours(0, 0, 0, 0);

const startOfWeekISO = lastMonday.toISOString();
const startOfWeekUnix = Math.floor(lastMonday.getTime() / 1000);
const weekLabel = lastMonday.toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric'
});

return [{ json: { startOfWeekISO, startOfWeekUnix, weekLabel } }];
```

**Nœuds 3, 4, 5 — HTTP Request Supabase (en parallèle depuis nœud 2)**

Pour chacun, activer: "Include Response Headers and Status Code: ON", header `Prefer: count=exact`, header `Authorization: Bearer <key>`.

**Nœud 3 — "Weddings this week"**
- URL: `https://pftvcpxwbprmphhgwvxc.supabase.co/rest/v1/weddings?created_at=gte.{{ $('Compute Week Range').item.json.startOfWeekISO }}&select=id`

**Nœud 4 — "Purchases this week"**
- URL: `https://pftvcpxwbprmphhgwvxc.supabase.co/rest/v1/purchases?created_at=gte.{{ $('Compute Week Range').item.json.startOfWeekISO }}&select=id,amount`

**Nœud 5 — "RSVPs this week"**
- URL: `https://pftvcpxwbprmphhgwvxc.supabase.co/rest/v1/rsvp_responses?submitted_at=gte.{{ $('Compute Week Range').item.json.startOfWeekISO }}&select=id`

**Nœud 6 — HTTP Request "Stripe Revenue"**
- Method: GET
- URL: `https://api.stripe.com/v1/payment_intents?created[gte]={{ $('Compute Week Range').item.json.startOfWeekUnix }}&limit=100`
- Authentication: stripe-api
- Options > Include Response Headers and Status Code: ON
- Continue on Fail: ON

**Nœud 7 — Merge**
- Mode: Combine All (Append)
- Inputs: nœuds 3, 4, 5, 6

**Nœud 8 — Code "Compute Totals + Format HTML"**
```javascript
const items = $input.all();

function extractCount(item) {
  const cr = item.headers?.['content-range'] || '*/0';
  return parseInt(cr.split('/')[1]) || 0;
}

const weddingsCount = extractCount(items[0]);
const purchasesArray = Array.isArray(items[1].json) ? items[1].json : [];
const purchasesCount = extractCount(items[1]);
const purchasesAmount = purchasesArray.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
const rsvpCount = extractCount(items[2]);
const stripeData = items[3].json?.data || [];
const stripeRevenue = stripeData
  .filter(pi => pi.status === 'succeeded')
  .reduce((sum, pi) => sum + pi.amount, 0) / 100;

const weekLabel = $('Compute Week Range').item.json.weekLabel;

const html = `<table style="font-family:sans-serif;border-collapse:collapse;width:100%;max-width:600px">
  <thead><tr style="background:#f4f0eb">
    <th style="padding:12px;text-align:left;border-bottom:2px solid #d4c9be">Métrique</th>
    <th style="padding:12px;text-align:right;border-bottom:2px solid #d4c9be">Semaine</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:10px 12px">Nouveaux mariages</td><td style="padding:10px 12px;text-align:right"><strong>${weddingsCount}</strong></td></tr>
    <tr style="background:#fafafa"><td style="padding:10px 12px">Achats (Supabase)</td><td style="padding:10px 12px;text-align:right"><strong>${purchasesCount}</strong> — ${purchasesAmount.toFixed(2)} €</td></tr>
    <tr><td style="padding:10px 12px">Revenus Stripe confirmés</td><td style="padding:10px 12px;text-align:right"><strong>${stripeRevenue.toFixed(2)} €</strong></td></tr>
    <tr style="background:#fafafa"><td style="padding:10px 12px">RSVPs soumis</td><td style="padding:10px 12px;text-align:right"><strong>${rsvpCount}</strong></td></tr>
  </tbody>
</table>`;

return [{ json: { html, weekLabel } }];
```

**Nœud 9 — HTTP Request "Send Report"**
- Method: POST
- URL: `https://api.resend.com/emails`
- Authentication: resend-api
- Body:
```json
{
  "from": "contact@thestudiopapeteriedigitale.fr",
  "to": ["contact@thestudiopapeteriedigitale.fr"],
  "subject": "📊 Rapport hebdo — Semaine du {{ $json.weekLabel }}",
  "html": "{{ $json.html }}"
}
```

- [ ] **Step 2: Test manuel**

"Test workflow" → Vérifier que nœud 8 retourne un HTML valide avec des chiffres (même à 0).

- [ ] **Step 3: Activer + exporter**

`n8n/workflows/wf6-business-report.json`

- [ ] **Step 4: Commit**

```bash
git add n8n/workflows/wf6-business-report.json
git commit -m "feat: add WF6 business report workflow"
```

---

## Task 8: WF3 — UI Scraping hebdomadaire

**Files:**
- Create: `n8n/workflows/wf3-ui-scraping.json`

- [ ] **Step 1: Créer le workflow dans n8n UI**

New Workflow > Rename: `WF3 — UI Scraping Hebdomadaire`

**Nœud 1 — Schedule Trigger**
- Cron: `0 8 * * 1`

Pour chacun des 6 sites, créer une **paire HTTP Request + HTML Extract** (Continue on Fail: ON sur le HTTP Request). Sites server-rendered (HTML complet sans JS) :
- `https://www.minted.com`
- `https://www.papier.com`
- `https://www.zola.com`
- `https://withjoy.com`
- `https://www.artifactuprising.com` ← (correction orthographe vs spec)
- `https://www.paperless-post.com`

**Chaque HTTP Request:**
- Method: GET
- Header: `User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36`
- Continue on Fail: ON

**Chaque HTML Extract:**
- Extraction rules:
  - `title` → CSS: `title` → Return: First
  - `description` → CSS: `meta[name="description"]` → Attribute: `content`
  - `ogImage` → CSS: `meta[property="og:image"]` → Attribute: `content`
**Après chaque paire HTTP Request + HTML Extract, ajouter un nœud Set pour injecter l'URL :**

**Set "Add siteUrl" (un par site) :**
- Field `siteUrl` = `https://www.minted.com` (adapter par site)
- Mode: Keep all existing fields + add `siteUrl`

**Après le Set, un IF "Site OK":**
- Condition: `{{ $json.title }}` Is Not Empty
- Branche **false** → **Set** nœud: `{ "title": "Site indisponible", "description": "-", "ogImage": "", "siteUrl": "<url>" }`

**Nœud 20 — Merge**
- Mode: Combine All, 6 inputs (1 item par branche true + false)

**Nœud 21 — Code "Format Digest HTML"**
```javascript
const items = $input.all();
const today = new Date().toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric'
});

const rows = items.map(item => {
  const d = item.json;
  const img = d.ogImage
    ? `<img src="${d.ogImage}" style="max-width:80px;max-height:50px;object-fit:cover" />`
    : '';
  const link = d.siteUrl
    ? `<a href="${d.siteUrl}" style="color:#7c5c3e">${d.siteUrl.replace('https://www.','')}</a>`
    : '-';
  return `<tr>
    <td style="padding:8px 12px">${link}</td>
    <td style="padding:8px 12px;font-size:13px">${d.description || '-'}</td>
    <td style="padding:8px 12px;text-align:center">${img}</td>
  </tr>`;
}).join('');

const html = `<p style="font-family:sans-serif">Inspiration UI de la semaine :</p>
<table style="font-family:sans-serif;border-collapse:collapse;width:100%;max-width:700px">
  <thead><tr style="background:#f4f0eb">
    <th style="padding:8px 12px;text-align:left">Site</th>
    <th style="padding:8px 12px;text-align:left">Description</th>
    <th style="padding:8px 12px;text-align:center">Aperçu</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`;

return [{ json: { html, today } }];
```

**Nœud 22 — HTTP Request "Send Digest"**
- Method: POST
- URL: `https://api.resend.com/emails`
- Authentication: resend-api
- Body:
```json
{
  "from": "contact@thestudiopapeteriedigitale.fr",
  "to": ["contact@thestudiopapeteriedigitale.fr"],
  "subject": "🎨 Inspiration UI — Semaine du {{ $json.today }}",
  "html": "{{ $json.html }}"
}
```

- [ ] **Step 2: Activer + exporter**

`n8n/workflows/wf3-ui-scraping.json`

- [ ] **Step 3: Commit**

```bash
git add n8n/workflows/wf3-ui-scraping.json
git commit -m "feat: add WF3 UI scraping weekly workflow"
```

---

## Task 9: Setup Playwright

**Files:**
- Create: `landing/playwright.config.ts`
- Create: `landing/tests/configurator.spec.ts`
- Create: `landing/tests/rsvp.spec.ts`

- [ ] **Step 1: Installer Playwright dans landing/**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected: "✔ chromium 1xx.x.x" — browser installé.

- [ ] **Step 2: Créer playwright.config.ts**

```typescript
// landing/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3002',
    headless: true,
    locale: 'fr',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [ ] **Step 3: Créer configurator.spec.ts**

```typescript
// landing/tests/configurator.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Configurateur — tunnel complet', () => {
  test('page start charge correctement', async ({ page }) => {
    await page.goto('/fr/studio/start');
    await expect(page).toHaveURL(/studio\/start/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('page plan affiche les offres', async ({ page }) => {
    await page.goto('/fr/studio/plan');
    await expect(page).toHaveURL(/studio\/plan/);
    await expect(page.locator('body')).toContainText(/discovery|essential|premium/i);
  });

  test('page checkout charge avec Stripe Elements', async ({ page }) => {
    await page.goto('/fr/studio/checkout');
    await expect(page).toHaveURL(/studio\/checkout/);
    // Stripe Elements prend ~5s à charger
    await expect(
      page.locator('[data-testid="stripe-element"], iframe[name*="stripe"], .StripeElement').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
```

- [ ] **Step 4: Créer rsvp.spec.ts**

```typescript
// landing/tests/rsvp.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Landing + RSVP routing', () => {
  test('page accueil landing charge', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveURL(/\/fr/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('route invitation existe (404 ou 200 acceptés)', async ({ page }) => {
    const response = await page.goto('/fr/invitation/DEMO');
    // Le test vérifie que la route répond (pas un crash serveur 500)
    expect(response?.status()).not.toBe(500);
  });
});
```

- [ ] **Step 5: Lancer les tests pour vérifier la config**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing
npx playwright test --reporter=list
```

Expected: Tests passent ou échouent proprement — pas de "Cannot find module" ou crash Playwright.

- [ ] **Step 6: Commit**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add landing/playwright.config.ts landing/tests/ landing/package.json landing/package-lock.json
git commit -m "feat: add Playwright E2E test setup with configurator and RSVP specs"
```

---

## Task 10: WF4 — Tests E2E

**Files:**
- Create: `n8n/workflows/wf4-e2e-tests.json`

> Prérequis: Task 9 doit être complète.

- [ ] **Step 1: Créer le workflow dans n8n UI**

New Workflow > Rename: `WF4 — Tests E2E Playwright`

**Nœud 1a — Schedule Trigger**
- Cron: `0 6 * * *`

**Nœud 1b — Webhook Trigger**
- Path: `run-e2e`

(Les deux triggers se connectent au même nœud 2)

**Nœud 2 — Execute Command**

> On redirige stdout vers un fichier et on capture `$?` AVANT le pipe pour éviter que `tee` écrase le code de sortie.

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npx playwright test --reporter=json > /tmp/pw-output.json 2>&1; echo "EXIT_CODE:$?" >> /tmp/pw-output.json
```

Le nœud Execute Command retourne l'output dans `$json.stdout` — on l'utilisera au nœud 3.

**Nœud 3 — Read/Write Files from Disk** ← (nom exact du nœud dans n8n 2.x)
- Operation: Read
- File Path: `/tmp/pw-output.json`

**Nœud 4 — Code "Parse Results"**
```javascript
// Le fichier contient le JSON Playwright + une dernière ligne "EXIT_CODE:N"
// En n8n 2.x, "Read/Write Files from Disk" stocke le contenu en binary.data.data (base64 inline)
// Note: this.helpers.binaryToBuffer n'est pas disponible dans les Code nodes
const binaryItem = $input.first().binary.data;
const raw = Buffer.from(binaryItem.data, 'base64').toString('utf-8');
const lines = raw.trim().split('\n');
const exitLine = lines[lines.length - 1];
const exitCode = parseInt((exitLine.match(/EXIT_CODE:(\d+)/) || [])[1] || '1');

const jsonText = lines.slice(0, -1).join('\n');
let failedTests = [];
let unexpected = 0;

try {
  const report = JSON.parse(jsonText);
  unexpected = report.stats?.unexpected || 0;
  function walkSuites(suites) {
    for (const suite of (suites || [])) {
      for (const spec of (suite.specs || [])) {
        for (const test of (spec.tests || [])) {
          if (test.status !== 'passed' && test.status !== 'skipped') {
            failedTests.push({
              title: spec.title,
              error: test.results?.[0]?.error?.message?.slice(0, 200) || 'unknown error'
            });
          }
        }
      }
      walkSuites(suite.suites);
    }
  }
  walkSuites(report.suites);
} catch(e) {
  failedTests = [{ title: 'JSON parse error', error: e.message }];
  unexpected = 1;
}

return [{ json: { exitCode, unexpected, failedTests, count: failedTests.length, timestamp: new Date().toISOString() } }];
```

**Nœud 5 — IF "Tests Failed"**
- Condition 1: `{{ $json.exitCode }}` Not Equal `0`
- Condition 2: `{{ $json.unexpected }}` Greater Than `0`
- Combiner: OR

**Nœud 6 — Code "Format Alert HTML" (branche true)**
```javascript
const { failedTests, timestamp, count } = $input.first().json;
const rows = failedTests.map(t =>
  `<tr><td style="padding:8px 12px;color:#dc2626;font-family:sans-serif">${t.title}</td><td style="padding:8px 12px;font-size:12px;color:#666;font-family:sans-serif">${t.error}</td></tr>`
).join('');

const html = `<p style="font-family:sans-serif"><strong>${count} test(s) E2E ont échoué</strong></p>
<table style="border-collapse:collapse;width:100%">
  <thead><tr style="background:#fee2e2">
    <th style="padding:8px 12px;text-align:left;font-family:sans-serif">Test</th>
    <th style="padding:8px 12px;text-align:left;font-family:sans-serif">Erreur</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<p style="font-family:sans-serif;color:#888;font-size:12px">Timestamp : ${timestamp}</p>`;

return [{ json: { html, count } }];
```

**Nœud 7 — HTTP Request "Alert E2E" (branche true)**
- Method: POST
- URL: `https://api.resend.com/emails`
- Authentication: resend-api
- Body:
```json
{
  "from": "contact@thestudiopapeteriedigitale.fr",
  "to": ["contact@thestudiopapeteriedigitale.fr"],
  "subject": "🔴 Tests E2E échoués — {{ $json.count }} test(s) KO — The Studio",
  "html": "{{ $json.html }}"
}
```

**Nœud 8 — No Operation (branche false)**

- [ ] **Step 2: Test manuel via webhook**

Ouvrir l'URL webhook du nœud 1b dans le browser (ou `curl -X POST http://localhost:5678/webhook/run-e2e`) → Vérifier que Execute Command tourne et que le Code node parse correctement.

- [ ] **Step 3: Activer + exporter**

`n8n/workflows/wf4-e2e-tests.json`

- [ ] **Step 4: Commit**

```bash
git add n8n/workflows/wf4-e2e-tests.json
git commit -m "feat: add WF4 E2E Playwright test runner workflow"
```

---

## Task 11: Vérification finale

- [ ] **Step 1: Vérifier que tous les workflows sont actifs**

Ouvrir `http://localhost:5678` > Workflows. Tous doivent avoir le toggle "Active" ON:
WF0 Heartbeat, WF1 Error Monitor, WF2 Stripe Events, WF3 UI Scraping, WF4 E2E Tests, WF5 DB Monitor, WF6 Business Report

- [ ] **Step 2: Smoke test WF1**

Dans WF1, "Test workflow" → Les 3 HTTP Requests retournent `statusCode: 200`, l'IF reste en branche false, pas d'email envoyé.

- [ ] **Step 3: Smoke test WF5**

Dans WF5, "Test workflow" → Le Code node retourne `{ count: <number>, isWeekday: <bool> }` sans NaN.

- [ ] **Step 4: Smoke test WF6**

Dans WF6, "Test workflow" → Email rapport envoyé à `contact@thestudiopapeteriedigitale.fr` avec les métriques (même à 0).

- [ ] **Step 5: Commit final**

```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
git add n8n/
git commit -m "feat: complete n8n automation workflows suite (WF0-WF6)"
```

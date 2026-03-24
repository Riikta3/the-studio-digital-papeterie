# Design Spec — n8n Workflows Automation

**Date:** 2026-03-24
**Projet:** The Studio — Papeterie Digitale
**Stack:** Next.js + Supabase + Stripe + Resend + n8n (localhost:5678, natif — pas Docker)

---

## Contexte

Mise en place de 6 workflows n8n pour automatiser le monitoring, les alertes, le reporting et les tests du SaaS de papeterie de mariage. n8n tourne nativement (non-Docker) sur `localhost:5678`.

---

## Architecture Globale

### Credentials partagés (créer une seule fois dans n8n)

| Nom credential n8n | Type n8n | Header / Champ |
|---|---|---|
| `resend-api` | HTTP Header Auth | `Authorization: Bearer <RESEND_API_KEY>` |
| `supabase-rest` | HTTP Header Auth | `apikey: <SUPABASE_SERVICE_ROLE_KEY>` + `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` |
| `stripe-api` | HTTP Header Auth | `Authorization: Bearer <STRIPE_SECRET_KEY>` |

### Email
- **From:** `contact@thestudiopapeteriedigitale.fr` (domaine vérifié dans Resend)
- **To (admin):** `contact@thestudiopapeteriedigitale.fr`
- **API Resend:** POST `https://api.resend.com/emails` avec credential `resend-api`
- **Corps HTML:** inline styles obligatoires (compatibilité clients mail)

### Variables d'environnement nécessaires
Toutes présentes dans `.env.local` :
- `NEXT_PUBLIC_SUPABASE_URL` = `https://pftvcpxwbprmphhgwvxc.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` ← à créer lors de l'enregistrement du webhook n8n dans Stripe Dashboard

### Note réseau
n8n tourne nativement (pas Docker), donc `localhost:3002` et `localhost:3003` sont accessibles directement.

---

## Workflow 0 — n8n Heartbeat (bonus sécurité)

**Objectif:** Détecter si n8n lui-même tombe en panne (le monitor doit être monitoré).

**Trigger:** Schedule — toutes les 30 min

**Nodes:**
1. `Schedule Trigger` — interval 30 min
2. `HTTP Request` — POST vers un endpoint externe de type UptimeRobot heartbeat ou webhook Discord/Resend
   - Option simple : POST vers `https://api.resend.com/emails` si pas d'UptimeRobot → log silencieux (pas d'email, juste un ping)
   - Option recommandée : configurer un UptimeRobot heartbeat monitor, n8n ping l'URL toutes les 30 min

> Si n8n s'arrête, UptimeRobot n'a plus de ping et envoie une alerte email automatiquement.

---

## Workflow 1 — Error Monitor

**Objectif:** Détecter les pannes des services (Supabase, apps Next.js) et alerter immédiatement.

**Trigger:** Schedule — toutes les 15 minutes

**Nodes:**
1. `Schedule Trigger` — interval 15 min
2. `HTTP Request` (Continue on Fail: ON) — GET `https://pftvcpxwbprmphhgwvxc.supabase.co/rest/v1/` avec credential `supabase-rest` (valide réseau + auth simultanément)
3. `HTTP Request` (Continue on Fail: ON) — GET `http://localhost:3002`
4. `HTTP Request` (Continue on Fail: ON) — GET `http://localhost:3003`
5. `Merge` — consolide les 3 résultats (mode: Combine All)
6. `IF` — si l'un des status codes != 200 OU si un nœud a retourné une erreur
7. `HTTP Request` (Resend) — envoie email alerte admin

**Email alerte:**
- Sujet: `🔴 Service en erreur — The Studio`
- Corps HTML inline: service en erreur, status code, timestamp ISO

---

## Workflow 2 — Stripe Payment Events

**Objectif:** Réagir aux événements Stripe (paiement réussi/échoué) pour notifier client et admin.

**Trigger:** Webhook n8n — URL à enregistrer dans Stripe Dashboard > Webhooks
Events à écouter : `payment_intent.succeeded`, `payment_intent.payment_failed`

**Nodes:**
1. `Webhook Trigger` — méthode POST, path `/stripe-events`
2. `Code` — **Vérification signature Stripe (sécurité critique)**
   ```js
   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
   const sig = $input.first().headers['stripe-signature'];
   const rawBody = $input.first().rawBody;
   const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
   return [{ json: event }];
   ```
   En cas d'erreur de signature : throw error (n8n renvoie 400, Stripe retentera)
3. `Switch` sur `{{ $json.type }}` :
   - `payment_intent.succeeded` → branche succès
   - `payment_intent.payment_failed` → branche échec

**Branche succès:**
4. `HTTP Request` (Stripe) — GET `https://api.stripe.com/v1/payment_intents/{{ $json.data.object.id }}?expand[]=charges` avec credential `stripe-api`
5. `Code` — extrait email client : `$json.charges.data[0].billing_details.email` (fallback: `$json.receipt_email`)
6. `HTTP Request` (Resend) — email confirmation au client
7. `HTTP Request` (Supabase REST) — log l'événement dans une table `stripe_events` (à créer en migration)

**Branche échec:**
4. `Code` — extrait email client depuis `$json.data.object.last_payment_error.payment_method.billing_details.email` (fallback: charges expand)
5. `HTTP Request` (Resend) — email alerte admin avec : email client, montant (en cents / 100), raison de l'échec

**Emails:**
- Succès client: `✅ Votre commande est confirmée — The Studio`
- Échec admin: `⚠️ Paiement échoué — [email] — [montant]€ — [raison]`

---

## Workflow 3 — UI Scraping hebdomadaire

**Objectif:** Collecter l'inspiration UI/UX des meilleurs sites de papeterie mariage chaque semaine.

**Trigger:** Schedule — cron `0 8 * * 1` (lundi 8h00)

**Sites scrappés** (1 requête par domaine, respecte robots.txt) :
- `https://www.minted.com`
- `https://www.papier.com`
- `https://www.zola.com`
- `https://withjoy.com`
- `https://www.artifactupxising.com`
- `https://www.paperless-post.com`

**Nodes:**
1. `Schedule Trigger` — cron lundi 8h
2. 6× `HTTP Request` (Continue on Fail: ON) en parallèle — GET sur chaque site, User-Agent défini
3. 6× `HTML Extract` — extrait `title`, `meta[name=description][content]`, `meta[property=og:image][content]`
4. 6× `IF` — si erreur (status != 200 ou champ vide) → `Set` nœud avec valeurs placeholder `{ title: "Site indisponible", description: "-", image: "" }`
5. `Merge` — consolide tous les résultats (chaque branche contribue exactement 1 item)
6. `Code` — formate le digest HTML (table inline-styled)
7. `HTTP Request` (Resend) — envoie digest email admin

**Email digest:**
- Sujet: `🎨 Inspiration UI — Semaine du [lundi date]`
- Corps: table HTML inline-styled, colonnes : Site | Description | Lien | Aperçu image

---

## Workflow 4 — Tests E2E Playwright

**Objectif:** Valider automatiquement les flows critiques et alerter en cas de régression.

**Prérequis:**
- n8n tourne nativement → accès au système de fichiers local
- Playwright installé dans le projet : `npx playwright install` depuis le repo
- Fichiers de tests à créer : `landing/tests/configurator.spec.ts` et `landing/tests/rsvp.spec.ts`
- `playwright.config.ts` à la racine du projet

**Trigger 1:** Schedule — cron `0 6 * * *` (quotidien 6h00)
**Trigger 2:** Webhook — path `/run-e2e` (on-demand)

**Flows testés:**
- Tunnel configurateur : sélection plan → infos mariage → checkout → Stripe test card `4242 4242 4242 4242`
- Invitation/RSVP : chargement page invitation → soumission formulaire RSVP

**Nodes:**
1. `Schedule Trigger` / `Webhook Trigger`
2. `Execute Command` :
   ```bash
   cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing && npx playwright test --reporter=json --output=/tmp/pw-results 2>&1 | tee /tmp/pw-output.json; echo "EXIT:$?"
   ```
3. `Read Binary File` — lit `/tmp/pw-output.json`
4. `Code` — parse JSON, extrait tests failed, détecte `EXIT:` code
5. `IF` — si exit code != 0 OU `stats.unexpected > 0`
6. **Si échec:** `HTTP Request` (Resend) — email alerte
7. **Si succès:** `No Operation`

**Email alerte:**
- Sujet: `🔴 Tests E2E échoués — [N] test(s) KO — The Studio`
- Corps HTML inline: liste des tests KO avec titre + message d'erreur + timestamp

---

## Workflow 5 — Supabase DB Monitor

**Objectif:** Détecter l'absence anormale de conversions.

**Trigger:** Schedule — cron `0 7 * * *` (quotidien 7h00)

**Nodes:**
1. `Schedule Trigger` — cron 7h quotidien
2. `HTTP Request` (Supabase REST) :
   - GET `{{ $env.NEXT_PUBLIC_SUPABASE_URL }}/rest/v1/purchases?created_at=gte.{{ new Date(Date.now() - 48*60*60*1000).toISOString() }}&select=id`
   - Headers : credential `supabase-rest` + `Prefer: count=exact`
   - Retourne le header `Content-Range` avec le count total
3. `Code` — extrait le count depuis `Content-Range` header (ex: `0-9/42` → 42)
4. `IF` — count == 0 **ET** jour de semaine (lundi–vendredi) — évite les fausses alertes le weekend
5. **Si 0 en semaine:** `HTTP Request` (Resend) — email alerte admin
6. `Set` — stocke `{ purchases_48h: count }` pour WF6

**Email alerte:**
- Sujet: `⚠️ Aucune conversion depuis 48h — The Studio`
- Corps: timestamp, count actuel, lien Supabase dashboard

> **Note:** L'alerte ne se déclenche que du lundi au vendredi pour éviter la fatigue d'alertes le weekend. À ajuster selon la croissance du trafic.

---

## Workflow 6 — Rapport Business hebdomadaire

**Objectif:** Synthèse hebdomadaire des métriques clés.

**Trigger:** Schedule — cron `30 7 * * 1` (lundi 7h30, avant WF3)

**Métriques collectées:**
- Supabase : nouveaux `weddings` créés cette semaine
- Supabase : nouveaux `purchases` créés cette semaine
- Supabase : nouveaux `rsvp_responses` soumis cette semaine
- Stripe API : `payment_intents` succeeded cette semaine

**Nodes:**
1. `Schedule Trigger` — cron lundi 7h30
2. `Code` — calcule `startOfWeekUnix` (lundi 00:00:00 UTC de la semaine passée en timestamp Unix) et `startOfWeekISO` (format ISO pour Supabase)
3. 3× `HTTP Request` (Supabase REST) en parallèle :
   - `weddings`: GET `/rest/v1/weddings?created_at=gte.{{ $json.startOfWeekISO }}&select=id` + `Prefer: count=exact`
   - `purchases`: GET `/rest/v1/purchases?created_at=gte.{{ $json.startOfWeekISO }}&select=id,amount`
   - `rsvp_responses`: GET `/rest/v1/rsvp_responses?submitted_at=gte.{{ $json.startOfWeekISO }}&select=id` + `Prefer: count=exact`
4. `HTTP Request` (Stripe) — GET `https://api.stripe.com/v1/payment_intents?created[gte]={{ $json.startOfWeekUnix }}&limit=100` avec credential `stripe-api`
5. `Merge` — consolide les 4 résultats
6. `Code` — calcule totaux (count weddings, count purchases, sum amount/100 en €, count rsvp, sum Stripe succeeded), formate HTML
7. `HTTP Request` (Resend) — envoie rapport email admin

**Email rapport:**
- Sujet: `📊 Rapport hebdo — Semaine du [lundi date]`
- Corps: table HTML inline-styled avec colonnes Métrique / Valeur / Variation

---

## Ordre d'implémentation recommandé

1. Créer les credentials partagés dans n8n (`resend-api`, `supabase-rest`, `stripe-api`)
2. **WF2** (Stripe Webhook) — critique business, signature verification
3. **WF5** (DB Monitor) — détection conversion
4. **WF6** (Rapport hebdo) — visibilité business
5. **WF1** (Error Monitor) — stabilité infra
6. **WF0** (Heartbeat) — fiabilité du monitoring
7. **WF3** (UI Scraping) — inspiration
8. **WF4** (Tests E2E) — nécessite création specs Playwright au préalable

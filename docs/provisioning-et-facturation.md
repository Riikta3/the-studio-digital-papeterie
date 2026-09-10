---
date: 2026-09-10
status: implemented
category: architecture
---

# Provisioning & Facturation

## Problème résolu

Le provisioning était déclenché **par le navigateur du client** (`checkout/page.tsx` → `createWedding()`).
Si l'onglet mourait pendant les ~2 s de traitement : paiement encaissé, **rien créé**, aucune alerte.
Le webhook Stripe se contentait de logger `⚠️ Paid but unprovisioned`.

## Architecture actuelle

Deux chemins, un seul résultat — idempotents par PaymentIntent.

1. **Chemin rapide (navigateur)** : `confirmPayment` → `createWedding()` → magic link → dashboard.
2. **Filet de sécurité (webhook)** : `payment_intent.succeeded` → `provisionFromPaymentIntent()`.
   Stripe retente la livraison, donc la commande aboutit même client parti.

`markPaymentProvisioned()` écrit `wedding_id` dans les métadonnées de l'intent : le second
chemin trouve le mariage déjà créé et s'arrête. Pas de doublon possible.

### Métadonnées Stripe = source de vérité

`[[lib/order-metadata.ts]]` construit et relit les métadonnées.
**Elles portent désormais l'identité du couple** (prénom, nom, partenaire, date, thème, locale),
pas seulement le panier — sans quoi le webhook ne pouvait pas provisionner.

⚠️ Toute nouvelle donnée nécessaire à `createWedding()` doit être ajoutée là,
et au tableau de dépendances de l'effect qui crée l'intent.

## Facturation

Obligation légale française : une facture par vente, numérotation **séquentielle sans trou**
(art. 242 nonies A annexe II CGI).

- `next_invoice_number()` — allocation **atomique en Postgres** (`insert … on conflict do update`,
  verrou de ligne). Testé : 30 appels concurrents → 30 numéros uniques, aucun trou.
  Un `max+1` en JavaScript aurait produit des doublons.
- `invoices.stripe_payment_intent_id` unique → un rejeu Stripe ne rebrûle pas de numéro.
- PDF via **pdf-lib** (pas Puppeteer : ne tient pas dans le runtime serverless Vercel).
- Bucket `invoices` **privé** → URL signée 60 s via `getInvoiceDownloadUrl()`,
  avec re-vérification de propriété côté serveur.

### ⚠️ À FAIRE AVANT LA PREMIÈRE VENTE

`landing/src/lib/company.ts` contient des `[à compléter]` (raison sociale, SIRET, adresse).
`assertCompanyConfigured()` **bloque l'émission** tant qu'ils y sont — une facture sans SIRET
est nulle, et pire qu'absente car le client la classe comme valide.

Les mêmes placeholders traînent dans les CGV (`messages/*.json`) — à aligner.

## Régime TVA

`VAT_REGIME = "franchise"` → mention 293 B, pas de TVA.
Passer à `"standard"` quand le seuil est franchi : les prix affichés deviennent TTC.

## Non vérifié

Docker éteint pendant l'implémentation → migration non appliquée sur la base locale.
Testée sur une instance Postgres jetable (numérotation + idempotence), pas sur Supabase.

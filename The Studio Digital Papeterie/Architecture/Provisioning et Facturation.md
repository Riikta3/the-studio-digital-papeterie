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


## Mise à jour 2026-09-10 — identité légale en variables d'env

Les mentions légales ne sont plus dans le code : `lib/company.ts` lit
`COMPANY_LEGAL_NAME`, `COMPANY_SIRET`, `COMPANY_ADDRESS`, etc.
Un SIRET et une adresse de siège ne se committent pas, et diffèrent entre preview et prod.

- **Serveur uniquement** (pas de `NEXT_PUBLIC_`) : les factures sont rendues dans le webhook.
- `assertCompanyConfigured()` nomme les variables manquantes dans son message.
- `COMPANY_VAT_REGIME` : `franchise` par défaut (mention 293 B).
  En `standard`, `COMPANY_VAT_NUMBER` devient obligatoire.
- Toutes documentées dans `landing/.env.example`.

⚠️ **En prod** : à renseigner dans Vercel → Settings → Environment Variables.
Sans elles le paiement et le provisioning marchent, mais aucune facture n'est émise —
échec silencieux côté client, visible seulement dans les logs (`[INVOICE_CONFIG]`).


## Un compte = un mariage — contrainte v1 assumée

**Décision (2026-09-10)** : un compte ne peut posséder qu'un seul mariage.
Garde serveur dans `create-wedding.ts`, après `findUserByEmail`.

### Pourquoi

Le store Zustand survivait au paiement : revenir en arrière depuis le dashboard
affichait un formulaire de paiement **fonctionnel**, pré-rempli avec le même panier.
La garde de rejeu est indexée sur le PaymentIntent — un second checkout en crée un
nouveau, donc elle ne voyait rien. Résultat : **double débit + second site créé**.

Trois protections en profondeur :
1. `completeOrder()` vide le panier après provisioning (+ `completedAt`)
2. Écran « commande finalisée » au retour arrière
3. **Refus serveur** si le compte a déjà un mariage → **remboursement automatique**
   (`refundPayment()`, idempotent via `metadata.refunded_reason`)

Le refus arrive *après* encaissement : refuser en gardant l'argent serait pire que le bug.

### ⚠️ À ouvrir en v2 : plusieurs mariages par compte

Cas légitimes aujourd'hui refusés (puis remboursés, traités à la main) :
wedding planner, couple offrant une invitation, second événement.

**Coût réel mesuré** : ~**25 requêtes `.single()` sur `weddings` dans 18 fichiers**
du dashboard. `.single()` **lève une exception dès qu'il y a deux lignes** — donc
le dashboard casse silencieusement à la seconde où la contrainte saute.

Ordre de migration :
1. Router les copies inline vers `lib/db/current-wedding.ts` (`requireWedding()`)
   — elles sont le vrai risque, pas la garde du checkout
2. Introduire la notion de « mariage courant » (sélecteur UI + session ou URL)
3. Ajouter un point d'entrée explicite « commander une autre invitation », porteur
   d'un flag que la garde honore

⚠️ **Ne pas simplement supprimer la garde** : ça restaurerait le double débit
au bouton Précédent qu'elle a été écrite pour empêcher. La distinction à faire est
*second achat intentionnel* vs *répétition accidentelle*.

Tout l'aval est déjà clé par `wedding_id` et non `user_id` — c'est ce qui rend
la v2 raisonnable.
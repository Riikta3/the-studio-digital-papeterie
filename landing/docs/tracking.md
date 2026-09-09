# Tracking & analytics — état et ce qui manque

Dernière mise à jour : 2026-09-09

## En place

| Outil | État | Consentement requis | Config |
|---|---|---|---|
| Bandeau de consentement | ✅ actif | — | aucune |
| Vercel Analytics | ✅ actif | non | aucune |
| Vercel Speed Insights | ✅ actif | non | aucune |
| Pixel Meta | ❌ absent | **oui** | voir ci-dessous |
| API Conversions Meta | ❌ absent | **oui** | voir ci-dessous |
| Google Analytics | ❌ absent, non prévu | oui | — |

### Pourquoi Analytics et Speed Insights ne passent pas par le bandeau

Ni l'un ni l'autre ne dépose de cookie, et aucun ne stocke d'identifiant
permettant d'isoler un visiteur. La mesure d'audience sans cookie de ce type
est dispensée de consentement préalable selon les lignes directrices de la
CNIL. C'est la raison du choix : des données de trafic disponibles tout de
suite, sans dépendre d'un clic sur « Accepter ».

Le pixel Meta, lui, dépose des cookies publicitaires. Il ne peut pas se
charger avant consentement — d'où le gate, livré avant lui.

### Le gate de consentement

`src/lib/consent.ts` expose tout ce qu'un script de tracking doit connaître :

```ts
import { hasConsent, CONSENT_EVENT } from "@/lib/consent";

// À l'initialisation
if (hasConsent()) loadPixel();

// Et pour démarrer sans rechargement quand le visiteur accepte
window.addEventListener(CONSENT_EVENT, (e) => {
  if ((e as CustomEvent).detail === "granted") loadPixel();
});
```

Règles encodées :
- **Aucune réponse = refus.** `hasConsent()` renvoie `false` tant que le
  visiteur n'a pas choisi.
- Le choix est stocké dans `localStorage` sous `studio.consent.v1`
  (`granted` / `denied`).
- Le bouton « Gérer les cookies » du pied de page rouvre la bannière, donc un
  consentement peut être retiré aussi simplement qu'il a été donné.

---

## Ce qu'il manque pour le pixel Meta

### 1. Le Pixel ID

Meta Events Manager → **Sources de données** → sélectionner le pixel → l'ID
est un nombre à 15-16 chiffres affiché sous son nom.

Destination : variable d'environnement **publique** (elle finit dans le
JavaScript de la page de toute façon).

```
NEXT_PUBLIC_META_PIXEL_ID=1234567890123456
```

### 2. Le token d'accès pour l'API Conversions

Meta Events Manager → le pixel → onglet **Paramètres** → section *API de
conversions* → **Générer un token d'accès**.

Destination : variable d'environnement **serveur uniquement**. C'est un
secret : il ne doit ni porter le préfixe `NEXT_PUBLIC_`, ni être committé.

```
META_CONVERSIONS_API_TOKEN=EAAG...
```

À ajouter dans Vercel → Project Settings → Environment Variables, et dans
`.env.local` pour le développement. `.env.example` doit lister les deux noms
sans les valeurs.

### Pourquoi l'API Conversions en plus du pixel

Le pixel navigateur perd 30 à 40 % des conversions : ATT sur iOS, bloqueurs de
publicité, restrictions de Safari. L'API Conversions envoie l'événement depuis
le serveur, où rien ne peut le bloquer.

Le webhook Stripe (`src/app/api/webhooks/stripe/route.ts`) est l'endroit juste
pour l'événement `Purchase` : il se déclenche sur `payment_intent.succeeded`,
donc sur un paiement réellement encaissé, avec le montant exact — pas sur un
retour de navigateur qui peut ne jamais arriver.

---

## Événements prévus

Le tunnel est déjà lisible pour ça. Rien n'est câblé, ceci est le plan.

| Événement Meta | Déclencheur | Source |
|---|---|---|
| `PageView` | toutes les pages | pixel |
| `ViewContent` | `/themes/[slug]` | pixel |
| `InitiateCheckout` | `/studio/start` | pixel |
| `AddPaymentInfo` | `/studio/checkout` | pixel |
| `Purchase` | `payment_intent.succeeded` | **API Conversions** |

`Purchase` doit venir du serveur, et de lui seul : le dédoublonner entre le
pixel et l'API demande un `event_id` partagé, et le compter deux fois faussse
le ROAS que l'algorithme optimise.

La valeur envoyée est celle calculée par `computeOrderTotal` dans
`src/lib/pricing.ts`, jamais un montant transmis par le client — même
raisonnement que la route de paiement, qui recalcule déjà le total côté
serveur.

---

## À faire quand les identifiants seront disponibles

1. Ajouter les deux variables d'environnement (Vercel + `.env.local` +
   `.env.example`).
2. Charger le pixel derrière `hasConsent()`, avec écoute de `CONSENT_EVENT`
   pour démarrer sans rechargement.
3. Émettre `ViewContent`, `InitiateCheckout` et `AddPaymentInfo` sur les routes
   ci-dessus.
4. Envoyer `Purchase` depuis le webhook Stripe via l'API Conversions.
5. Mettre à jour la page de confidentialité : elle mentionne les cookies mais
   ne nomme aucun destinataire tiers, ce qu'il faudra faire dès qu'un pixel
   Meta transmettra des données.

Le point 5 n'est pas optionnel : nommer les tiers destinataires est une
obligation du RGPD, et elle devient exigible le jour où le pixel est actif.

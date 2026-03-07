# Documentation Technique : Flux de Paiement Stripe & Persistance (Wizard)

Ce document détaille le fonctionnement technique de l'intégration Stripe dans le wizard de création de mariage, ainsi que les mécanismes de rés resilience implémentés pour gérer les redirections et les rafraîchissements de page.

## Vue d'ensemble du flux

1. **Saisie (Étapes 1-5)** : L'utilisateur remplit ses informations.
2. **Étape 6 (Récapitulatif & Paiement)** :
   - Un `PaymentIntent` est créé via l'API `/api/create-payment-intent`.
   - Avant chaque tentative de paiement, le `formData` est sauvegardé dans le `localStorage` sous la clé `checkout_form_data`.
3. **Confirmation du Paiement** :
   - Utilisation de `stripe.confirmPayment` avec `redirect: "if_required"`.
   - Le `return_url` est configuré sur l'URL actuelle (`window.location.href`).

## Mécanismes de Résilience

### 1. Persistance d'état (localStorage)

Pour éviter la perte de données lors d'une redirection (ex: 3D Secure, PayPal), le formulaire est sérialisé en JSON dans le `localStorage` juste avant l'appel à Stripe.

### 2. Gestion des retours (Redirect Handling)

La détection du retour de paiement se fait au plus haut niveau dans `src/app/[locale]/create/page.tsx`.

- **Détection** : Présence de `payment_intent_client_secret` dans l'URL.
- **Désynchronisation (Hydration)** : Utilisation du hook `use` de React 19 pour lire `searchParams` de manière compatible avec le SSR.
- **Nettoyage immédiat** : L'URL est nettoyée via `window.history.replaceState` dès la détection pour éviter les boucles infinies de rechargement.
- **Restauration** : Reconstruction du `formData` et passage forcé à l'étape 6.
- **Vérification** : Appel à `stripe.retrievePaymentIntent` pour confirmer le statut "succeeded".

### 3. Création du compte (Provisioning)

Une fois le succès confirmé par Stripe :

1. Appel à l'action serveur `createWedding` avec les données restaurées.
2. Suppression de `checkout_form_data` du `localStorage` en cas de succès.
3. Redirection vers le Dashboard (`NEXT_PUBLIC_DASHBOARD_URL`).

## Cas d'erreurs gérés

- **Annulation/Échec** : Si le statut Stripe n'est pas "succeeded" au retour (ex: annulation PayPal), un toast d'erreur s'affiche, les données sont restaurées, et l'utilisateur reste sur l'étape 6 pour réessayer.
- **Hydration Failed** : Corrigé par l'utilisation de `use(searchParams)` qui garantit la cohérence entre le serveur et le client.
- **Looping Errors** : Corrigé par le nettoyage systématique de l'URL au montage.

## Fichiers clés

- `src/app/[locale]/create/page.tsx` : Logique de routage, orchestration du wizard et traitement des retours.
- `src/app/[locale]/create/CheckoutForm.tsx` : Intégration Stripe Elements et sauvegarde `localStorage`.
- `src/actions/create-wedding.ts` : Action serveur pour la création effective dans la DB via Supabase.

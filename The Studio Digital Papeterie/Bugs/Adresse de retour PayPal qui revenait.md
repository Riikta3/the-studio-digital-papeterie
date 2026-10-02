---
date: 2026-09-29
status: résolu (local, non commité)
category: bug
---

# L'adresse de retour PayPal revenait après chaque action

**Symptôme** : au retour de PayPal, `payment_intent`, son `client_secret` et `redirect_status` restaient dans la barre d'adresse. Chaque rechargement relançait la confirmation et le toast « C'est en ligne ! ». Le paramètre `?section=` de l'éditeur revenait aussi à l'ancienne valeur après un enregistrement.

**Cause** : `window.history.replaceState(window.history.state, "", url)`. L'état courant porte le marqueur `__NA` du routeur Next : Next prend l'appel pour le sien, ne met pas à jour son URL canonique, puis la réécrit au rendu suivant (fin d'une server action).

**Correction** : passer `null` comme état (`ModulePaymentDialog.tsx`, `EditorProvider.tsx`). Next recopie lui-même ses champs internes et synchronise son routeur.

**Vérifié** : E2E, vrai aller-retour PayPal en mode test Stripe, adresse propre au retour.

Voir [[Achat de modules]], [[Conventions]].
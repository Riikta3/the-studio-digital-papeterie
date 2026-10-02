---
date: 2026-09-28
status: implémenté (local, non commité)
category: feature
---

# Achat de modules dans l'éditeur

Spec : `docs/superpowers/specs/2026-09-28-dashboard-module-purchase-design.md`. Plan : `docs/superpowers/plans/2026-09-28-dashboard-module-purchase.md`.

## Parcours
1. « + Ajouter un module » : popover sur ordinateur, feuille en bas sur téléphone. On n'y voit que les modules que le thème sait afficher, avec leur prix (« 5 € » ou « Inclus »).
2. L'onglet s'ouvre. L'aperçu montre le module avec un contenu d'exemple marqué « Exemple » tant qu'il est vide.
3. « Enregistrer » sauvegarde toujours. Si un module est à payer, la fenêtre « Publiez… » s'ouvre une fois : récapitulatif, case CGV, puis Payment Element en onglets.
4. « Plus tard » garde le module (badge « À régler », rappel dans l'en-tête sur ordinateur, bande sous les onglets sur téléphone).

## Qui fait quoi
- Prix : `shared/lib/pricing.ts` (`addOnQuote`). Signature : 4 inclus puis 5 €. Sur-mesure, Prestige et l'ancien `premium` : inclus. Plan inconnu : facturé comme Signature.
- États : draft → `pending_modules` → `modules`, via `grant_modules` (voir [[Base de Données]]).
- Chemin rapide : `completeModulePayment` (dashboard). Filet, facturation, facture et remboursement d'un double paiement : webhook de la landing, `fulfilModuleAddOn`, avant le chemin checkout.
- Modules inclus : accordés gratuitement à l'enregistrement.

## Pièges
- **Dashboard et landing doivent utiliser le même compte Stripe**, sinon les paiements du dashboard n'atteignent pas le webhook : ni facture, ni filet. En local, `dashboard/.env.local` pointait sur un autre compte. Voir [[Achat de module hors service]].
- La feuille mobile passe par un portail : le `backdrop-blur` de l'en-tête capture les `position: fixed`.
- Les badges de l'aperçu sont dans un calque à part, car les thèmes utilisent `::before` et `::after`.

Lié : [[Éditeur de faire-part]], [[Provisioning et Facturation]].


## Après la relecture finale (2026-09-29)
- **Jamais « échec » une fois l'argent pris** : si le chemin rapide échoue après la confirmation de Stripe, le couple lit « Paiement reçu, confirmation en cours » (`payment-flow.ts`). En rouvrant « Payer », `startModulePayment` termine un paiement déjà encaissé mais pas encore accordé au lieu d'en créer un second, et attend un paiement encore en cours.
- **Payer seulement après avoir enregistré** : la pastille, la bande mobile et le bandeau cachent le bouton tant qu'une modification n'est pas enregistrée, car PayPal quitte la page.
- **« Annuler » après un ajout** : l'onglet du module retiré disparaît, et l'éditeur revient sur l'accueil.
- **Vérifié en E2E** (Stripe test) : 3D Secure validé jusqu'au bout, souris et clavier, sous la fenêtre modale ; vrai aller-retour PayPal ; retour échoué ; reprise d'un paiement encaissé sans second paiement.
- Le compte Stripe de test de la landing propose **Carte bancaire + PayPal**. CSP : `frame-src` ajoute `https://*.js.stripe.com`.
- **Ordre de mise en prod** : migration `20260928120000_module_addons.sql` d'abord, dashboard ensuite (l'éditeur lit `plan_id` et `pending_modules`). Voir [[Adresse de retour PayPal qui revenait]].
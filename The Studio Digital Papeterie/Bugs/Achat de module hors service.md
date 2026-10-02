---
date: 2026-09-28
status: résolu (local)
category: bug
---

# L'achat de module du dashboard ne pouvait pas marcher

- **CSP** : le `frame-src` du dashboard bloquait `js.stripe.com` (Payment Element) et `hooks.stripe.com` (3DS). Corrigé, et la page de test 3DS s'affiche.
- **Webhook muet** : l'intent n'avait ni email ni metadata exploitable, donc le webhook l'ignorait. Un onglet fermé laissait un couple qui avait payé sans son module. Désormais `kind=module_addon`, traité en premier.
- **Prix faux** : 10 € fixes pour tous. Désormais la règle du checkout.
- **RLS** : un couple pouvait réécrire `sites.modules` et `plan_id`. Désormais privilèges par colonne.
- **Clés Stripe de deux comptes différents** entre dashboard et landing : le webhook ne voit pas les paiements du dashboard. Il faut aligner les clés, en local et sur Vercel.
- **Leçon** : vérifier qu'un paiement déclenche bien le webhook (`stripe listen`) avant de conclure qu'un flux marche. Le chemin rapide seul masque tout.

Lié : [[Achat de modules]].

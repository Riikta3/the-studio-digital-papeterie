---
date: 2026-10-02
status: en cours
category: Features
---

# Nom de domaine personnalisé

L'option « Domaine personnalisé » du studio était facturée 65 € sans rien livrer. Le couple choisit un `.com`, au checkout ou plus tard dans le dashboard. Le studio l'achète chez Vercel, puis le branche sur l'invitation et les pages Jour J, automatiquement.

Spec : `docs/superpowers/specs/2026-10-02-custom-domain-design.md`.
Plan : `docs/superpowers/plans/2026-10-02-custom-domain.md`.

## Décisions (2026-10-02)

- **`.com` seulement.** Vercel ne vend pas `.fr`, `.eu`, `.de`, `.es`, `.it`, `.pt` ni `.be`.
- **Durée** : jusqu'au mariage + 3 mois, en années entières (aucun registrar ne vend « quelques mois »).
- **Prix** : 65 € la 1re année, + 20 € par année en plus. Les années sont figées au paiement, dans les métadonnées Stripe.
- **Titulaire** : le studio. Le renouvellement automatique est coupé chez Vercel.
- **Achat après la vente** depuis le dashboard, au prix du jour. Un couple qui attend paie moins, et c'est assumé.
- **Renouvellement payant et relances** : une spec séparée, plus tard.

## Pièges à retenir

- La recherche Vercel répond `available: false` pour une extension qu'elle ne vend pas, comme si le nom était pris. Il faut vérifier l'extension d'abord.
- Une adresse inconnue arrivant sur la landing doit garder le comportement normal, jamais une 404 : un alias oublié casserait tout le site.
- Pas de bac à sable Vercel pour les domaines : le test de bout en bout coûte un vrai `.com` (environ 10 €).

Voir aussi [[Achat de modules]], [[Invitation]], [[Base de Données]], [[Reste à faire]].

## Plan (2026-10-02)

Plan : `docs/superpowers/plans/2026-10-02-custom-domain.md`, 8 phases. Deux étapes demandent une validation : la maquette cliquable avant l'interface (phase 4), et la stabilisation de [[Achat de modules]] avant le dashboard (phase 7).

Pièges trouvés en préparant le plan :
- Supabase accorde par défaut le droit d'exécuter une nouvelle fonction à `anon`. Un `revoke … from public` seul ne suffit donc pas.
- next-intl lit la langue dans l'en-tête `X-NEXT-INTL-LOCALE`, jamais dans le segment `[locale]`. Une réécriture du proxy doit le poser, avec `x-pathname` pour `<html lang/dir>`.
- Le `expectedPrice` de l'achat Vercel est le total pour toutes les années, pas le prix annuel.

## Avancement (2026-10-02)

| Phase | État |
|---|---|
| 1. Logique partagée (prix, noms, recherche, add-on) | faite, relue, durcie |
| 2. Base de données | faite, relue, durcie (migration `…130000_custom_domains_hardening.sql`) |
| 3. Checkout côté serveur | faite, relue, durcie |
| 4. Interface du studio | en attente : l'utilisateur doit valider la [maquette](https://claude.ai/artifact/TLwrYkLhhYsiJMGvJ6bioc) |
| 5. Moteur d'achat (cron, `after()`, emails) | faite, relue, durcie |
| 6. Routage du domaine d'un couple (`proxy.ts`) | faite, relue, durcie |
| 7. Dashboard | reportée par l'utilisateur |
| 8. Vérification finale, mise en ligne | pas commencée |

- Les phases 1 à 3 ont été commitées et poussées sur `main` par une autre session (`ec65497f`). Tout le reste, dont les durcissements qui ont suivi, n'est pas commité.
- Les migrations sont appliquées en local. La base de prod n'est pas vérifiée (`db push --dry-run`), et `db push` attend le feu vert.
- Aucun vrai domaine n'a été acheté : le premier achat (environ 10 €) se fait en phase 8, sur feu vert.
- Écarts au plan d'origine, consignés dans le plan : bail à jeton (`lease_token`), raisons de la recherche, politique des achats incertains, `domainInvoiceLine(years)` sans le nom, `isCoupleDomainRequest()`, 503 quand la résolution d'hôte échoue.
- Défauts trouvés par les revues : [[Domaines perso — leçons de la revue]]. Table et fonctions : [[Base de Données]]. Pièges : [[Conventions]].
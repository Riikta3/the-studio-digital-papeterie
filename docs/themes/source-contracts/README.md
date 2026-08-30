# Contrats d'intégration des thèmes sources

Les trois thèmes `belle-rive`, `blanc-couture` (Blanc Couture / carte_blanche)
et `ciao-amore` ont été livrés comme projets Next.js autonomes, accompagnés de
ces documents. Le code a été porté dans
`landing/src/components/invitation/themes/` ; les dossiers sources d'origine
(~141 Mo d'assets non optimisés) ne sont pas versionnés.

Ces fichiers sont conservés parce qu'ils décrivent **ce qui reste à brancher**.
Aujourd'hui les formulaires RSVP, playlist et covoiturage des thèmes sont en
mode démo : ils affichent un état de succès local et n'enregistrent rien.

Ce que ces documents apportent pour la phase Supabase :

- **La forme des données attendues** — `invitation-data.example.json` et
  `invitation.ciao-amore.json` sont les schémas cibles proposés par les auteurs.
  Ils ont convergé vers `couple` / `event` / `schedule` / `modules`, ce qui a
  guidé le type partagé `InvitationData` (`themes/types.ts`).
- **Les endpoints proposés** — `API_CONTRACT.md`, `api-contract.json` :
  payload RSVP, suggestions de playlist, trajets de covoiturage.
- **Les règles métier** — RSVP idempotent (ne jamais créer de doublon),
  modération des propositions de playlist, isolation par mariage.
- **Les contraintes de sécurité** — notamment : ne jamais exposer un numéro de
  téléphone dans une réponse API publique (covoiturage `belle-rive`).
- **Les critères de recette** — `ACCEPTANCE_CHECKLIST.md`.

Attention : ces documents décrivent l'intention des auteurs, pas l'implémentation
retenue. Les schémas y sont incomplets (ni FAQ, ni dress code, ni textes) et les
chemins d'API sont indicatifs. La source de vérité côté code reste
`themes/types.ts`, et côté base `site_modules.config`.

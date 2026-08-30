# Invitation Blanc Couture — dossier intégrateur

Ce dossier contient la version Next.js complète de l’invitation « Blanc Couture — Victoria & Gabriel », prête à être intégrée au site The Studio et reliée au back-office des mariés.

## Contenu

- `app/page.tsx` : invitation complète, sections, formulaires et animations au scroll.
- `app/globals.css` : direction artistique, responsive mobile-first, gaufrage, doré et animations.
- `app/layout.tsx` : métadonnées de la page.
- `public/blanc-couture/` : tous les visuels séparés, dont les PNG détourés.
- `docs/INTEGRATION_BACKOFFICE.md` : branchement détaillé au back-office.
- `docs/api-contract.json` : format conseillé des requêtes API.
- `docs/invitation-data.example.json` : exemple de contenu administrable.
- `.env.example` : variables d’environnement attendues.

## Démarrage

```bash
npm install
npm run dev
```

La page est ensuite disponible sur `http://localhost:3000`.

## À conserver impérativement

- Le format mobile-first et la largeur maximale de l’invitation.
- Les fonds uniformément blancs.
- Les animations typographiques au scroll.
- Les CTA avec un retour visuel au clic (`scale(1.05)`).
- Le respect de `prefers-reduced-motion`.
- Les assets sous `public/blanc-couture/` et leurs proportions.

## Travail attendu côté intégration

1. Remplacer les contenus codés en dur par les données du modèle `invitation-data.example.json`.
2. Relier les formulaires RSVP, covoiturage et playlist aux API du back-office.
3. Afficher les états de chargement, succès et erreur retournés par l’API.
4. Empêcher les doubles soumissions et valider les champs côté serveur.
5. Enregistrer l’identifiant de l’invitation et celui de l’invité avec chaque réponse.
6. Connecter la playlist à Spotify uniquement côté serveur si une écriture automatique est souhaitée.

## Version de démonstration

https://invitation-blanc-couture.emiliethestudio.chatgpt.site

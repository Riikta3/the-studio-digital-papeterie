# Invitation Émilie & Jordy — dossier intégrateur

Version source correspondant à la version publique validée le 29 août 2026.

## Version visuelle à préserver

- Collection Riviera / Belle Rive, mobile-first.
- Aucun emoji ni flèche de style iPhone dans « Hébergements » ou « Covoiturage ».
- Les trajets s'affichent sous la forme « Ville de départ vers Mauguio ».
- Aucun bouton « Écouter » et aucune lecture musicale intégrée.
- La playlist participative reste présente : les invités proposent un titre et un artiste.
- La structure graphique, les animations et les assets doivent être conservés.

## Lancer le projet

Prérequis : Node.js 22.13 ou supérieur.

```bash
npm ci
npm run dev
```

Production :

```bash
npm run build
```

## Structure utile

- `app/page.tsx` : invitation et interactions côté invité.
- `app/globals.css`, `app/interactions.css`, `app/couture.css` : direction artistique et responsive.
- `public/assets/` : tous les visuels et vidéos.
- `worker/index.ts` : API covoiturage actuellement fonctionnelle.
- `db/schema.ts` et `drizzle/` : table D1 du covoiturage.
- `INTEGRATION_BACK_OFFICE.md` : données à rendre administrables et règles de branchement.
- `API_CONTRACT.md` : contrat recommandé entre l'invitation et le back-office.

## État des modules

| Module | État dans ce dossier | Travail d'intégration |
| --- | --- | --- |
| Contenus de l'invitation | Données statiques dans `app/page.tsx` | Charger la configuration du mariage depuis le back-office |
| Compte à rebours | Fonctionnel | Alimenter la date depuis la configuration |
| RSVP | Interface fonctionnelle, stockage simulé | Relier à l'API RSVP et à la fiche invité |
| +1 | Champ conditionnel présent | Appliquer l'autorisation issue de la fiche invité |
| Playlist | Interface locale | Stocker, modérer et afficher les propositions |
| Covoiturage | API et table D1 fonctionnelles | Rattacher chaque trajet au bon mariage et ajouter la modération |
| Hébergements | Liens fonctionnels | Rendre les fiches administrables |
| FAQ / programme / dress code | Affichage fonctionnel | Rendre les contenus administrables |

## Priorité d'intégration

1. Identifier le mariage par `weddingSlug` ou `weddingId` côté serveur.
2. Charger les contenus publiés et les options de modules.
3. Relier le RSVP à un invité ou foyer précis, sans doublon.
4. Relier playlist et covoiturage au même mariage.
5. Ajouter les écrans back-office, exports et modération.
6. Tester l'isolation entre deux mariages et le rendu mobile.

## Important

Ne jamais exposer de numéro de téléphone dans une réponse API accessible sans contrôle d'accès. Dans la version de production, le contact covoiturage doit être réservé aux invités autorisés ou transmis via une action serveur contrôlée.


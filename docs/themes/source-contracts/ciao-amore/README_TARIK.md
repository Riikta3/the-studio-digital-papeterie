# Invitation Ciao Amore — dossier d’intégration

Ce dossier contient la dernière version validée de l’invitation **Alba & Elio**, datée du **5 janvier 2027**, prête à être reprise dans l’écosystème The Studio.

## Contenu

- `source/` : front Next.js complet et responsive.
- `source/app/page.tsx` : structure de l’invitation et interactions actuelles.
- `source/app/globals.css` : direction artistique, responsive et animations.
- `source/public/dolce/` : uniquement les visuels réellement utilisés.
- `data/invitation.ciao-amore.json` : exemple de données à fournir depuis le back-office.
- `docs/API_CONTRACT.md` : endpoints proposés.
- `docs/INTEGRATION_MAP.md` : correspondance entre le front et les champs administrables.
- `docs/ACCEPTANCE_CHECKLIST.md` : points à vérifier avant mise en production.

## Lancer le front

Prérequis : Node.js 22+.

```bash
cd source
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Priorité d’intégration

1. Remplacer les contenus codés en dur par un objet `invitation` récupéré côté serveur.
2. Brancher le RSVP avec contrôle d’accès par invitation ou token invité.
3. Brancher la playlist participative.
4. Rendre date, lieu, programme, hébergements, FAQ et textes administrables.
5. Conserver les classes CSS et l’ordre du DOM : les animations et le responsive en dépendent.

## Important

- La date de référence est le **5 janvier 2027 à 17 h, heure locale**.
- Le champ du partenaire doit apparaître uniquement lorsque l’invité sélectionne « Moi + mon/ma partenaire ».
- Les formulaires de démonstration n’enregistrent rien aujourd’hui : ils affichent seulement un état de confirmation local.
- Les fichiers ne contiennent aucune clé API ni donnée personnelle réelle.
- Les liens Maps, Waze et hébergements doivent être validés dans le back-office avant publication.

## Branchement recommandé

Le front peut recevoir un objet `invitation` dans un Server Component, puis transmettre uniquement les données nécessaires aux composants interactifs RSVP et playlist. Éviter de charger les secrets ou les droits d’administration dans le navigateur.

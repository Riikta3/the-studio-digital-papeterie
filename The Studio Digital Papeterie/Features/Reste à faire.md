---
date: 2026-09-12
status: actif
category: Features
---

# Reste à faire

État au 12 septembre 2026, après la variabilisation. Chaque chantier est
autonome : on peut en prendre un sans toucher aux autres.

Voir aussi [[Checklist nouveau thème]], [[Invitation]], [[Conventions]].

---

## Vue d'ensemble

| # | Chantier | Qui peut le faire | Bloquant pour la vente ? |
|---|---|---|---|
| 1 | i18n de blanc-couture | Claude, seul | Oui si un couple achète ce thème en non-français |
| 2 | Base de production | Toi (créer le projet), Claude (pousser) | **Oui** — rien n'est en ligne |
| 3 | Relecture ja / ar / zh / pt | Un locuteur natif | Non, mais visible par les invités |
| 4 | Champs du contrat sans écran | Claude, seul | Non |
| 5 | Sur-mesure sans module | Décision produit | Non — assumé |

---

## 1. i18n de blanc-couture

**C'est le seul thème encore uniquement en français.** ciao-amore et
belle-rive parlent les 9 locales.

### Taille réelle

~42 chaînes visibles réparties sur 13 fichiers. Pour comparaison :
`ciaoAmore` fait 69 clés, `belleRive` 87. Le plus gros morceau est
`RsvpSection.tsx` (≈15 chaînes), puis `CarpoolSection.tsx` (≈7).

Les autres sections sont légères : 1 à 4 chaînes chacune.

### Ce qui n'est PAS à traduire

- Le nom du mode d'accès et ses lignes (`venue.access`) : ce sont les mots des
  mariés, saisis au dashboard. Déjà correct.
- Le décor propre au thème, s'il y en a (cf. ciao-amore qui garde « Grazie »).

### Procédure

Elle est déjà écrite : [[Checklist nouveau thème]] §3. Les pièges y sont, en
particulier :

- le hook `useTranslations` se déclare **tout en haut** du composant — avant
  tout `return` anticipé, jamais dans un `useEffect`. Erreur commise deux fois.
- pluriels en **ICU**, jamais `count > 1 ? "s" : ""`.
- passer `locale` aux formateurs de date, sinon tout reste en français sur une
  page traduite.

### Pourquoi c'est en attente

Tu as dit que blanc-couture n'est pas fini de ton côté. À reprendre quand tu
auras terminé — traduire un thème qui va encore bouger, c'est traduire deux
fois.

---

## 2. Base de données de production

**Rien n'est en ligne.** Les 53 migrations vivent en local et sur le repo.

### Ce qu'il y a à faire

1. Créer le projet Supabase de production (toi — ça demande un compte et une
   carte, je ne le fais pas à ta place).
2. `npx supabase link --project-ref <ref>`
3. `npx supabase db push`

### Ce qui est déjà garanti

Les migrations sont **rejouables** : chacune a été testée en `db reset` depuis
zéro *et* en réexécution sur une base existante. Les `add column` sont en
`if not exists`, les policies en `drop policy if exists` d'abord. Une
réexécution accidentelle ne casse rien — elle émet des `NOTICE` et s'arrête.

### Le piège qui reste

Le `seed.sql` contient le **mariage de démonstration** (`demo@studio.test` /
`demo1234`). Il ne doit **jamais** partir en production : `db push` ne le joue
pas, mais `db reset` si. Ne pas lancer `db reset` contre la prod.

---

## 3. Relecture des traductions

`en`, `es`, `it`, `de` sont fiables. **`ja`, `ar`, `zh` et `pt` doivent être
relus par un locuteur natif** avant d'être montrés à de vrais invités.

Ce n'est pas une question d'exactitude mais de **ton** : c'est de la papeterie
de mariage, le registre compte autant que le sens. Une tournure correcte mais
plate abîme le produit.

### Arbitrages à trancher

| Langue | Question |
|---|---|
| `pt` | Portugais européen ou brésilien ? (actuellement : européen — « convosco », « telemóvel ») |
| `ar` | Vouvoiement d'un **foyer** (pluriel) ou d'une **personne** ? |
| `ja` | Niveau de politesse : actuellement 丁寧語. Trop formel pour un mariage entre amis ? |

### Où sont les fichiers

- `landing/messages/{locale}.json` — le faire-part
- `dashboard/messages/{locale}.json` — l'espace des mariés

---

## 4. Champs du contrat encore sans écran

Le piège déjà nommé dans [[Checklist nouveau thème]] : **un champ de
`types.ts` qu'aucun formulaire n'alimente est un champ mort**, même s'il est
rendu par trois thèmes.

Trois ont été réparés le 12/09 (`venue.access`, `dressCode.colors`,
`couple.portrait`). Il en reste.

### Rendus par un thème, jamais alimentés

| Champ | Rendu par | Source manquante |
|---|---|---|
| `copy.scheduleIntro` | ciao-amore, belle-rive | Aucune — 0 occurrence dans le mapper |
| `copy.rsvpIntro` | — | Aucune |
| `copy.footerNote` | ciao-amore | Aucune |

Note : `scheduleIntro` et consorts existent dans `defaults.ts` (donc semés au
départ), mais `toInvitationData` ne les relit nulle part. Ils sont écrits une
fois et perdus.

### Alimentés seulement à moitié

- **`dressCode` en mode `split`** : une seule palette pour les deux colonnes.
  Acceptable, mais à noter si on veut une palette par audience.
- **`copy.venueIntro` / `staysIntro` / `playlistIntro`** : viennent du champ
  `description` des modules concernés. Ça marche, mais le libellé du
  formulaire ne dit pas que ce texte atterrit en intro de section.

### Comment vérifier qu'il n'en reste pas d'autres

Pour chaque champ de `InvitationData` : le chercher dans
`landing/src/lib/to-invitation-data.ts`. Zéro occurrence = champ mort.

---

## 5. Sur-mesure sans aucun module — assumé

Sur le plan Sur-mesure, l'étape modules du studio laisse continuer sans rien
sélectionner. Un couple peut payer 299 € et recevoir un faire-part sans
programme, sans lieu et sans RSVP.

**Décision : laissé en l'état** (2026-09-12). À rouvrir si des commandes
arrivent avec `sites.modules` vide.

---

## Ce qui est fini et vérifié

Pour mémoire, à ne pas refaire :

- Parcours d'achat complet : Stripe → webhook → mariage créé → faire-part en
  ligne → RSVP qui revient au dashboard.
- Les trois thèmes rendent le contenu des mariés, zéro fuite de démo.
- `venue.access` sur les trois thèmes.
- Palette / photo / note du dress code, de bout en bout.
- Écran **Nos mots** (phrases du hero, annonce, mot de la fin, photo du couple).
- Publication séparée du module Jour J, avec bascule au dashboard.
- 12 combinaisons thème × locale en HTTP 200, zéro `MISSING_MESSAGE`.

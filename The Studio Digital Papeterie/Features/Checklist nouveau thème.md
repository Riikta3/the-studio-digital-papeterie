---
date: 2026-09-12
status: actif
category: Features
---

# Checklist — brancher un nouveau thème

Ce qu'il faut faire quand un thème arrive dans `landing/src/components/invitation/themes/<id>/`, **après** le portage décrit dans `themes/README.md` (assets, scoping CSS, polices, sections).

`ciao-amore` est le thème de référence : il a reçu tout ce qui suit et sert de modèle à copier. `belle-rive` et `blanc-couture` **ne l'ont pas encore** — ils rendent, mais restent français et incomplets.

Voir aussi [[Invitation]] et [[Conventions]].

---

## 1. Le contrat avant tout

Un thème **rend**, il ne décide rien. Tout ce qu'il affiche vient de `InvitationData` (`themes/types.ts`).

- [ ] **Zéro contenu dans le JSX.** Pas de nom de lieu, pas de date, pas de ville, pas de photo de couple, pas de texte écrit à la voix des mariés.
  - Le piège : une section qui ne reçoit aucune prop (`<GiftsSection />`) est forcément en dur.
  - Les fuites déjà vues : « vers Mauguio », « sur la Riviera », « À proximité de la Villa », un monogramme « V & G » en valeur par défaut, la photo du couple démo.
- [ ] **Icônes de programme** : utiliser les clés de `ScheduleIcon` (`ceremony`, `cocktail`, `dinner`, `party`, `brunch`). Elles nomment **le moment**, pas le dessin. Le thème mappe ensuite vers son propre visuel.
- [ ] **Champ manquant ?** L'ajouter à `types.ts` plutôt que de le contourner dans le thème. Un thème qui invente une prop locale est un thème qui divergera des autres.
- [ ] **Un champ du contrat qu'aucun écran n'alimente est un champ mort.** Trois fois le même piège : `venue.access`, `dressCode.colors` et `couple.portrait` existaient dans `types.ts`, étaient rendus par un thème ou trois, et n'avaient **aucun écrivain**. La palette en particulier avait été dépinglée du CSS *pour* que chaque mariage choisisse la sienne — et rien ne le permettait. Avant de considérer une section finie : remonter la chaîne jusqu'au formulaire.
- [ ] Le beau contenu spécifique va dans `demo-data.ts` — c'est la vitrine, elle a le droit d'être une belle histoire.

## 2. Les deux modes

`data.weddingId` décide de tout :

- **présent** → vraie invitation, les formulaires persistent
- **absent** → démo, les formulaires confirment et n'écrivent rien

- [ ] **RSVP** : appeler `submitRsvp` avec le garde `if (!weddingId) { setSent(true); return; }`.
  - `belle-rive` et `blanc-couture` affichaient « votre réponse a bien été enregistrée » **sans rien écrire**. Toutes les réponses des invités étaient perdues.
- [ ] **Playlist** : même logique avec `submitPlaylistSuggestions`.
- [ ] **Un échec doit se voir** : message d'erreur + état « Envoi… » sur le bouton. Un formulaire silencieux fait croire à l'invité qu'il a répondu.

## 3. i18n — 9 locales

- [ ] Extraire toutes les chaînes vers `landing/messages/*.json`, namespace `Invitation.<camelId>`, groupé par section.
- [ ] **Client** (`"use client"`) : `useTranslations("Invitation.<id>.<section>")`
      **Serveur** : rendre la fonction `async` + `await getTranslations(...)`
- [ ] ⚠️ **Le hook se déclare tout en haut du composant** — avant tout `return` anticipé, jamais dans un `useEffect`. Erreur commise deux fois.
- [ ] **Pluriels en ICU**, jamais `count > 1 ? "s" : ""` :
      `"{count, plural, one {# titre} other {# titres}}"`
      La règle française est fausse en anglais à zéro et n'a aucun sens en arabe (6 catégories) ou en japonais (aucune).
- [ ] **Dates** : passer `locale` à `formatFrenchDate` / `formatFrenchWeekday` (`useLocale()` ou `await getLocale()`). Le paramètre existe ; s'il n'est pas passé, tout reste en français sur une page traduite.
- [ ] Un tableau qui sert à la fois de clés d'objet et de libellés doit être dissocié (cf. `UNITS` dans le countdown, qui affichait « 01 jours »).
- [ ] Le décor propre au thème reste dans sa langue (ciao-amore garde « Grazie », « dolce vita »).

## 4. Enregistrement et vérification

- [ ] `npm run themes:sync` puis `npx tsc --noEmit -p landing/tsconfig.json`
- [ ] `npm run build:landing` → zéro erreur
- [ ] Ouvrir la démo **et** une vraie invitation (`/fr/invitation/<slug>` avec `sites.theme_id` pointant sur le thème). Les deux doivent tenir.
- [ ] Tester au moins `/fr`, `/en` et `/ar` : l'arabe vérifie le RTL et les pluriels à 6 catégories.
- [ ] Chercher `MISSING_MESSAGE` dans le HTML rendu → doit être absent.
- [ ] `scrollW === clientW` : aucun débordement horizontal.
- [ ] **Regarder les captures** (`npm run themes:shoot -- <id> 1440`). Les bugs de mise en page sont invisibles dans le CSS et évidents à l'image.

## 5. Relecture des traductions

`en`, `es`, `it` sont fiables. **`ja`, `ar`, `zh` et `pt` doivent être relus par un locuteur** avant d'être montrés à de vrais invités — c'est de la papeterie de mariage, le ton compte autant que le sens.

Points à trancher pour `pt` : portugais européen ou brésilien.
Pour `ar` : vouvoiement d'un foyer (pluriel) ou d'une personne.

---

## État actuel

| Thème | Contrat | RSVP persisté | i18n |
|---|---|---|---|
| ciao-amore | ✅ | ✅ | ✅ 9 locales |
| belle-rive | ✅ | ✅ | ✅ 9 locales |
| blanc-couture | ✅ | ✅ | ❌ français |

`venue.access` est désormais rendu par les trois thèmes (2026-09-12). Sur
belle-rive il est **sous** le cadre gravé, pas dedans : `.venue-content` est
l'image `venue-frame.webp`, dimensionnée sur son propre dessin, et plusieurs
modes de quelques lignes débordent de la gravure. Sur blanc-couture il a sa
propre page, pour la même raison au carré (l'ovale est `contain` sur le
viewport) — et cette page est conditionnée au **contenu** autant qu'au module,
sinon une page vide consomme un créneau et inverse l'alternance gauche/droite
de toutes les sections suivantes.

Reste pour blanc-couture : la passe i18n (§3). Ses libellés propres sont encore
en français ; le contenu des accès, lui, est déjà dans les mots des mariés.

---

## Où les mariés écrivent quoi (2026-09-12)

Trois champs du contrat ont reçu leur écran ce jour-là. Un thème peut donc
compter dessus :

| Champ du contrat | Écran |
|---|---|
| `venue.access` | Lieu & infos pratiques (transport / stationnement / accès) ou le module Transport |
| `dressCode.colors` / `.image` / `.note` | Module Dress code |
| `copy.heroKicker` / `.announcement` / `.closing` | **Nos mots** (nouveau) |
| `couple.portrait` | **Nos mots** (nouveau) |

`copy.*` et le portrait sont stockés sur `settings` (migration
`20260912140000`) et arrivent par `resolve_public_slug`. La palette et la photo
du dress code passent par `site_modules.config`, donc par `module-config.ts`.

Les couleurs sont validées **des deux côtés, pour deux raisons différentes** :
l'éditeur n'accepte que `#rrggbb` parce que `<input type="color">` réécrit
silencieusement tout le reste en noir à l'ouverture ; le lecteur accepte aussi
`rgb()`/`hsl()` et jette le reste parce que ces chaînes partent dans un
attribut `style` et que la colonne jsonb est éditable à la main.

Reste sans écran : `dressCode.mode: "split"` côté palette (une seule palette
pour les deux), et `copy.venueIntro`/`staysIntro`/`playlistIntro`, qui viennent
des `description` des modules concernés.

---

## Constats ouverts (hors thèmes)

### Sur-mesure sans aucun module — assumé pour l'instant

Sur le plan Sur-mesure, l'étape modules du studio laisse continuer sans rien
sélectionner : le compteur affiche « aucun sélectionné » mais c'est un simple
libellé, il n'y a ni `disabled` sur le bouton ni garde côté serveur.

Un couple peut donc payer 299 € et recevoir une invitation sans programme,
sans lieu et sans RSVP. Les thèmes masquent correctement ces sections — c'est
leur rôle — mais le contenu semé à l'achat reste invisible.

**Décision : laissé en l'état** (2026-09-12). À rouvrir si des commandes
arrivent avec `sites.modules` vide.

Constaté lors du premier test d'achat de bout en bout.


---
date: 2026-10-02
status: validé
category: Features
---

# Thème Château Royal

Un château de conte au fil d'un jour et d'une nuit : espresso, ivoire et or discret. Id `chateau-royal`, accent `#583b32`, **pleine largeur** (pas de colonne). Polices Bodoni Moda (auto-hébergée, famille « Chateau Royal Bodoni »), Pinyon Script, Jost. Source : `chateau/dist` (HTML/CSS/JS statique). Démo : Éléonore & Raphaël, Vaux-le-Vicomte.

Porté avec [[Thème Maré Alta]] et [[Thème Cabo Verde]]. Voir [[Invitation]], [[Checklist nouveau thème]], [[Conventions]].

## Ce que le thème dessine

Hero (château du jour à la nuit, prénoms, dates), lettre d'ouverture avec monogramme, lieu sous une arche (photo du lieu ou ornement), **frise de programme** qui s'allume au défilement (les événements en plus y apparaissent avec adresse, dress code et leurs moments), menu « royal » avec la **pièce montée animée**, brunch du lendemain, grille pratique (dress code, transport, FAQ, chaque bloc avec son propre `data-editor-section`), RSVP, pied de page avec sceau du monogramme et portrait.

`supports` : les **13 modules** à contenu invité, comme `ciao-amore` (tous sauf les deux livres d'or). `Invitation.chateauRoyal` = 93 clés × 9 langues.

### Les modules que le designer n'avait pas dessinés (2026-10-03)

L'utilisateur l'a relevé (« tu m'as pas fait tous les modules ») : un couple qui choisit ce thème doit pouvoir acheter et voir chaque module. Dessinés dans la grammaire du thème (`modules.css`, chargé après `responsive.css`), placés dans le récit du jour à la nuit :

hero → lettre → **compte à rebours** (chiffres Bodoni gravés entre deux filets d'or) → transition → lieu → **film** (cadre doré sur velours espresso ; YouTube via `youtube-nocookie`, hôte inconnu = rien) → programme → menu → pli de la nuit → **carnet de bal** (playlist : les titres du couple en I, II, III, les propositions des invités continuent en IV…, recherche Spotify) → brunch → **galerie** (cadres dorés, plaque en chiffres romains, `roman.ts`) → petits détails → **où dormir** (cartes des détails, photo sous une arche, `secondary` derrière « Voir plus d'options ») → **mot pour les cadeaux** (lettre cachetée, sceau de cire au monogramme) → RSVP → pied de page.

### Mouvement

Une entrée par nouvelle section (chiffres gravés tour à tour, rideaux de velours qui s'ouvrent sur le film, tableaux qui se balancent à leur clou, cachet de cire pressé) et quatre moments sur les sections du designer : la lettre se déplie depuis son pli, les filets d'or se tracent depuis leur ornement, le sceau du pied de page et le blason du menu s'impriment, une lueur de bougie derrière le pied de page. Seuls `transform`, `opacity`, `clip-path` bougent ; keyframes préfixées `chateau-royal-` ; tout est visible sans JavaScript et figé en mouvement réduit ; rien ne rejoue quand l'éditeur re-rend.

### Contrôle contre la maquette en ligne (2026-10-03)

Audit en lecture seule contre https://invitation-chateau-eleonore-raphael.emiliethestudio.chatgpt.site/ (identique octet pour octet à `chateau/dist`) : polices, tailles, couleurs, coupures de titres et toutes les animations identiques à 390 et 1440. Écarts non voulus corrigés : interlettrage hérité de Tailwind dans les champs, couleur des placeholders, lissage des polices (`antialiased` de l'app → `auto`), « E · R » en haut de la lettre, nom de l'invité dans le remerciement, apostrophes typographiques, hauteur des surtitres. Le fond jaune de l'app au rebond est remplacé par l'espresso via `html:has(.theme-chateau-royal)`.

## Ce qu'il ne dessine pas

- Le film du lieu (remplacé par `venue.image` avec un zoom lent) et la carte de France.
- Les questions RSVP « samedi / dimanche » et « nombre de personnes » : remplacées par présence + accompagnants, ce que le produit stocke.

## Décisions de portage

- Sans JavaScript la frise s'affiche comme une liste statique lisible ; en mouvement réduit tout est allumé et le gâteau reste entier.
- **Bodoni italique** : la page du designer ne charge que la romaine, ses mots en `<em>` sont donc penchés par le navigateur. Le port a retiré la vraie italique pour rendre à l'identique. Pour la rétablir, rajouter le sous-ensemble latin italique dans `fonts.ts`.
- Bodoni Moda est auto-hébergée parce que les autres thèmes chargent la même famille sans axe optique et l'écrasaient.
- Le `?` orphelin du titre RSVP à partir de 1728 px (présent aussi chez le designer) est corrigé.
- Le château du hero est le décor de la collection : il ne change pas avec le lieu du couple.
- Assets : 8 WebP (2,2 Mo), copiés sans ré-encodage.

## Portes de maquette

| Élément | Capture | Réponse de l'utilisateur |
|---|---|---|
| Événements en plus dans la frise | `final2/chateau-royal-heavy-{390,1440}-08-programme.png` | Validé (2026-10-02, « vas y fais tout ») |
| Arche du lieu sans photo (`?fixture=minimal`) | `final2/chateau-royal-minimal-{390,1440}-07-venue.png` | Validé (2026-10-02, « vas y fais tout ») |
| Portrait en pied de page (`?fixture=heavy`) | `final2/chateau-royal-heavy-{390,1440}-14-royal-signoff.png` | Validé (2026-10-02, « vas y fais tout ») |

## Limites connues

- Les captures `heavy` à 1440 px relancées en tout dernier n'ont pas été relues image par image (la mienne, indépendante, ne montre rien d'anormal).
- Le hero à l'état « jour » a un contraste faible du titre sur l'image : c'est le dessin du designer.
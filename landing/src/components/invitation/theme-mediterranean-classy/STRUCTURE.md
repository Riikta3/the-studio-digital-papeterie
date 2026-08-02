# Mediterranean Classy — structure de la VF

Relevé depuis l'export Figma `UI.png` (402 × 10418 px, frame mobile 1x, sRGB).
Les couleurs citées sont échantillonnées sur l'export et recoupées avec les
labels de la page *Design System*. Tokens : `./tokens.ts`.

Fond de page global : `neutral/cream` `#F5F2EB`, avec le grain (`texture-grain.png`)
en overlay ~2 % `mix-blend-mode: darken`, et des pétales blancs détourés
(`flowers-petals.webp`) posés en décor absolu, débordant des bords, à travers
toute la page.

---

## 1. Hero

- Cadre gaufré plein cadre (`paper-frame-portrait-1.webp`), motif lavande en relief.
- Pétales blancs superposés aux quatre coins, débordant hors du cadre.
- « Nous nous marions … » — Cormorant Garamond, `secondary/warm`.
- **Emilie** / *et* / **Jordy** — Ballet 120px, `secondary/warm`. Le « et » est en
  Cormorant Garamond italique, nettement plus petit.
- Date — Cormorant Garamond, `secondary/warm`.

## 2. Scroll indicator

Cercle outlined `primary/default`, flèche ↓ centrée. R:97 (cf. atomes).

## 3. Countdown

- Label « JOUR J DANS » — Cormorant Garamond, `primary/default`, capitales.
- Plaque claire translucide sur le fond gaufré, 4 colonnes séparées par des
  filets verticaux fins : `254 | 12 | 37 | 48`.
- Chiffres : Cormorant Infant Light 40px, `primary/default`.
- Unités : `JOURS / HEURES / MIN / SEC` — Jost 14px, `neutral/muted`, capitales, tracking large.

## 4. Le Programme

- Titre « LE PROGRAMME » — Cormorant Garamond SemiBold 40px, `primary/default`, capitales.
- Sous-titre « Deux jours d'exception » — Jost 18px, `neutral/muted`.
- Filet horizontal court centré (`neutral/muted`).
- Puis, par journée : « JOUR 1 » (Cormorant, `primary/default`) + date (Jost, `neutral/muted`).

**Timeline** — alternance image / créneau, reliés par une ligne verticale
pointillée avec un point plein à chaque nœud :

| Heure | Libellé | Visuel |
|---|---|---|
| 17H00 | Cérémonie laïque | `venue-ceremony-arch` puis `venue-ceremony-aisle` |
| 19H30 | Cocktail | `icon-cocktails` (détouré, sans cadre) |
| 21H30 | Dîner de mariage | `venue-banquet-table` |
| 23H30 | Fête jusqu'au matin | `venue-orangerie` |
| **JOUR 2** — Samedi 13 juin 2027 | | |
| 12H00 | Brunch pool party | `venue-pool` |
| — | (pétanque / tennis) | `venue-petanque`, `venue-tennis` |

Heures : Cormorant Infant SemiBold 40px, `primary/default`.
Libellés : Jost 18px, `neutral/muted`.
Les aquarelles sont pleine largeur, bords fondus (pas de cadre ni de radius).

## 5. Accès & Itinéraires

Carte à **sommet en arche**, fond papier texturé, filet intérieur fin
(`neutral/warm-gray`), et **cul-de-lampe en bas** se terminant par le monogramme
E&J gaufré (`monogram-emboss.webp`).

- « ACCÈS » — Cormorant, `primary/default` / « & ITINÉRAIRES » — Jost, `neutral/muted`.
- Nom du lieu — Cormorant Garamond SemiBold 32px (`heading/lg`), `primary/default`.
- Adresse — Jost, `neutral/muted`.
- `map-domaine-trinite.webp` en carré, ombre `shadow/card`.
- « En voiture » / « En avion » — Cormorant, `primary/default`, avec détails en Jost `neutral/muted`.
- Deux boutons `routeButton` empilés : **VOIR SUR WAZE**, **VOIR SUR GOOGLE MAPS**.

## 6. Hébergements

Fond : `texture-stone-wall.webp` (mur de pierre aquarellé) sur toute la section.

- Titre « HÉBERGEMENTS » + filet + « Sélectionnés pour vous » (Jost, `neutral/muted`).
- Cartes : photo en haut (bord à bord), corps crème gaufré, ombre `shadow/card-dark`.
  - Nom — Cormorant Garamond SemiBold 32px, `primary/default`.
  - Ville — Jost, `neutral/nearBlack`.
  - « 10 MIN DU DOMAINE » — Jost, capitales, `neutral/muted`.
  - Bouton `routeButton` pleine largeur : **JE RÉSERVE**.
  - « -10% AVEC LE CODE XXXX » — Jost SemiBold, capitales, `primary/default`.
- Bouton `optionsButton` centré : **VOIR PLUS D'OPTIONS** (fond `neutral/beige`).

## 7. Playlist participative

Panneau **sauge foncé** pleine largeur (`paper-frame-sage.webp`, fond ≈ `#8B8875`),
bordure ornementale gaufrée sur les 4 côtés.

- « PLAYLIST » — Cormorant, `primary/light` `#42452A`.
- « PARTCIPATIVE » — Jost, `neutral/white`. ⚠️ coquille dans la maquette.
- Filet + « Aidez-nous à créer la bande-son de notre week-end » — Jost, blanc.
- « Votre suggestion » — Cormorant, sombre.
- `textInput` : icône ♫ + placeholder « Titre – Artiste », soulignement seul.
- Bouton `suggestButton` (outlined blanc) : **AJOUTER À LA PLAYLIST**.
- « Déjà proposés » — Cormorant, sombre.
- Liste sur plaque crème : lignes séparées par des filets, icône ♫ dorée,
  titre en Cormorant Garamond `neutral/nearBlack`.

## 8. FAQ

- Titre « FAQ » — Cormorant, `primary/default`.
- Accordéons : plaque crème gaufrée, ombre `shadow/card`.
  - Question — Cormorant Garamond, `primary/default`.
  - Réponse — Jost, `primary/default`, visible seulement à l'état ouvert.
  - `toggleButton` 40×40 à droite : **plein `primary/default` + « − »** quand ouvert,
    **outlined + « + »** quand fermé.

## 9. RSVP

Même carte en arche que la section Accès (arche en haut, cul-de-lampe et
monogramme en bas).

- « RSVP » — Cormorant, `primary/default` / « VOTRE PRÉSENCE COMPTE » — Jost, `neutral/muted`.
- Intro — Jost, `primary/default`, centré.
- Groupes de champs, label en Jost capitales `primary/default` :
  - **PRÉSENCE** — 2 radios : « Oui, je serai là avec grand plaisir » / « Non, mais je penserai fort à vous ».
  - **QUI SERA PRÉSENT ?** — 2 radios : « Moi uniquement » / « Moi + mon/ma partenaire ».
  - **RESTRICTIONS ALIMENTAIRES** — select (Cormorant, chevron), stroke `#BABCAB`.
  - **ALLERGIES** — `textArea` 321×80, stroke `#BABCAB`.
- « Merci de répondre avant le … » — Jost SemiBold, `primary/default`.
- Bouton `routeButton` pleine largeur : **ENVOYER MA RÉPONSE**.

## 10. Footer

- Aquarelle `venue-domaine-trinite.webp` pleine largeur, chevauchée par le bas de
  la carte RSVP en arche.
- Plaque `neutral/beige` texturée (`texture-footer.webp`, multiply 72 %).
- « MERCI ! » — Cormorant, `primary/default` + filet.
- « Emilie & Jordy » — Jost SemiBold, `primary/default`.
- Date — Jost, `neutral/muted`.

---

## Incohérences relevées dans la maquette

Contenu de remplissage, mais à trancher avant de figer les données de démo :

- Dates contradictoires : hero « 4 juillet 2027 », programme « 12–13 juin 2027 »,
  RSVP « 14 Novembre 2026 » puis « 15 mai 2025 », footer « 6 juillet 2026 ».
- « PARTCIPATIVE » → *PARTICIPATIVE*.
- Adresse « 34130 Mauguio » (Hérault) alors que la carte situe le domaine entre
  Cannes et Nice.
- La carte hébergement est dupliquée à l'identique (Le Mas Candille ×2).

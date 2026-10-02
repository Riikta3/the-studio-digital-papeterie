---
date: 2026-10-02
status: validé
category: Features
---

# Thème Maré Alta

Broderie sur lin sauge, pins parasols et glycines : un mariage dans une villa de l'Atlantique. Id `mare-alta`, accent `#4d5845`, polices Bodoni Moda / Jost / Cormorant Garamond, **colonne centrée de 720 px**. Source : le dossier du designer `Invitation_Mare_Alta_FINAL_Tarik_2026-09-30` (Next/React, CSS en 12 couches). Démo : Sienna & Malo, Comporta.

Porté en même temps que [[Thème Château Royal]] et [[Thème Cabo Verde]], avec le socle décrit dans [[Conventions]] (section « Porter un thème du designer »). Voir aussi [[Invitation]] et [[Checklist nouveau thème]]. Spec : `docs/superpowers/specs/2026-10-02-three-themes-design.md`.

## Ce que le thème dessine

Hero (prénoms, date, monogramme, ligne d'annonce), barre flottante de trois raccourcis (lieu, programme, réponse), compte à rebours en quatre cartes, lieu avec itinéraire et « ajouter à l'agenda », programme avec le bloc **« Et aussi »** (événements des autres jours et leurs moments), dress code (pastilles de couleurs), hébergements, transport (`venue.access`), menu, playlist (recherche Spotify), cadeaux (un lien), RSVP, FAQ (première question ouverte), deux blocs **Jour J** (« Trouve ta place », « Partage tes photos »), pied de page avec le portrait du couple.

`supports` : countdown, timeline, dress-code, map, accommodation, transport, menu, playlist, gift-list, rsvp, faq. **31 slots** dans `editor.ts`, `Invitation.mareAlta` = 121 clés × 9 langues.

## Ce qu'il ne dessine pas

- **Galerie et vidéo d'introduction** : le design n'a pas de section pour eux. L'éditeur le dit au couple s'il a acheté le module.
- **La jarre de messages** : aucune fonctionnalité invité derrière (le module `guestbook` existe, pas son côté invité). Sous-projet séparé, voir [[Reste à faire]].
- Retirés du design parce que le produit ne sait pas les honorer : lecteur audio et sa liste fixe de 4 titres, IBAN et barre de progression de la cagnotte, tampon GPS (remplacé par ville · pays), e-mail / téléphone / arrivée / hébergement / cases dîner et brunch / âges des enfants dans le RSVP, « modifiable jusqu'au… », covoiturage intégré.

## Décisions de portage

- **Contrat produit d'abord** : le RSVP ne pose que ce que `submitRsvp` stocke (présence, nom, accompagnants, allergies, mot).
- **Le Jour J est un lien, jamais un module** : les deux boutons mènent à `/jourj/<slug>/ma-table` et `/photos` quand le mariage a un `weddingId` ; inertes dans la démo et l'aperçu. La page invité est en français et sans thème (connu).
- Le canvas à gratter du compte à rebours n'existe pas : le CSS final du designer le masque, la référence en ligne aussi. La lueur qui suit le pointeur non plus.
- Étiquette de valise : le fichier du designer portait les initiales de la démo ; retouchée (`embroidered-luggage-tag-blank-v10.webp`), le monogramme du couple s'inscrit en CSS.
- Assets : 18 PNG (43 Mo) devenus 16 WebP (5,5 Mo).
- Noms longs : le titre du hero passe en taille réduite (`data-long`) au-delà de 9 caractères par prénom.
- Barre flottante : le plan la croyait masquée par le CSS final, elle est en fait visible sur la référence ; restaurée sans son 4e bouton (la musique, déjà assurée par le bouton du produit).

## Portes de maquette (éléments sans équivalent dans le design)

| Élément | Capture | Réponse de l'utilisateur |
|---|---|---|
| Bloc « Et aussi » du programme | `gates/mare-alta-{390,1440}-06-program_coral-section.png` | Validé (2026-10-02, « vas y fais tout ») |
| Monogramme du hero | `gates/mare-alta-{390,1440}-03-hero.png` | Validé (2026-10-02, « vas y fais tout ») |
| Portrait en pied de page (`?fixture=heavy`) | `gates/mare-alta-heavy-{390,1440}-17-footer.png` | Validé (2026-10-02, « vas y fais tout ») |
| Blocs Jour J | `gates/mare-alta-{390,1440}-14-photos…` et `…-16-dayof…` | Validé (2026-10-02, « vas y fais tout ») |

## Limites connues

- Le lien Jour J avec un vrai `weddingId` n'a été vérifié que par la lecture du code.
- Le citron brodé du menu effleure la lettre « d » du titre « du grand jour » à 1440 px.
- En arabe, `letter-spacing: 0` sur toute la page élargit les titres latins (« Casa Maré Alta » passe sur deux lignes à 1440 px).
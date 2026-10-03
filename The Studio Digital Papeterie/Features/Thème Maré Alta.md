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

`supports` : les **13 modules** à contenu invité, comme `ciao-amore` (tous sauf les deux livres d'or). `Invitation.mareAlta` = 137 clés × 9 langues.

### Galerie et vidéo d'introduction (2026-10-03)

Dessinées dans la recette du designer (`modules.css`), sur des bandes `coral-section` pour garder l'alternance papier / nuit / corail :
- **Film**, juste après le compte à rebours : passe-partout de soie ivoire, filet d'or, point avant cousu à 8 px, rangée de perles en haut et en bas. Hôte d'embed inconnu = rien ; fichier = `<video controls>`.
- **Galerie**, entre la playlist et les cadeaux : tirages sur passe-partout, point de croix doré à chaque coin (une large, puis deux côte à côte ; un tirage seul en fin prend toute la largeur). Chaque tirage ouvre une visionneuse `<dialog>` (précédent/suivant, compteur, flèches, glisser — inversé en arabe, Échap, retour du focus).

### Mouvement

Le point se coud tout seul autour du film puis les perles s'enfilent ; les tirages se posent en tournant légèrement, puis leurs points de croix se resserrent. Sur les sections du designer : les fils d'or du compte à rebours se tirent depuis le centre et les cartes s'ouvrent tour à tour, chaque médaillon du programme pivote quand sa carte arrive, le tampon de la ville est pressé sur la photo du lieu. Keyframes préfixées `mare-alta-`.

### Contrôle contre la maquette en ligne (2026-10-03)

Audit contre https://sienna-malo-mare-alta.emiliethestudio.chatgpt.site (mêmes 15 sections et textes que la source) : polices, couleurs, colonne et toutes les animations identiques sur ~150 éléments. Corrigés : sous-titres « On aime / On évite » (une première ligne courte devient le titre), intro du menu (slot `menu.intro`, vide par défaut), marges et dernier filet de la FAQ, tampons des hébergements sur une ligne (date courte « 2–4 avr. »), titres datés « Le récit du 3 avril » / « Le menu du 3 avril » (date du couple, spec D2), libellés RSVP du designer, monogramme brodé de l'étiquette, bouton d'envoi de la playlist en sauge plein (`aria-disabled`), textes de démo indépendants de la saison, fond au rebond (`html:has(.theme-mare-alta)`).

## Ce qu'il ne dessine pas

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
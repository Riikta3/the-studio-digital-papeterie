---
date: 2026-10-02
status: validé
category: Features
---

# Thème Cabo Verde

Pieds dans le sable, eau turquoise et bateaux colorés : un mariage tropical au bord de l'océan. Id `cabo-verde`, accent `#3aaeb5`, polices Bodoni Moda et Pinyon Script, **colonne centrée de 680 px**. Source : `Invitation_Beach_Paula_Ricardo_FINAL_Tarik_2026-10-02/site` (HTML/CSS/JS statique). Démo : Paula & Ricardo, Baía das Gatas, São Vicente.

Porté avec [[Thème Maré Alta]] et [[Thème Château Royal]]. Voir [[Invitation]], [[Checklist nouveau thème]], [[Conventions]].

## Ce que le thème dessine

Hero (bateaux, prénoms, tampon lieu · date), accueil, **compte à rebours à chiffres qui se retournent**, lieu, itinéraire en **onglets** (un par événement du couple), dress code (photo facultative), hébergements (photos facultatives), **playlist participative** (recherche Spotify, jusqu'à 3 titres), **carnet de voyage** (passeport, billet d'avion, avion, puis une carte numérotée par moyen d'accès `venue.access`), RSVP, pied de page avec portrait.

`supports` : countdown, map, timeline, dress-code, accommodation, playlist, transport, rsvp. **19 slots**, `Invitation.caboVerde` = 80 clés × 9 langues.

## Ce qu'il ne dessine pas

- **Menu, FAQ, liste de cadeaux, galerie, vidéo d'introduction** : pas de section dans le design.
- Retirés du design source : la porte d'ouverture, le calendrier, la carte postale, le disque, les boutons play et les durées, le formulaire libre de chanson, les notes « Elle / Lui », le prénom et le nom séparés dans le RSVP.

## Décisions de portage

- Assets : 52 PNG (82 Mo) dans le dossier source, dont la moitié jamais référencée ; les 25 utilisés pèsent 4,8 Mo en WebP.
- **Le billet d'avion portait la destination et la date de la démo dessinées dans l'image** (le test anti-fuite ne lit pas les images). Le texte du billet est effacé du fichier et remplacé par du HTML posé dessus : destination = ville ou nom du lieu, date du mariage, pays, étiquettes traduites (`travel.ticketDestination`, `ticketDate`, `ticketCountry`). Une ligne sans valeur n'est pas dessinée. Ne pas remettre l'original.
- Le guitariste ne bougeait dans aucune règle de la feuille finale : un balancement lent a été ajouté (coupé en mouvement réduit). Le retournement des chiffres du compte à rebours ne jouait jamais chez le designer ; il joue ici.
- Le carnet de voyage s'affiche si `transport` ou `map` est actif et seulement s'il y a des `venue.access`.
- `loading="lazy"` sans dimensions réservées sur les décors : le ponton et la guitare peuvent décaler la mise en page tant qu'ils ne sont pas chargés (visible seulement sans défilement).

## Portes de maquette

| Élément | Capture | Réponse de l'utilisateur |
|---|---|---|
| Portrait en pied de page (`?fixture=heavy`) | `final-matrix/cabo-verde-heavy-{390,1440}-13-beach-footer.png` | Validé (2026-10-02, « vas y fais tout ») |
| Photos des hébergements | `final-matrix/cabo-verde-heavy-{390,1440}-09-section_stay.png` | Validé (2026-10-02, « vas y fais tout ») |
| Photo du dress code | `final-matrix/cabo-verde-heavy-{390,1440}-08-section_dress.png` | Validé (2026-10-02, « vas y fais tout ») |
| Photo du lieu | `final-matrix/cabo-verde-heavy-{390,1440}-06-section_venue.png` | Validé (2026-10-02, « vas y fais tout ») |
| Billet d'avion à texte variable | `scratchpad/ticket/fr-heavy-390.png` | Validé (2026-10-02, « vas y fais tout ») |

## Limites connues

- Sans JavaScript, le compte à rebours reste à « 000 00 00 00 ».
- Deux noms de fichiers d'assets contiennent des mots de la démo sans jamais être affichés (`mindelo-calendar-v3.webp`, `baia-ceremony-v2.webp`) : le pipeline exige que le CSS généré trouve ses fichiers.
- Le rendu côté éditeur (aperçu client du Root) a été vérifié par l'orchestrateur : OK.
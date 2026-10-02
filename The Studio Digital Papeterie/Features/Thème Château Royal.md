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

`supports` : timeline, menu, map, dress-code, faq, transport, rsvp. **15 slots**, `Invitation.chateauRoyal` = 50 clés × 9 langues.

## Ce qu'il ne dessine pas

- **Compte à rebours, hébergements, playlist, liste de cadeaux, galerie, vidéo d'introduction** : le design n'a pas de place pour eux.
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
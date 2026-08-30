# Carte d’intégration back-office

| Zone visible | Champs administrables | Type recommandé |
|---|---|---|
| Hero | prénoms, date, lieu, sur-titre | chaînes + date ISO |
| Compte à rebours | date/heure cible, fuseau | datetime + timezone |
| Programme | jour, heure, titre, description, image | liste ordonnée |
| Brunch | date, heure, description, consigne | objet événement |
| Dress code | titre, texte, couleurs, visuel | objet + liste de couleurs |
| Lieu | nom, adresse, image, Maps, Waze | objet lieu |
| Où dormir | nom, distance, adresse, URL | liste ordonnée |
| Playlist | titre, artiste, auteur invité, statut | liste modérée |
| FAQ | question, réponse, ordre, publication | liste ordonnée |
| RSVP | deadline, présence, accompagnant, régime, message | formulaire versionné |
| Footer | phrase, date, lieu | chaînes |

## Découpage React recommandé

- `InvitationPage` : récupère et orchestre les données publiées.
- `HeroSection`, `CountdownSection`, `ProgramSection`, `VenueSection`, `StaysSection` : composants de présentation.
- `PlaylistForm` et `RsvpForm` : Client Components isolés.
- `InvitationThemeProvider` : variables de thème si plusieurs collections utilisent la même base.

## Points à ne pas casser

- Le hero mobile utilise une composition verticale spécifique pour Alba, le « & » solaire et Elio.
- Le set de valises est décoratif (`aria-hidden`) et doit rester petit en bas de la section hébergements.
- Les animations doivent respecter `prefers-reduced-motion`.
- Les boutons et champs doivent rester utilisables au clavier.
- Les visuels sont référencés depuis `/public/dolce/...`.

## Données privées

Les réponses RSVP, tokens invités, informations alimentaires et noms de partenaires ne doivent jamais être inclus dans le payload public de l’invitation. Ils sont accessibles uniquement dans le back-office authentifié.

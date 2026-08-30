# Intégration au back-office des mariés

## 1. Principe

L’invitation doit rester un composant de présentation. Les contenus, réponses et permissions doivent venir du back-office The Studio via API. Le navigateur ne doit jamais contenir de secret Spotify, de clé SMS ou de droit d’administration.

## 2. Données administrables

Le back-office doit permettre aux mariés de modifier :

- prénoms, date, heure, lieu et date limite de réponse ;
- textes d’introduction et de conclusion ;
- programme et horaires ;
- dress code ;
- hôtels ;
- FAQ ;
- activation des modules RSVP, +1, welcome dinner, brunch, covoiturage et playlist ;
- URL Google Maps, Waze et Spotify.

Le modèle conseillé est fourni dans `invitation-data.example.json`.

## 3. RSVP

Endpoint conseillé : `POST /api/invitations/:invitationId/rsvps`

Champs à enregistrer :

- `guestId` ou jeton individuel d’invitation ;
- prénom et nom ;
- présence au mariage ;
- nombre de participants ;
- identité du +1 lorsqu’il est activé ;
- présence au welcome dinner ;
- présence au brunch ;
- régime alimentaire ;
- consentement et horodatage.

Le back-office doit permettre la modification manuelle, l’export CSV, le filtrage et les statistiques de présence.

## 4. Covoiturage

Endpoints conseillés :

- `GET /api/invitations/:invitationId/rides`
- `POST /api/invitations/:invitationId/rides`
- `PATCH /api/rides/:rideId`
- `DELETE /api/rides/:rideId`

Ne jamais afficher publiquement le téléphone ou l’e-mail sans consentement explicite. Un invité peut proposer ou rechercher un trajet. Le back-office sert uniquement à modérer ; les mariés ne doivent pas gérer les places à la main.

## 5. Playlist participative

Option simple recommandée : enregistrer les propositions dans la base, puis les afficher dans le back-office pour validation par les mariés.

Option Spotify automatique : après validation, le serveur utilise OAuth Spotify pour ajouter le morceau à la playlist. Le token Spotify reste exclusivement côté serveur. Prévoir une recherche de titre/artiste et stocker `spotifyTrackId` pour éviter les doublons.

Endpoints conseillés :

- `POST /api/invitations/:invitationId/song-suggestions`
- `GET /api/invitations/:invitationId/song-suggestions`
- `POST /api/song-suggestions/:id/approve`

## 6. Sécurité et qualité

- Token d’invité signé ou lien personnel non prédictible.
- Validation serveur de toutes les entrées.
- Rate limiting sur les formulaires publics.
- Protection anti-spam discrète.
- Journalisation des modifications.
- RGPD : durée de conservation, export et suppression des données.
- Aucun secret dans les variables `NEXT_PUBLIC_*`.

## 7. Responsive et animations

La version fournie est mobile-first. Les titres sont centrés mathématiquement après leur animation. Les animations utilisent `IntersectionObserver` et doivent rester désactivables avec `prefers-reduced-motion`. Ne pas transformer les fonds en vidéos : la direction artistique repose sur un papier blanc immobile et une typographie cinétique subtile.

## 8. Critères de recette

- Aucun débordement horizontal entre 320 px et 430 px.
- Tous les titres restent centrés avant, pendant et après l’animation.
- Aucun séparateur blanc visible entre les sections.
- RSVP avec +1 conditionnel fonctionnel.
- Welcome dinner et brunch enregistrés séparément.
- Soumission impossible deux fois pendant le chargement.
- Erreurs API compréhensibles et non destructives.
- Liens Maps/Waze ouverts correctement.
- Navigation clavier et labels accessibles.

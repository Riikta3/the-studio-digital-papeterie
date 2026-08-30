# Contrat API recommandé

Les chemins peuvent être adaptés à l'architecture existante de The Studio. Toutes les écritures doivent être validées côté serveur, limitées en fréquence et rattachées au mariage courant.

## Configuration publiée

`GET /api/public/weddings/:slug`

Retourne uniquement les données publiques publiées : identité, lieu, programme, dress code, hébergements, FAQ, cadeaux et modules actifs.

## RSVP

- `GET /api/invitations/:token` : récupère le foyer, les événements autorisés et la réponse existante.
- `PUT /api/invitations/:token/rsvp` : crée ou remplace la réponse du foyer de manière idempotente.

Corps recommandé :

```json
{
  "attendance": "yes",
  "attendanceMode": "partner",
  "partnerName": "Prénom Nom",
  "dietaryRestriction": "none",
  "dietaryDetails": "",
  "events": {}
}
```

## Playlist

- `GET /api/public/weddings/:slug/songs` : propositions approuvées.
- `POST /api/invitations/:token/songs` : nouvelle proposition.
- `PATCH /api/admin/weddings/:weddingId/songs/:songId` : modération.

## Covoiturage

- `GET /api/invitations/:token/carpool` : trajets visibles pour ce mariage.
- `POST /api/invitations/:token/carpool` : nouveau trajet avec consentement.
- `PATCH /api/admin/weddings/:weddingId/carpool/:tripId` : modération ou mise à jour.
- `DELETE /api/admin/weddings/:weddingId/carpool/:tripId` : suppression contrôlée.

Le numéro de téléphone ne doit pas être renvoyé dans un endpoint public anonyme.

## Administration

- `GET /api/admin/weddings/:weddingId/dashboard`
- `GET|PUT /api/admin/weddings/:weddingId/content`
- `POST /api/admin/weddings/:weddingId/publish`
- `GET /api/admin/weddings/:weddingId/rsvps`
- `GET /api/admin/weddings/:weddingId/export`

## Idempotence et sécurité

- Utiliser un identifiant stable de foyer/invité pour le RSVP.
- Accepter une clé d'idempotence sur les écritures sensibles.
- Vérifier `weddingId` et les droits côté serveur à chaque requête.
- Conserver un historique minimal des publications et modifications manuelles.
- Ne jamais placer de secret ou de droit d'administration dans le client React.


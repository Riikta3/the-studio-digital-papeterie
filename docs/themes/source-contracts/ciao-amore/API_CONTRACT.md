# Contrat API conseillé

Préfixe proposé : `/api/v1`.

## Lecture de l’invitation

`GET /api/v1/invitations/:slug`

Retourne uniquement les données publiées nécessaires au rendu public. Ne jamais retourner les listes d’invités, notes internes ou statistiques du couple.

## RSVP

`POST /api/v1/invitations/:slug/rsvp`

```json
{
  "guestToken": "token-opaque",
  "fullName": "Prénom Nom",
  "attendance": "yes",
  "partyMode": "partner",
  "partnerName": "Prénom Nom",
  "dietaryRestrictions": ["vegetarian"],
  "message": "Message facultatif"
}
```

Règles serveur :

- vérifier le token invité et l’invitation associée ;
- refuser `partnerName` vide lorsque `partyMode = partner` ;
- limiter la longueur des champs et normaliser les valeurs ;
- appliquer une protection anti-spam et un rate limit ;
- faire un upsert idempotent pour permettre une modification ultérieure ;
- journaliser la date de consentement sans exposer les réponses entre invités.

## Playlist

`POST /api/v1/invitations/:slug/playlist-suggestions`

```json
{
  "guestToken": "token-opaque",
  "title": "Titre",
  "artist": "Artiste"
}
```

Prévoir un statut `pending | approved | rejected` dans le back-office. Ne pas publier automatiquement une suggestion dans Spotify sans validation.

## Hébergements et FAQ

Peuvent être inclus dans la réponse publique de l’invitation. Les modifications back-office doivent invalider le cache ou déclencher une revalidation du slug concerné.

## Réponses HTTP

- `200/201` : succès.
- `400` : données invalides.
- `401/403` : token absent ou non autorisé.
- `404` : invitation inconnue ou non publiée.
- `409` : conflit métier.
- `429` : trop de requêtes.
- `500` : erreur interne, sans détail sensible côté client.

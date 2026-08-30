# Checklist avant mise en production

## Affichage

- [ ] Hero complet sur iPhone et Android, sans texte coupé.
- [ ] Alba, « & » et Elio suffisamment espacés.
- [ ] Date affichée : 05 janvier 2027.
- [ ] Compte à rebours calculé avec le fuseau Europe/Paris ou Europe/Rome.
- [ ] Aucun débordement horizontal.
- [ ] Set de valises discret et non coupé.
- [ ] Animations désactivées si l’utilisateur réduit les mouvements.

## Données

- [ ] Les contenus du back-office remplacent les valeurs de démonstration.
- [ ] Les changements publiés invalident correctement le cache.
- [ ] Les URLs externes sont validées et ouvertes de façon sécurisée.

## RSVP

- [ ] Token invité vérifié côté serveur.
- [ ] Nom du partenaire obligatoire uniquement en mode accompagné.
- [ ] Modification d’une réponse existante possible.
- [ ] Confirmation visible après envoi.
- [ ] Erreurs réseau et validation affichées clairement.
- [ ] Export CSV disponible uniquement au couple/administrateur.

## Playlist

- [ ] Suggestion enregistrée avec statut `pending`.
- [ ] Modération disponible dans le back-office.
- [ ] Protection anti-spam active.

## Sécurité et RGPD

- [ ] Collecte limitée aux données utiles.
- [ ] Durée de conservation définie.
- [ ] Suppression/export des données possible.
- [ ] Secrets uniquement côté serveur.
- [ ] Rate limiting et logs sans données sensibles.

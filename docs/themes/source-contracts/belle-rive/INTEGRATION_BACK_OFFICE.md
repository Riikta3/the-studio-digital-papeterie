# Branchement au back-office mariés

## Principe

Le back-office modifie le contenu, l'ordre et la visibilité des modules, mais ne modifie pas la structure graphique du thème Riviera. La publication doit créer une version figée et permettre de revenir à la dernière version publiée.

## Données administrables

### Identité et hero

- Prénoms du couple
- Date et heure du mariage
- Nom et adresse du lieu
- Sous-titre
- Visuel des prénoms
- Musique activée/désactivée au niveau produit, mais désactivée pour Émilie & Jordy

### Programme

- Jours, dates, horaires, titres, descriptions, ordre et visibilité
- Média associé à chaque moment
- Informations du brunch et activités

### Dress code

- Titre, texte, palette, recommandations et visuels

### Hébergements

- Nom, localisation/distance, offre, note, URL, catégorie, ordre et visibilité
- Aucun pictogramme flèche ajouté automatiquement aux liens

### FAQ

- Question, réponse, ordre et visibilité

### RSVP

- Date limite
- Texte d'introduction
- Présence/absence
- Autorisation et identité du +1
- Restrictions alimentaires et précision libre
- Événements optionnels activés pour le mariage
- Horodatage et source de la réponse

Le formulaire doit mettre à jour une réponse existante au lieu d'en créer une seconde. Un double clic ne doit jamais générer de doublon.

### Playlist

- Activation du module
- Titre et artiste proposés
- Invité ou foyer source
- Statut : en attente, approuvé, refusé
- Date de création

Cette invitation ne comporte ni bouton « Écouter », ni lecteur musical.

### Covoiturage

- Activation du module
- Prénom du conducteur
- Ville de départ
- Date et heure
- Nombre de places
- Trajet retour proposé ou non
- Téléphone WhatsApp
- Consentement d'affichage
- Statut de modération

Tous les trajets doivent porter un `weddingId`. L'affichage doit rester « Ville vers Mauguio », sans flèche ni emoji directionnel.

## Permissions

- The Studio : création du mariage, choix du thème, activation des modules, support et accès global.
- Mariés : accès uniquement à leur mariage, édition des contenus autorisés, suivi, export et modération.
- Invités : consultation et actions autorisées par leur lien personnel.

## Critères de recette

- Affichage mobile et ordinateur fidèle à la version fournie.
- Les données de deux mariages ne se croisent jamais.
- Les validations sont faites côté serveur.
- Les erreurs sont compréhensibles et les doubles soumissions bloquées.
- Les RSVP, +1, restrictions, chansons et trajets apparaissent dans le bon back-office.
- Les exports correspondent aux données affichées.
- Les flèches type iPhone et le bouton « Écouter » ne réapparaissent pas après publication depuis le back-office.


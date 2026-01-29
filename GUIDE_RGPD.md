# Guide RGPD & Cookies - Meet My Wedding

Ce document détaille les éléments mis en place pour la conformité RGPD et les procédures à suivre.

## 1. Bannière de Consentement (Cookies)

Une bannière de consentement a été ajoutée (`src/components/cookie-consent.tsx`). Elle apparaît automatiquement pour tous les nouveaux visiteurs en bas de l'écran.

### Fonctionnement technique
- **Stockage du choix** : Le choix de l'utilisateur est sauvegardé dans le `localStorage` du navigateur sous la clé `cookie_consent`.
  - Valeur `accepted` : L'utilisateur a accepté.
  - Valeur `declined` : L'utilisateur a refusé.
- **Persistance** : Tant que l'utilisateur ne vide pas son cache, la bannière ne s'affiche plus une fois le choix fait.

### Ajouter des scripts de tracking (Google Analytics, Pixel...)
Actuellement, la bannière gère uniquement l'affichage et le stockage du consentement. Si vous souhaitez activer des outils comme Google Analytics uniquement après acceptation :

1. Ouvrez `src/components/cookie-consent.tsx`.
2. Dans la fonction `handleAccept`, ajoutez le code d'initialisation ou changez un état global qui charge les scripts.
3. Exemple :
   ```typescript
   const handleAccept = () => {
     localStorage.setItem("cookie_consent", "accepted");
     setIsVisible(false);
     // Initialiser Google Analytics ici
     // window.gtag('config', 'GA_MEASUREMENT_ID', ...);
   };
   ```

## 2. Page de Politique de Confidentialité

La bannière contient un lien "En savoir plus" qui redirige vers `/privacy`.
**Action Requise** : Vous devez créer la page correspondante si ce n'est pas déjà fait.

1. Créez le fichier `src/app/[locale]/privacy/page.tsx`.
2. Insérez-y vos mentions légales.

**Contenu obligatoire pour le RGPD :**
- **Identité** : Nom de l'entreprise/éditeur, coordonnées.
- **Données collectées** : Noms, emails, dates de mariage, adresses, etc.
- **Finalité** : Pourquoi collectez-vous ces données ? (Gestion des commandes, RSVP, statistiques...).
- **Destinataires** : Qui voit ces données ? (Vous, hébergeur, processeur de paiement).
- **Durée de conservation** : Combien de temps gardez-vous les données (ex: 12 mois après le mariage).
- **Vos droits** : Expliquer que l'utilisateur peut demander accès, rectification ou suppression.

## 3. Procédure de Suppression des Données (Droit à l'oubli)

Si un utilisateur (marié ou invité) vous contacte pour exercer son "droit à l'oubli", voici la procédure à suivre :

### A. Données dans le Navigateur (Côté Client)
Les données de commande en cours (panier) sont stockées localement via `use-order-store.ts` (Zustand persist).
- Ces données sont sur l'appareil de l'utilisateur.
- Vous ne pouvez pas les supprimer à distance, mais elles ne sont pas sur vos serveurs tant que la commande n'est pas validée.
- L'utilisateur peut les effacer en vidant le cache de son navigateur.

### B. Données sur le Serveur / Base de Données
Si vous stockez les commandes, comptes utilisateurs ou réponses RSVP dans une base de données (ex: lors de la validation d'une commande) :

1. **Recherche** : Connectez-vous à votre base de données ou Dashboard Admin.
2. **Identification** : Recherchez l'utilisateur par son adresse email.
3. **Suppression** :
   - Supprimez l'enregistrement de l'utilisateur (Table `Users`).
   - Supprimez les commandes associées (Table `Orders`).
   - Supprimez les données des invités/RSVP liés à ce mariage.
4. **Confirmation** : Envoyez un email à la personne pour lui confirmer que toutes ses données ont été effacées de vos serveurs.

### C. Services Tiers
N'oubliez pas les données stockées ailleurs :
- **Stripe** (Paiement) : Connectez-vous au Dashboard Stripe > Clients > Rechercher l'email > Supprimer le client.
- **Emails / Marketing** : Si vous utilisez un outil d'emailing, supprimez le contact de vos listes.

## 4. Résumé des tâches restantes
- [ ] Créer la page `/privacy` avec le texte juridique.
- [ ] Si vous ajoutez Google Analytics plus tard, connectez-le à la bannière.

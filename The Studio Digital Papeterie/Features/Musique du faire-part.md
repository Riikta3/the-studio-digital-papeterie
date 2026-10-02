---
date: 2026-10-02
status: done
category: feature
---

# Musique du faire-part

Option `custom-music` (10 €, checkout uniquement). Spec : `docs/superpowers/specs/2026-10-02-invitation-music-design.md`.

- **Invités** : la musique démarre au premier tap (les navigateurs bloquent le son sans geste ; un swipe sur iOS ne compte pas, on attend le tap suivant). Icône sticky en haut à droite (`InvitationMusic.tsx`), montée par la page à côté du thème — aucun thème ne la connaît. Le choix « coupé » est mémorisé par mariage dans le navigateur. Pause quand l'onglet est masqué. Muette dans l'iframe du mockup de l'accueil.
- **Démos** : jouent le morceau par défaut, pour vendre l'option.
- **Dashboard** `/musique` : interrupteur, bibliothèque, envoi d'un fichier. L'envoi va du navigateur à Supabase Storage par URL signée — Vercel refuse les corps de requête > 4,5 Mo.
- **Ajouter un morceau** : une entrée dans `shared/data/music-library.ts` + le fichier dans `music/library/`. Retirer un morceau est sans risque (retour au défaut).
- **Thème qui veut déplacer l'icône** : `.invitation-music[data-theme="<id>"]` dans son `responsive.css`.

## Pièges

- `dashboard/.env.local` pointe sur la prod : en local, lancer le dashboard avec les variables Supabase locales en ligne de commande.
- iOS ignore `audio.volume` : pas de fondu sur iPhone.
- `uploadIntroVideo` passe 100 Mo par une server action : même limite Vercel, probablement cassé en prod (hors périmètre).

Liens : [[Base de Données]], [[Conventions]].
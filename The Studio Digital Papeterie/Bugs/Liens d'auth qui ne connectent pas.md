---
date: 2026-09-28
status: resolved
category: bug
---

# Liens d'auth qui ne connectent pas (magic link + reset)

## Symptômes
- Le lien de connexion reçu depuis la page login ramène sur la page login.
- Le lien « Réinitialiser votre mot de passe » idem, ou une 404.

## Causes
1. **`redirect_to` hors allowlist → repli silencieux sur `site_url`.** En local, `dashboard/.env.local` pointait Supabase vers la stack locale mais `NEXT_PUBLIC_DASHBOARD_URL` vers la prod Vercel. Supabase local ne connaît pas cette URL, donc il redirige vers `http://127.0.0.1:3003/#access_token=…` — la racine, pas `/auth/confirm`. Le `proxy.ts` voit un visiteur anonyme, renvoie vers `/fr/login`, et les jetons du fragment sont perdus.
2. **Reset vers `/fr/update-password` = 404.** `update-password` vit hors `[locale]` ; `auth-email.ts` ajoutait le préfixe de locale à tous les `next`.

## Correctifs
- `.env.local` du dashboard : `NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3003` (même base que Supabase).
- `dashboard/src/lib/auth-email.ts` : `reset` → `next=/update-password` sans locale.

## À retenir
- Supabase **n'échoue pas** sur un `redirect_to` inconnu : vérifier l'allowlist (local : `supabase/config.toml`, prod : Authentication → URL Configuration) dès qu'un lien « marche » mais atterrit au mauvais endroit.
- Test rapide : `generate_link` via l'admin API puis `curl -w '%{redirect_url}'` sur l'`action_link`.

Voir [[Conventions]].

## Suite — reset en prod : connecté mais pas de changement de mot de passe
La prod (ancien code) envoyait `next=/fr/update-password` → 404 **après** avoir ouvert la session : le couple se retrouvait dans le dashboard sans jamais changer son mot de passe. Garde-fous ajoutés :
- `proxy.ts` : `/<locale>/update-password` → 307 vers `/update-password` (couvre les emails déjà envoyés, valides 24 h).
- `auth/session/page.tsx` : un fragment `type=recovery` force `next=/update-password`, quel que soit le `next` reçu.
- Leçon : un correctif testé en local n'est pas « corrigé » tant qu'il n'est pas déployé — le dire explicitement.

## Suite 2 — « Wedding not found » après changement de mot de passe
- `generateLink({type:"magiclink"})` **crée le compte** si l'adresse est inconnue (alors que `recovery` renvoie `user_not_found`). Le formulaire « lien de connexion » fabriquait donc des comptes sans mariage → toutes les pages du dashboard lèvent `Wedding not found`. Et n'importe qui pouvait faire envoyer nos emails vers n'importe quelle adresse (mauvais pour la réputation du domaine → spam).
- Correctif : `sendAuthEmail` vérifie d'abord que le compte existe (`findUserByEmail`, déplacé dans `shared/lib/` et partagé avec la landing). Seul le checkout crée des comptes.
- Langue : `/update-password` (hors `[locale]`) devinait la langue via le navigateur → anglais. Le lien porte maintenant `?locale=`, que la page lit en priorité.

## Suite 3 — comptes sans mariage déjà existants
- `requireWedding` : 0 mariage → `redirect("/<locale>/login?reason=no_wedding")` ; la page login déconnecte (client) et affiche un toast traduit. Plus de 500 sur l'accueil.
- Piège : ne pas rediriger vers une route handler depuis un server component sous `[locale]` — `loading.tsx` fait streamer la page, le `redirect()` devient une navigation client, et le routeur Next plante en dev (« Rendered more hooks than during the previous render »).

## Suite 4 — page `/update-password` refaite
- Même carte que `/login` (logo, libellés uppercase, champs h-14, bouton), confirmation du mot de passe, min 8 caractères, afficher/masquer, logique `pe-`/`end-` pour l'arabe.
- Erreurs inline : le layout hors `[locale]` n'a pas de `<Toaster />`, les toasts d'avant ne s'affichaient jamais.
- Squelette de la carte pendant le chargement des messages (avant : page blanche).
- CTA court (« Enregistrer ») : l'ancien libellé débordait en uppercase — cf. [[Conventions]] largeurs de CTA.

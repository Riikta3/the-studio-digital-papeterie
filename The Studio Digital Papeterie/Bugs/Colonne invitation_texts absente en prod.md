---
date: 2026-09-28
status: resolved
category: bug
---

# Colonne invitation_texts absente en prod

## Symptôme
`/invitation` (dashboard en dev) plante : `column settings.invitation_texts does not exist`, levée par `readInvitation` (`dashboard/src/actions/invitation-editor-actions.ts`).

## Cause
- Le 28/09, `dashboard/.env.local` a été basculé sur le projet de prod (`pftvcpxwbprmphhgwvxc`) ; la version locale est gardée dans `.env.local.bak-local`. Le serveur de dev a rechargé l'env et lisait donc la prod.
- La prod avait toutes les migrations jusqu'à `20260914100000`, mais pas `20260927120000_invitation_editor.sql` (appliquée en local seulement, code pas encore commité).

Pas un bug de code : un écart de schéma entre la base visée et le code.

## Correctif
`npx supabase db push` sur la prod, après un `--dry-run` qui ne listait que cette migration. Vérifié ensuite :
- les huit requêtes de `readInvitation` répondent 200 en prod ;
- `resolve_public_slug` (anon) renvoie `languages` et `invitation_texts`. La nouvelle fonction reprend l'ancienne à l'identique (mêmes conditions, mêmes droits) et ajoute ces deux champs ;
- sur le déploiement, les 3 faire-part publiés qui ont un événement répondent 200. Les 3 sans événement répondent 404 à cause d'une règle existante, indépendante de la migration (« aucun événement = non publié ») ;
- la garde de langue refonctionne : `/en` d'un faire-part vendu en français seul renvoie une 307 vers `/fr`. Un faire-part à code invité affiche le portail dans toutes les langues, car le portail passe avant la garde.

## Leçons
- **Migrer la prod avant de déployer le code** qui lit les nouvelles colonnes. Une migration additive reste compatible avec le code déjà en ligne ; l'inverse n'est pas vrai.
- **La page publique avale les requêtes en échec** (`scheduleRes.data ?? []`) : sans la migration, le programme et les hébergements auraient disparu des faire-part sans la moindre erreur. Un écart de schéma y passe inaperçu.
- **L'aperçu affichait une 404 (même jour)** : l'iframe et la CSP `frame-src` lisaient `NEXT_PUBLIC_LANDING_URL`, qui pointe sur le déploiement Vercel dans les deux `.env.local` du dashboard, et ce déploiement n'a pas encore `/invitation/apercu`. Corrigé à la source : l'aperçu a sa propre adresse (`dashboard/src/lib/editor-preview-url.ts`), `http://localhost:3010` hors production, et le lien public garde `NEXT_PUBLIC_LANDING_URL`. Vérifié dans le navigateur, sur les données de prod.
- **Modifier `next.config.ts` en une seule écriture** : le serveur de dev redémarre dès le premier enregistrement. Une modification faite en deux écritures l'a relancé sur un état intermédiaire (une variable déjà supprimée mais encore utilisée), et le serveur s'est arrêté. Valider une nouvelle config à part avec le chargeur de Next (`transpileConfig` de `next/dist/build/next-config-ts/transpile-config`) avant de l'écrire.

Voir [[Éditeur de faire-part]] et [[Base de Données]].
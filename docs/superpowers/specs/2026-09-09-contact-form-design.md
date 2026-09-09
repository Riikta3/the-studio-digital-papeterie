# Canal de contact — formulaire public sécurisé

**Date**: 2026-09-09
**Statut**: validé, prêt pour le plan d'implémentation

## Problème

Le site n'a aucun canal de contact. Un visiteur qui a une question avant
d'acheter, ou un client dont la commande a échoué, n'a aucun moyen de joindre
un humain — sauf sur la page checkout, où `SUPPORT_EMAIL` est codé en dur pour
le seul cas du provisioning raté.

Conséquences : questions pré-achat perdues (donc ventes perdues), et un client
bloqué après paiement qui n'a nulle part à écrire.

## Décisions cadrantes

Prises avec le porteur du projet avant conception :

| Décision | Choix | Raison |
|---|---|---|
| Canal | Formulaire asynchrone, **pas de chat live** | Une seule personne traite les messages, sur son temps. Un chat live promettrait une présence intenable. |
| Acheminement | Resend **+** stockage Supabase | L'email seul perd le message si l'envoi échoue ; le stockage seul n'alerte pas. |
| Périmètre | Page `/contact` + lien footer + bulle flottante | La page est indexable et réutilisable ; la bulle capte le visiteur qui ne pense pas à chercher. |
| IA / chatbot | **Non** | Un bot qui improvise sur la politique de remboursement engage juridiquement. À reconsidérer quand les vraies questions seront connues. |
| CAPTCHA | **Non en v1** | Additif : s'ajoute plus tard sans rien défaire. Évite une dépendance externe bloquante dès le départ. |
| Rate-limit global | 60 / 10 min | Choisi permissif pour ne pas refuser un vrai client. |

## Sécurité — le cœur du design

### Le piège à éviter, déjà documenté dans ce repo

`supabase/migrations/20260903110000_guest_search_rate_limit.sql` établit le
principe, après une faille mesurée :

> *"A limit in the Next.js action would be trivially bypassed by calling
> PostgREST."*

C'est directement applicable ici. Les tables publiques existantes
(`rsvp_responses`, `playlist_suggestions`) ont une policy `insert`
`with check (true)`, et `NEXT_PUBLIC_SUPABASE_ANON_KEY` est par définition
publique. Donc un bot **ignore complètement notre page** : ni le honeypot, ni
le délai anti-soumission, ni la validation TypeScript ne sont sur son chemin.
Il fait `POST /rest/v1/contact_messages` en boucle.

**Conséquence pour le design : la table n'a aucune policy `insert`.** Le seul
chemin d'écriture est une fonction `security definer`, sur le modèle de
`search_guest_table`. Toute défense qui compte vit donc dans Postgres, où
*chaque* appelant est compté — y compris un appelant qu'on n'a pas écrit.

### Les couches, classées par ce qu'elles valent réellement

**1. Rate-limit dans Postgres — la protection réelle**

Table `contact_attempts`, même esprit que `guest_search_attempts` : ni IP, ni
fingerprint, ni contenu. Deux fenêtres :

- **globale** : 60 messages / 10 min sur tout le site. Plafonne un flood même
  distribué sur des milliers d'IP — ce qu'une limite par IP ne fait pas.
- **par email** : 3 messages / heure pour un même `email`. Arrête le bot qui
  martèle avec la même identité, sans pénaliser les autres visiteurs.

Nettoyage opportuniste (`random() < 0.05`, suppression au-delà d'1h) pour que
la table ne grossisse pas sans borne et sans cron — repris tel quel du
précédent.

**2. Validation et bornes dans la fonction SQL**

Dupliquée depuis le TypeScript, parce que le TypeScript n'est pas sur le
chemin d'un appelant direct. `name` ≤ 80, `email` ≤ 160 et format vérifié,
`message` entre 10 et 2000, `subject` contraint à l'enum.

Le refus ne dit pas *pourquoi* : la fonction retourne un booléen. Un appelant
hostile n'apprend pas quelle borne il a touchée.

**3. Contraintes de table** — `check` sur longueurs et enum. Dernier filet si
la fonction était modifiée un jour sans relire ce document.

**4. Anti-bot côté client** — honeypot + rejet si soumission < 2s après
affichage. **Classé pour ce qu'il est** : réduit le bruit des bots naïfs,
ne protège rien seul. La couche 1 est ce qui tient.

**5. Injection**

Pas de surface SQL (requêtes paramétrées, fonction typée). Le risque réel est
**l'email de notification**, dont le corps vient d'un inconnu :

- envoi en **texte brut, jamais en HTML** — un `<script>` ou une fausse mise
  en page dans le message ne doit pas devenir une surface d'injection dans la
  boîte du destinataire ;
- **aucune interpolation de contenu utilisateur dans les en-têtes**
  (`subject`, `from`, `reply-to` construits à partir de valeurs contrôlées, le
  `subject` depuis l'enum) — prévention du header injection.

**6. Ce qui n'est pas collecté** — ni IP, ni user-agent, ni cookie, ni
fingerprint. Cohérent avec le raisonnement déjà écrit dans
`invitation-submissions.ts` : *"a guest looking for their own table is not a
suspect"*.

### Compromis assumé

Le rate-limit global est un **plafond partagé** : sous attaque volumétrique, un
vrai client peut se voir refuser l'envoi pendant la fenêtre. C'est le prix de
ne pas stocker d'IP.

Atténuations : la page affiche **toujours** l'email de contact en clair, et le
message d'erreur invite explicitement à écrire directement. Le canal ne peut
donc jamais être totalement fermé.

## Architecture

### Base de données

Migration `supabase/migrations/<timestamp>_contact_messages.sql`.

`public.contact_messages` :

| colonne | type | contrainte |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `name` | text | `1..80` |
| `email` | text | `1..160`, format vérifié |
| `subject` | text | enum (voir plus bas) |
| `message` | text | `10..2000` |
| `locale` | text | 2..5 — pour répondre dans la bonne langue |
| `status` | text | `new` \| `handled`, défaut `new` |
| `created_at` | timestamptz | `now()` UTC |

RLS activée. **Aucune policy** : ni `select`, ni `insert` pour `anon`. Seule la
fonction `security definer` écrit ; seul le service role lit.

`public.contact_attempts` : `id`, `email_hash` (pas l'email en clair — un
hash suffit pour compter par identité sans conserver l'adresse dans un
journal), `attempted_at`. RLS activée, aucune policy.

À vérifier au moment d'écrire la migration : `digest()` vient de `pgcrypto`,
qui n'est pas déclaré explicitement dans `full_db_reset.sql`. Sur Supabase
l'extension est disponible dans le schéma `extensions` — donc appeler
`extensions.digest(...)`, ou ajouter un `create extension if not exists
pgcrypto`. Si cela s'avère fragile, se rabattre sur `md5()` (natif, sans
extension) : la résistance cryptographique est ici sans objet, on ne fait que
regrouper des tentatives.

Index : `(attempted_at desc)` et `(email_hash, attempted_at desc)`.

`public.submit_contact_message(p_name, p_email, p_subject, p_message, p_locale)`
→ `boolean`, `language plpgsql`, `security definer`, `set search_path = public`.
Séquence : valide → vérifie les deux fenêtres → insère le message → enregistre
la tentative → nettoyage opportuniste. `revoke all from public`, puis
`grant execute to anon`.

### Sujets

Enum contrainte plutôt qu'un champ libre, pour trier d'un coup d'œil :
`avant-achat` · `ma-commande` · `technique` · `sur-mesure` · `autre`.
Vérifiée côté SQL, pas seulement dans le `<select>`.

### Server action

`landing/src/actions/submit-contact.ts`, `"use server"`, client **anon**
(`utils/supabase/server.ts`) — pas `supabase-admin`. La base reste la dernière
ligne de défense, conformément au raisonnement de `invitation-submissions.ts`.

Ordre volontaire : **insert d'abord, notification ensuite.** Si Resend échoue
(quota, domaine non vérifié, panne), la ligne est déjà en base et le visiteur
voit un succès légitime — son message n'est pas perdu. L'échec d'envoi est
loggué côté serveur, jamais remonté au visiteur.

Retour : `{ ok: true } | { ok: false, reason: "invalid" | "rate_limited" | "error" }`
— assez pour un message utile, pas assez pour renseigner un attaquant.

### UI

| Fichier | Rôle |
|---|---|
| `landing/src/app/[locale]/contact/page.tsx` | Page indexable. Formulaire + email en clair en secours. |
| `landing/src/components/contact/ContactForm.tsx` | `"use client"`. Le formulaire, partagé par la page et la bulle. |
| `landing/src/components/contact/ContactBubble.tsx` | Bulle flottante ouvrant le formulaire en sheet. |
| `landing/src/components/home/Footer.tsx` | Lien « Contact » dans la colonne légale. |

Contraintes d'intégration relevées dans le code existant :

- **`z-index`** : le header flottant occupe `z-30`, `MobileMenu` utilise
  scrim `z-40` / panneau `z-50`. La sheet de la bulle reprend 40/50 ; la bulle
  elle-même reste sous le scrim.
- **Collision** : `ScrollToTop` est déjà en bas à droite → la bulle doit être
  décalée, sinon les deux se superposent.
- **Navigation** : helpers de `src/navigation.ts` (jamais `next/link` direct).
- **RTL** : le projet utilise déjà les utilitaires logiques (`text-start`,
  `ms-`/`me-`, cf. `CookieConsent.tsx`, `Atelier.tsx`). Le formulaire et la
  bulle les suivent — pas de `text-left` ni de `left-*`/`right-*` codés en
  dur, sinon l'arabe se casse. La bulle en particulier doit se positionner en
  logique (`end-*`), pas en `right-*`.

### i18n

Section `Contact` dans les **9** `landing/messages/*.json` : titre, sous-titre,
labels, options de sujet, messages d'erreur (invalide / trop de tentatives /
erreur technique), confirmation. Aucune chaîne en dur dans les composants.

### Environnement

`RESEND_API_KEY` et `CONTACT_NOTIFY_TO`, à ajouter dans `.env.example`,
`.env.local` et sur Vercel. Une seule dépendance nouvelle : `resend`.

## Tests et vérification

1. `npx tsc --noEmit`, `npm run build:landing`, `npm run lint` (aucune
   régression sur les fichiers touchés).
2. Migration appliquée en local, puis **vérifier que l'insert direct est bien
   refusé** avec la clé anon — c'est le test qui valide tout le design.
3. Vérifier que le rate-limit se déclenche (dépasser la fenêtre par email).
4. Parcours navigateur : envoi depuis la page et depuis la bulle, ligne créée
   en base, email reçu en texte brut, confirmation affichée.
5. Vérifier les 9 locales (au moins fr / en / ar pour le RTL).
6. Mobile : bulle sans collision avec `ScrollToTop`, sheet scrollable.

## Hors périmètre

- Chat live, chatbot IA, réponses automatiques.
- CAPTCHA / Turnstile — additif, s'ajoutera si du spam apparaît.
- Interface de lecture des messages dans le dashboard (v1 : consultation via
  Supabase). À proposer si le volume le justifie.
- Double opt-in sur l'email : sans intérêt ici — un email faux empêche
  simplement de répondre, il n'y a pas d'abus derrière.

## Dépendance externe à traiter par le porteur du projet

**Domaine Resend à vérifier.** Pour envoyer depuis
`@thestudiopapeteriedigitale.com`, le domaine doit être validé chez Resend
(enregistrements DNS). Sans cela les notifications partent en spam ou sont
refusées. À noter : `project_n8n_setup` mentionne déjà un « problème resend
auth » — possiblement le même sujet.

## Point d'attention hors périmètre, mais lié

Les textes légaux contiennent des placeholders non remplis :
`[email de contact à compléter]`, `[SIRET à compléter]`,
`[adresse à compléter]`, `[Raison sociale à compléter]` (dans `Legal.Cgv` et
`Legal.Privacy` des 9 locales).

Ce sont des mentions légalement obligatoires (mentions légales + RGPD), et une
page contact les rend plus visibles. Elles ne peuvent pas être remplies sans
les informations d'entreprise réelles — à traiter par le porteur du projet.

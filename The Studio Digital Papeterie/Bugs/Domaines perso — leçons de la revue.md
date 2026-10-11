---
date: 2026-10-02
status: en cours
category: bug
---

# Domaines perso — leçons de la revue

Les revues de code de [[Nom de domaine personnalisé]] (phases 1 à 3, 5 et 6) ont trouvé ces défauts avant le premier achat réel d'un domaine. Tous sont corrigés et testés ; le n° 6, un bug antérieur au chantier, l'est en local seulement (non commité).

Où en sont les correctifs : ceux des dates et des noms sont dans `ec65497f`, comme la migration du bail. Le code du moteur (`landing/src/lib/custom-domains/`) et du proxy n'est pas commité.

## 1. Un achat incertain ne doit jamais devenir le problème du couple

- **Défaut** : un appel d'achat sans réponse claire (timeout, 5xx, erreur réseau) était traité comme un échec ordinaire. Remettre la ligne en `queued` peut payer le domaine deux fois ; la déclarer « nom pris » envoie au couple un email pour un nom peut-être déjà acheté.
- **Correctif** (spec D5, « Uncertain purchases ») :
  - la ligne reste `purchasing` avec `last_error = 'buy_unconfirmed'` ;
  - le moteur vérifie si le domaine est à nous à +30 min, +2 h, +6 h et +24 h, puis passe `failed` avec une alerte au studio (« commande peut-être en attente, vérifier Vercel ») ;
  - seul un refus net de Vercel avant commande (code 4xx connu) autorise un retour en `queued` ou `awaiting_choice`.
- **Même famille** : la recherche Vercel donne une raison (`taken`, `premium`, `above_ceiling`, `unsupported`, `unknown`). Seuls `taken` et `premium` envoient la ligne en `awaiting_choice`. Une réponse absente ou illisible (`unknown`), ou un prix `null` juste après une recherche positive, se réessaie : jamais d'email « nom pris ».

## 2. Un numéro de commande perdu

- **Défaut** : Vercel répond avec un `orderId`, mais son écriture en base échoue. La ligne restait `purchasing` sans numéro, et un domaine payé n'était plus suivi.
- **Correctif** (`saveOrderId` dans `advance.ts`) :
  - trois essais ;
  - puis une écriture d'échec qui porte quand même le numéro (`order_id_not_saved`) ;
  - si la base refuse tout, une alerte au studio avec le numéro (`[DOMAIN_ORDER_ID_NOT_SAVED]`).
- Une ligne `queued` qui a encore un `vercel_order_id` suit cette commande au lieu d'en passer une autre.

## 3. Un bail sans jeton de propriétaire

- **Défaut** : le bail de 2 minutes était anonyme. Un run dont le bail expirait en pleine étape (appel Vercel lent, process figé) écrivait encore son résultat par-dessus la ligne qu'un autre run venait de prendre. Et une étape qui tuait son process à chaque fois était reprise sans fin.
- **Correctif** (`20261002130000_custom_domains_hardening.sql` et le moteur) :
  - chaque claim frappe un `lease_token`, et toute écriture du moteur porte `where id = … and lease_token = …` ; une écriture qui ne touche aucune ligne arrête l'étape sans agir ;
  - le marqueur posé avant l'achat exige aussi `status = 'queued'` ;
  - `claims_since_progress` compte les claims sans écriture : à 3, `failed` et alerte au studio ;
  - chaque appel Vercel a un timeout de 20 s, et chaque étape un budget de 90 s, bien sous le bail.

## 4. Des dates impossibles (31 avril) qui font échouer une commande payée

- **Défaut** : le champ « jour » du studio accepte 1 à 31 quel que soit le mois. « 2027-04-31 » allait jusqu'au PaymentIntent. `domainYearsFor` la refusait à raison et facturait 1 an : un couple qui se marie dans trois ans aurait payé, et reçu, un domaine expiré avant le mariage. Au provisioning, `weddings.wedding_date` est une colonne `date` : Postgres refusait l'insertion **après** l'encaissement.
- **Correctif** :
  - `isRealDate` (`shared/lib/pricing.ts`) ;
  - `weddingDateFrom` (`landing/src/lib/wedding-date.ts`) ne renvoie rien pour un jour qui n'existe pas ;
  - `checkedWeddingDate` dans `createWedding` traite une date impossible comme une date absente et le logue `[WEDDING_DATE_INVALID]`. Le couple saisira la date dans le dashboard.
- **Leçon** : ne jamais parser une date seule avec `new Date(…)` : une date inexistante (30 février) glisse au mois suivant au lieu d'être refusée.

## 5. Des prénoms qui perdent des lettres

- **Défaut** : la normalisation du nom de domaine supprimait les lettres que NFKD ne décompose pas : « Lætitia » donnait `ltitia`, « Søren » `sren`, « Łukasz » `ukasz`.
- **Correctif** (`shared/lib/custom-domain.ts`) : NFKD d'abord (ligatures comme `ﬁ`, lettres pleine chasse), puis une table de translittération (æ→ae, œ→oe, ß→ss, ø→o, ł→l, đ→d, þ→th, ı→i), puis retrait des accents. Testé dans `custom-domain.test.mjs`.

## 6. La course au remboursement entre le webhook et le navigateur — corrigé en local

- **Défaut** (antérieur au chantier, vu en direct) : le navigateur et le webhook `payment_intent.succeeded` appellent tous deux `createWedding`. La garde de rejeu ne reconnaît la commande que par `wedding_id` sur l'intent, posé après la création du mariage. Si le second appel arrive entre les deux, il trouve un compte qui a déjà un mariage, et la garde « un compte, un mariage » rembourse une commande légitime. Même effet au rechargement de la page de succès quand `markPaymentProvisioned` a échoué.
- **Correctif** (plan `docs/superpowers/plans/2026-10-02-checkout-provision-claim.md`, non commité) : chaque passage **réclame le PaymentIntent** dans `checkout_provisions` avant de créer quoi que ce soit (`landing/src/lib/provision-claim.ts`, migration `20261002220000_checkout_provisions.sql`), et le mariage **porte son paiement** (`weddings.payment_intent_id`, unique, écrit par l'insert).
  - l'insert passe : ce passage provisionne, et inscrit `wedding_id` sur la réclamation juste après l'insert du mariage ;
  - la réclamation porte un mariage dont le site existe : on l'adopte, jamais de remboursement (et on remet le tampon Stripe s'il manque). Sans site, il est encore en construction : on attend ;
  - pas de mariage et réclamation de plus de 10 min : son propriétaire est mort, reprise par update conditionnel sur `claimed_at` ;
  - pas de mariage et réclamation fraîche : on attend jusqu'à 8 s, puis `{ success: false, inProgress: true }` ; le webhook lève une erreur, Stripe relivre.
  - Un passage qui échoue avant de créer le mariage (ou qui rembourse un vrai second achat) rend la réclamation, pour que le suivant reparte aussitôt.
- **Vérifié en direct** (Stripe test, Supabase local) : trois passages simultanés sur un même intent → un mariage, aucun remboursement ; un vrai second achat → remboursé une fois ; tampon effacé puis rechargement → adopté, sans remboursement ; webhook face à une réclamation fraîche → 500, puis la relivraison provisionne.
- **Revue du correctif** (70 vérifications en Node sur la base locale ; lectures Stripe réelles, écritures Stripe simulées) — leçons :
  - **Lier l'objet à son paiement dans l'insert même.** Un enregistrement écrit après coup (réclamation, tampon) peut manquer, `weddings.payment_intent_id` non. La garde demande « ce mariage est-il celui de ce paiement ? », plus « ce compte a-t-il un mariage ? ».
  - **Une colonne de confiance se protège contre la RLS.** Les couples écrivent leurs propres lignes `weddings` : un trigger refuse la colonne à `anon`/`authenticated` (vérifié : PostgREST tourne en `current_user = service_role` avec la clé service).
  - **Un mariage à moitié construit se supprime, il ne s'adopte pas.** Réglages ou site en échec → suppression (cascade) puis libération, le passage suivant reconstruit. Suppression ratée → `[PROVISION_HALF_BUILT]`, pour un humain.
  - **N'adopter que ce qui est utilisable.** Sans site, ni tampon ni réparation de la ligne domaine : sinon faux `[DOMAIN_ROW_FAILED]`, et le webhook échoue sur un site absent.
  - **Facturer par paiement, jamais par compte.** Le webhook jugeait « provisionné » sur le compte : un second achat remboursé recevait une ligne `billing` et une facture. Désormais il saute la facturation, et relit l'intent (`refunded_reason`) avant de facturer.
  - **Rendre la réclamation dans un `finally`** : un `return` comme une exception avant l'insert la libèrent, plus de `release()` éparpillés à oublier.
  - **Un seuil de « mort » dépasse la durée de vie maximale** : 10 min, pas 5 min (= la limite Vercel de 300 s).
  - **Horodater une migration après celles déjà appliquées ailleurs.** Une migration jamais poussée se renomme ; en local, `migration repair --status reverted` sur l'ancienne version.
  - **Reste ouvert** : un mariage réclamé sans site (process tué entre l'inscription et le site, ou suppression ratée) répond `inProgress` sans fin ; un second achat sur un compte antérieur à la colonne peut encore être facturé si le webhook passe avant le remboursement.
- Voir [[Provisioning et Facturation]] et [[Base de Données]].

## 7. La 404 de la boutique sur le domaine d'un couple

- **Défaut** : le matcher de `proxy.ts` saute tout chemin qui contient un point. Sur le domaine d'un couple, `/x.php` ou `/photo.jpg` n'étaient ni réécrits ni marqués `x-custom-domain`, et affichaient la 404 de la boutique, avec son menu et ses liens.
- **Correctif** : `isCoupleDomainRequest()` (`landing/src/lib/custom-domain-request.ts`) regarde aussi l'hôte. `app/not-found.tsx`, `[locale]/not-found.tsx` et le layout s'en servent : 404 nue, sans `ContactBubble` ni bandeau cookies.
- **Prix accepté** : un alias de la boutique absent de `isOwnHost` reçoit lui aussi la 404 nue et perd la bulle de contact. Jamais une page qui marche.

## À retenir

- Ce qui coûte de l'argent (un achat, un remboursement) ne se décide jamais sur une réponse incertaine : on attend, on vérifie, on alerte.
- Une valeur saisie dans le navigateur (date, nom) est validée avant le paiement, et relue sans confiance après.
- Tout ce qui dépend de l'hôte se décide aussi hors du proxy. Voir [[Conventions]], section « Domaines personnalisés ».
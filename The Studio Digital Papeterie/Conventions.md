# Conventions de code

## Langues
- Discussion: Français
- Code, commentaires, commits: Anglais

## Composants
- RSC par défaut
- use client uniquement pour Zustand/Hooks
- No Zustand dans dashboard

## Styling
- bg-[#FDFBF7] pour le fond dashboard
- Boutons destructifs: bg-red-500 hover:bg-red-600 text-white (pas --destructive)
- Tokens: shared/tailwind-preset.js

## Traductions
- getTranslations() côté serveur
- useTranslations() côté client
- Messages: {app}/messages/{locale}.json

## Pièges
- Pas de href='#anchor' (cause scroll au refresh) → scrollIntoView
- colSpan des expand panels = nombre exact de th

## SEO / Next 16
- Le middleware s'appelle **proxy.ts** (convention Next 16), pas middleware.ts — ne pas en créer un en doublon
- proxy.ts rend TOUTES les routes dynamiques (ƒ) : generateStaticParams est sans effet sur les pages
- lang/dir doivent être posés server-side (root layout lit x-pathname) — un script client n'est vu ni par les crawlers ni par les lecteurs d'écran
- React sérialise hreflang en **hrefLang** dans le HTML : un grep 'hreflang' ne trouve rien, c'est normal et valide
- Satori (next/og) ne sait pas façonner l'arabe : lookupType 5 / substFormat 3 non supporté, même avec Noto Sans Arabic → fallback wordmark latin
- Satori a besoin d'une police par écriture (défaut = latin only ; CJK → Noto Sans SC/JP)
- npm run lint fonctionne à nouveau (eslint.config.mjs à plat), mais sort en code 1 sur 7 erreurs pré-existantes (Stripe/i18n/tailwind.config.js) → juger sur les fichiers touchés, pas sur l'exit code

Voir [[SEO Landing]].

## Responsive mobile
- `size="pill"` fait h-14 px-8 → un CTA mesure ~230px : **deux ne tiennent jamais côte à côte** sur un viewport de 360-390px (mesuré : 388px requis pour 312px utiles)
- Toute rangée de deux CTA s'empile donc en mobile : `flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center` (Hero.tsx, Preview.tsx). Ne pas rétrécir le pill — il est partagé avec le dashboard
- Les libellés longs ("Découvrir les invitations", et leurs traductions de/es) rendent l'empilement plus robuste que le wrap
- `next dev` laisse un `.next/dev/lock` orphelin si le process meurt mal → `rm -rf .next/dev/lock` avant de relancer

## Sections landing
- `WhyUs.reasons` est un tableau dans les 9 messages/{locale}.json, aligné par index sur `REASON_ICONS` dans WhyUs.tsx — retirer une carte = retirer l'entrée dans les 9 locales **et** l'icône correspondante, sinon décalage silencieux des icônes
- La carte "Sans impression" a été retirée (2026-09-07) : 4 cartes, grille 2×2 paire, le fallback `isLastOdd` ne s'active plus

## Thèmes d'invitation (2026-09-27)
- Sections **isomorphes** : jamais `async`, rien de `next-intl/server`. L'aperçu
  de l'éditeur rend le `Root` côté client.
- `data-editor-section="<id>"` sur la racine de chaque section (ids dans
  `shared/data/invitation-sections.ts`).
- Tout mot dans la voix du thème est un slot déclaré dans `editor.ts` et lu par
  `slot(data, clé) ?? t(...)`. Voir [[Éditeur de faire-part]].
- Lien saisi par un couple : `normaliseUserUrl` à l'écriture, `safeUrl` au rendu.


## Next App Router : history.replaceState (2026-09-29)
- Toujours `window.history.replaceState(null, "", url)`, jamais avec `window.history.state` : cet état porte le marqueur `__NA` de Next, qui ignore alors le changement et remet l'ancienne adresse à son prochain rendu (après une server action, par exemple). Voir [[Adresse de retour PayPal qui revenait]].


## Porter un thème du designer (2026-10-02)

Trois thèmes ont été portés d'un coup (Maré Alta, Château Royal, Cabo Verde). Ce qui a été outillé à cette occasion — le guide pas à pas est `docs/superpowers/plans/2026-10-02-theme-port-playbook.md`.

- **Le CSS du designer ne se porte plus à la main.** `npm run themes:port-css -w landing -- <config.json>` enchaîne pré-traitement, scoping, préfixe des `@keyframes`, substitution des polices, remplacement des mots du décor et vérifications. Relancer = même commande ; la substitution des polices ne se perd plus au re-scope (c'était une dette notée dans le README des thèmes).
- **Les `@keyframes` sont globaux au document.** Les feuilles de tous les thèmes se chargent ensemble (le registre les importe toutes) : deux thèmes qui nomment une animation `softRise`, `sunPulse` ou `giftFloat` se l'échangent, sans erreur. Le pipeline préfixe chaque nom par celui du thème ; un `responsive.css` écrit à la main doit faire pareil, et `theme-checks.test.mjs` le vérifie.
- **Les mots du décor viennent de la donnée.** Un `content: "…"` du designer qui contient des lettres devient une propriété CSS posée par le `Root` à partir du couple ; une chaîne non mappée fait échouer le portage.
- **`theme-checks.test.mjs` garde chaque thème** : aucun mot de la démo hors `demo-data.ts` (code, styles, catalogues), chaque slot déclaré est sur une vraie section, présent au catalogue et lu, chaque module annoncé dans `supports` est dessiné. Un nouveau thème s'y ajoute dans `THEMES` dès le début du portage, avec les mots de sa démo.
- **Briques partagées** (dans `themes/`) : `monogramOf`, `formatDateRange`, `heroDates(data, locale)`, `useGuestRsvp`, `useGuestPlaylist`, `Reveal` / `JsFlag` / `ScrollToButton`. Les deux hooks sont extraits de `ciao-amore`, qui garde sa propre copie.
- **Les dates du hero : `heroDates(data, locale)`, pas `copy.dateLabel` / `dateSpelled`.** Le mapper les fournit en français quelle que soit la langue de la page.
- **Les noms de champs du RSVP sont un contrat** : `fullName`, `partnerName`, `childName-<i>`, `dietary`, `message`, et les boutons radio `name="attendance"`. En renommer un envoie une valeur vide, sans erreur.
- **`Reveal`, pas `document.querySelectorAll`.** Les scripts des designers révèlent les sections au scroll en visant tout le document : dans l'aperçu de l'éditeur, ils attrapent des éléments qui ne sont pas à eux. Chaque section s'observe elle-même ; sans JavaScript, le CSS du thème garde le contenu visible (`JsFlag`).
- **Le Jour J est un lien, jamais un module.** Table, photos et menu existent déjà sur `/jourj/[slug]` (derrière `day_of_settings.enabled`). Un thème s'y relie par `data.dayOf` ; sans `weddingId` (démo, aperçu) le lien est inerte. Cette page invité est en français et sans thème : voir [[Reste à faire]].
- **Catalogues** : `npm run themes:messages -w landing -- <camelId> <dossier>` fusionne `Invitation.<camelId>` dans les neuf fichiers, sous verrou, et refuse des langues qui n'ont pas exactement les mêmes clés. Ne jamais lire-modifier-écrire à la main quand plusieurs thèmes s'ajoutent en parallèle : l'un écrase l'autre.
- **Voir le résultat** : `?fixture=minimal|heavy` sur la page démo (hors production) donne un mariage presque vide ou chargé ; `SHOOT_LOCALE=de` change la langue de `themes:shoot` ; `themes:shoot-url` photographie la référence du designer (une URL `file://` marche quand le site est derrière une connexion). Une page de plus de 16 000 px est découpée en `-full.png`, `-full-2.png`… — Chromium plafonne à 16 384 px.
- **Node et Chrome n'écrivent pas une plage de dates pareil** (espaces autour du tiret, selon l'ICU) : `formatDateRange` normalise, sinon un test passe en Node et la page diffère.
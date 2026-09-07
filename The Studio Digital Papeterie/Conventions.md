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

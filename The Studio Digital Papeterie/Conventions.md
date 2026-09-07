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
- npm run lint est cassé (next lint supprimé en Next 16, pas d'eslint.config.js) → utiliser tsc + build

Voir [[SEO Landing]].
---
date: 2026-09-07
status: done
category: SEO
---

# SEO Landing — signaux servis au crawler

Audit complet + corrections. Le socle i18n était déjà bon (hreflang, canonical,
robots.txt, sitemap avec alternates) ; c'est le **HTML réellement servi** qui ne
portait pas les signaux.

## Corrigé

- **`<html lang>` / `dir`** : étaient patchés par un script client — donc jamais
  vus par un crawler ni un lecteur d'écran. Toutes les locales s'annonçaient en
  `fr`, et l'arabe s'affichait en LTR (vrai bug de rendu). Désormais lus
  server-side depuis `x-pathname` que `proxy.ts` forwarde déjà.
- **Image Open Graph** : `openGraph` déclarait `summary_large_image` sans
  `images` → carte vide sur tous les partages. Ajout de
  `[locale]/opengraph-image.tsx`, prérendu pour les 9 locales.
- **JSON-LD** : aucune donnée structurée. Ajout de `Organization`, `WebSite`,
  `Product`/`Offer` et `FAQPage` (6 questions déjà traduites).
- **Pages légales** : ne renvoyaient qu'un `title` alors qu'elles existent en 9
  locales et sont dans le sitemap → 18 pages quasi identiques sans signal de
  langue. Ajout canonical + hreflang + `noindex, follow`.
- **`meta keywords`** : retiré (ignoré par Google depuis 2009).

## Gotchas rencontrés

- **`middleware.ts` s'appelle `proxy.ts`** (convention Next 16). Ne pas créer un
  `middleware.ts` en doublon — il existe déjà et gère la redirection de `/`.
- **Satori ne sait pas façonner l'arabe** : `lookupType: 5 - substFormat: 3 is
  not yet supported`, y compris avec Noto Sans Arabic fourni. C'est une limite
  du Satori bundlé dans Next 16.1, pas une police manquante. La carte `/ar`
  retombe sur le wordmark latin.
- **Satori a besoin d'une police par écriture** : la police par défaut est
  latin-only, le CJK exige Noto Sans SC / JP (fetch au build, caché par process).
- **`generateStaticParams` est sans effet ici** : `proxy.ts` rend toutes les
  routes dynamiques (`ƒ`). Vérifié par build avant/après.
- **React sérialise `hreflang` en `hrefLang`** dans le HTML — un `grep hreflang`
  ne le trouve pas. C'est valide, HTML est insensible à la casse.
- **`npm run lint` est cassé** (`next lint` supprimé dans Next 16) et il n'y a
  pas d'`eslint.config.js`. Préexistant.

## Switch de langue

Garde son URL et son round-trip serveur (indispensable au SEO : chaque locale
doit rester rendue côté serveur). Amélioration du ressenti uniquement :
`router.prefetch` de toutes les locales à l'ouverture du menu + `scroll: false`
pour ne pas renvoyer le lecteur en haut de page.

Voir [[Conventions]].

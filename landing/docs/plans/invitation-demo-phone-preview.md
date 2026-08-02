# Plan — Simulation de téléphone scrollable (preview home)

**Objectif** : brancher le `PhoneScreen` déjà construit dans `src/components/home/Preview.tsx` sur une vraie page `/invitation/demo`, chargée en iframe, avec le scroll qui fonctionne (wheel-forwarding déjà codé). Un seul thème (`theme-floral`), données 100% hardcodées, **pas** de synchronisation de paramètres via `postMessage`.

**Repos** :
- Actif : `/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing`
- Référence lecture seule : `/Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/landing-deprecated` (ne jamais éditer)

---

## Phase 0 — Documentation Discovery (fait, consolidé)

Trois agents d'exploration ont lu le code source réel (pas de suppositions). Résumé des faits qui cadrent l'implémentation :

### API/structure autorisées (à copier, pas à réinventer)

- **Route** : `src/app/[locale]/invitation/[weddingCode]/page.tsx` (deprecated) montre le pattern Next 15 `searchParams: Promise<{...}>` + `generateViewport`. On simplifie : notre route n'a pas de `weddingCode` dynamique (page 100% statique), donc **pas besoin de parser `searchParams`** — `generateViewport` peut retourner `{ width: 390, initialScale: 1 }` en dur.
- **`InvitationDemoContext` n'est PAS consommé par `theme-floral`** (confirmé par grep sur tout le repo deprecated) → on ne porte ni `InvitationDemoContext.tsx`, ni `InvitationPageClient.tsx`, ni `InvitationIntro.tsx`, ni `FloatingDemoControls`. C'est exactement là que vivait tout le `postMessage` (`SET_THEME`/`SYNC_THEME`/`SYNC_DEVICE`/`PLAY_INTRO`, un seul fichier concerné : `InvitationPageClient.tsx` lignes 486-552). En ne portant pas ce fichier, on élimine le postMessage à la racine, sans rien avoir à "retirer" après coup.
- **`module-registry.ts` / `ModuleRenderer.tsx` / `ThemedInvitationLayout.tsx` sont conçus pour une composition dynamique pilotée par Supabase** (`site_modules` en DB). Hors périmètre (pas de Supabase). On compose la page **directement** en JSX statique dans `page.tsx`, sans registry.
- **`ModulesWrapper.tsx`** ne fait que fournir `PlaylistContext` (7 lignes) — inutile puisque `PlaylistModule` est différé.

### Composants `theme-floral` à porter (contrat exact)

`InvitationHero` (deprecated, 40 lignes) — seul composant Hero, prop contract confirmé via son unique appelant (`ThemedInvitationLayout.tsx`) :
```ts
interface InvitationHeroProps {
  firstName: string;
  partnerName: string;
  weddingDate?: string | null;
}
```
Zéro dépendance à `InvitationDemoContext`, zéro asset image/vidéo — 100% CSS/SVG inline + `framer-motion`. Copie quasi verbatim.

**Set minimal V1 recommandé par l'agent** (justifié : zéro backend, zéro clé API, visuellement correct) :
1. `InvitationHero.tsx` (40 l.) — obligatoire
2. `Divider.tsx` (14 l.) — séparateur SVG, zéro dépendance
3. `CountdownModule.tsx` (98 l.) — compte à rebours calculé côté client, `framer-motion` + `lucide-react`, zéro backend
4. `TimelineModule.tsx` (123 l.) — timeline mock hardcodée, `lucide-react` seul (pas même framer-motion)
5. `MapModule.tsx` (165 l.) — **pas besoin de clé Google Maps** : c'est un iframe `output=embed` gratuit et sans clé. Utilise `next/image` sur une photo Unsplash hardcodée → **à remplacer par un asset local** (`public/images/`) pour éviter de toucher `next.config.mjs` (`remotePatterns`).
6. `InvitationFooter.tsx` (13 l.) — obligatoire pour clore la page

**Explicitement différé** (ne pas porter maintenant) : `RsvpModule` (Supabase), `PlaylistModule` (route `/api/spotify/search` + `PlaylistContext`), `VideoGuestbookModule` (upload fake, UX bancale sans vrai backend), `IntroVideoModule` (a besoin d'une vraie URL vidéo), `DressCode`/`GiftList`/`Faq`/`Accommodation`/`Transport`/`Menu`/`Guestbook` (statiques et peu coûteux, mais pas nécessaires pour valider le mécanisme de scroll — pourront être ajoutés en itération 2 sans rien casser puisqu'on n'utilise pas de registry figé).

### Conventions de l'app `landing` actuelle (confirmées, à respecter)

- Alias : `@/` → `landing/src/*`, `@shared/` → `../shared/*` (`tsconfig.json`).
- RSC par défaut ; `"use client"` seulement sur les feuilles qui ont besoin de hooks (pattern déjà suivi par `theme/page.tsx`, `(steps)/layout.tsx`).
- Navigation interne : `Link`/`usePathname`/`useRouter` depuis `@/navigation` — **sauf** pour la `src` d'un `<iframe>`, qui doit être une string brute (c'est déjà le cas dans `Preview.tsx`, commentaire ligne 22-25 anticipe exactement `/fr/invitation/demo?demo=true`).
- `framer-motion` (^12.29.2) et `lucide-react` (^0.563.0) déjà installés dans `landing/package.json` — aucun ajout de dépendance nécessaire.
- Couleurs/fonts par thème : gardées en **styles inline / hex litéraux** (pattern déjà suivi par `src/components/studio/themes.ts` + `theme/page.tsx`), pas de tokens Tailwind à inventer pour `theme-floral`. Le chrome fixe (si besoin) utilise les tokens `studio-*` de `shared/tailwind-preset.js`.
- Format des données démo : aligné sur `WeddingInfo` (`src/stores/use-order-store.ts`) — `partner1`, `partner2`, `day`, `month`, `year`, `venue`, `email`. Convention placeholder déjà utilisée dans `theme/page.tsx` : `"Sophie & Pierre"` / `"14 Juin 2026"` / `"Château des Roses"`.
- `Preview.tsx` a déjà tout le plumbing iframe prêt (loading spinner, `onLoad`, wheel-forwarding lignes 58-71, clé de traduction `Preview.demoIframeTitle` déjà présente dans `messages/fr.json:251`) — **il ne manque qu'une URL valide**.
- Root layout body : `overflow-x-hidden` seulement (pas de `overflow-y: hidden`) → le scroll vertical natif de la page démo ne sera pas bloqué par le layout parent.
- `[locale]/layout.tsx` ne rend aucun header/footer partagé — une page sous `[locale]/invitation/demo` n'héritera d'aucun chrome de site par défaut, ce qui est exactement voulu pour un rendu "propre" dans le téléphone.

### Anti-patterns à éviter

- ❌ Ne pas porter `InvitationPageClient.tsx`, `InvitationDemoContext.tsx`, `InvitationIntro.tsx`, `module-registry.ts`, `ModuleRenderer.tsx`, `ThemedInvitationLayout.tsx`, `ModulesWrapper.tsx` — tous inutiles pour ce périmètre réduit et sources du postMessage/complexité qu'on veut éviter.
- ❌ Ne pas ajouter `remotePatterns` Unsplash dans `next.config.mjs` juste pour une photo mock — utiliser un asset local.
- ❌ Ne pas inventer de query params (`?demo=true&device=...`) tant qu'aucune logique ne les consomme réellement.
- ❌ Ne pas router la démo à travers Supabase — dataset 100% en dur.

---

## Phase 1 — Dataset démo + composants `theme-floral` minimal

**Fichiers à créer** (tous dans `landing/src/`) :

1. `lib/invitation-demo-data.ts`
   - Objet const `INVITATION_DEMO = { partner1: "Sophie", partner2: "Pierre", day: "14", month: "Juin", year: "2026", venue: "Château des Roses", email: "demo@thestudio.wedding" }` (forme alignée sur `WeddingInfo`).
   - Export d'une date ISO dérivée (`weddingDateISO`) pour les modules qui attendent une string de date.

2. `components/invitation/theme-floral/InvitationHero.tsx`
   - Copier depuis `landing-deprecated/src/components/invitation/themes/theme-floral/InvitationHero.tsx` (40 lignes) quasi verbatim. Props : `firstName`, `partnerName`, `weddingDate?`.
   - Vérifier que `framer-motion` s'importe exactement pareil (`motion.div`), rien d'autre à adapter.

3. `components/invitation/theme-floral/Divider.tsx`
   - Copier verbatim depuis `.../theme-floral/Divider.tsx` (14 lignes, zéro dépendance).

4. `components/invitation/theme-floral/InvitationFooter.tsx`
   - Copier depuis `.../theme-floral/InvitationFooter.tsx` (13 lignes). Adapter la prop `{ profile: {...} }` pour accepter directement `{ partner1, partner2, weddingDate? }` (plus simple que de recréer un objet `profile` juste pour ce composant démo).

5. `components/invitation/theme-floral/CountdownModule.tsx`
   - Copier depuis `.../theme-floral/CountdownModule.tsx` (98 lignes). Remplacer le fallback `"Sophie"/"Pierre"` (ligne 48 dans le fichier source) par les valeurs de `INVITATION_DEMO` passées en props — ne pas dupliquer les noms en dur dans le composant.

6. `components/invitation/theme-floral/TimelineModule.tsx`
   - Copier depuis `.../theme-floral/TimelineModule.tsx` (123 lignes), garder `MOCK_EVENTS` tel quel (contenu déjà statique/hardcodé, pas de prop externe requise).

7. `components/invitation/theme-floral/MapModule.tsx`
   - Copier depuis `.../theme-floral/MapModule.tsx` (165 lignes).
   - **Remplacer** l'URL Unsplash hardcodée de `MOCK_LOCATION` par un asset local : ajouter une image dans `public/images/` (réutiliser un visuel existant du dossier ou en demander un au user si besoin) et passer par `next/image` avec un chemin local (`/images/...`), pas une URL distante — pas de changement `next.config.mjs`.
   - Le venue/adresse dans `MOCK_LOCATION` doit correspondre à `INVITATION_DEMO.venue` ("Château des Roses").

**Vérification de la phase** :
- `cd landing && npx tsc --noEmit` passe sans erreur sur ces 6 nouveaux fichiers (pas d'import cassé, pas de prop manquante).
- Aucun de ces fichiers n'importe `InvitationDemoContext`, `useInvitationDemo`, `module-registry`, ou `window.postMessage`/`window.addEventListener("message"`. Vérifier par grep :
  ```
  grep -rn "InvitationDemoContext\|useInvitationDemo\|postMessage\|addEventListener(\"message\"" landing/src/components/invitation/
  ```
  → doit retourner vide.

**Exécution** : ces 6 fichiers sont indépendants les uns des autres (à part le dataset partagé en étape 1) → peut être parallélisé avec `/do` sur 5 sous-tâches (Hero, Divider, Footer, Countdown, Timeline+Map) une fois l'étape 1 (dataset) faite.

---

## Phase 2 — Route `/invitation/demo`

**Fichier à créer** : `landing/src/app/[locale]/invitation/demo/page.tsx`

- Server Component (pas de `"use client"` — aucun hook nécessaire ici, tous les composants enfants gèrent leur propre interactivité).
- `export async function generateViewport() { return { width: 390, initialScale: 1 }; }` — en dur, pas de parsing de `searchParams` (pas de device switch dans ce périmètre).
- `export const metadata = { title: "Aperçu — The Studio", robots: { index: false, follow: false } };` — page démo, ne doit pas être indexée.
- Body : import `INVITATION_DEMO` depuis `@/lib/invitation-demo-data`, composer dans l'ordre :
  `InvitationHero → Divider → CountdownModule → Divider → TimelineModule → Divider → MapModule → Divider → InvitationFooter`
  toutes dans un wrapper `<main className="min-h-screen bg-[#fdf6f0]">` (couleur de fond du thème floral, cf. `bgGradient`/`accentColor` de `theme-floral` dans `studio/themes.ts`).

**Documentation de référence** : `landing-deprecated/src/components/invitation/themes/theme-floral/index.ts` pour l'ordre canonique d'assemblage Hero/modules/Footer (même si on n'utilise pas le registry, l'ordre visuel doit rester cohérent avec le thème).

**Vérification de la phase** :
- `npm run dev:landing`, ouvrir `http://localhost:3002/fr/invitation/demo` directement dans le navigateur (hors iframe) : la page doit s'afficher, scroller normalement au wheel/trackpad, sans erreur console, sans header/footer du site parent.
- Vérifier `view-source` ou devtools que `<meta name="viewport" content="width=390">` est bien présent.

---

## Phase 3 — Branchement du `PhoneScreen` (`Preview.tsx`)

**Fichier à modifier** : `landing/src/components/home/Preview.tsx`

1. Remplacer la constante en dur `const DEMO_INVITATION_URL: string | null = null;` par une valeur dynamique basée sur la locale courante :
   ```ts
   import { useLocale } from "next-intl";
   // dans PhoneScreen():
   const locale = useLocale();
   const demoUrl = `/${locale}/invitation/demo`;
   ```
   (Remplacer les usages de `DEMO_INVITATION_URL` dans `PhoneScreen` par `demoUrl` local à la fonction — le composant est déjà `"use client"`, `useLocale()` est safe.)
2. Ne **rien changer** au wheel-forwarding déjà écrit (lignes 58-71) — il doit s'activer automatiquement dès que l'URL n'est plus `null`.
3. Garder le fallback `<Image>` statique **uniquement** si on veut un filet de sécurité en cas d'échec de chargement iframe — sinon le supprimer puisque l'URL est maintenant toujours définie (à trancher pendant l'implémentation selon si on garde un "graceful degradation").

**Anti-pattern guard** : ne pas ajouter de logique `postMessage` ici pour synchroniser un thème sélectionné dans le carrousel `ThemeCarousel` vers l'iframe — hors périmètre validé par l'utilisateur. Le carrousel de thèmes (Amalfi/Venise/...) reste visuellement déconnecté du contenu de l'iframe pour l'instant (l'iframe affiche toujours le même thème floral démo, quel que soit le thème sélectionné dans le carrousel) — c'est un écart UX assumé, à noter au user, pas à masquer.

**Vérification de la phase** :
- Sur la home (`/fr`), scroller jusqu'à la section preview : le téléphone doit charger l'iframe (spinner puis contenu), et le scroll à la molette **dans la zone de l'écran du téléphone** doit faire défiler le contenu de l'invitation démo (Hero → Countdown → Timeline → Map → Footer), sans faire scroller la page principale en même temps (vérifier que `e.preventDefault()` ligne 62-63 empêche bien le double-scroll).
- Tester aussi au trackpad (scroll naturel deux doigts) et si possible sur mobile réel/responsive devtools (le forwarding wheel ne marche qu'au wheel — le scroll tactile natif dans l'iframe devrait fonctionner nativement sans forwarding, à vérifier).

---

## Phase 4 — Vérification finale

1. `cd landing && npx tsc --noEmit` — zéro erreur.
2. `cd landing && npm run lint` — zéro erreur/warning nouveau.
3. `npm run build:landing` — le build de production passe (vérifie que rien ne dépend d'une API Node/Supabase non dispo côté démo).
4. Grep anti-pattern final (doit être vide) :
   ```
   grep -rn "postMessage\|SET_THEME\|SYNC_THEME\|SYNC_DEVICE" landing/src/app/\[locale\]/invitation/ landing/src/components/invitation/ landing/src/components/home/Preview.tsx
   ```
5. Test manuel navigateur (via `/run` ou `npm run dev:landing`) : home page → section preview → téléphone charge, scroll fonctionne, pas d'erreur console.
6. Confirmer avec l'utilisateur si le carrousel de thèmes (Amalfi/Venise/...) doit rester déconnecté du contenu iframe pour cette itération, ou si ça mérite une phase 2 (branchement thème réel, potentiellement les 4 autres thèmes `theme-floral`→`theme-royal` etc., hors périmètre actuel).

---

## Hors périmètre (rappel, itérations futures possibles)

- Les 4 autres thèmes du configurateur (`theme-minimalist`, `theme-boho`, `theme-royal`, `theme-travel`).
- Les modules différés (`Rsvp`, `Playlist`, `VideoGuestbook`, `IntroVideo`, `DressCode`, `GiftList`, `Faq`, `Accommodation`, `Transport`, `Menu`, `Guestbook`).
- Toute synchronisation live paramètres ↔ iframe (postMessage `SET_THEME`/`SYNC_THEME`/`SYNC_DEVICE`).
- Connexion Supabase pour la route démo (données réelles de mariage).

# Live Preview Panel — Spec Design
**Date:** 2026-03-31
**Statut:** Approuvé

---

## Problème

L'utilisateur configure son faire-part en 6 étapes (thème, animation, modules, options, etc.) sans jamais voir le rendu final avant le checkout. Ce manque de feedback visuel refroidit l'achat et augmente l'abandon de tunnel.

## Solution

Un panneau de prévisualisation live, persistant tout au long du configurateur, qui affiche le rendu réel de l'invitation en fonction des choix en cours — sans attendre le paiement.

---

## Comportement selon la surface

### 📱 Mobile (< 768px) — Bottom Drawer

**État collapsé (permanent) :**
- Barre fixe en bas de l'écran, toujours visible, hauteur ~60px
- Contenu : miniature statique (1ère frame de l'animation choisie ou placeholder thème) + noms des mariés + résumé des choix (thème, nb modules) + bouton "↑ Voir le rendu"
- Ne bloque pas le scroll du configurateur (position fixed, padding-bottom ajouté au contenu)

**État déplié (tap sur "Voir le rendu") :**
- Drawer remonte jusqu'à ~85% de la hauteur écran (motion spring)
- Affiche l'invitation complète en `transform: scale(~0.35)` avec `transform-origin: top center`
- L'animation d'intro se lance en boucle (InvitationIntro avec les frames WebP)
- `pointer-events: none` sur tout le contenu → aucune interaction possible
- Handle en haut pour refermer (swipe down ou tap sur le handle)
- Backdrop semi-transparent derrière le drawer

### 🖥️ Desktop (≥ 768px) — Sidebar droite collapsable

**État réduit (défaut) :**
- Panneau latéral droit de ~44px (icône œil + tooltip "Aperçu")
- Cliquable pour s'ouvrir

**État ouvert :**
- Panneau de 280px qui s'anime depuis la droite (motion slide-in)
- Même contenu que le drawer mobile déplié : invitation complète scaled
- Bouton "←" pour refermer
- Le contenu principal du configurateur s'adapte (`max-w` réduit ou padding-right ajouté)

---

## Architecture technique

### Composant principal : `<LivePreviewPanel />`

Fichier : `landing/src/components/configurator/LivePreviewPanel.tsx`

- `"use client"` — lit `useOrderStore()` directement
- Détecte la surface via `useMediaQuery('(min-width: 768px)')`
- Rend `<LivePreviewDrawer />` sur mobile, `<LivePreviewSidebar />` sur desktop

### Composant preview : `<InvitationPreviewScaled />`

Fichier : `landing/src/components/configurator/InvitationPreviewScaled.tsx`

Reçoit les props :
```ts
{
  theme: string           // ex: "theme-floral"
  animation: string       // ex: "envelope-classic"
  modules: string[]       // ex: ["rsvp", "countdown", "map"]
  partner1: string
  partner2: string
  weddingDate: string     // "YYYY-MM-DD"
  venue: string
  isExpanded: boolean     // true = lance l'animation, false = frame statique
}
```

Logique interne :
1. Wrappe tout dans `<InvitationDemoContext.Provider value={{ isDemo: true, activeTheme: theme, ... }}>`
2. Applique un `div` avec `transform: scale(X)` calculé dynamiquement selon la largeur disponible du conteneur (ResizeObserver)
3. Affiche `<InvitationHero />` du bon thème
4. Si `isExpanded` → affiche `<InvitationIntro />` en boucle (prop `loop=true` à ajouter)
5. Si `!isExpanded` → affiche la 1ère frame statique via `<img src={firstFrameUrl} />`
6. Affiche les modules sélectionnés via `getModuleComponent(theme, moduleId)` avec `isDemo=true`
7. `pointer-events: none` sur le wrapper complet

### Modification de `InvitationIntro`

Ajouter une prop `loop?: boolean` (défaut: `false`).  
Quand `loop=true` : relance l'animation depuis le frame 0 quand elle atteint la fin, sans appeler `onComplete`.

### Intégration dans le layout du studio

Fichier : `landing/src/app/[locale]/(configurator)/studio/layout.tsx` (à créer)

- Wrapper qui rend `<LivePreviewPanel />` en dehors du flux de contenu
- Sur mobile : ajoute `pb-[72px]` au contenu pour ne pas être masqué par la barre
- Sur desktop : layout flex avec `<main>` + `<LivePreviewSidebar />`

---

## Données affichées

| Donnée | Source store | Fallback |
|--------|-------------|----------|
| Noms des mariés | `weddingInfo.partner1/2` | "Sophie & Pierre" |
| Date | `weddingInfo.day/month/year` | "14 Juin 2026" |
| Lieu | `weddingInfo.venue` | "Château des Roses" |
| Thème | `theme` | "theme-floral" |
| Animation | `animation` | "envelope-classic" |
| Modules | `modules[]` | `["countdown", "rsvp", "map"]` |

---

## Ce qu'on ne montre PAS dans la preview

- L'animation d'intro complète quand collapsé (frame statique uniquement)
- Les formulaires interactifs (RSVP, guestbook, playlist) → `isDemo=true` les désactive
- Les vraies données Supabase (weddingId = "preview", isDemo bypass les fetches)

---

## États UX

- **Choix du thème** → `InvitationHero` change de style instantanément
- **Choix de l'animation** → la 1ère frame change, ou l'animation redémarre si expanded
- **Ajout/retrait d'un module** → la liste des modules dans la preview se met à jour
- **Saisie des prénoms** → les noms dans le hero se mettent à jour en temps réel

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `landing/src/components/configurator/LivePreviewPanel.tsx` | Créer |
| `landing/src/components/configurator/InvitationPreviewScaled.tsx` | Créer |
| `landing/src/components/configurator/LivePreviewDrawer.tsx` | Créer |
| `landing/src/components/configurator/LivePreviewSidebar.tsx` | Créer |
| `landing/src/app/[locale]/(configurator)/studio/layout.tsx` | Créer |
| `landing/src/components/invitation/InvitationIntro.tsx` | Modifier (prop `loop`) |

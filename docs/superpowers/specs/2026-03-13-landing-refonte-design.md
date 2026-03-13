# Spec — Refonte Landing Page "The Studio"

**Date :** 2026-03-13
**Projet :** The Studio Digital Papeterie
**Scope :** Refonte complète de la landing page (`landing/src/app/[locale]/page.tsx` et composants associés)

---

## Contexte

La landing page actuelle est un catalogue basique. L'objectif est de la transformer en une expérience de vente immersive et haut de gamme pour les faire-part digitaux. Stack : Next.js App Router, React, Tailwind CSS, Framer Motion, shadcn/ui, next-intl.

---

## Design System (existant, à respecter)

| Token | Valeur | Rendu |
|---|---|---|
| `--background` | `hsl(40 33% 98%)` | Crème `#FDFBF7` |
| `--foreground` | `hsl(0 0% 16%)` | Quasi-noir `#292929` |
| `--primary` | `hsl(344 53% 35%)` | Bordeaux `#882040` |
| `--primary-foreground` | `hsl(0 0% 98%)` | Blanc cassé |
| `--muted-foreground` | `hsl(220 10% 40%)` | Gris bleuté |
| Font heading | Cormorant Garamond | Serif élégant |
| Font body | Inter | Sans-serif |

---

## Structure de la page (ordre d'affichage)

### 1. Navbar
- **Choix validé :** Minimaliste 3 liens
- Logo gauche · Liens centre (Thèmes, Démo, Tarifs) · Droite : "Espace Mariés" + CTA "Créer"
- Au scroll (>50px) : pill avec `backdrop-blur-md`, `bg-card/80`, `border border-border/20`
- Mobile : logo + CTA pill + burger icon
- Burger overlay : liens en grande typo `font-heading`, CTA pleine largeur en bas

### 2. Hero Section
- **Fond :** Séquence WebP enveloppe en boucle (34 frames desktop `/videos/desktop/Animation enveloppe personnalisée_000.webp`, 53 frames mobile `/videos/mobile/Mobile Test 2_000.webp`) — réutiliser la logique de `InvitationIntro.tsx` (requestAnimationFrame, 24fps)
- **Overlay :** Fade radial crème depuis les bords (`radial-gradient(ellipse at center, transparent 5%, rgba(253,251,247,0.88) 75%)`) — texte sombre lisible
- **Titre :** "Le faire-part réinventé au digital" — `font-heading text-6xl md:text-8xl`, ligne 2 en `italic text-primary`
- **Sous-titre :** "Pour les amoureux, les grandes fêtes et les invitations qui marquent le début d'une belle histoire."
- **CTAs :**
  - Bouton principal : "Créer mon invitation →" (pill bordeaux)
  - Bouton secondaire : "Voir une démo" (outline bordeaux)
  - Scroll anchor : "Découvrir les thèmes ↓" (lien discret + `ChevronDown` animé, ancre vers `#themes`)
- **Grain overlay** : conservé (`bg-noise opacity-[0.04]`)

### 3. Démo Immédiate
- **Choix validé :** CTA vers démo réelle
- Mockup téléphone incliné (`rotate(-4deg)`) avec preview d'invitation
- Gros bouton "Voir la démo live →" → lien vers `/invitation/[weddingCode]` (code de démo configurable)
- 3 vignettes de thèmes en dessous (couleurs thématiques)
- Section ID : `id="apercu"`

### 4. Comment ça marche
- 3 étapes ultra-visuelles avec icônes et numéros
- Étape 1 : "Choisissez un design" · Étape 2 : "Personnalisez votre invitation" · Étape 3 : "Envoyez le lien à vos invités"
- Layout horizontal desktop, vertical mobile

### 5. Catalogue Thématique
- **Choix validé :** Tabs d'ouverture + grille masonry
- Section ID : `id="themes"`
- Tabs soulignés : Tous · ✉ Enveloppe · ✨ Rideaux · 🚪 Portes
- Grille masonry CSS (`columns-2 md:columns-3 lg:columns-4`)
- Chaque card : thumbnail couleur thème, nom, badge type d'ouverture, badge "Nouveau" si applicable
- Thèmes : Bohème, Floral, Minimaliste, Royal, Modern, Champêtre, Voyage, Bridgerton, Oriental
- State local (useState) pour le filtre actif

### 6. Comparatif Papier vs Digital
- **Choix validé :** 2 cards prix + badge économie
- Titre : "La différence qui compte"
- Card gauche : "📄 Papier — 860€" (pour 200 invités)
- Card droite highlighted : "✨ The Studio — à partir de 149€" + badge "Économisez 711€"
- Ligne d'avantages : ✓ Instantané · ✓ Modifiable · ✓ RSVP intégré · ✓ Zéro papier

### 7. Valeur Ajoutée — 5 cartes
- Icônes + titres : Design élégant · Envoi instantané · Écologique · Modifiable · Sur-mesure
- Layout : grille 5 colonnes desktop, 2-3 mobile

### 8. Personnalisation & Sur-mesure
- Options : Programme, Galerie, Liste cadeaux
- Mention "100% sur-mesure sur RDV" avec lien mailto

### 9. Témoignages
- **Choix validé :** Grande citation centrale en carrousel
- Badge "Déjà 130+ invitations envoyées ✨"
- Guillemets décoratifs grand format (Cormorant, opacity 20%)
- Citation pleine largeur · nom + date · étoiles `★★★★★`
- Navigation par dots · autoplay 5s
- Carrousel simple avec `useState` + `useEffect`

### 10. Footer
- **Choix validé :** Fond primary bordeaux `#882040`, structuré 3 colonnes
- Logo + tagline italic · réseaux sociaux (icônes outline)
- 3 colonnes : Produit (Thèmes, Démo, Tarifs, Sur-mesure) · Mariés (Se connecter, Créer) · Légal (CGV, Confidentialité)
- Séparateurs `rgba(253,251,247,0.12)`
- Copyright centré en bas

---

## Architecture des composants

Tous les nouveaux composants dans `landing/src/components/landing/` :

```
hero.tsx              ← refonte (existant)
navbar.tsx            ← refonte (existant)
demo-section.tsx      ← nouveau
how-it-works.tsx      ← nouveau
catalogue.tsx         ← nouveau (remplace examples.tsx)
pricing-comparison.tsx ← nouveau (remplace ou complète pricing.tsx)
value-cards.tsx       ← nouveau (remplace features.tsx)
customization.tsx     ← nouveau (remplace about.tsx)
testimonials.tsx      ← refonte (existant)
footer.tsx            ← refonte (existant)
```

---

## Traductions

Toutes les chaînes passent par `next-intl`. Clés à ajouter dans `landing/messages/fr.json` (et propager aux autres locales).

---

## Table des IDs de section

| Section | `id` anchor | Lien navbar | Lien footer |
|---|---|---|---|
| Hero | — | — | — |
| Démo Immédiate | `apercu` | Démo | Démo |
| Comment ça marche | `comment-ca-marche` | — | — |
| Catalogue Thématique | `themes` | Thèmes | Thèmes |
| Comparatif Prix | `comparatif` | Tarifs | Tarifs |
| Valeur Ajoutée | `valeur` | — | — |
| Personnalisation | `sur-mesure` | — | Sur-mesure |
| Témoignages | `temoignages` | — | — |
| Footer | — | — | — |

Le lien "Sur-mesure" dans le footer est un `mailto:` (adresse email de contact), pas un anchor.

---

## Points d'attention

### Hero — séquence d'images
- Ne **pas** réutiliser `InvitationIntro.tsx` directement (elle gère le scroll lock), mais extraire la logique dans un hook `useImageSequence(frames, fps)`
- **Mode boucle :** restart depuis frame 0 (pas ping-pong)
- **Resize :** conserver le debounced resize handler de `InvitationIntro.tsx` pour recalculer les dimensions du canvas
- **`prefers-reduced-motion` :** si activé, afficher statiquement la première frame sans animation

### Démo Immédiate — weddingCode
- Variable d'env : `NEXT_PUBLIC_DEMO_WEDDING_CODE`
- Ajouter au `.env.local` et à la config Vercel
- Fallback : si la variable est absente, masquer le bouton "Voir la démo live"

### Navigation anchors
- Composants **sur la home** : `onClick` + `scrollIntoView({ behavior: 'smooth' })` (convention projet)
- Liens **footer** (utilisables depuis d'autres pages) : `href="/#apercu"`, `href="/#themes"`, etc. via le composant `Link` de `@/navigation` — ce pattern est déjà utilisé dans le footer existant et est acceptable

### Traductions
- Toutes les chaînes UI passent par `next-intl`
- **Exception documentée :** les témoignages (citations, noms, dates) sont définis comme un tableau statique TypeScript dans le composant, pas dans les fichiers de messages — ils ne sont pas traduits

### Catalogue — thèmes sans CSS class
- Les thèmes Champêtre, Voyage, Bridgerton, Oriental sont des **placeholders visuels** uniquement (couleur de fond statique) — pas de `theme-*` CSS class associée pour l'instant

### Accessibilité carrousel (témoignages)
- Autoplay pause au hover et au focus (`onMouseEnter`/`onMouseLeave`/`onFocus`)
- Respecte WCAG 2.1 AA SC 2.2.2

### Sections supprimées
- `faq.tsx`, `dashboard-preview.tsx`, `examples.tsx`, `features.tsx`, `about.tsx`, `pricing.tsx` → **dépréciés**, à retirer de `page.tsx` et leurs imports nettoyés. Les clés de traduction correspondantes dans `fr.json` peuvent être conservées pour l'instant (pas de suppression risquée).

### Masonry
- CSS pur (`columns-*`) pour éviter une dépendance JS supplémentaire

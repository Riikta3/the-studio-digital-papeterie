---
date: 2026-09-12
status: actif
category: index
---

# The Studio — Papeterie Digitale

Faire-part de mariage en ligne. Les mariés achètent un thème, remplissent leur
contenu au dashboard, et envoient le lien à leurs invités.

## Par où commencer

**→ [[Reste à faire]]** — ce qu'il y a à faire ensuite, par ordre d'importance.

## Les notes

### Architecture
- [[Stack Technique]] — Next.js 16, Supabase, monorepo npm
- [[Base de Données]] — tables, RLS, fonctions `security definer`
- [[Provisioning et Facturation]] — Stripe, webhook, création du mariage

### Fonctionnalités
- [[Invitation]] — le faire-part public
- [[RSVP]] — réponses des invités
- [[Checklist nouveau thème]] — **à suivre pour tout nouveau thème**
- [[SEO Landing]]

### Qualité
- [[Conventions]] — code, styling, traductions, pièges
- [[Audit Sécurité 2026-09]]

## Les trois applications

| App | Port | Rôle |
|---|---|---|
| `landing` | 3002 | Site public, configurateur, faire-part |
| `dashboard` | 3003 | Espace des mariés après achat |
| `builder` | — | Constructeur de site |

`shared/` porte le preset Tailwind et les composants communs ; `supabase/`
les migrations.

## Les trois thèmes

| Thème | i18n |
|---|---|
| ciao-amore | 9 locales |
| belle-rive | 9 locales |
| blanc-couture | français seulement — cf. [[Reste à faire]] |

Un thème **rend**, il ne décide rien : tout ce qu'il affiche vient de
`InvitationData` (`themes/types.ts`). C'est ce qui permet au contenu d'un même
mariage d'être rendu par n'importe lequel.

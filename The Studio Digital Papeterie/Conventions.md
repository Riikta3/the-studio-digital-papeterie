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
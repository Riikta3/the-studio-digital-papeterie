# Page Invitation

## Route
 landing/src/app/[locale]/invitation/[weddingCode]/page.tsx

## InvitationIntro — Séquence images
- Desktop: 34 frames /videos/desktop/Animation enveloppe personnalisée_000.webp
- Mobile: 53 frames /videos/mobile/Mobile Test 2_000.webp
- 24fps via requestAnimationFrame
- Fade to white à 82% de la séquence
- États: idle → loading → playing → onComplete

## Comportement
- Body scroll locké pendant l'intro
- Fade du site après l'intro
- Header: h-[100svh]
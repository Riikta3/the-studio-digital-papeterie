# Stack Technique

## Monorepo
- Landing — site client, configurateur, invitations (port 3002)
- Dashboard — espace mariés post-achat (port 3003)
- Shared — Tailwind preset, composants shadcn/ui
- Supabase — migrations SQL, edge functions, RLS

## Tech
- Framework: Next.js App Router
- i18n: next-intl 4.x
- Auth: Supabase SSR
- UI: shadcn/ui + Tailwind
- Animations: Framer Motion
- Paiements: Stripe
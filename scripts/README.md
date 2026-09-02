# scripts/

Administration scripts. Run by hand from the repo root, never from CI.

## seed-demo-wedding.mjs

Seeds one wedding with the full demo dataset (140 guests, 124 confirmed, 10
tables of 12 with 116 guests seated, 4 events, menu, FAQ, venue,
accommodations, day-of settings) so the dashboard screens can be exercised
against real rows instead of empty tables.

```bash
node scripts/seed-demo-wedding.mjs <wedding_id> [--force]
```

- `<wedding_id>` is required. The script refuses to run without one —
  picking a wedding implicitly is how you seed the wrong one.
- Refuses to run if the wedding already has guests, unless `--force` is
  passed, in which case it purges the wedding's existing rows (in reverse
  dependency order) before reseeding.
- Refuses unconditionally — `--force` included — on any of the three public
  product-demo weddings (`sites.is_demo = true`, ids starting
  `00000000-0000-0001-`). Those are a customer-facing showcase on the
  landing site; seeding invented guests into one would publish fabricated
  data publicly.

### `service_role` key

The script reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
from the first of `dashboard/.env.local`, `dashboard/.env`, `.env.local`,
`.env` that defines both. The service-role key bypasses Row Level Security
entirely — this is an administration script for local use, and must never
run in CI or against a database you do not control.

### What it does not create

No `guest_media` rows. There are no real files to place in the
`guest-media` storage bucket, and rows pointing at absent objects would make
the photos screen show broken images — worse than the empty state, which is
a state the dashboard already has to handle correctly.

`sites` is never touched — the wedding's slug (used for the Jour J QR code)
is left exactly as it was.

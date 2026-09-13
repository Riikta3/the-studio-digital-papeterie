/**
 * One-off: remove the wedding a provisioning race created in production.
 *
 * On 2026-09-13 a single paid checkout was provisioned twice, 4.4 seconds
 * apart — Stripe delivered `payment_intent.succeeded` one second before the
 * browser finished writing the wedding it had already started, so the
 * webhook's recovery net rescued an order that was in fact mid-flight.
 *
 * The account ended up owning two identical weddings, and every dashboard
 * page 500'd: `requireWedding()` resolves with `.single()`, which throws on
 * a second row.
 *
 * This deletes the webhook's copy and keeps the browser's, which is the
 * older of the two. `weddings` cascades on delete, so its site, settings and
 * purchases go with it.
 *
 * Must run BEFORE the `weddings_one_per_user` migration: a unique index will
 * not build over a table that already violates it.
 *
 * Run from the repo root:
 *   node scripts/remove-duplicate-wedding.mjs
 *
 * Safe to re-run: it exits cleanly if the wedding is already gone, and
 * refuses to delete anything that has acquired real content.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const KEEP = "bb2f65ac-cb2a-4613-b549-c5d9e72b2985"; // browser,  19:40:12
const DROP = "eab00a59-79a0-4455-97be-7c3b7f73f262"; // webhook,  19:40:17

const env = Object.fromEntries(
  fs
    .readFileSync("vercel-env/dashboard-ALL.env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
console.log("target project:", env.NEXT_PUBLIC_SUPABASE_URL);

const { data: target } = await sb.from("weddings").select("*").eq("id", DROP).maybeSingle();
if (!target) {
  console.log("Nothing to do: that wedding is already gone.");
  process.exit(0);
}

// Never delete a wedding someone has started using. The two copies were
// byte-for-byte identical when this was written; if that has changed since,
// stop and let a human decide which one is the real one.
for (const table of ["households", "guests", "rsvp_responses"]) {
  const { count } = await sb
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("wedding_id", DROP);
  if (count) {
    console.error(`ABORT: ${table} holds ${count} row(s) for ${DROP}.`);
    console.error("This copy is no longer empty — resolve it by hand.");
    process.exit(1);
  }
}

const { data: keeper } = await sb.from("weddings").select("id").eq("id", KEEP).maybeSingle();
if (!keeper) {
  console.error(`ABORT: the wedding to keep (${KEEP}) is missing.`);
  process.exit(1);
}

console.log(`deleting ${DROP} (created ${target.created_at}), keeping ${KEEP}`);
const { error } = await sb.from("weddings").delete().eq("id", DROP);
if (error) {
  console.error("DELETE FAILED:", error);
  process.exit(1);
}

for (const table of ["sites", "settings", "purchases"]) {
  const { count } = await sb
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("wedding_id", DROP);
  console.log(`  orphaned ${table}: ${count}`);
}

const { data: all } = await sb.from("weddings").select("user_id");
const byUser = {};
for (const w of all) byUser[w.user_id] = (byUser[w.user_id] || 0) + 1;
const dupes = Object.entries(byUser).filter(([, n]) => n > 1);

console.log(`\nweddings: ${all.length} | accounts owning more than one: ${dupes.length}`);
for (const [user, n] of dupes) console.log(`  ${user} -> ${n}`);
console.log(dupes.length === 0 ? "\nOK — weddings_one_per_user can now be built." : "\nStill blocked.");

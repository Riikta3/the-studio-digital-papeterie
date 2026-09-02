#!/usr/bin/env node
/**
 * Seeds one wedding with the demo dataset (140 guests, 124 confirmed, 10
 * tables, menu, FAQ, venue) so the dashboard can be demonstrated and, more
 * importantly, so every wired screen is exercised against real rows.
 *
 * Administration script: run by hand, never from CI. It uses the service-role
 * key and therefore bypasses RLS.
 *
 *   node scripts/seed-demo-wedding.mjs <wedding_id> [--force]
 *
 * Refuses to run without an explicit wedding id: picking a wedding implicitly
 * is how you seed the wrong one. Also refuses on any of the three demo
 * weddings (sites.is_demo = true, ids starting 00000000-0000-0001-) — those
 * are a public customer-facing showcase, not a scratch dataset.
 *
 * The dataset is ported from shared/data/jour-j-mock.ts and
 * shared/data/invitation-mock.ts (values hardcoded below, not imported —
 * those mocks are deleted once every screen is wired to Supabase).
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

/* ------------------------------------------------------------------ *
 * Environment
 * ------------------------------------------------------------------ */

function loadEnv() {
  const candidates = ["dashboard/.env.local", "dashboard/.env", ".env.local", ".env"];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const url = text.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)$/m)?.[1]?.trim();
    const key = text.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)$/m)?.[1]?.trim();
    if (url && key) return { url, key, source: file };
  }
  return null;
}

const env = loadEnv();
if (!env) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Looked in (in order): dashboard/.env.local, dashboard/.env, .env.local, .env",
  );
  process.exit(1);
}

const supabase = createClient(env.url, env.key, {
  auth: { persistSession: false },
});

/* ------------------------------------------------------------------ *
 * CLI args
 * ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const weddingId = args.find((a) => !a.startsWith("--"));
const force = args.includes("--force");

if (!weddingId) {
  console.error(
    "Usage: node scripts/seed-demo-wedding.mjs <wedding_id> [--force]\n\n" +
      "Refuses to run without an explicit wedding id: picking one implicitly\n" +
      "is how you seed the wrong wedding.",
  );
  process.exit(1);
}

// Never touch the public product demo showcase (ProductDemoViewer), even if
// --force is passed. These ids are fixed by supabase/migrations/20260315100000_demo_weddings.sql.
if (weddingId.startsWith("00000000-0000-0001-")) {
  console.error(
    `Refusing to seed ${weddingId}: this is one of the three public product-demo weddings ` +
      "(sites.is_demo = true). Seeding invented guests into it would publish fabricated data " +
      "on the landing site's showcase.",
  );
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Guard: wedding must exist
 * ------------------------------------------------------------------ */

const { data: wedding, error: weddingError } = await supabase
  .from("weddings")
  .select("id, partner_name")
  .eq("id", weddingId)
  .maybeSingle();

if (weddingError) {
  console.error(`Could not look up wedding ${weddingId}: ${weddingError.message}`);
  process.exit(1);
}
if (!wedding) {
  console.error(`No wedding with id ${weddingId} found in the weddings table.`);
  process.exit(1);
}

// Double-check via sites.is_demo directly, in case the id convention above
// ever drifts from the actual flag.
const { data: site } = await supabase
  .from("sites")
  .select("is_demo")
  .eq("wedding_id", weddingId)
  .maybeSingle();
if (site?.is_demo) {
  console.error(`Refusing to seed ${weddingId}: sites.is_demo is true for this wedding.`);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Guard: refuse to overwrite existing data unless --force
 * ------------------------------------------------------------------ */

const { count: existingGuests, error: countError } = await supabase
  .from("guests")
  .select("*", { count: "exact", head: true })
  .eq("wedding_id", weddingId);

if (countError) {
  console.error(`Could not count existing guests: ${countError.message}`);
  process.exit(1);
}

if (existingGuests > 0 && !force) {
  console.error(
    `Wedding ${weddingId} already has ${existingGuests} guest(s). ` +
      "Re-run with --force to purge and reseed.",
  );
  process.exit(1);
}

if (existingGuests > 0 && force) {
  await purgeWedding(weddingId);
}

/* ------------------------------------------------------------------ *
 * Purge, in reverse dependency order
 * ------------------------------------------------------------------ */

async function purgeWedding(id) {
  console.log(`--force: purging existing rows for ${id}...`);

  // guest_events has no wedding_id column — reach it through guests.
  const { data: existing } = await supabase.from("guests").select("id").eq("wedding_id", id);
  const guestIds = (existing ?? []).map((g) => g.id);
  if (guestIds.length > 0) {
    await supabase.from("guest_events").delete().in("guest_id", guestIds);
  }

  await supabase.from("guests").delete().eq("wedding_id", id);
  await supabase.from("households").delete().eq("wedding_id", id);
  await supabase.from("tables").delete().eq("wedding_id", id);
  await supabase.from("schedule_entries").delete().eq("wedding_id", id);
  await supabase.from("events").delete().eq("wedding_id", id);
  await supabase.from("venues").delete().eq("wedding_id", id);
  await supabase.from("accommodations").delete().eq("wedding_id", id);
  await supabase.from("faq_entries").delete().eq("wedding_id", id);

  // menu_items has no wedding_id column — reach it through menu_categories.
  const { data: cats } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("wedding_id", id);
  const catIds = (cats ?? []).map((c) => c.id);
  if (catIds.length > 0) {
    await supabase.from("menu_items").delete().in("category_id", catIds);
  }
  await supabase.from("menu_categories").delete().eq("wedding_id", id);

  await supabase.from("day_of_settings").delete().eq("wedding_id", id);
}

/* ------------------------------------------------------------------ *
 * Dataset — ported verbatim from shared/data/jour-j-mock.ts and
 * shared/data/invitation-mock.ts. Do not import those files: they are
 * deleted once the dashboard no longer needs mock data as a fallback.
 * ------------------------------------------------------------------ */

const FIRST_NAMES = [
  "Marie", "Jordy", "Émilie", "Lucas", "Chloé", "Antoine", "Sarah", "Thomas",
  "Camille", "Hugo", "Léa", "Maxime", "Julie", "Nicolas", "Manon", "Alexandre",
  "Clara", "Julien", "Inès", "Romain",
];

const LAST_NAMES = [
  "Dupont", "Moreau", "Lefèvre", "Bernard", "Rossi", "Girard", "Fontaine",
  "Mercier", "Blanc", "Roux", "Caron", "Perrin",
];

const GROUPS = ["family", "friends", "colleagues", "other"];

// Deterministic pseudo-random, so the seed is reproducible run to run.
const pick = (list, seed) => list[seed % list.length];

function foldToAscii(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/* ---- Guests: 140, in this exact order (order matters — seating below
 * depends on "the first 116 confirmed") ---------------------------------- */

const guests = [];
for (let i = 0; i < 140; i++) {
  const status = i < 124 ? "confirmed" : i < 128 ? "pending" : "declined";
  const firstName = pick(FIRST_NAMES, i * 7 + 1);
  const lastName = pick(LAST_NAMES, i * 3 + 2);
  const isChild = i % 12 === 0;

  // isChild takes precedence over the vegetarian bucket, matching the mock.
  const meal = isChild ? "child" : i % 9 === 0 ? "vegetarian" : i % 31 === 0 ? "vegan" : "standard";
  const dietaryFlags = i % 14 === 0 ? ["gluten-free"] : [];

  guests.push({
    index: i,
    firstName,
    lastName,
    status,
    isChild,
    isPlusOne: i % 19 === 0,
    meal,
    dietaryFlags,
    guestGroup: GROUPS[i % 4],
    email: i % 3 === 0 ? `${foldToAscii(firstName)}.${foldToAscii(lastName)}+${i}@example.com` : null,
    phone: i % 5 === 0 ? `06${String(10000000 + i).slice(0, 8)}` : null,
    notes: i % 17 === 0 ? (i % 2 === 0 ? "Témoin" : "Placement à côté de la famille") : null,
    allergies: i % 23 === 0 ? "Arachides" : null,
  });
}

/* ---- Households: ~60, pairing guests up (2 per household mostly, a few of
 * 1 and of 4) -------------------------------------------------------------- */

function buildHouseholdGroups(guestList) {
  const groups = [];
  let i = 0;
  let cursor = 0;
  // Repeating pattern of household sizes: mostly 2, with a 1 and a 4 mixed
  // in every 5 households, landing close to 60 households for 140 guests
  // (140 / ~2.33 avg ≈ 60).
  const sizePattern = [2, 2, 1, 2, 4];
  while (cursor < guestList.length) {
    const size = sizePattern[i % sizePattern.length];
    const slice = guestList.slice(cursor, cursor + size);
    if (slice.length === 0) break;
    groups.push(slice);
    cursor += size;
    i++;
  }
  return groups;
}

const householdGroups = buildHouseholdGroups(guests);

/* ---- Tables: 10 of 12, seating the first 116 confirmed ------------------ */

const TABLE_NAMES = [
  "Capri", "Amalfi", "Portofino", "Positano", "Ravello",
  "Sorrente", "Ischia", "Procida", "Anacapri", "Maiori",
];

const seatable = guests.filter((g) => g.status === "confirmed").slice(0, 116);

const tableDefs = TABLE_NAMES.map((name, i) => ({
  name,
  seatsLabel: `Table ${i + 1}`,
  capacity: 12,
  shape: "round",
  position: i,
  x: 120 + (i % 4) * 260,
  y: 120 + Math.floor(i / 4) * 430,
  guestSlice: seatable.slice(i * 12, (i + 1) * 12),
}));

/* ---- Events: 4, June 2027 (from invitation-mock.ts, actual on-screen
 * wording) ------------------------------------------------------------- */

const eventDefs = [
  {
    key: "welcome-dinner",
    name: "Welcome Dinner",
    date: "2027-06-18",
    time: "20h00",
    address: "Trattoria del Porto, Via Marina 12, Amalfi",
    description: "Un dîner en petit comité pour accueillir celles et ceux qui arrivent la veille.",
    dressCode: "Tenue décontractée élégante",
    position: 0,
    enabled: true,
  },
  {
    key: "wedding-day",
    name: "Cérémonie & Réception",
    date: "2027-06-19",
    time: "16h30",
    address: "Villa Bellavista, Via Panoramica 4, Ravello",
    description: "Cérémonie dans les jardins, suivie du cocktail puis du dîner sur la terrasse.",
    dressCode: "Tenue de cérémonie — éviter le blanc",
    position: 1,
    enabled: true,
  },
  {
    key: "brunch",
    name: "Brunch du lendemain",
    date: "2027-06-20",
    time: "11h00",
    address: "Villa Bellavista, jardin bas",
    description: "Pour prolonger un peu, sans protocole.",
    dressCode: null,
    position: 2,
    enabled: true,
  },
  {
    key: "party",
    name: "Soirée",
    date: "2027-06-19",
    time: "23h00",
    address: "Villa Bellavista, orangerie",
    description: "DJ jusqu'au bout de la nuit.",
    dressCode: null,
    position: 3,
    enabled: true,
  },
];

/* ---- schedule_entries (from invitation-mock.ts `schedule`) ------------- */

const scheduleDefs = [
  { eventKey: "wedding-day", time: "16h30", title: "Accueil des invités", description: "Un rafraîchissement à l'ombre des citronniers.", position: 0 },
  { eventKey: "wedding-day", time: "17h00", title: "Cérémonie", description: "Dans les jardins de la villa.", position: 1 },
  { eventKey: "wedding-day", time: "18h00", title: "Cocktail", description: "Vue sur la baie, musique live.", position: 2 },
  { eventKey: "wedding-day", time: "20h00", title: "Dîner", description: "Sur la terrasse.", position: 3 },
  { eventKey: "wedding-day", time: "22h30", title: "Pièce montée & première danse", description: null, position: 4 },
  { eventKey: "welcome-dinner", time: "20h00", title: "Dîner d'accueil", description: "Trattoria del Porto.", position: 0 },
  { eventKey: "brunch", time: "11h00", title: "Brunch", description: "Jardin bas, en toute simplicité.", position: 0 },
];

/* ---- venue (from invitation-mock.ts `venue`) --------------------------- */

const venueDef = {
  name: "Villa Bellavista",
  address: "Via Panoramica 4",
  city: "Ravello, Italie",
  mapsUrl: "https://maps.google.com/?q=Ravello",
  wazeUrl: "https://waze.com/ul?q=Ravello",
  parkingInfo: "Parking privé gratuit dans l'enceinte de la villa, une trentaine de places. Voiturier à partir de 16h.",
  accessInfo: "Depuis Naples : 1h30 en voiture par la côte amalfitaine. Route étroite sur les dix derniers kilomètres.",
  transportInfo: "Une navette part de Amalfi centre à 15h45 et repart à 1h00. Places limitées, à réserver auprès des mariés.",
  photoUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=70",
};

/* ---- accommodations (from invitation-mock.ts `accommodation`) --------- */

const accommodationDefs = [
  { name: "Hotel Villa Maria", city: "Ravello", distance: "5 min à pied", phone: "+39 089 857 255", bookingUrl: "https://example.com/villa-maria", offer: "Tarif négocié -15% avec le code BELLAVISTA", photoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70", position: 0 },
  { name: "Palazzo Avino", city: "Ravello", distance: "10 min à pied", phone: null, bookingUrl: "https://example.com/palazzo-avino", offer: null, photoUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=70", position: 1 },
  { name: "B&B Il Limoneto", city: "Scala", distance: "12 min en voiture", phone: "+39 089 123 456", bookingUrl: null, offer: "Option la plus abordable", photoUrl: null, position: 2 },
  { name: "Residence Amalfi Coast", city: "Amalfi", distance: "20 min en voiture", phone: null, bookingUrl: "https://example.com/residence", offer: null, photoUrl: null, position: 3 },
];

/* ---- faq_entries (from invitation-mock.ts `faq`) ----------------------- */

const faqDefs = [
  { question: "Les enfants sont-ils les bienvenus ?", answer: "Oui, avec joie. Un menu enfant et une garderie sont prévus à partir de 20h.", position: 0, published: true },
  { question: "Puis-je venir accompagné ?", answer: "Votre invitation précise le nombre de places qui vous sont réservées. N'hésitez pas à nous écrire en cas de doute.", position: 1, published: true },
  { question: "Où puis-je me garer ?", answer: "Un parking privé gratuit est accessible dans l'enceinte de la villa, avec voiturier à partir de 16h.", position: 2, published: true },
  { question: "Quel est le dress code ?", answer: "Tenue de cérémonie. Les jardins sont en gravier : prévoyez des talons stables, ou de quoi changer.", position: 3, published: true },
  { question: "À quelle heure faut-il arriver ?", answer: "L'accueil ouvre à 16h30 et la cérémonie commence à 17h précises.", position: 4, published: true },
  { question: "Y a-t-il une liste de mariage ?", answer: "Votre présence nous suffit. Pour celles et ceux qui insistent, une urne sera à disposition.", position: 5, published: false },
];

/* ---- menu (from jour-j-mock.ts `buildMenu`) ---------------------------- */

const menuDefs = [
  {
    key: "cocktail", enabled: true, position: 0,
    items: [
      { name: "Arancini à la truffe", description: null, variant: null },
      { name: "Burrata, tomates confites, basilic", description: null, variant: null },
      { name: "Spritz maison", description: "Aperol ou sans alcool", variant: null },
    ],
  },
  {
    key: "starter", enabled: true, position: 1,
    items: [
      { name: "Vitello tonnato", description: null, variant: "classic" },
      { name: "Velouté de courge, huile de noisette", description: null, variant: "veggie" },
    ],
  },
  {
    key: "main", enabled: true, position: 2,
    items: [
      { name: "Filet de bœuf, jus corsé", description: null, variant: "classic" },
      { name: "Risotto aux champignons", description: null, variant: "veggie" },
      { name: "Coquillettes au jambon", description: null, variant: "child" },
    ],
  },
  {
    key: "cheese", enabled: true, position: 3,
    items: [{ name: "Plateau de fromages affinés", description: null, variant: null }],
  },
  {
    key: "dessert", enabled: true, position: 4,
    items: [
      { name: "Pièce montée", description: null, variant: null },
      { name: "Tiramisu revisité", description: null, variant: null },
    ],
  },
  {
    key: "drinks", enabled: false, position: 5,
    items: [{ name: "Vins de la propriété", description: null, variant: null }],
  },
];

/* ------------------------------------------------------------------ *
 * Insert, in dependency order
 * ------------------------------------------------------------------ */

const counts = {};

async function insertAndCount(table, rows) {
  if (rows.length === 0) {
    counts[table] = 0;
    return [];
  }
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) {
    console.error(`Insert into ${table} failed: ${error.message}`);
    process.exit(1);
  }
  counts[table] = data.length;
  return data;
}

console.log(`Seeding wedding ${weddingId} (${wedding.partner_name})...`);

// 1. events
const eventRows = eventDefs.map((e) => ({
  wedding_id: weddingId,
  key: e.key,
  name: e.name,
  date: e.date,
  time: e.time,
  address: e.address,
  description: e.description,
  dress_code: e.dressCode,
  position: e.position,
  enabled: e.enabled,
}));
const insertedEvents = await insertAndCount("events", eventRows);
const eventIdByKey = new Map(insertedEvents.map((e) => [e.key, e.id]));

// 2. households
const householdRows = householdGroups.map((members) => {
  const lastName = members[0].lastName;
  const group = members[0].guestGroup;
  return {
    wedding_id: weddingId,
    name: members.length === 1 ? `Les ${lastName}` : `Famille ${lastName}`,
    guest_group: group,
  };
});
const insertedHouseholds = await insertAndCount("households", householdRows);

// 3. guests (linked to their household)
const guestRows = [];
householdGroups.forEach((members, hIdx) => {
  const householdId = insertedHouseholds[hIdx].id;
  for (const g of members) {
    guestRows.push({
      wedding_id: weddingId,
      household_id: householdId,
      first_name: g.firstName,
      last_name: g.lastName,
      email: g.email,
      phone: g.phone,
      status: g.status,
      is_child: g.isChild,
      is_plus_one: g.isPlusOne,
      meal: g.meal,
      dietary_flags: g.dietaryFlags,
      allergies: g.allergies,
      notes: g.notes,
      guest_group: g.guestGroup,
      _index: g.index, // stripped before insert, kept for the in-memory map
    });
  }
});
const guestRowsForInsert = guestRows.map(({ _index, ...rest }) => rest);
const insertedGuests = await insertAndCount("guests", guestRowsForInsert);

// Map original guest index -> inserted row, by insertion order (guestRows and
// insertedGuests are built/returned in the same order).
const guestByIndex = new Map();
guestRows.forEach((g, i) => guestByIndex.set(g._index, insertedGuests[i]));

// 4. tables
const tableRows = tableDefs.map((t) => ({
  wedding_id: weddingId,
  name: t.name,
  seats_label: t.seatsLabel,
  capacity: t.capacity,
  shape: t.shape,
  position: t.position,
  x: t.x,
  y: t.y,
}));
const insertedTables = await insertAndCount("tables", tableRows);

// 5. seat assignment: update guests.table_id for the first 116 confirmed
let seatedCount = 0;
for (let i = 0; i < tableDefs.length; i++) {
  const tableId = insertedTables[i].id;
  const slice = tableDefs[i].guestSlice;
  for (const g of slice) {
    const row = guestByIndex.get(g.index);
    const { error } = await supabase.from("guests").update({ table_id: tableId }).eq("id", row.id);
    if (error) {
      console.error(`Failed to seat guest ${row.id} at table ${tableId}: ${error.message}`);
      process.exit(1);
    }
    seatedCount++;
  }
}
counts["guests.table_id (seated)"] = seatedCount;

// 6. guest_events — mirrors guests.status for wedding-day; sparser, varied
// answers for welcome-dinner and brunch. Party is not asked (no per-event
// answers in the mock beyond these three).
const guestEventRows = [];
for (const g of guests) {
  const guestRow = guestByIndex.get(g.index);
  const i = g.index;

  guestEventRows.push({
    guest_id: guestRow.id,
    event_id: eventIdByKey.get("wedding-day"),
    status: g.status,
  });

  if (g.status === "declined") continue;

  if (g.guestGroup === "family" || i % 4 === 0) {
    guestEventRows.push({
      guest_id: guestRow.id,
      event_id: eventIdByKey.get("welcome-dinner"),
      status: i % 11 === 0 ? "pending" : i % 6 === 0 ? "declined" : "confirmed",
    });
  }

  guestEventRows.push({
    guest_id: guestRow.id,
    event_id: eventIdByKey.get("brunch"),
    status: i % 3 === 0 ? "declined" : i % 8 === 0 ? "pending" : "confirmed",
  });
}
await insertAndCount("guest_events", guestEventRows);

// 7. schedule_entries
const scheduleRows = scheduleDefs.map((s) => ({
  wedding_id: weddingId,
  event_id: eventIdByKey.get(s.eventKey),
  time: s.time,
  title: s.title,
  description: s.description,
  position: s.position,
}));
await insertAndCount("schedule_entries", scheduleRows);

// 8. venues
await insertAndCount("venues", [
  {
    wedding_id: weddingId,
    name: venueDef.name,
    address: venueDef.address,
    city: venueDef.city,
    maps_url: venueDef.mapsUrl,
    waze_url: venueDef.wazeUrl,
    parking_info: venueDef.parkingInfo,
    access_info: venueDef.accessInfo,
    transport_info: venueDef.transportInfo,
    photo_url: venueDef.photoUrl,
  },
]);

// 9. accommodations
const accommodationRows = accommodationDefs.map((a) => ({
  wedding_id: weddingId,
  name: a.name,
  city: a.city,
  distance: a.distance,
  phone: a.phone,
  booking_url: a.bookingUrl,
  offer: a.offer,
  photo_url: a.photoUrl,
  position: a.position,
}));
await insertAndCount("accommodations", accommodationRows);

// 10. faq_entries
const faqRows = faqDefs.map((f) => ({
  wedding_id: weddingId,
  question: f.question,
  answer: f.answer,
  position: f.position,
  published: f.published,
}));
await insertAndCount("faq_entries", faqRows);

// 11. menu_categories -> menu_items
const menuCategoryRows = menuDefs.map((m) => ({
  wedding_id: weddingId,
  key: m.key,
  enabled: m.enabled,
  position: m.position,
}));
const insertedCategories = await insertAndCount("menu_categories", menuCategoryRows);

const menuItemRows = [];
menuDefs.forEach((m, idx) => {
  const categoryId = insertedCategories[idx].id;
  for (const item of m.items) {
    menuItemRows.push({
      category_id: categoryId,
      name: item.name,
      description: item.description,
      variant: item.variant,
      position: m.items.indexOf(item),
    });
  }
});
await insertAndCount("menu_items", menuItemRows);

// 12. day_of_settings
await insertAndCount("day_of_settings", [
  {
    wedding_id: weddingId,
    enabled: true,
    gallery_visible_to_guests: true,
    uploads_open_until: "2027-06-21T23:59:59.999Z",
    after_wedding_mode: false,
    venue_plan_url: null,
  },
]);

/* ------------------------------------------------------------------ *
 * Summary
 * ------------------------------------------------------------------ */

console.log("\nSeed complete. Rows inserted:");
for (const [table, count] of Object.entries(counts)) {
  console.log(`  ${table}: ${count}`);
}

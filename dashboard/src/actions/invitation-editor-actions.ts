"use server";

import { normaliseTexts } from "@shared/data/invitation-texts";
import { APP_MODULES } from "@shared/data/modules";
import { SCHEDULE_ICON_KEYS } from "@shared/data/schedule-icons";
import { EVENT_KEYS } from "@shared/types/invitation";
import { addableModules, amountDue, splitUnpaid } from "@shared/lib/addable-modules";

import { diffList, sameValue } from "@/components/editor/diff";
import {
  EDITOR_IMAGE_FOLDERS,
  type EditorAccommodation,
  type EditorBootstrap,
  type EditorChanges,
  type EditorEvent,
  type EditorFaqEntry,
  type EditorScheduleEntry,
  type EditorState,
  type EditorUnit,
  type ModuleConfig,
  type SaveResult,
  isNewId,
} from "@/components/editor/types";
import {
  EditorValidationError,
  cleanAccommodations,
  cleanEvents,
  cleanFaq,
  cleanModuleConfig,
  cleanNames,
  cleanSchedule,
  cleanSettings,
  cleanTexts,
  cleanVenue,
} from "@/components/editor/validate";
import { requireWedding } from "@/lib/db/current-wedding";
import { editorPreviewUrl } from "@/lib/editor-preview-url";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * The invitation editor's two round trips: read the whole invitation, and save
 * whatever part of it changed.
 *
 * Every read and write goes through the couple's own session (RLS: "Owner can
 * manage own …" on every table touched), and every write is also scoped to the
 * wedding explicitly — the policy is the net, not the only check. Uploads are
 * the exception, as everywhere else in the dashboard: storage is written with
 * the service role, into a folder named after the wedding the session owns.
 */

type Db = Awaited<ReturnType<typeof requireWedding>>["supabase"];

/** A column's value as the editor's string, `""` for null. */
function s(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** A string for a nullable column: empty is stored as null, not as "". */
function orNull(value: string): string | null {
  return value ? value : null;
}

const KNOWN_MODULES = new Set(APP_MODULES.map((module) => module.id));
const DEFAULT_ORDER = new Map(APP_MODULES.map((module) => [module.id, module.defaultOrder]));
const KNOWN_EVENT_KEYS: ReadonlySet<string> = new Set(EVENT_KEYS);
const KNOWN_ICONS: ReadonlySet<string> = new Set(SCHEDULE_ICON_KEYS);

function landingUrl(): string {
  return (
    process.env.NEXT_PUBLIC_LANDING_URL || "https://www.thestudiopapeteriedigitale.com"
  ).replace(/\/+$/, "");
}

/* ------------------------------------------------------------------ *
 * Read
 * ------------------------------------------------------------------ */

async function readInvitation(db: Db, weddingId: string, userId: string): Promise<EditorBootstrap> {
  const [profileRes, settingsRes, siteRes, eventsRes, scheduleRes, venueRes, staysRes, faqRes] =
    await Promise.all([
      db.from("profiles").select("first_name, partner_name").eq("id", userId).maybeSingle(),
      db
        .from("settings")
        .select("hero_kicker, announcement, closing_words, couple_photo_url, adults_only, invitation_texts")
        .eq("wedding_id", weddingId)
        .maybeSingle(),
      db
        .from("sites")
        .select("id, theme_id, modules, languages, slug, status, plan_id, pending_modules")
        .eq("wedding_id", weddingId)
        .maybeSingle(),
      db
        .from("events")
        .select("id, key, name, date, time, address, description, dress_code, position, enabled")
        .eq("wedding_id", weddingId)
        .order("position", { ascending: true }),
      db
        .from("schedule_entries")
        .select("id, event_id, time, title, description, position, icon, image_url")
        .eq("wedding_id", weddingId)
        .order("position", { ascending: true }),
      db
        .from("venues")
        .select("name, address, city, maps_url, waze_url, parking_info, access_info, transport_info, photo_url")
        .eq("wedding_id", weddingId)
        .maybeSingle(),
      db
        .from("accommodations")
        .select("id, name, city, distance, phone, booking_url, offer, photo_url, address, secondary")
        .eq("wedding_id", weddingId)
        .order("position", { ascending: true }),
      db
        .from("faq_entries")
        .select("id, question, answer, position, published")
        .eq("wedding_id", weddingId)
        .order("position", { ascending: true }),
    ]);

  const firstError = [profileRes, settingsRes, siteRes, eventsRes, scheduleRes, venueRes, staysRes, faqRes]
    .map((res) => res.error)
    .find(Boolean);
  if (firstError) throw new Error(firstError.message);

  const site = siteRes.data;
  const moduleRows = site
    ? await db.from("site_modules").select("module_id, position, config").eq("site_id", site.id)
    : { data: [], error: null };
  if (moduleRows.error) throw new Error(moduleRows.error.message);

  // The couple's module order: `site_modules.position` where there is a row,
  // the catalogue's default order where there is none. Read only — unlike
  // `getOrderedModules`, which inserts the missing rows as a side effect.
  const positions = new Map<string, number>();
  const configs = new Map<string, ModuleConfig>();
  for (const row of moduleRows.data ?? []) {
    positions.set(row.module_id, row.position ?? 99);
    configs.set(
      row.module_id,
      row.config && typeof row.config === "object" && !Array.isArray(row.config)
        ? (row.config as ModuleConfig)
        : {},
    );
  }

  const ownedModules = ((site?.modules as string[] | null) ?? [])
    .filter((id) => KNOWN_MODULES.has(id))
    .sort(
      (a, b) =>
        (positions.get(a) ?? DEFAULT_ORDER.get(a) ?? 99) -
        (positions.get(b) ?? DEFAULT_ORDER.get(b) ?? 99),
    );

  // Saved but unpaid: shown in the editor, invisible to guests (spec D3).
  const ownedSet = new Set(ownedModules);
  const pendingModules = [...new Set((site?.pending_modules as string[] | null) ?? [])].filter(
    (id) => KNOWN_MODULES.has(id) && !ownedSet.has(id),
  );

  const settings = settingsRes.data;
  const venue = venueRes.data;
  const legacyFaq = configs.get("faq")?.questions;

  // Events first, then the moments inside each, so the draft's own order is
  // already the display order the forms show.
  const events: EditorEvent[] = (eventsRes.data ?? [])
    .filter((row) => KNOWN_EVENT_KEYS.has(row.key))
    .map((row) => ({
      id: row.id,
      key: row.key,
      name: s(row.name),
      date: s(row.date),
      time: s(row.time),
      address: s(row.address),
      description: s(row.description),
      dressCode: s(row.dress_code),
      enabled: row.enabled === true,
    }));

  const eventOrder = new Map(events.map((event, index) => [event.id, index]));
  const schedule: EditorScheduleEntry[] = (scheduleRes.data ?? [])
    .filter((row) => eventOrder.has(row.event_id))
    .sort((a, b) => (eventOrder.get(a.event_id)! - eventOrder.get(b.event_id)!) || (a.position ?? 0) - (b.position ?? 0))
    .map((row) => ({
      id: row.id,
      eventId: row.event_id,
      time: s(row.time),
      title: s(row.title),
      description: s(row.description),
      icon: KNOWN_ICONS.has(row.icon) ? row.icon : "",
      imageUrl: s(row.image_url),
    }));

  const state: EditorState = {
    names: {
      partner1: s(profileRes.data?.first_name),
      partner2: s(profileRes.data?.partner_name),
    },
    settings: {
      heroKicker: s(settings?.hero_kicker),
      announcement: s(settings?.announcement),
      closingWords: s(settings?.closing_words),
      couplePhotoUrl: s(settings?.couple_photo_url),
      adultsOnly: settings?.adults_only === true,
    },
    texts: normaliseTexts(settings?.invitation_texts),
    events,
    schedule,
    venue: {
      name: s(venue?.name),
      address: s(venue?.address),
      city: s(venue?.city),
      mapsUrl: s(venue?.maps_url),
      wazeUrl: s(venue?.waze_url),
      parkingInfo: s(venue?.parking_info),
      accessInfo: s(venue?.access_info),
      transportInfo: s(venue?.transport_info),
      photoUrl: s(venue?.photo_url),
    },
    accommodations: (staysRes.data ?? []).map((row) => ({
      id: row.id,
      name: s(row.name),
      city: s(row.city),
      distance: s(row.distance),
      address: s(row.address),
      phone: s(row.phone),
      bookingUrl: s(row.booking_url),
      offer: s(row.offer),
      photoUrl: s(row.photo_url),
      secondary: row.secondary === true,
    })),
    faq: (faqRes.data ?? []).map((row) => ({
      id: row.id,
      question: s(row.question),
      answer: s(row.answer),
      published: row.published !== false,
    })),
    modules: Object.fromEntries(
      [...ownedModules, ...pendingModules].map((id) => [id, configs.get(id) ?? {}]),
    ),
  };

  return {
    state,
    meta: {
      themeId: (site?.theme_id as string | null) ?? null,
      ownedModules,
      planId: (site?.plan_id as string | null) ?? null,
      pendingModules,
      languages: (site?.languages as string[] | null) ?? [],
      slug: (site?.slug as string | null) ?? null,
      published: site?.status === "published",
      landingUrl: landingUrl(),
      previewUrl: editorPreviewUrl(),
      legacyFaq: Array.isArray(legacyFaq)
        ? legacyFaq
            .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
            .map((entry) => ({ question: s(entry.question).trim(), answer: s(entry.answer).trim() }))
            .filter((entry) => entry.question && entry.answer)
        : [],
    },
  };
}

/**
 * Everything the editor shows, in one read. Throws when there is no session,
 * which the page turns into its error boundary — the middleware has already
 * sent a signed-out visitor to the login page by then.
 */
export async function loadInvitationEditor(): Promise<EditorBootstrap> {
  const { supabase, user, weddingId } = await requireWedding();
  return readInvitation(supabase, weddingId, user.id);
}

/* ------------------------------------------------------------------ *
 * Write
 * ------------------------------------------------------------------ */

/**
 * Brings a table's rows for this wedding in line with `after`: deletes what is
 * gone, inserts what is new (collecting the real ids), updates what changed or
 * moved. Rows are written one by one — the lists are short, and a failing row
 * then names itself instead of taking a batch down with it.
 */
async function syncRows<T extends { id: string }>(opts: {
  db: Db;
  table: "events" | "schedule_entries" | "accommodations" | "faq_entries";
  weddingId: string;
  before: T[];
  after: T[];
  toRow: (row: T) => Record<string, unknown>;
  position: (row: T) => number;
}): Promise<Map<string, string>> {
  const { db, table, weddingId, before, after, toRow, position } = opts;
  const { inserted, updated, deletedIds } = diffList(before, after);
  const createdIds = new Map<string, string>();

  if (deletedIds.length > 0) {
    const { error } = await db.from(table).delete().in("id", deletedIds).eq("wedding_id", weddingId);
    if (error) throw new Error(error.message);
  }

  const beforePosition = new Map(before.map((row) => [row.id, position(row)]));
  const changed = new Set(updated.map((row) => row.id));
  const isInsert = new Set(inserted.map((row) => row.id));

  for (const row of after) {
    const values = { ...toRow(row), position: position(row) };

    if (isInsert.has(row.id)) {
      const { data, error } = await db
        .from(table)
        .insert({ ...values, wedding_id: weddingId })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "insert failed");
      createdIds.set(row.id, data.id as string);
    } else if (changed.has(row.id) || beforePosition.get(row.id) !== position(row)) {
      const { error } = await db.from(table).update(values).eq("id", row.id).eq("wedding_id", weddingId);
      if (error) throw new Error(error.message);
    }
  }

  return createdIds;
}

/** 1-based index of each row in its list. */
function indexPositions<T extends { id: string }>(rows: T[]): (row: T) => number {
  const index = new Map(rows.map((row, i) => [row.id, i + 1]));
  return (row) => index.get(row.id) ?? 0;
}

/** 1-based index of each moment inside its own event. */
function schedulePositions(rows: EditorScheduleEntry[]): (row: EditorScheduleEntry) => number {
  const counters = new Map<string, number>();
  const index = new Map<string, number>();
  for (const row of rows) {
    const next = (counters.get(row.eventId) ?? 0) + 1;
    counters.set(row.eventId, next);
    index.set(row.id, next);
  }
  return (row) => index.get(row.id) ?? 0;
}

/**
 * An id the couple's draft carries that is neither new nor one of the rows the
 * wedding holds cannot be trusted as a row reference; it is treated as a new
 * row instead, so a crafted id can never make an update land elsewhere.
 */
function claimIds<T extends { id: string }>(rows: T[], existing: T[]): T[] {
  const known = new Set(existing.map((row) => row.id));
  return rows.map((row) =>
    isNewId(row.id) || known.has(row.id) ? row : { ...row, id: `new_${row.id}` },
  );
}

export async function saveInvitationDraft(changes: EditorChanges): Promise<SaveResult> {
  let ctx: Awaited<ReturnType<typeof requireWedding>>;
  try {
    ctx = await requireWedding();
  } catch {
    return {
      ok: false,
      state: null,
      errors: { names: "Votre session a expiré. Reconnectez-vous." },
      createdIds: {},
    };
  }

  const { supabase: db, user, weddingId } = ctx;
  const current = await readInvitation(db, weddingId, user.id);
  const errors: Partial<Record<EditorUnit, string>> = {};

  const run = async (unit: EditorUnit, write: () => Promise<void>) => {
    try {
      await write();
    } catch (error) {
      console.error(`[EDITOR_SAVE_${unit}]`, error);
      errors[unit] =
        error instanceof EditorValidationError
          ? error.message
          : "Cette partie n'a pas pu être enregistrée. Réessayez dans un instant.";
    }
  };

  /* -- The couple and their words ------------------------------------------ */

  if (changes.names) {
    await run("names", async () => {
      const names = cleanNames(changes.names);
      const { error } = await db
        .from("profiles")
        .update({ first_name: names.partner1, partner_name: names.partner2 })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    });
  }

  if (changes.settings) {
    await run("settings", async () => {
      const settings = cleanSettings(changes.settings);
      const { error } = await db
        .from("settings")
        .update({
          hero_kicker: orNull(settings.heroKicker),
          announcement: orNull(settings.announcement),
          closing_words: orNull(settings.closingWords),
          couple_photo_url: orNull(settings.couplePhotoUrl),
          adults_only: settings.adultsOnly,
        })
        .eq("wedding_id", weddingId);
      if (error) throw new Error(error.message);
    });
  }

  if (changes.texts) {
    await run("texts", async () => {
      const { error } = await db
        .from("settings")
        .update({ invitation_texts: cleanTexts(changes.texts) })
        .eq("wedding_id", weddingId);
      if (error) throw new Error(error.message);
    });
  }

  /* -- Events, then the moments that hang off them ----------------------------- */

  // New events get their real ids here; moments pointing at them are
  // rewritten before they are saved.
  let eventIds = new Map<string, string>();

  if (changes.events) {
    await run("events", async () => {
      const after = claimIds(cleanEvents(changes.events), current.state.events);
      eventIds = await syncRows<EditorEvent>({
        db,
        table: "events",
        weddingId,
        before: current.state.events,
        after,
        position: indexPositions(after),
        toRow: (event) => ({
          key: event.key,
          name: event.name,
          date: orNull(event.date),
          time: orNull(event.time),
          address: orNull(event.address),
          description: orNull(event.description),
          dress_code: orNull(event.dressCode),
          enabled: event.enabled,
        }),
      });

      // `weddings.wedding_date` is what the dashboard's own countdown reads.
      // Kept in step with the ceremony here, or changing the date in the
      // editor would leave the home page counting down to the old one.
      const ceremony = after.find((event) => event.key === "wedding-day");
      if (ceremony?.date) {
        const { error } = await db
          .from("weddings")
          .update({ wedding_date: ceremony.date })
          .eq("id", weddingId);
        if (error) throw new Error(error.message);
      }
    });
  }

  if (changes.schedule) {
    if (errors.events) {
      errors.schedule = "Le programme sera enregistré avec les événements.";
    } else {
      await run("schedule", async () => {
        const { data: eventRows, error } = await db
          .from("events")
          .select("id")
          .eq("wedding_id", weddingId);
        if (error) throw new Error(error.message);

        const owned = new Set((eventRows ?? []).map((row) => row.id as string));
        const remapped = (changes.schedule ?? []).map((entry) => ({
          ...entry,
          eventId: eventIds.get(entry.eventId) ?? entry.eventId,
        }));
        const after = claimIds(cleanSchedule(remapped, owned), current.state.schedule);

        await syncRows<EditorScheduleEntry>({
          db,
          table: "schedule_entries",
          weddingId,
          // Moments of an event deleted above are already gone (cascade).
          before: current.state.schedule.filter((entry) => owned.has(entry.eventId)),
          after,
          position: schedulePositions(after),
          toRow: (entry) => ({
            event_id: entry.eventId,
            time: entry.time,
            title: entry.title,
            description: orNull(entry.description),
            icon: entry.icon || null,
            image_url: orNull(entry.imageUrl),
          }),
        });
      });
    }
  }

  /* -- Venue, hotels, questions ------------------------------------------------- */

  if (changes.venue) {
    await run("venue", async () => {
      const venue = cleanVenue(changes.venue);
      const { error } = await db.from("venues").upsert(
        {
          wedding_id: weddingId,
          name: venue.name,
          address: orNull(venue.address),
          city: orNull(venue.city),
          maps_url: orNull(venue.mapsUrl),
          waze_url: orNull(venue.wazeUrl),
          parking_info: orNull(venue.parkingInfo),
          access_info: orNull(venue.accessInfo),
          transport_info: orNull(venue.transportInfo),
          photo_url: orNull(venue.photoUrl),
        },
        { onConflict: "wedding_id" },
      );
      if (error) throw new Error(error.message);
    });
  }

  if (changes.accommodations) {
    await run("accommodations", async () => {
      const after = claimIds(cleanAccommodations(changes.accommodations), current.state.accommodations);
      await syncRows<EditorAccommodation>({
        db,
        table: "accommodations",
        weddingId,
        before: current.state.accommodations,
        after,
        position: indexPositions(after),
        toRow: (stay) => ({
          name: stay.name,
          city: orNull(stay.city),
          distance: orNull(stay.distance),
          address: orNull(stay.address),
          phone: orNull(stay.phone),
          booking_url: orNull(stay.bookingUrl),
          offer: orNull(stay.offer),
          photo_url: orNull(stay.photoUrl),
          secondary: stay.secondary,
        }),
      });
    });
  }

  if (changes.faq) {
    await run("faq", async () => {
      const after = claimIds(cleanFaq(changes.faq), current.state.faq);
      await syncRows<EditorFaqEntry>({
        db,
        table: "faq_entries",
        weddingId,
        before: current.state.faq,
        after,
        position: indexPositions(after),
        toRow: (entry) => ({
          question: entry.question,
          answer: entry.answer,
          published: entry.published,
        }),
      });
    });
  }

  /* -- Module configs ----------------------------------------------------------- */

  const { data: site } = await db.from("sites").select("id").eq("wedding_id", weddingId).maybeSingle();

  if (changes.modules && Object.keys(changes.modules).length > 0) {
    const owned = new Set(current.meta.ownedModules);
    const pending = new Set(current.meta.pendingModules);
    // A module added in the editor since the last save: only one the couple's
    // theme draws and that is not already theirs (spec D3, D9).
    const addable = new Set(
      addableModules(current.meta.themeId, current.meta.ownedModules, current.meta.pendingModules),
    );
    const added: string[] = [];

    for (const [moduleId, config] of Object.entries(changes.modules)) {
      await run(`modules.${moduleId}`, async () => {
        const isNew = !owned.has(moduleId) && !pending.has(moduleId);
        if (!site || (isNew && !addable.has(moduleId))) {
          throw new EditorValidationError("Ce module n'est pas disponible avec votre thème.");
        }

        const previous = current.state.modules[moduleId] ?? {};
        const cleaned = cleanModuleConfig(moduleId, config, previous);
        // A new module is stored even empty: saving it is what adds it.
        if (!isNew && sameValue(previous, cleaned)) return;

        const { data: existing, error: readError } = await db
          .from("site_modules")
          .select("id")
          .eq("site_id", site.id)
          .eq("module_id", moduleId)
          .maybeSingle();
        if (readError) throw new Error(readError.message);

        const { error } = existing
          ? await db.from("site_modules").update({ config: cleaned }).eq("id", existing.id)
          : await db.from("site_modules").insert({
              site_id: site.id,
              module_id: moduleId,
              config: cleaned,
              position: DEFAULT_ORDER.get(moduleId) ?? 99,
            });
        if (error) throw new Error(error.message);

        if (isNew) added.push(moduleId);
      });
    }

    if (site && added.length > 0) {
      // After their rows exist. The couple's own session may write this column
      // (spec D10): nothing in it is shown to guests or granted without a payment.
      const { error } = await db
        .from("sites")
        .update({ pending_modules: [...current.meta.pendingModules, ...added] })
        .eq("id", site.id);
      if (error) {
        console.error("[EDITOR_SAVE_PENDING]", error);
        for (const id of added) {
          errors[`modules.${id}`] = "Ce module n'a pas pu être ajouté. Réessayez dans un instant.";
        }
      }
    }
  }

  let fresh = await readInvitation(db, weddingId, user.id);

  // Unpaid modules the plan still includes go live now, free (spec D3). The
  // service role, because granting is exactly what a couple must not do alone.
  if (site) {
    const { free } = splitUnpaid(
      fresh.meta.planId,
      fresh.meta.ownedModules,
      fresh.meta.pendingModules,
      fresh.meta.themeId,
    );
    if (free.length > 0) {
      const { error } = await supabaseAdmin.rpc("grant_modules", {
        p_site_id: site.id,
        p_modules: free,
        p_unit_price_cents: 0,
      });
      if (error) console.error("[EDITOR_GRANT_INCLUDED]", error);
      else fresh = await readInvitation(db, weddingId, user.id);
    }
  }

  const modules = { owned: fresh.meta.ownedModules, pending: fresh.meta.pendingModules };
  const due = amountDue(fresh.meta.planId, modules.owned, modules.pending, fresh.meta.themeId);

  return Object.keys(errors).length === 0
    ? { ok: true, state: fresh.state, modules, due }
    : {
        ok: false,
        state: fresh.state,
        errors,
        createdIds: Object.fromEntries(eventIds),
        modules,
        due,
      };
}

/* ------------------------------------------------------------------ *
 * Uploads
 * ------------------------------------------------------------------ */

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB — PhotoPicker's cap, re-checked here.
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const FOLDERS: ReadonlySet<string> = new Set(EDITOR_IMAGE_FOLDERS);

/**
 * A photograph for the invitation — the venue, a hotel, a moment of the day,
 * the dress-code inspiration, the couple.
 *
 * The same bucket and limits as `venue-actions.ts`; the folder comes from an
 * allowlist rather than from the caller verbatim, because a server action's
 * arguments are whatever the request says they are.
 */
export async function uploadEditorImage(
  formData: FormData,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  let weddingId: string;
  try {
    ({ weddingId } = await requireWedding());
  } catch {
    return { success: false, error: "Vous devez être connecté" };
  }

  const folder = formData.get("folder");
  if (typeof folder !== "string" || !FOLDERS.has(folder)) {
    return { success: false, error: "Emplacement de photo inconnu." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, error: "Aucun fichier fourni." };

  const extension = PHOTO_TYPES[file.type];
  if (!extension) {
    return { success: false, error: "Format non pris en charge. Utilisez un JPEG, un PNG ou un WebP." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { success: false, error: "Photo trop lourde. Le maximum est de 8 Mo." };
  }

  const path = `${weddingId}/${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseAdmin.storage
    .from("venue")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });

  if (error) {
    console.error("[EDITOR_UPLOAD]", error);
    return { success: false, error: "Erreur lors du téléversement de la photo." };
  }

  return { success: true, url: supabaseAdmin.storage.from("venue").getPublicUrl(path).data.publicUrl };
}

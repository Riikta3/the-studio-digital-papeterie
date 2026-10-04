/**
 * The invitation editor's pure core: what changed, how a list becomes writes,
 * what the server accepts, and what the preview is sent.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test dashboard/src/components/editor/editor.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { editorPreviewUrl } from "../../lib/editor-preview-url.ts";
import { changedUnits, diffList } from "./diff.ts";
import { MODULE_LINK_KEYS, toPreviewRows } from "./to-preview-rows.ts";
import { formatEuros } from "./format-euros.ts";
import { draftedModules, moduleStatus, previewMarks, previewModules, sectionOrHero } from "./module-status.ts";
import { canOfferPayment, isCharged, paymentOutcome } from "./payment-flow.ts";
import { groupSections, sectionBadge, stepSection } from "./section-nav.ts";
import { parseHexColor, withColor } from "./fields/color.ts";
import {
  EditorValidationError,
  cleanAccommodations,
  cleanEvents,
  cleanFaq,
  cleanModuleConfig,
  cleanNames,
  cleanSchedule,
  cleanVenue,
} from "./validate.ts";

function emptyVenue() {
  return {
    name: "",
    address: "",
    city: "",
    mapsUrl: "",
    wazeUrl: "",
    parkingInfo: "",
    accessInfo: "",
    transportInfo: "",
    photoUrl: "",
  };
}

function entry(overrides = {}) {
  return {
    id: "s1",
    eventId: "e1",
    time: "17h00",
    title: "Cérémonie",
    description: "",
    icon: "",
    imageUrl: "",
    ...overrides,
  };
}

function fixtureState() {
  return {
    names: { partner1: "Camille", partner2: "Jonas" },
    settings: {
      heroKicker: "Nous nous marions",
      announcement: "",
      closingWords: "",
      couplePhotoUrl: "",
      adultsOnly: false,
    },
    texts: { "faq.title": "FAQ" },
    events: [
      {
        id: "e1",
        key: "wedding-day",
        name: "Notre mariage",
        date: "2027-05-12",
        time: "16h00",
        address: "",
        description: "",
        dressCode: "",
        enabled: true,
      },
      {
        id: "e2",
        key: "brunch",
        name: "Brunch",
        date: "2027-05-13",
        time: "",
        address: "",
        description: "",
        dressCode: "",
        enabled: false,
      },
    ],
    schedule: [
      entry({ id: "s1", eventId: "e1" }),
      entry({ id: "s2", eventId: "e1", time: "18h00", title: "Cocktail" }),
      entry({ id: "s3", eventId: "e2", time: "11h00", title: "Brunch" }),
      entry({ id: "s4", eventId: "e1", time: "", title: "" }),
    ],
    venue: { ...emptyVenue(), name: "Domaine", city: "Uzès" },
    accommodations: [],
    faq: [
      { id: "f1", question: "Parking ?", answer: "Oui.", published: true },
      { id: "f2", question: "Brouillon", answer: "Pas encore", published: false },
    ],
    modules: { rsvp: {}, faq: {} },
  };
}

function fixtureMeta() {
  return {
    themeId: "ciao-amore",
    ownedModules: ["countdown", "timeline", "rsvp", "faq"],
    planId: "signature",
    pendingModules: [],
    languages: ["fr"],
    slug: "camille-et-jonas",
    published: true,
    landingUrl: "https://www.thestudiopapeteriedigitale.com",
    previewUrl: "http://localhost:3010",
    legacyFaq: [],
  };
}

/* -- diff ------------------------------------------------------------------ */

test("changedUnits reports only what differs, module by module", () => {
  const saved = fixtureState();
  const draft = structuredClone(saved);
  draft.faq[0].answer = "Oui, gratuit.";
  draft.modules.rsvp = { allow_partner: false };

  const changes = changedUnits(saved, draft);
  assert.deepEqual(Object.keys(changes).sort(), ["faq", "modules"]);
  assert.deepEqual(Object.keys(changes.modules), ["rsvp"]);
});

test("changedUnits ignores key order in the texts map", () => {
  const saved = fixtureState();
  saved.texts = { "faq.title": "FAQ", "map.eyebrow": "Le lieu" };
  const draft = structuredClone(saved);
  draft.texts = { "map.eyebrow": "Le lieu", "faq.title": "FAQ" };

  assert.deepEqual(changedUnits(saved, draft), {});
});

test("diffList sorts rows into inserts, updates, deletes and order", () => {
  const result = diffList(
    [
      { id: "a", v: 1 },
      { id: "b", v: 1 },
      { id: "c", v: 1 },
    ],
    [
      { id: "c", v: 1 },
      { id: "b", v: 2 },
      { id: "new_1", v: 0 },
    ],
  );

  assert.deepEqual(result.inserted.map((row) => row.id), ["new_1"]);
  assert.deepEqual(result.updated.map((row) => row.id), ["b"]);
  assert.deepEqual(result.deletedIds, ["a"]);
  assert.deepEqual(result.order, ["c", "b", "new_1"]);
});

/* -- validation ------------------------------------------------------------ */

test("names are required", () => {
  assert.throws(() => cleanNames({ partner1: "  ", partner2: "Léo" }), EditorValidationError);
  assert.deepEqual(cleanNames({ partner1: " Anna ", partner2: "Léo" }), {
    partner1: "Anna",
    partner2: "Léo",
  });
});

test("cleanVenue fixes a bare domain and refuses a script link", () => {
  assert.equal(
    cleanVenue({ ...emptyVenue(), mapsUrl: "maps.google.com/?q=Uzes" }).mapsUrl,
    "https://maps.google.com/?q=Uzes",
  );
  assert.throws(
    () => cleanVenue({ ...emptyVenue(), wazeUrl: "javascript:alert(1)" }),
    EditorValidationError,
  );
});

test("text longer than the form allows is refused, not cut", () => {
  assert.throws(
    () => cleanVenue({ ...emptyVenue(), name: "x".repeat(161) }),
    /dépasse 160 caractères/,
  );
});

test("cleanEvents refuses an unknown kind and a duplicate", () => {
  const event = fixtureState().events[0];
  assert.throws(() => cleanEvents([{ ...event, key: "after-party" }]), EditorValidationError);
  assert.throws(() => cleanEvents([event, { ...event, id: "e9" }]), /qu'une fois/);
  assert.throws(() => cleanEvents([{ ...event, date: "2027-02-30" }]), /date valide/);
});

test("cleanSchedule refuses a moment pointing at another wedding's event", () => {
  assert.throws(
    () => cleanSchedule([entry({ eventId: "someone-else" })], new Set(["e1"])),
    EditorValidationError,
  );
});

test("cleanSchedule drops blank rows and keeps only known icons", () => {
  const cleaned = cleanSchedule(
    [entry({ icon: "party" }), entry({ id: "s2", time: "", title: "" }), entry({ id: "s3", icon: "rocket" })],
    new Set(["e1"]),
  );
  assert.deepEqual(cleaned.map((row) => row.id), ["s1", "s3"]);
  assert.deepEqual(cleaned.map((row) => row.icon), ["party", ""]);
});

test("a question needs its answer, and blank rows disappear", () => {
  assert.throws(
    () => cleanFaq([{ id: "f1", question: "Parking ?", answer: "", published: true }]),
    EditorValidationError,
  );
  assert.deepEqual(cleanFaq([{ id: "f1", question: "", answer: "", published: true }]), []);
});

test("an hotel needs a name once anything is written in it", () => {
  const blank = {
    id: "a1", name: "", city: "", distance: "", address: "", phone: "",
    bookingUrl: "", offer: "", photoUrl: "", secondary: false,
  };
  assert.deepEqual(cleanAccommodations([blank]), []);
  assert.throws(() => cleanAccommodations([{ ...blank, city: "Uzès" }]), /doit avoir un nom/);
});

test("cleanModuleConfig keeps legacy keys it does not own", () => {
  const out = cleanModuleConfig(
    "map",
    { description: "Au bout de l'allée", name: "Tentative d'écraser" },
    { name: "Ancien nom", description: "x" },
  );
  assert.deepEqual(out, { name: "Ancien nom", description: "Au bout de l'allée" });
});

test("cleanModuleConfig derives the RSVP label from the ISO day", () => {
  const rsvp = cleanModuleConfig("rsvp", { rsvp_deadline_iso: "2027-04-01" }, {});
  assert.equal(rsvp.rsvp_deadline, "1er avril 2027");
  assert.equal(rsvp.allow_partner, true);
  assert.deepEqual(rsvp.dietary_options, []);
});

test("cleanModuleConfig refuses a module with nothing to configure", () => {
  assert.throws(() => cleanModuleConfig("countdown", {}, {}), EditorValidationError);
  assert.throws(() => cleanModuleConfig("gift-list", { gift_list_url: "javascript:x" }, {}), /adresse web/);
  assert.throws(() => cleanModuleConfig("dress-code", { colors: ["url(x)"] }, {}), /couleur/);
});

/* -- preview rows ---------------------------------------------------------- */

test("toPreviewRows hides what guests would not see, and positions the rest", () => {
  const rows = toPreviewRows(fixtureState(), fixtureMeta());

  assert.deepEqual(rows.events.map((event) => event.key), ["wedding-day"]);
  assert.deepEqual(rows.schedule.map((row) => [row.id, row.position]), [
    ["s1", 1],
    ["s2", 2],
  ]);
  assert.deepEqual(rows.faq.map((row) => row.id), ["f1"]);
  assert.equal(rows.site.theme_id, "ciao-amore");
  assert.deepEqual(rows.site.invitation_texts, { "faq.title": "FAQ" });
  assert.deepEqual(
    rows.moduleConfigs.map((row) => row.module_id),
    ["countdown", "timeline", "rsvp", "faq"],
  );
});

test("an empty venue is no venue at all", () => {
  const state = fixtureState();
  state.venue = emptyVenue();
  assert.equal(toPreviewRows(state, fixtureMeta()).venue, null);
});

test("the preview shows a link typed without its scheme as the save will store it", () => {
  const state = fixtureState();
  state.venue = { ...state.venue, mapsUrl: "maps.app.goo.gl/abc", wazeUrl: "javascript:alert(1)" };
  state.settings.couplePhotoUrl = "cdn.example.com/portrait.webp";

  const rows = toPreviewRows(state, fixtureMeta());
  assert.equal(rows.venue.maps_url, "https://maps.app.goo.gl/abc");
  assert.equal(rows.site.couple_photo_url, "https://cdn.example.com/portrait.webp");
  // Not a web link: passed on as typed, for the landing's `safeUrl` to drop.
  assert.equal(rows.venue.waze_url, "javascript:alert(1)");
});

test("every module link the save stores as a link, the preview completes too", () => {
  for (const [moduleId, keys] of Object.entries(MODULE_LINK_KEYS)) {
    for (const key of keys) {
      const saved = cleanModuleConfig(moduleId, { [key]: "www.example.com/x" }, {});
      assert.equal(saved[key], "https://www.example.com/x", `${moduleId}.${key} is not a link at save`);

      const state = fixtureState();
      state.modules[moduleId] = { [key]: "www.example.com/x" };
      const meta = { ...fixtureMeta(), ownedModules: [...fixtureMeta().ownedModules, moduleId] };
      const row = toPreviewRows(state, meta).moduleConfigs.find((config) => config.module_id === moduleId);
      assert.equal(row.config[key], "https://www.example.com/x", `${moduleId}.${key} in the preview`);
    }
  }

  const state = fixtureState();
  state.modules.gallery = { images: ["www.example.com/a.webp"] };
  const meta = { ...fixtureMeta(), ownedModules: [...fixtureMeta().ownedModules, "gallery"] };
  const gallery = toPreviewRows(state, meta).moduleConfigs.find((config) => config.module_id === "gallery");
  assert.deepEqual(gallery.config.images, ["https://www.example.com/a.webp"]);
});

/* -- preview address ------------------------------------------------------- */

/** Runs `fn` with these variables set (`undefined` unsets one), then restores them. */
function withEnv(values, fn) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  const apply = (entries) => {
    for (const [key, value] of Object.entries(entries)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  apply(values);
  try {
    return fn();
  } finally {
    apply(previous);
  }
}

test("in development the preview is the local landing, whatever the landing URL says", () => {
  // A dashboard run on the production database keeps a landing URL on the
  // deployment, which may not have the preview route at all.
  withEnv(
    {
      NODE_ENV: "development",
      EDITOR_PREVIEW_URL: undefined,
      NEXT_PUBLIC_LANDING_URL: "https://the-studio-digital-papeterie.vercel.app",
    },
    () => assert.equal(editorPreviewUrl(), "http://localhost:3010"),
  );
});

test("in production the preview is this environment's landing, as an origin", () => {
  withEnv(
    {
      NODE_ENV: "production",
      EDITOR_PREVIEW_URL: undefined,
      NEXT_PUBLIC_LANDING_URL: "https://www.thestudiopapeteriedigitale.com/",
    },
    () => assert.equal(editorPreviewUrl(), "https://www.thestudiopapeteriedigitale.com"),
  );
  withEnv(
    { NODE_ENV: "production", EDITOR_PREVIEW_URL: undefined, NEXT_PUBLIC_LANDING_URL: undefined },
    () => assert.equal(editorPreviewUrl(), "https://www.thestudiopapeteriedigitale.com"),
  );
});

test("EDITOR_PREVIEW_URL wins, and a malformed value is skipped", () => {
  withEnv(
    { NODE_ENV: "development", EDITOR_PREVIEW_URL: "https://landing-git-editor.vercel.app/fr" },
    () => assert.equal(editorPreviewUrl(), "https://landing-git-editor.vercel.app"),
  );
  withEnv(
    {
      NODE_ENV: "production",
      EDITOR_PREVIEW_URL: "not an address",
      NEXT_PUBLIC_LANDING_URL: "https://landing.example",
    },
    () => assert.equal(editorPreviewUrl(), "https://landing.example"),
  );
});

/* -- modules added after the sale ------------------------------------------- */

test("a module added in the draft is drawn, marked and priced before it is saved", () => {
  const state = fixtureState();
  state.modules = { ...state.modules, gallery: {} };
  const meta = { ...fixtureMeta(), pendingModules: ["menu"] };

  assert.deepEqual(draftedModules(state, meta), ["gallery"]);
  assert.equal(moduleStatus("gallery", state, meta), "draft");
  assert.equal(moduleStatus("menu", state, meta), "unpaid");
  assert.equal(moduleStatus("rsvp", state, meta), "live");
  assert.equal(moduleStatus("playlist", state, meta), null);

  const all = ["countdown", "timeline", "rsvp", "faq", "menu", "gallery"];
  assert.deepEqual(previewModules(state, meta), all);
  // Signature owning three counted modules (the RSVP takes no slot): menu
  // fills the last free one, gallery is billable and marked.
  assert.deepEqual(previewMarks(state, meta), { samples: ["menu", "gallery"], notLive: ["gallery"] });

  const rows = toPreviewRows(state, meta);
  assert.deepEqual(rows.site.modules, all);
  assert.deepEqual(rows.moduleConfigs.map((row) => row.module_id), all);
});

test("on an unlimited plan, added modules are sampled but never marked unpaid", () => {
  const state = fixtureState();
  state.modules = { ...state.modules, gallery: {} };
  const meta = { ...fixtureMeta(), planId: "prestige" };
  assert.deepEqual(previewMarks(state, meta), { samples: ["gallery"], notLive: [] });
});

test("formatEuros writes whole euros without decimals", () => {
  assert.match(formatEuros(500, "fr"), /^5\s€$/u);
  assert.match(formatEuros(1250, "fr"), /^12,50\s€$/u);
  assert.equal(formatEuros(500, "en"), "€5");
});

/* -- after the final review --------------------------------------------------- */

test("once Stripe has the money, a failed fast path says « confirming », never « failed »", () => {
  const lists = { owned: ["gallery"], pending: [] };
  assert.deepEqual(paymentOutcome({ ok: true, status: "granted", modules: lists }, { charged: true }), { kind: "live", modules: lists });
  assert.deepEqual(paymentOutcome({ ok: true, status: "already-owned", modules: lists }, { charged: true }), {
    kind: "already-owned",
    modules: lists,
  });
  assert.deepEqual(paymentOutcome({ ok: true, status: "processing" }, { charged: true }), { kind: "confirming" });
  // The database or Stripe hiccuped after the card was charged: the webhook grants it.
  assert.deepEqual(paymentOutcome({ ok: false, error: "unavailable" }, { charged: true }), { kind: "confirming" });
  // PayPal declined: nothing was taken, trying again is right.
  assert.deepEqual(paymentOutcome({ ok: false, error: "unverified" }, { charged: false }), { kind: "failed" });
});

test("only a succeeded or processing payment counts as charged", () => {
  assert.equal(isCharged("succeeded"), true);
  assert.equal(isCharged("processing"), true);
  for (const status of ["failed", "requires_payment_method", "requires_action", "canceled", null, undefined]) {
    assert.equal(isCharged(status), false);
  }
});

test("paying is offered only when nothing is left unsaved", () => {
  const due = { modules: ["gallery"], amountCents: 500 };
  assert.equal(canOfferPayment(due, false), true);
  // PayPal leaves the page: unsaved edits would be lost on the way (spec D4).
  assert.equal(canOfferPayment(due, true), false);
  assert.equal(canOfferPayment(null, false), false);
});

test("a tab the discarded draft took away falls back to the hero", () => {
  const state = fixtureState();
  const meta = { ...fixtureMeta(), pendingModules: ["menu"] };
  // Added since the save: discarding removed it, and its tab with it.
  assert.equal(sectionOrHero("gallery", state, meta), "hero");
  assert.equal(sectionOrHero("menu", state, meta), "menu");
  assert.equal(sectionOrHero("rsvp", state, meta), "rsvp");
  assert.equal(sectionOrHero("footer", state, meta), "footer");
  assert.equal(sectionOrHero("hero", state, meta), "hero");
});

/* -- the summary (section navigation) --------------------------------------- */

test("the summary groups the hero, the modules in the theme's order, then the footer", () => {
  assert.deepEqual(groupSections(["hero", "countdown", "timeline", "gallery", "footer"]), {
    intro: ["hero"],
    modules: ["countdown", "timeline", "gallery"],
    outro: ["footer"],
  });
  assert.deepEqual(groupSections(["hero", "footer"]), { intro: ["hero"], modules: [], outro: ["footer"] });
});

test("the phone switcher steps through the sections and stops at both ends", () => {
  const sections = ["hero", "countdown", "footer"];
  assert.equal(stepSection(sections, "hero", 1), "countdown");
  assert.equal(stepSection(sections, "countdown", -1), "hero");
  assert.equal(stepSection(sections, "hero", -1), null);
  assert.equal(stepSection(sections, "footer", 1), null);
  // A section the list no longer has (just discarded) steps nowhere.
  assert.equal(stepSection(sections, "gallery", 1), null);
});

test("a row says « À régler », its price or « Inclus » only for a module that is not live", () => {
  assert.equal(sectionBadge("unpaid", true), "due");
  assert.equal(sectionBadge("draft", true), "price");
  assert.equal(sectionBadge("draft", false), "included");
  assert.equal(sectionBadge("live", false), null);
  assert.equal(sectionBadge(null, false), null);
});

/* -- the dress-code colour picker ------------------------------------------- */

test("a typed colour code is read with or without its #, and in its short form", () => {
  assert.equal(parseHexColor("#E7BDC6"), "#e7bdc6");
  assert.equal(parseHexColor("e7bdc6"), "#e7bdc6");
  assert.equal(parseHexColor("  #e7bdc6 "), "#e7bdc6");
  assert.equal(parseHexColor("#abc"), "#aabbcc");
  assert.equal(parseHexColor("abc"), "#aabbcc");
});

test("anything but a 3- or 6-digit hex code is refused", () => {
  for (const input of ["", "#", "#e7bdc", "#e7bdc6ff", "#ggg", "rose", "rgb(1,2,3)", "#e7 bd c6"]) {
    assert.equal(parseHexColor(input), null, input);
  }
});

test("a validated colour replaces its swatch, or joins the palette when it is new", () => {
  assert.deepEqual(withColor(["#111111", "#222222"], 1, "#e7bdc6"), ["#111111", "#e7bdc6"]);
  assert.deepEqual(withColor(["#111111"], "new", "#e7bdc6"), ["#111111", "#e7bdc6"]);
});

import assert from "node:assert/strict";
import test from "node:test";

import { normaliseUserUrl, safeUrl } from "./safe-url.ts";
import { normaliseTexts, splitTexts } from "../data/invitation-texts.ts";
import { isEditorSectionId } from "../data/invitation-sections.ts";
import {
  isEditorToPreviewMessage,
  isPreviewToEditorMessage,
} from "../types/editor-preview.ts";

test("safeUrl keeps http(s) and drops every other scheme", () => {
  assert.equal(safeUrl("https://maps.google.com/?q=x"), "https://maps.google.com/?q=x");
  assert.equal(safeUrl(" http://127.0.0.1:54321/a.webp "), "http://127.0.0.1:54321/a.webp");
  assert.equal(safeUrl("javascript:alert(1)"), undefined);
  assert.equal(safeUrl("JAVASCRIPT:alert(1)"), undefined);
  assert.equal(safeUrl("data:text/html,x"), undefined);
  assert.equal(safeUrl("www.hotel.fr"), undefined);
  assert.equal(safeUrl(""), undefined);
  assert.equal(safeUrl(42), undefined);
});

test("normaliseUserUrl fixes a bare domain and refuses a script", () => {
  assert.equal(normaliseUserUrl("www.hotel.fr/chambres"), "https://www.hotel.fr/chambres");
  assert.equal(normaliseUserUrl("  hotel-du-lac.com "), "https://hotel-du-lac.com");
  assert.equal(normaliseUserUrl("https://waze.com/ul?q=x"), "https://waze.com/ul?q=x");
  assert.equal(normaliseUserUrl("JavaScript:alert(1)"), undefined);
  assert.equal(normaliseUserUrl("mailto:a@b.fr"), undefined);
  assert.equal(normaliseUserUrl("pas un lien"), undefined);
  assert.equal(normaliseUserUrl("localhost"), undefined);
  assert.equal(normaliseUserUrl(""), undefined);
  assert.equal(normaliseUserUrl(null), undefined);
});

test("normaliseTexts keeps well-formed keys and trimmed strings only", () => {
  assert.deepEqual(
    normaliseTexts({
      "faq.title": "  Bon à savoir ",
      "copy.footerNote": "",
      bad: "x",
      "a.b": 3,
      __proto__: "y",
      "dress-code.eyebrow": "Tenue",
    }),
    { "faq.title": "Bon à savoir", "dress-code.eyebrow": "Tenue" },
  );
  assert.deepEqual(normaliseTexts(["x"]), {});
  assert.deepEqual(normaliseTexts(null), {});
  assert.deepEqual(normaliseTexts("faq.title"), {});
  assert.equal(normaliseTexts({ "faq.title": "x".repeat(900) })["faq.title"].length, 600);
  assert.equal(normaliseTexts({ "faq.title": "a\r\nb" })["faq.title"], "a\nb");
});

test("normaliseTexts caps the number of keys", () => {
  const many = Object.fromEntries(
    Array.from({ length: 200 }, (_, index) => [`faq.k${index}`, "x"]),
  );
  assert.equal(Object.keys(normaliseTexts(many)).length, 120);
});

test("splitTexts separates contract copy from theme slots", () => {
  const { contract, slots } = splitTexts({
    "copy.footerNote": "Merci",
    "faq.title": "FAQ",
    "couple.monogram": "A & E",
    "dayTwo.note": "Maillot",
  });
  assert.deepEqual(contract, {
    "copy.footerNote": "Merci",
    "couple.monogram": "A & E",
    "dayTwo.note": "Maillot",
  });
  assert.deepEqual(slots, { "faq.title": "FAQ" });
});

test("section ids are the fifteen modules plus the hero and the footer", () => {
  assert.equal(isEditorSectionId("gift-list"), true);
  assert.equal(isEditorSectionId("hero"), true);
  assert.equal(isEditorSectionId("footer"), true);
  assert.equal(isEditorSectionId("gifts"), false);
  assert.equal(isEditorSectionId(undefined), false);
});

test("editor messages are recognised only when well formed", () => {
  const rows = {
    site: {},
    names: null,
    events: [],
    schedule: [],
    venue: null,
    accommodations: [],
    faq: [],
    moduleConfigs: [],
  };

  assert.equal(
    isEditorToPreviewMessage({ source: "studio-editor", type: "editor:focus", section: "faq" }),
    true,
  );
  assert.equal(
    isEditorToPreviewMessage({ source: "studio-editor", type: "editor:render", themeId: null, rows }),
    true,
  );
  assert.equal(
    isEditorToPreviewMessage({ source: "other", type: "editor:focus", section: "faq" }),
    false,
  );
  assert.equal(
    isEditorToPreviewMessage({ source: "studio-editor", type: "editor:render", themeId: null }),
    false,
  );
  assert.equal(
    isEditorToPreviewMessage({
      source: "studio-editor",
      type: "editor:render",
      themeId: 3,
      rows,
    }),
    false,
  );
});

test("preview messages are recognised only when well formed", () => {
  assert.equal(isPreviewToEditorMessage({ source: "studio-editor", type: "preview:ready" }), true);
  assert.equal(
    isPreviewToEditorMessage({
      source: "studio-editor",
      type: "preview:rendered",
      themeName: "Ciao Amore",
      sections: ["hero"],
      supported: ["hero", "footer"],
      slots: [{ key: "faq.title", defaultText: "FAQ", multiline: false }],
    }),
    true,
  );
  assert.equal(
    isPreviewToEditorMessage({
      source: "studio-editor",
      type: "preview:rendered",
      themeName: "Ciao Amore",
      sections: ["hero"],
      supported: ["hero"],
      slots: [{ key: "faq.title" }],
    }),
    false,
  );
  assert.equal(
    isPreviewToEditorMessage({ source: "studio-editor", type: "preview:select", section: 3 }),
    false,
  );
  assert.equal(isPreviewToEditorMessage("preview:ready"), false);
});

test("editor:render may carry the preview's sample and not-live lists", () => {
  const base = {
    source: "studio-editor",
    type: "editor:render",
    themeId: "ciao-amore",
    rows: { site: {}, events: [], schedule: [], accommodations: [], faq: [], moduleConfigs: [], venue: null, names: null },
  };
  assert.equal(isEditorToPreviewMessage(base), true);
  assert.equal(isEditorToPreviewMessage({ ...base, samples: ["gallery"], notLive: [] }), true);
  assert.equal(isEditorToPreviewMessage({ ...base, samples: "gallery" }), false);
  assert.equal(isEditorToPreviewMessage({ ...base, notLive: [1] }), false);
});

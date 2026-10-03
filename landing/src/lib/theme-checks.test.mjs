/**
 * Checks every ported theme against the two rules that keep a theme a theme:
 * nothing of its demo wedding survives outside `demo-data.ts`, and nothing the
 * editor offers is left unconnected.
 *
 * A designer hands over a mock-up with the demo couple's names, venue, hotels
 * and menu written into the markup and the stylesheet. Ported as-is, those
 * words appear on every customer's wedding — it has happened (a venue town, a
 * default monogram, the demo couple's photograph). And a slot declared in
 * `editor.ts` that no section reads is a field in the dashboard that changes
 * nothing.
 *
 * Leak words are whole words, case-sensitive. The theme's own name is not a
 * leak: "Maré Alta" is the theme, "Casa Maré Alta" was the demo venue. Add a
 * theme to `THEMES` when its port starts.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/theme-checks.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { readSupports } from "./theme-supports.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url)); // …/landing/
const THEMES_DIR = path.join(ROOT, "src/components/invitation/themes");
const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"];

/** The only file allowed to hold the demo wedding. */
const DEMO_FILE = "demo-data.ts";

const THEMES = {
  "mare-alta": {
    camel: "mareAlta",
    words: [
      "Sienna", "Malo", "Morel", "Casa Maré Alta", "Comporta", "Estrada da Praia",
      "Portugal", "Lisbonne", "Alentejo", "Setúbal", "Humberto Delgado",
      "Villa Pinhal", "Casa Areia", "Cabana do Sal", "Kyoto", "Naoshima", "Yakushima",
      "Vitor Kley", "Mayra Andrade", "Vanessa da Mata",
    ],
  },
  "chateau-royal": {
    camel: "chateauRoyal",
    words: [
      "Éléonore", "Eleonore", "Raphaël", "Raphael", "Vaux-le-Vicomte", "Vaux",
      "Maincy", "Meaux", "Seine-et-Marne", "Île-de-France", "77950",
      "Bresse", "morilles", "langoustine",
      "Orangerie", "Grand Parterre", "Relais des Écuries", "Reine-Blanche", "Bergerie du Parc",
      "Charmilles", "Pont-Neuf", "Domaine des Tilleuls", "Melun", "ER2027", "Venise",
      "Strauss", "Aznavour", "Earth, Wind & Fire",
    ],
  },
  "cabo-verde": {
    camel: "caboVerde",
    words: [
      "Paula", "Ricardo", "Baía das Gatas", "Baia das Gatas", "São Vicente", "Sao Vicente",
      "Mindelo", "Laginha", "São Pedro", "Cesária", "Cesaria", "Cap-Vert",
      "Daniel Caesar", "Stephen Sanchez", "SÃO VICENTE",
      "Cachupa", "Chã das Caldeiras", "São Antão",
    ],
  },
};

const read = (file) => fs.readFileSync(file, "utf8");

const wordPattern = (word) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`,
    "u",
  );

/** Every text file under a folder, except the demo's own. */
function filesOf(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...filesOf(full));
    else if (entry.name !== DEMO_FILE && /\.(tsx?|css|mjs|json|md)$/.test(entry.name)) found.push(full);
  }
  return found;
}

/** The editor's section ids, read from the one list the editor and themes share. */
const SECTION_IDS = (() => {
  const source = read(path.join(ROOT, "../shared/data/invitation-sections.ts"));
  const block = source.match(/EDITOR_SECTION_IDS = \[([\s\S]*?)\] as const/)?.[1] ?? "";
  return [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
})();

/**
 * The editor-section ids a theme's sources name. The id reaches the DOM either
 * as a literal `data-editor-section="…"` attribute or through a section
 * wrapper's `editorSection="…"` prop (which sets that attribute); a dynamic
 * `{value}` cannot be read statically and is ignored.
 */
function editorSectionsIn(source) {
  return [...source.matchAll(/(?:data-editor-section|editorSection)=["']([a-z-]+)["']/g)].map((match) => match[1]);
}

const frCatalogue = () => JSON.parse(read(path.join(ROOT, "messages/fr.json")));

for (const [id, { camel, words }] of Object.entries(THEMES)) {
  const dir = path.join(THEMES_DIR, id);
  const skip = !fs.existsSync(dir);

  /* -- 1. no leaks ------------------------------------------------------ */

  test(`${id}: no demo word in the theme's code, styles or notes`, { skip }, () => {
    const hits = [];
    for (const file of filesOf(dir)) {
      const text = read(file);
      for (const word of words) {
        if (wordPattern(word).test(text)) hits.push(`${path.relative(THEMES_DIR, file)}: "${word}"`);
      }
    }
    assert.deepEqual(hits, [], `demo content outside ${DEMO_FILE}:\n  ${hits.join("\n  ")}`);
  });

  test(`${id}: no demo word in its message catalogues`, () => {
    const hits = [];
    for (const locale of LOCALES) {
      const catalog = JSON.parse(read(path.join(ROOT, "messages", `${locale}.json`)));
      const namespace = catalog.Invitation?.[camel];
      if (!namespace) continue;
      const text = JSON.stringify(namespace);
      for (const word of words) {
        if (wordPattern(word).test(text)) hits.push(`${locale}: "${word}"`);
      }
    }
    assert.deepEqual(hits, [], `demo content in Invitation.${camel}:\n  ${hits.join("\n  ")}`);
  });

  /* -- 2. everything wired ---------------------------------------------- */

  test(`${id}: hand-written keyframes carry the theme's prefix`, { skip }, () => {
    // The generated sheet is prefixed by the pipeline; `responsive.css` is
    // hand-written and `@keyframes` names are global to the document.
    const file = path.join(dir, "responsive.css");
    if (!fs.existsSync(file)) return;
    const bare = [...read(file).matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)]
      .map((match) => match[1])
      .filter((name) => !name.startsWith(`${id}-`));
    assert.deepEqual(bare, [], `keyframes in responsive.css must start with "${id}-": ${bare}`);
  });

  test(`${id}: every slot is on a real section, in the catalogue, and read`, { skip: skip || !fs.existsSync(path.join(dir, "editor.ts")) }, async () => {
    const slots = (await import(pathToFileURL(path.join(dir, "editor.ts")).href))[`${camel}EditorSlots`];
    assert.ok(Array.isArray(slots) && slots.length > 0, `${camel}EditorSlots must be a non-empty array`);

    const fr = frCatalogue();
    const source = filesOf(dir)
      .filter((file) => /\.tsx?$/.test(file) && path.basename(file) !== "editor.ts")
      .map(read)
      .join("\n");

    const problems = [];
    const seen = new Set();
    for (const slot of slots) {
      const [section] = slot.key.split(".");
      if (!SECTION_IDS.includes(section)) problems.push(`${slot.key}: "${section}" is not an editor section`);
      if (seen.has(slot.key)) problems.push(`${slot.key}: declared twice`);
      seen.add(slot.key);

      for (const message of slot.messages) {
        const found = message.split(".").reduce((node, part) => node?.[part], fr);
        if (typeof found !== "string") problems.push(`${slot.key}: catalogue key ${message} is missing`);
      }
      if (!source.includes(`"${slot.key}"`)) problems.push(`${slot.key}: no section reads this slot`);
    }
    assert.deepEqual(problems, [], problems.join("\n"));
  });

  test(`${id}: section ids are real, and every supported module is drawn`, { skip: skip || !fs.existsSync(path.join(dir, "theme.config.ts")) }, () => {
    const source = filesOf(dir)
      .filter((file) => /\.tsx?$/.test(file))
      .map(read)
      .join("\n");

    const used = editorSectionsIn(source);
    const unknown = [...new Set(used)].filter((value) => !SECTION_IDS.includes(value));
    assert.deepEqual(unknown, [], `data-editor-section values that are not editor sections: ${unknown}`);

    const supports = readSupports(read(path.join(dir, "theme.config.ts")));
    assert.ok(supports, "supports must be a list of string literals");
    const undrawn = supports.filter((module) => !used.includes(module));
    assert.deepEqual(undrawn, [], `supported but no section carries data-editor-section="…": ${undrawn}`);
  });
}

test("the leak matcher is whole-word and case-sensitive", () => {
  assert.equal(wordPattern("Malo").test("Sienna & Malo"), true);
  assert.equal(wordPattern("Malo").test("Malorca"), false);
  assert.equal(wordPattern("Malo").test("malo"), false);
  assert.equal(wordPattern("Vaux").test("Vaux-le-Vicomte"), true, "a hyphen ends a word");
  assert.equal(wordPattern("Paula").test("flyAcrossPaula"), false, "inside an identifier");
  assert.equal(wordPattern("77950").test("code 77950 Maincy"), true);
});

test("section ids are read from the attribute and from the wrapper prop, not from a dynamic value", () => {
  const source = '<section data-editor-section="faq"> <Section editorSection="map"> <Reveal data-editor-section={editorSection}>';
  assert.deepEqual(editorSectionsIn(source), ["faq", "map"]);
});

test("the editor's section ids are read from the shared list", () => {
  for (const expected of ["hero", "countdown", "timeline", "rsvp", "footer"]) {
    assert.ok(SECTION_IDS.includes(expected), expected);
  }
});

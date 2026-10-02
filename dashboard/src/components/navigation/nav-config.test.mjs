import assert from "node:assert/strict";
import test from "node:test";

import { NAV_SECTIONS, visibleNavSections } from "./nav-config.ts";

const hrefs = (sections) => sections.flatMap((section) => (section.items ?? []).map((item) => item.href));

test("the music screen is listed only for a site that bought the option", () => {
  assert.ok(hrefs(visibleNavSections(NAV_SECTIONS, ["custom-music"])).includes("/musique"));
  assert.ok(!hrefs(visibleNavSections(NAV_SECTIONS, [])).includes("/musique"));
  assert.ok(!hrefs(visibleNavSections(NAV_SECTIONS, ["custom-domain"])).includes("/musique"));
});

test("while the site is still being read, nothing tied to an extra is listed", () => {
  assert.ok(!hrefs(visibleNavSections(NAV_SECTIONS, null)).includes("/musique"));
});

test("items that need no extra are always listed, in their order", () => {
  const withoutMusic = hrefs(NAV_SECTIONS).filter((href) => href !== "/musique");
  assert.deepEqual(hrefs(visibleNavSections(NAV_SECTIONS, [])), withoutMusic);
  assert.equal(visibleNavSections(NAV_SECTIONS, []).length, NAV_SECTIONS.length);
});

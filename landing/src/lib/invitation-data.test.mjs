/**
 * The public invitation and the editor's preview both go through these two
 * functions, so a regression here is a regression on every wedding's page.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/invitation-data.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { assembleInvitationPage, readDayOf } from "./assemble-invitation-page.ts";
import { toInvitationData } from "./to-invitation-data.ts";

function baseRows() {
  return {
    site: {
      theme_id: "ciao-amore",
      modules: ["countdown", "timeline", "map", "accommodation", "faq", "rsvp"],
      adults_only: false,
      languages: ["fr"],
      hero_kicker: null,
      announcement: null,
      closing_words: null,
      couple_photo_url: null,
      invitation_texts: {},
    },
    names: { first_name: "Camille", partner_name: "Jonas" },
    events: [
      {
        id: "e1",
        key: "wedding-day",
        name: "Notre mariage",
        date: "2027-06-12",
        time: "17h00",
        address: null,
        description: null,
        dress_code: null,
        position: 1,
      },
    ],
    schedule: [
      {
        id: "s1",
        event_id: "e1",
        time: "17 h 00",
        title: "Cérémonie",
        description: null,
        position: 1,
        icon: null,
        image_url: null,
      },
    ],
    venue: {
      name: "Domaine des Oliviers",
      address: "Route de Lourmarin",
      city: "Lourmarin",
      maps_url: null,
      waze_url: null,
      parking_info: null,
      access_info: null,
      transport_info: null,
      photo_url: null,
    },
    accommodations: [
      {
        id: "a1",
        name: "Hôtel du Lac",
        city: null,
        distance: "5 min",
        phone: null,
        booking_url: "https://hotel-du-lac.fr",
        offer: null,
        photo_url: null,
        address: null,
        secondary: null,
      },
    ],
    faq: [{ id: "f1", question: "Y a-t-il un parking ?", answer: "Oui.", position: 1 }],
    moduleConfigs: [],
  };
}

function render(rows) {
  const page = assembleInvitationPage("wedding-1", "camille-et-jonas", rows);
  assert.ok(page, "expected a page");
  return toInvitationData(page);
}

test("no enabled event means no page, as on the public route", () => {
  assert.equal(
    assembleInvitationPage("wedding-1", "slug", { ...baseRows(), events: [] }),
    null,
  );
});

test("the page carries the languages the couple bought", () => {
  const page = assembleInvitationPage("wedding-1", "slug", baseRows());
  assert.deepEqual(page.languages, ["fr"]);
});

test("without overrides the derived labels stay and no slot reaches the theme", () => {
  const data = render(baseRows());
  assert.equal(data.copy.dateLabel, "12 · 06 · 2027");
  // Not derived: a monogram nobody wrote is not printed (a theme that needs
  // one falls back to the initials itself).
  assert.equal(data.couple.monogram, undefined);
  assert.equal(data.texts, undefined);
  assert.equal(data.copy.scheduleIntro, undefined);
});

test("contract overrides replace derived copy, and slots reach the theme", () => {
  const rows = baseRows();
  rows.site.invitation_texts = {
    "copy.dateLabel": "12 juin 2027",
    "copy.dateSpelled": "Un samedi de juin",
    "copy.scheduleIntro": "Au fil de la journée",
    "copy.rsvpIntro": "Dites-nous tout",
    "copy.footerNote": "Avec amour",
    "couple.monogram": "C · J",
    "faq.title": "Bon à savoir",
    "timeline.ribbon": "Provence · Lavande",
    "not a key": "ignored",
  };

  const data = render(rows);
  assert.equal(data.copy.dateLabel, "12 juin 2027");
  assert.equal(data.copy.dateSpelled, "Un samedi de juin");
  assert.equal(data.copy.scheduleIntro, "Au fil de la journée");
  assert.equal(data.copy.rsvpIntro, "Dites-nous tout");
  assert.equal(data.copy.footerNote, "Avec amour");
  assert.equal(data.couple.monogram, "C · J");
  assert.deepEqual(data.texts, {
    "faq.title": "Bon à savoir",
    "timeline.ribbon": "Provence · Lavande",
  });
});

test("a stored icon wins over the title guess, an unknown one falls back", () => {
  const rows = baseRows();
  rows.schedule = [
    { ...rows.schedule[0], id: "s1", title: "Cérémonie", icon: "party" },
    { ...rows.schedule[0], id: "s2", title: "Cérémonie laïque", icon: "rocket", position: 2 },
    { ...rows.schedule[0], id: "s3", title: "Discours", icon: null, position: 3 },
  ];

  const icons = render(rows).schedule.map((entry) => entry.icon);
  assert.deepEqual(icons, ["party", "ceremony", undefined]);
});

test("a moment keeps its photograph", () => {
  const rows = baseRows();
  rows.schedule[0].image_url = "https://cdn.example.com/church.webp";
  assert.equal(render(rows).schedule[0].image, "https://cdn.example.com/church.webp");
});

test("unsafe links never reach a theme", () => {
  const rows = baseRows();
  rows.venue.maps_url = "javascript:alert(1)";
  rows.venue.waze_url = "https://waze.com/ul?q=x";
  rows.venue.photo_url = "javascript:alert(2)";
  rows.accommodations[0].booking_url = "data:text/html,x";
  rows.schedule[0].image_url = "javascript:alert(3)";

  const data = render(rows);
  assert.equal(data.venue.mapsUrl, undefined);
  assert.equal(data.venue.wazeUrl, "https://waze.com/ul?q=x");
  assert.equal(data.venue.image, undefined);
  assert.equal(data.stays[0].url, undefined);
  assert.equal(data.schedule[0].image, undefined);
});

test("transport modes are added after the venue's own directions", () => {
  const rows = baseRows();
  rows.venue.parking_info = "Parking gratuit devant le domaine";
  rows.moduleConfigs = [
    {
      module_id: "transport",
      position: 8,
      config: {
        options: [{ iconType: "Train", title: "En train", description: "Gare d'Avignon TGV" }],
        carpoolUrl: "https://covoit.example.com",
      },
    },
  ];

  const modes = render(rows).venue.access.map((entry) => entry.mode);
  assert.deepEqual(modes, ["Stationnement", "En train", "Covoiturage"]);
});

test("an untitled mode is named in words, and the carpool link keeps its wording", () => {
  const rows = baseRows();
  rows.moduleConfigs = [
    {
      module_id: "transport",
      position: 8,
      config: {
        options: [{ iconType: "Plane", title: "", description: "Aéroport de Marseille" }],
        carpoolUrl: "https://covoit.example.com",
        carpoolLinkLabel: "Proposer une place",
        carpoolDescription: "Partagez vos trajets",
      },
    },
  ];

  const [plane, carpool] = render(rows).venue.access;
  assert.equal(plane.mode, "En avion");
  assert.deepEqual(carpool, {
    mode: "Covoiturage",
    details: ["Partagez vos trajets"],
    link: { url: "https://covoit.example.com", label: "Proposer une place" },
  });
});

test("a hotel's phone reaches the theme", () => {
  const rows = baseRows();
  rows.accommodations[0].phone = " 04 90 12 34 56 ";
  assert.equal(render(rows).stays[0].phone, "04 90 12 34 56");
});

test("RSVP options come from the module, and default to an open form", () => {
  const open = render(baseRows()).rsvp;
  assert.equal(open.allowPartner, true);
  assert.equal(open.collectMessage, true);
  assert.equal(open.dietaryOptions, undefined);

  const rows = baseRows();
  rows.moduleConfigs = [
    {
      module_id: "rsvp",
      position: 5,
      config: {
        allow_partner: false,
        collect_message: false,
        dietary_options: ["Végétarien", "", 3, "Sans gluten"],
      },
    },
  ];

  const set = render(rows).rsvp;
  assert.equal(set.allowPartner, false);
  assert.equal(set.collectMessage, false);
  assert.deepEqual(set.dietaryOptions, ["Végétarien", "Sans gluten"]);
});

test("hotels carry their address and the more-options flag", () => {
  const rows = baseRows();
  rows.accommodations[0].address = "2 rue du Lac";
  rows.accommodations[0].secondary = true;

  const stay = render(rows).stays[0];
  assert.equal(stay.address, "2 rue du Lac");
  assert.equal(stay.secondary, true);
});

test("the day after takes the couple's own labels and note", () => {
  const rows = baseRows();
  rows.events.push({
    id: "e2",
    key: "brunch",
    name: "Brunch",
    date: "2027-06-13",
    time: "11h00",
    address: null,
    description: "Autour de la piscine",
    dress_code: null,
    position: 2,
  });
  rows.schedule.push({
    id: "s9",
    event_id: "e2",
    time: "11 h 00",
    title: "Brunch",
    description: null,
    position: 1,
    icon: null,
    image_url: null,
  });

  const derived = render(rows).dayTwo;
  assert.equal(derived.title, "Brunch");
  assert.equal(derived.timeLabel, "11h00");
  assert.equal(derived.note, undefined);

  rows.site.invitation_texts = {
    "dayTwo.dateLabel": "Jour 2 · Dimanche",
    "dayTwo.timeLabel": "Dès 11 h",
    "dayTwo.note": "Maillot de bain conseillé",
  };
  const written = render(rows).dayTwo;
  assert.equal(written.dateLabel, "Jour 2 · Dimanche");
  assert.equal(written.timeLabel, "Dès 11 h");
  assert.equal(written.note, "Maillot de bain conseillé");
});

test("the day after keeps its date before it has any moment", () => {
  const rows = baseRows();
  rows.events.push({
    id: "e2",
    key: "brunch",
    name: "Brunch",
    date: "2027-06-13",
    time: null,
    address: null,
    description: null,
    dress_code: null,
    position: 2,
  });

  assert.equal(render(rows).dayTwo.dateLabel, "dimanche 13 juin 2027");
});

test("every event reaches the theme with what the couple wrote on its card", () => {
  const rows = baseRows();
  Object.assign(rows.events[0], {
    address: "  Église Saint-Michel, Lourmarin ",
    description: "Suivie du vin d'honneur",
    dress_code: "Chic champêtre",
  });
  rows.events.push({
    id: "e2",
    key: "brunch",
    name: "Brunch",
    date: "2027-06-13",
    time: "11h00",
    address: null,
    description: "",
    dress_code: null,
    position: 2,
  });
  rows.schedule.push({
    id: "s9",
    event_id: "e2",
    time: "11 h 00",
    title: "Brunch",
    description: null,
    position: 1,
    icon: null,
    image_url: null,
  });

  const data = render(rows);
  assert.deepEqual(data.events, [
    {
      kind: "wedding-day",
      name: "Notre mariage",
      date: "2027-06-12",
      time: "17h00",
      address: "Église Saint-Michel, Lourmarin",
      description: "Suivie du vin d'honneur",
      dressCode: "Chic champêtre",
      day: 1,
    },
    {
      kind: "brunch",
      name: "Brunch",
      date: "2027-06-13",
      time: "11h00",
      address: undefined,
      description: undefined,
      dressCode: undefined,
      day: 2,
    },
  ]);
  // Each moment names its event, so a theme can print it under the right one.
  assert.deepEqual(
    data.schedule.map((entry) => [entry.title, entry.event, entry.day]),
    [
      ["Cérémonie", "wedding-day", 1],
      ["Brunch", "brunch", 2],
    ],
  );
});

test("two events may share a name without their moments trading days", () => {
  const rows = baseRows();
  rows.events.push({
    id: "e2",
    key: "brunch",
    name: "Notre mariage",
    date: "2027-06-13",
    time: null,
    address: null,
    description: null,
    dress_code: null,
    position: 2,
  });
  rows.schedule.push({
    id: "s9",
    event_id: "e2",
    time: "11 h 00",
    title: "Brunch au bord de l'eau",
    description: null,
    position: 1,
    icon: null,
    image_url: null,
  });

  assert.deepEqual(
    render(rows).schedule.map((entry) => [entry.title, entry.day]),
    [
      ["Cérémonie", 1],
      ["Brunch au bord de l'eau", 2],
    ],
  );
});

test("the couple's portrait and monogram reach the theme", () => {
  const rows = baseRows();
  // Nothing written, nothing printed: a cleared monogram leaves the page.
  assert.equal(render(rows).couple.monogram, undefined);
  assert.equal(render(rows).couple.portrait, undefined);

  rows.site.couple_photo_url = "https://cdn.example/portrait.webp";
  rows.site.invitation_texts = { "couple.monogram": "C · J" };
  const { couple } = render(rows);
  assert.equal(couple.portrait, "https://cdn.example/portrait.webp");
  assert.equal(couple.monogram, "C · J");
});

test("the gift list takes its title, and a bad link is dropped", () => {
  const rows = baseRows();
  rows.moduleConfigs = [
    {
      module_id: "gift-list",
      position: 11,
      config: {
        title: "Notre voyage de noces",
        description: "Votre présence suffit.",
        gift_list_url: "javascript:alert(1)",
      },
    },
  ];

  const gifts = render(rows).gifts;
  assert.equal(gifts.title, "Notre voyage de noces");
  assert.equal(gifts.body, "Votre présence suffit.");
  assert.equal(gifts.url, undefined);
});

test("real invitations persist their forms; the flag is set", () => {
  assert.equal(render(baseRows()).weddingId, "wedding-1");
});

test("the video, menu and gallery modules reach the theme, or stay absent", () => {
  assert.equal(render(baseRows()).introVideo, undefined);
  assert.equal(render(baseRows()).menu, undefined);
  assert.equal(render(baseRows()).gallery, undefined);

  const rows = baseRows();
  rows.moduleConfigs = [
    {
      module_id: "intro-video",
      position: 2,
      config: { title: "Bienvenue", videoUrl: "https://youtu.be/abc123", videoType: "embed" },
    },
    {
      module_id: "menu",
      position: 9,
      config: {
        sections: [
          { title: "Entrée", items: [{ title: "Burrata", description: "tomates anciennes" }] },
          { title: "Le plat", items: [] },
        ],
        dietaryNote: "Menu végétarien sur demande",
        footer: [],
      },
    },
    {
      module_id: "gallery",
      position: 10,
      config: { images: ["https://cdn.example.com/1.webp", "javascript:alert(1)", ""] },
    },
  ];

  const data = render(rows);
  assert.deepEqual(data.introVideo, {
    title: "Bienvenue",
    subtitle: undefined,
    body: undefined,
    url: "https://youtu.be/abc123",
    kind: "embed",
  });
  assert.equal(data.menu.sections.length, 1);
  assert.equal(data.menu.sections[0].items[0].title, "Burrata");
  assert.equal(data.menu.note, "Menu végétarien sur demande");
  assert.equal(data.menu.footer, undefined);
  assert.deepEqual(data.gallery.images, ["https://cdn.example.com/1.webp"]);
});

test("the Jour J reaches the theme only when the couple switched it on", () => {
  assert.equal(render(baseRows()).dayOf, undefined);

  const page = assembleInvitationPage("wedding-1", "camille-et-jonas", baseRows());
  const data = toInvitationData({ ...page, dayOf: { photos: true } });
  assert.deepEqual(data.dayOf, { slug: "camille-et-jonas", photos: true });
});

test("readDayOf: no row means off, and photos follow the window and the gallery", () => {
  const now = Date.parse("2027-06-19T12:00:00Z");

  assert.equal(readDayOf(null, now), undefined);
  assert.equal(readDayOf([], now), undefined);
  assert.equal(readDayOf("nonsense", now), undefined);

  const row = (uploads_open_until, gallery_visible_to_guests) => [
    { uploads_open_until, gallery_visible_to_guests },
  ];
  assert.deepEqual(readDayOf(row(null, false), now), { photos: false });
  assert.deepEqual(readDayOf(row("2027-06-20T00:00:00Z", false), now), { photos: true });
  assert.deepEqual(readDayOf(row("2027-06-18T00:00:00Z", false), now), { photos: false });
  assert.deepEqual(readDayOf(row("2027-06-18T00:00:00Z", true), now), { photos: true });
  assert.deepEqual(readDayOf(row("not a date", false), now), { photos: false });
  // A single object instead of a one-row array is what a scalar RPC returns.
  assert.deepEqual(readDayOf({ uploads_open_until: null, gallery_visible_to_guests: true }, now), {
    photos: true,
  });
});

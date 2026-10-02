import type { InvitationData } from "@/components/invitation/themes/types";

/**
 * Sample content for a module the couple added but has not filled in yet, so
 * the preview shows what they would be buying (spec D8). The theme's own demo
 * comes first; these cover what no demo has — no theme's demo carries a
 * gallery, a menu or an intro video, and not every one has gifts or a
 * playlist. Images are the studio's own, under `landing/public/themes/`.
 */

/** Where each module's content lives in the invitation a theme receives. */
const FIELDS = {
  gallery: "gallery",
  menu: "menu",
  "intro-video": "introVideo",
  "gift-list": "gifts",
  playlist: "playlist",
  faq: "faq",
  "dress-code": "dressCode",
  accommodation: "stays",
  timeline: "schedule",
} as const satisfies Record<string, keyof InvitationData>;

export const MODULE_SAMPLES: Partial<InvitationData> = {
  gallery: {
    images: [
      "/themes/mediterranean-classy/venue-ceremony-arch.webp",
      "/themes/mediterranean-classy/venue-banquet-table.webp",
      "/themes/mediterranean-classy/venue-orangerie.webp",
      "/themes/mediterranean-classy/venue-ceremony-aisle.webp",
      "/themes/mediterranean-classy/venue-pool.webp",
      "/themes/mediterranean-classy/venue-domaine-trinite.webp",
    ],
  },
  menu: {
    sections: [
      { title: "Entrée", items: [{ title: "Burrata crémeuse, tomates anciennes et basilic" }] },
      { title: "Plat", items: [{ title: "Filet de bar rôti, risotto au citron" }] },
      { title: "Dessert", items: [{ title: "Pièce montée et douceurs du chef" }] },
    ],
    note: "Menu végétarien sur demande.",
  },
  introVideo: {
    title: "Notre histoire",
    url: "/themes/belle-rive/ceremony.mp4",
    kind: "file",
  },
  gifts: {
    title: "Liste de mariage",
    body: "Votre présence est notre plus beau cadeau. Pour ceux qui le souhaitent, une cagnotte est ouverte pour notre voyage de noces.",
    url: "#",
    linkLabel: "Participer",
  },
  playlist: [
    { title: "September", artist: "Earth, Wind & Fire" },
    { title: "Dancing Queen", artist: "ABBA" },
    { title: "Volare", artist: "Gipsy Kings" },
  ],
  faq: [
    { question: "Y a-t-il un parking ?", answer: "Oui, un parking gratuit vous attend devant le domaine." },
    { question: "Les enfants sont-ils les bienvenus ?", answer: "Avec plaisir : un espace leur sera réservé." },
  ],
  dressCode: {
    title: "Dress code",
    body: "Tenue de cocktail, couleurs claires bienvenues.",
    colors: ["#F2E5AA", "#B7AFD1", "#E6DCC6"],
  },
  stays: [
    { name: "Hôtel des Oliviers", city: "Lourmarin", distance: "5 min", offer: "Tarif mariage avec le code AMORE" },
  ],
  schedule: [
    { day: 1, time: "16h00", title: "Cérémonie" },
    { day: 1, time: "18h00", title: "Cocktail" },
    { day: 1, time: "20h30", title: "Dîner" },
  ],
};

const SAMPLE_ACCESS: NonNullable<InvitationData["venue"]["access"]> = [
  { mode: "En train", details: ["Gare d'Avignon TGV, puis 45 minutes en voiture."] },
];

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || (Array.isArray(value) && value.length === 0);
}

/**
 * The invitation with samples in the listed modules the couple has left
 * empty, and which of them got one — for the preview to mark « Exemple ».
 */
export function withSamples(
  data: InvitationData,
  demo: Partial<InvitationData>,
  modules: readonly string[],
): { data: InvitationData; sampled: string[] } {
  const next: InvitationData = { ...data };
  const sampled: string[] = [];

  for (const id of modules) {
    if (id === "transport") {
      if (next.venue && isEmpty(next.venue.access)) {
        next.venue = {
          ...next.venue,
          access: demo.venue?.access?.length ? demo.venue.access : SAMPLE_ACCESS,
        };
        sampled.push(id);
      }
      continue;
    }

    const field = FIELDS[id as keyof typeof FIELDS];
    if (!field || !isEmpty(next[field])) continue;

    const sample = demo[field] ?? MODULE_SAMPLES[field];
    if (isEmpty(sample)) continue;
    (next as Record<string, unknown>)[field] = sample;
    sampled.push(id);
  }

  return { data: next, sampled };
}

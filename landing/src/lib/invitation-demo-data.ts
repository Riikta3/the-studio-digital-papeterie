import type { WeddingInfo } from "@/stores/use-order-store";

// Hardcoded dataset for the /invitation/demo phone preview.
// Shaped like `WeddingInfo` (minus `password`, unused here) so it can be
// passed directly to theme-floral components without any transformation.
export const INVITATION_DEMO: Omit<WeddingInfo, "password"> = {
  partner1: "Sophie",
  partner2: "Pierre",
  day: "14",
  month: "Juin",
  year: "2026",
  venue: "Château des Roses",
  email: "demo@thestudio.wedding",
};

// Same FR month-name -> number mapping used by LivePreviewPanel, kept in
// sync so both places resolve "Juin" the same way.
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function toIsoDate(day: string, month: string, year: string): string {
  const m = MONTHS.indexOf(month) + 1;
  if (!day || !m || !year) return "";
  return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ISO date string derived from INVITATION_DEMO, for modules expecting a
// `weddingDate` string (e.g. CountdownModule, InvitationHero).
export const weddingDateISO = toIsoDate(
  INVITATION_DEMO.day,
  INVITATION_DEMO.month,
  INVITATION_DEMO.year,
);

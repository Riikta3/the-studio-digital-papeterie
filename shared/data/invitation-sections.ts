/**
 * The sections of an invitation, as the editor and the themes name them.
 *
 * One id per module sold at checkout (the same ids as `APP_MODULES` and the
 * theme contract's `MODULE_IDS`), plus the two sections every invitation has
 * whatever was bought: the hero and the footer.
 *
 * The same string is written in three places that must agree: the editor's tab,
 * the `data-editor-section` attribute a theme puts on that section's markup so
 * the preview can scroll to it, and the prefix of the section's text slots
 * (`faq.title`). Keeping the list here, beside nothing else, lets both apps
 * import it without dragging in a theme or an icon set.
 */
export const EDITOR_SECTION_IDS = [
  "hero",
  "countdown",
  "intro-video",
  "timeline",
  "dress-code",
  "rsvp",
  "map",
  "accommodation",
  "transport",
  "menu",
  "gallery",
  "gift-list",
  "playlist",
  "guestbook",
  "video-guestbook",
  "faq",
  "footer",
] as const;

export type EditorSectionId = (typeof EDITOR_SECTION_IDS)[number];

const IDS: ReadonlySet<string> = new Set(EDITOR_SECTION_IDS);

export function isEditorSectionId(value: unknown): value is EditorSectionId {
  return typeof value === "string" && IDS.has(value);
}

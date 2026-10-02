import type { InvitationRows } from "./invitation-rows";

/**
 * The conversation between the invitation editor (dashboard) and its live
 * preview (an iframe on the landing, `/[locale]/invitation/apercu`).
 *
 * The two apps live on different origins, so they talk through `postMessage`,
 * and a message from `window.postMessage` can come from any window at all.
 * Both sides therefore check the sender's origin first and then the message's
 * shape with the guards below; neither trusts a field it has not narrowed.
 *
 *   preview → editor   preview:ready     the iframe is listening
 *   editor  → preview  editor:render     draw this draft
 *   preview → editor   preview:rendered  what got drawn, and the theme's words
 *   editor  → preview  editor:focus      scroll to the section being edited
 *   preview → editor   preview:select    the couple clicked a section
 */

export const EDITOR_MESSAGE_SOURCE = "studio-editor";

/** A word the theme prints that the couple may rewrite, with its default. */
export type PreviewSlot = {
  /** `<sectionId>.<role>`, the key it is stored under. */
  key: string;
  /** What the theme prints when the couple has written nothing, in the preview's language. */
  defaultText: string;
  /** A title set on two lines: the value may contain a line break. */
  multiline: boolean;
};

export type EditorToPreviewMessage =
  | {
      source: typeof EDITOR_MESSAGE_SOURCE;
      type: "editor:render";
      themeId: string | null;
      rows: InvitationRows;
      /** Modules drawn with sample content while the couple's own is empty (spec D8). */
      samples?: string[];
      /** Modules drawn in the preview that guests cannot see yet. */
      notLive?: string[];
    }
  | {
      source: typeof EDITOR_MESSAGE_SOURCE;
      type: "editor:focus";
      section: string;
    };

export type PreviewRenderedMessage = {
  source: typeof EDITOR_MESSAGE_SOURCE;
  type: "preview:rendered";
  themeName: string;
  /** Sections present on the page, in the order the theme drew them. */
  sections: string[];
  /** Sections the theme knows how to draw, present or not. */
  supported: string[];
  slots: PreviewSlot[];
};

export type PreviewToEditorMessage =
  | { source: typeof EDITOR_MESSAGE_SOURCE; type: "preview:ready" }
  | PreviewRenderedMessage
  | {
      source: typeof EDITOR_MESSAGE_SOURCE;
      type: "preview:select";
      section: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function fromEditor(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && value.source === EDITOR_MESSAGE_SOURCE;
}

/**
 * Only the outline of the rows is checked here: every field inside them is
 * narrowed again by the readers that consume it (`readModuleConfigs`,
 * `normaliseTexts`, `safeUrl`), exactly as rows from the database are.
 */
function looksLikeRows(value: unknown): value is InvitationRows {
  if (!isRecord(value) || !isRecord(value.site)) return false;

  return (
    Array.isArray(value.events) &&
    Array.isArray(value.schedule) &&
    Array.isArray(value.accommodations) &&
    Array.isArray(value.faq) &&
    Array.isArray(value.moduleConfigs) &&
    (value.venue === null || isRecord(value.venue)) &&
    (value.names === null || isRecord(value.names))
  );
}

export function isEditorToPreviewMessage(data: unknown): data is EditorToPreviewMessage {
  if (!fromEditor(data)) return false;

  switch (data.type) {
    case "editor:render":
      return (
        (data.themeId === null || typeof data.themeId === "string") &&
        looksLikeRows(data.rows) &&
        (data.samples === undefined || isStringArray(data.samples)) &&
        (data.notLive === undefined || isStringArray(data.notLive))
      );
    case "editor:focus":
      return typeof data.section === "string";
    default:
      return false;
  }
}

function isSlot(value: unknown): value is PreviewSlot {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    typeof value.defaultText === "string" &&
    typeof value.multiline === "boolean"
  );
}

export function isPreviewToEditorMessage(data: unknown): data is PreviewToEditorMessage {
  if (!fromEditor(data)) return false;

  switch (data.type) {
    case "preview:ready":
      return true;
    case "preview:rendered":
      return (
        typeof data.themeName === "string" &&
        isStringArray(data.sections) &&
        isStringArray(data.supported) &&
        Array.isArray(data.slots) &&
        data.slots.every(isSlot)
      );
    case "preview:select":
      return typeof data.section === "string";
    default:
      return false;
  }
}

/**
 * How the invitation's music behaves, apart from the DOM so it can be tested
 * (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D5).
 *
 * `InvitationMusic.tsx` turns browser events into `MusicEvent`s and carries
 * out the command each step returns. Nothing here touches `window`.
 */

export type MusicState = "idle" | "playing" | "muted" | "error";

export type MusicEvent =
  /**
   * The page has just opened: try to play before any gesture. Chrome and Edge
   * allow it once the visitor has clicked on the site (« Voir la démo », the
   * guest code); Safari refuses, and the refusal waits for the first tap.
   */
  | "autostart"
  /** The first tap, click or key press on the page — never one on the icon. */
  | "gesture"
  /** A tap on the icon. */
  | "toggle"
  | "hidden"
  | "visible"
  /** `audio.play()` was refused: no gesture the browser accepts (a swipe on iOS). */
  | "rejected"
  /** The file cannot be loaded or decoded. */
  | "failed"
  /** The audio paused without us: lock screen, media keys, headphones unplugged. */
  | "interrupted"
  /** The audio started without us: lock screen or media keys. */
  | "resumed"
  /** Another video or sound on the page started playing (the couple's film). */
  | "otherMedia";

export type MusicStep = {
  state: MusicState;
  command: "play" | "pause" | null;
  /** What to remember in the guest's browser for this wedding, when it changed. */
  remember: "muted" | "unmuted" | null;
};

/** A guest who muted this wedding on a previous visit is not played to again. */
export function initialMusicState(storedMuted: boolean): MusicState {
  return storedMuted ? "muted" : "idle";
}

export function nextMusicStep(state: MusicState, event: MusicEvent): MusicStep {
  const stay: MusicStep = { state, command: null, remember: null };
  // A file that cannot play stays silent: the component hides the icon.
  if (state === "error") return stay;

  switch (event) {
    case "autostart":
    case "gesture":
      return state === "idle" ? { state: "playing", command: "play", remember: null } : stay;
    case "toggle":
      // From idle too: the icon is how a guest starts it before any other tap.
      if (state === "playing") return { state: "muted", command: "pause", remember: "muted" };
      return { state: "playing", command: "play", remember: state === "muted" ? "unmuted" : null };
    case "hidden":
      // The state stays "playing": it is what the guest wants once they are back.
      return state === "playing" ? { state, command: "pause", remember: null } : stay;
    case "visible":
      return state === "playing" ? { state, command: "play", remember: null } : stay;
    case "rejected":
      // Back to waiting: the next real tap starts it.
      return state === "playing" ? { state: "idle", command: null, remember: null } : stay;
    case "failed":
      return { state: "error", command: "pause", remember: null };
    case "interrupted":
      // Shown as muted, so a tap on the page does not restart what the guest
      // just paused elsewhere — but not remembered: they did not mute this
      // wedding, the phone did.
      return state === "playing" ? { state: "muted", command: null, remember: null } : stay;
    case "resumed":
      return state === "playing"
        ? stay
        : { state: "playing", command: null, remember: state === "muted" ? "unmuted" : null };
    case "otherMedia":
      return state === "playing" ? { state: "muted", command: "pause", remember: null } : stay;
  }
}

/** Keys a guest presses to move around or to leave, not to ask for sound. */
const NON_GESTURE_KEYS = new Set(["Tab", "Shift", "Control", "Alt", "Meta", "Escape", "CapsLock"]);

/**
 * Whether a page event is the guest's first gesture. A keyboard user's first
 * Tab must reach the icon, not start the music they are trying to avoid.
 */
export function countsAsGesture(event: { type: string; key?: string }): boolean {
  return !(event.type === "keydown" && NON_GESTURE_KEYS.has(event.key ?? ""));
}

export function musicStorageKey(weddingKey: string): string {
  return `invitation-music:${weddingKey}`;
}

type MusicStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Whether this guest muted this wedding before. A storage that throws reads as "no". */
export function readStoredMuted(storage: MusicStorage | null | undefined, key: string): boolean {
  try {
    return storage?.getItem(key) === "muted";
  } catch {
    return false;
  }
}

/** Remembers the guest's choice. A storage that throws (private window) forgets it. */
export function writeStoredMuted(
  storage: MusicStorage | null | undefined,
  key: string,
  remember: "muted" | "unmuted",
): void {
  try {
    if (remember === "muted") storage?.setItem(key, "muted");
    else storage?.removeItem(key);
  } catch {
    // The choice lasts for this visit only.
  }
}

/**
 * The volume `elapsedMs` into a fade-in towards `target`, clamped to
 * [0, target]. `requestAnimationFrame` stamps a frame with its START time,
 * which can precede the moment the fade began: unclamped, that gave a
 * slightly negative volume and `HTMLMediaElement.volume` threw IndexSizeError.
 */
export function fadeInVolume(elapsedMs: number, target: number, durationMs: number): number {
  const progress = Math.min(1, Math.max(0, elapsedMs / durationMs));
  return target * progress;
}

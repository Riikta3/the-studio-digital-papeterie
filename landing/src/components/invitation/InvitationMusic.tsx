"use client";

import { Music2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  type MusicEvent,
  type MusicState,
  countsAsGesture,
  fadeInVolume,
  initialMusicState,
  musicStorageKey,
  nextMusicStep,
  readStoredMuted,
  writeStoredMuted,
} from "@/lib/invitation-music";

import "./invitation-music.css";

/**
 * The invitation's music and its sticky icon
 * (docs/superpowers/specs/2026-10-02-invitation-music-design.md, D5–D6).
 *
 * Mounted by the invitation and demo routes beside the theme, never inside
 * it: no theme knows about it, and a new theme gets it for free. The
 * behaviour lives in `@/lib/invitation-music`; this file only wires the
 * browser to it.
 */
export type InvitationMusicProps = {
  src: string;
  /** The wedding id, or `demo:<themeId>` — keys the guest's remembered choice. */
  weddingKey: string;
  accentColor: string;
  /** Lets a theme restyle the icon: `.invitation-music[data-theme="<id>"]`. */
  themeId: string;
};

/** Events browsers accept as the gesture that unlocks audio. `scroll` is not one. */
const GESTURES = ["click", "touchend", "keydown"] as const;
const TARGET_VOLUME = 0.6;
const FADE_MS = 2000;

const subscribeNever = () => () => {};

export function InvitationMusic(props: InvitationMusicProps) {
  // False on the server and inside a frame — the home page shows each demo in
  // a phone mock-up through an iframe, and a tap there must not start music
  // on the marketing page. True on the invitation itself.
  const canPlay = useSyncExternalStore(
    subscribeNever,
    () => window.self === window.top,
    () => false,
  );
  return canPlay ? <MusicPlayer {...props} /> : null;
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Raises the volume over FADE_MS. iOS ignores `volume` (always 1): no fade there. */
function fadeIn(audio: HTMLAudioElement) {
  const start = performance.now();
  const frame = (now: number) => {
    const volume = fadeInVolume(now - start, TARGET_VOLUME, FADE_MS);
    audio.volume = volume;
    if (volume < TARGET_VOLUME && !audio.paused) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function MusicPlayer({ src, weddingKey, accentColor, themeId }: InvitationMusicProps) {
  const t = useTranslations("Invitation.music");
  const storageKey = musicStorageKey(weddingKey);
  // Lazy: this component only ever renders in the browser (see InvitationMusic).
  const [state, setState] = useState<MusicState>(() =>
    initialMusicState(readStoredMuted(browserStorage(), storageKey)),
  );
  const stateRef = useRef(state);
  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Each play() gets a number; only the latest one may report a refusal. A
  // quick double tap otherwise lets the first, interrupted play() knock the
  // second one's "playing" back to "idle".
  const playToken = useRef(0);
  // Set just before we pause, so the element's `pause` event can tell our own
  // pauses from the phone's (lock screen, media keys).
  const selfPause = useRef(false);

  const dispatch = useCallback(
    function dispatch(event: MusicEvent) {
      const step = nextMusicStep(stateRef.current, event);
      stateRef.current = step.state;
      setState(step.state);
      if (step.remember) writeStoredMuted(browserStorage(), storageKey, step.remember);

      const audio = audioRef.current;
      if (!audio) return;
      if (step.command === "pause" && !audio.paused) {
        selfPause.current = true;
        audio.pause();
      }
      if (step.command === "play") {
        const token = ++playToken.current;
        audio.volume = 0;
        audio.play().then(
          () => fadeIn(audio),
          () => {
            if (token === playToken.current) dispatch("rejected");
          },
        );
      }
    },
    [storageKey],
  );

  // While idle, the next tap, click or key press anywhere starts the music.
  useEffect(() => {
    if (state !== "idle") return;
    const onGesture = (event: Event) => {
      // The icon dispatches its own toggle; counting its tap here as well
      // would start the music and stop it at once.
      if (event.target instanceof Node && buttonRef.current?.contains(event.target)) return;
      if (!countsAsGesture({ type: event.type, key: (event as KeyboardEvent).key })) return;
      dispatch("gesture");
    };
    for (const type of GESTURES) document.addEventListener(type, onGesture, true);
    return () => {
      for (const type of GESTURES) document.removeEventListener(type, onGesture, true);
    };
  }, [state, dispatch]);

  // A guest who switches tabs or locks the phone is not played to.
  useEffect(() => {
    const onVisibility = () => dispatch(document.hidden ? "hidden" : "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [dispatch]);

  // The couple's film, or any other sound on the page, takes over from the music.
  useEffect(() => {
    const onOtherPlay = (event: Event) => {
      if (event.target instanceof HTMLMediaElement && event.target !== audioRef.current) {
        dispatch("otherMedia");
      }
    };
    // Media events do not bubble: only a capture listener on the document sees them.
    document.addEventListener("play", onOtherPlay, true);
    return () => document.removeEventListener("play", onOtherPlay, true);
  }, [dispatch]);

  // The themes lay out at 390 px (`generateViewport`), so on a narrower phone
  // `right` measured from that layout would put the icon off screen. Follow
  // the part of the page that is actually visible.
  useEffect(() => {
    const viewport = window.visualViewport;
    const button = buttonRef.current;
    if (!viewport || !button) return;
    const place = () => {
      const hiddenRight =
        document.documentElement.clientWidth - (viewport.offsetLeft + viewport.width);
      button.style.setProperty("--invitation-music-inset-right", `${Math.max(0, hiddenRight)}px`);
      button.style.setProperty("--invitation-music-inset-top", `${Math.max(0, viewport.offsetTop)}px`);
    };
    place();
    viewport.addEventListener("resize", place);
    viewport.addEventListener("scroll", place);
    return () => {
      viewport.removeEventListener("resize", place);
      viewport.removeEventListener("scroll", place);
    };
  }, []);

  // A file that cannot play leaves no button that does nothing.
  if (state === "error") return null;

  const playing = state === "playing";
  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop
        // Nothing downloads before the music starts: a guest who never hears
        // it does not pay for it in mobile data.
        preload='none'
        onError={() => {
          console.warn(`[InvitationMusic] cannot play ${src}`);
          dispatch("failed");
        }}
        onPause={() => {
          if (selfPause.current) {
            selfPause.current = false;
            return;
          }
          dispatch("interrupted");
        }}
        // Our own play() already set "playing"; this catches the lock screen's.
        onPlay={() => dispatch("resumed")}
      />
      <button
        ref={buttonRef}
        type='button'
        className='invitation-music'
        data-theme={themeId}
        data-state={state}
        style={{ "--invitation-music-accent": accentColor } as CSSProperties}
        // One label in every state: aria-pressed says whether it plays, and a
        // label that changed with it would announce the opposite.
        aria-label={t("label")}
        aria-pressed={playing}
        onClick={() => dispatch("toggle")}
      >
        {playing ? (
          <span className='invitation-music__bars' aria-hidden='true'>
            <i />
            <i />
            <i />
          </span>
        ) : state === "muted" ? (
          <VolumeX size={18} aria-hidden='true' />
        ) : (
          <Music2 size={18} aria-hidden='true' />
        )}
      </button>
    </>
  );
}

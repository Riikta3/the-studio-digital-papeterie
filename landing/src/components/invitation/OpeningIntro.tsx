"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import "./opening-intro.css";

/**
 * The theme's opening film, played over the invitation before guests see it:
 * the envelope is opened, the screen fades to white, and the white lifts off
 * the page — which rendered underneath meanwhile, so it is ready when shown.
 *
 * Once per visit: the invitation is reopened to check an address or a time,
 * and nobody should sit through the envelope again for that. The visit is the
 * tab's `sessionStorage`, keyed per invitation.
 *
 * Inside a preview — the phone mock-up of the home page and of the studio's
 * theme step, which load the demo in an iframe — it is the showcase: it plays
 * every time a theme is loaded, and waits, envelope closed, until the phone is
 * on screen (the home page loads it long before the visitor scrolls to it).
 *
 * It never stands between a guest and the page:
 * - a phone that refuses to autoplay (iOS Low Power Mode) or a video that has
 *   not started after a few seconds opens straight on the page;
 * - a tap anywhere skips to the fade;
 * - "reduce motion" skips it entirely.
 *
 * Whether to play is decided by an inline script before the first paint, so a
 * guest who already saw it (or asked for less motion) never gets a flash of
 * the envelope. Automated browsers skip it too — the screenshot scripts of the
 * theme strips and covers drive one — unless the URL asks for `?intro=1`.
 */

/** `opening`: no film after all — the layer simply fades off the page, no white. */
type Phase = "playing" | "white" | "lifting" | "opening" | "done";

/** How long before the film's end the white starts to rise. */
const WHITE_LEAD_S = 0.7;
const WHITE_MS = 700;
const LIFT_MS = 900;
/** Longest wait for the first frame to move before opening the page anyway. */
const START_TIMEOUT_MS = 3500;

const SKIP_ATTR = "data-opening-skip";

/**
 * Runs before the first paint, from the server HTML. Sets `data-opening-skip`
 * on <html> when the film must not show; the stylesheet hides it then.
 */
function decideScript(storageKey: string) {
  const key = JSON.stringify(storageKey);
  return `(function(){try{var d=document.documentElement,q=new URLSearchParams(location.search).get("intro");if(q==="1")return;var skip=q==="0"||navigator.webdriver||window.matchMedia("(prefers-reduced-motion: reduce)").matches;try{skip=skip||(window.self===window.top&&sessionStorage.getItem(${key})==="1")}catch(e){}if(skip)d.setAttribute("${SKIP_ATTR}","1")}catch(e){}})();`;
}

export function OpeningIntro({
  video,
  poster,
  color,
  storageKey,
}: {
  video: string;
  poster: string;
  color: string;
  /** One per invitation: a guest of two weddings sees each film once. */
  storageKey: string;
}) {
  const t = useTranslations("Invitation.opening");
  const [phase, setPhase] = useState<Phase>("playing");
  const videoRef = useRef<HTMLVideoElement>(null);
  const phaseRef = useRef<Phase>("playing");

  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  useEffect(() => {
    if (document.documentElement.hasAttribute(SKIP_ATTR)) {
      go("done");
      return;
    }

    // A preview (the demo inside a phone mock-up) replays on every load.
    const embedded = window.self !== window.top;
    if (!embedded) {
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // Private mode or blocked storage: the film plays again next time.
      }
    }

    const el = videoRef.current;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    // No film after all: fade straight off the page, no white flash.
    const openNow = () => {
      if (phaseRef.current !== "playing") return;
      go("opening");
      later(() => go("done"), LIFT_MS);
    };

    const toWhite = () => {
      if (phaseRef.current !== "playing") return;
      go("white");
      later(() => {
        go("lifting");
        later(() => go("done"), LIFT_MS);
      }, WHITE_MS);
    };

    if (!el) {
      openNow();
      return;
    }

    let started = false;
    const onPlaying = () => {
      started = true;
    };
    const onTime = () => {
      if (el.duration && el.currentTime >= el.duration - WHITE_LEAD_S) toWhite();
    };
    el.addEventListener("playing", onPlaying);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", toWhite);
    el.addEventListener("error", openNow);

    const start = () => {
      el.play().catch(openNow);
      later(() => {
        if (!started) openNow();
      }, START_TIMEOUT_MS);
    };

    // In a preview, hold the closed envelope until the phone is on screen.
    // An iframe's implicit root is the top-level viewport.
    let seen: IntersectionObserver | null = null;
    if (embedded && "IntersectionObserver" in window) {
      seen = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            seen?.disconnect();
            start();
          }
        },
        { threshold: 0.6 },
      );
      seen.observe(el);
    } else {
      start();
    }

    return () => {
      seen?.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", toWhite);
      el.removeEventListener("error", openNow);
    };
    // storageKey is fixed for the page's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "done") return null;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decideScript(storageKey) }} />
      <div
        className="opening-intro"
        data-phase={phase}
        style={{ "--opening-color": color, "--opening-poster": `url("${poster}")` } as React.CSSProperties}
      >
        <div className="opening-intro__backdrop" aria-hidden="true" />
        <video
          ref={videoRef}
          className="opening-intro__video"
          src={video}
          poster={poster}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="opening-intro__white" aria-hidden="true" />
        <button
          type="button"
          className="opening-intro__skip"
          aria-label={t("skip")}
          onClick={() => {
            const el = videoRef.current;
            if (phaseRef.current !== "playing") return;
            el?.pause();
            go("white");
            window.setTimeout(() => {
              go("lifting");
              window.setTimeout(() => go("done"), LIFT_MS);
            }, WHITE_MS);
          }}
        />
      </div>
    </>
  );
}

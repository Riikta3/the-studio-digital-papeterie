"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import "./opening-intro.css";

/**
 * The theme's opening film, played over the invitation before guests see it:
 * the closed envelope waits with « Touchez pour ouvrir », the guest's tap
 * plays the film, the screen fades to white, and the white lifts off the
 * page — which rendered underneath meanwhile, so it is ready when shown.
 *
 * The tap is the invitation being opened, and it is also what lets the film
 * play everywhere: a phone that refuses to autoplay (iOS Low Power Mode)
 * still plays a video started from a tap.
 *
 * Once per visit: the invitation is reopened to check an address or a time,
 * and nobody should open the envelope again for that. The visit is the tab's
 * `sessionStorage`, keyed per invitation, written on the tap. Inside a preview
 * — the demo in the studio's phone mock-up, in an iframe — the envelope waits
 * for its tap every time a theme is loaded.
 *
 * It never stands between a guest and the page:
 * - a video that cannot play, or has not started a few seconds after the
 *   tap, opens straight on the page;
 * - a tap during the film skips to the fade;
 * - "reduce motion" skips it entirely.
 *
 * Whether to show it is decided by an inline script before the first paint,
 * so a guest who already opened it (or asked for less motion) never gets a
 * flash of the envelope. Automated browsers skip it too — the screenshot
 * scripts of the theme strips and covers drive one — unless the URL asks for
 * `?intro=1`.
 */

/** `opening`: no film after all — the layer simply fades off the page, no white. */
type Phase = "waiting" | "playing" | "white" | "lifting" | "opening" | "done";

/** How long before the film's end the white starts to rise. */
const WHITE_LEAD_S = 0.7;
const WHITE_MS = 700;
const LIFT_MS = 900;
/** Longest wait, after the tap, for the first frame to move before opening the page anyway. */
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
  /** One per invitation: a guest of two weddings opens each envelope once. */
  storageKey: string;
}) {
  const t = useTranslations("Invitation.opening");
  const [phase, setPhase] = useState<Phase>("waiting");
  const videoRef = useRef<HTMLVideoElement>(null);
  const phaseRef = useRef<Phase>("waiting");
  const timers = useRef<number[]>([]);
  const started = useRef(false);

  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  // No film after all: fade straight off the page, no white flash.
  const openNow = () => {
    if (phaseRef.current !== "waiting" && phaseRef.current !== "playing") return;
    go("opening");
    later(() => go("done"), LIFT_MS);
  };

  const toWhite = () => {
    if (phaseRef.current !== "playing") return;
    videoRef.current?.pause();
    go("white");
    later(() => {
      go("lifting");
      later(() => go("done"), LIFT_MS);
    }, WHITE_MS);
  };

  // Called from the tap itself: iOS lets a video play only from a gesture.
  const open = () => {
    const el = videoRef.current;
    if (window.self === window.top) {
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // Private mode or blocked storage: the envelope waits again next time.
      }
    }
    if (!el) return openNow();
    go("playing");
    el.play().catch(openNow);
    later(() => {
      if (!started.current) openNow();
    }, START_TIMEOUT_MS);
  };

  useEffect(() => {
    if (document.documentElement.hasAttribute(SKIP_ATTR)) {
      go("done");
      return;
    }

    const el = videoRef.current;
    const pending = timers.current;
    if (!el) return;

    const onPlaying = () => {
      started.current = true;
    };
    const onTime = () => {
      if (el.duration && el.currentTime >= el.duration - WHITE_LEAD_S) toWhite();
    };
    el.addEventListener("playing", onPlaying);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", toWhite);
    el.addEventListener("error", openNow);

    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", toWhite);
      el.removeEventListener("error", openNow);
    };
    // The handlers only read refs; storageKey is fixed for the page's life.
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
          className="opening-intro__tap"
          aria-label={phase === "waiting" ? t("open") : t("skip")}
          onClick={() => (phaseRef.current === "waiting" ? open() : toWhite())}
        >
          <span className="opening-intro__hint" aria-hidden="true">
            <span className="opening-intro__hint-touch">{t("tapToOpen")}</span>
            <span className="opening-intro__hint-click">{t("clickToOpen")}</span>
          </span>
        </button>
      </div>
    </>
  );
}

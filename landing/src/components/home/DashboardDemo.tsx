"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import "./dashboard-demo.css";

/**
 * A guided tour of the couple's back-office, for the landing page.
 *
 * This replaces the "screenshot coming soon" placeholder that used to sit in
 * `Dashboard.tsx`. Rather than a static image or a video, it replays five real
 * screens with the interactions that sell the product -- an RSVP landing while
 * you watch, a guest dragged onto a table -- because those are exactly what a
 * still frame cannot show.
 *
 * The screens are transcribed from the dashboard's own components, not
 * designed here; `dashboard-demo.css` lists which component each one mirrors.
 * Anything that looks like an odd choice (a blue "sans reponse" chip, a
 * household-per-row guest list, a violet "taux de reponse" card) is what the
 * dashboard actually does.
 *
 * Timings are deliberate and were chosen by the product owner: a visitor gives
 * a landing-page block a few seconds, so chapters run 2-4s and every animation
 * inside one has to finish within its window. Nothing here waits.
 */

type Chapter = {
  /** Matches a `data-panel` value below. */
  panel: string;
  /** Sidebar section to light up. */
  nav: string;
  /** Sidebar sub-item to light up, when the section has one. */
  sub: string | null;
  ms: number;
  url: string;
  rail: string;
  title: string;
  body: string;
};

const CHAPTERS: Chapter[] = [
  {
    panel: "home",
    nav: "home",
    sub: null,
    ms: 2000,
    url: "dashboard.the-studio-digital-papeterie.fr/fr",
    rail: "Accueil",
    title: "Une vision claire, au même endroit.",
    body: "Réponses reçues, invités à placer, préparation du Jour J… votre tableau de bord vous permet de retrouver rapidement les informations dont vous avez besoin, sans multiplier les fichiers et les outils.",
  },
  {
    panel: "guests",
    nav: "guests",
    sub: "all",
    ms: 4000,
    url: "dashboard.the-studio-digital-papeterie.fr/fr/guests",
    rail: "Invités",
    title: "Une ligne par foyer, pas par personne",
    body: "On invite des familles, pas des individus : la liste est donc organisée par foyer, avec son contact et son statut. Les réponses arrivent depuis le faire-part et remontent ici toutes seules.",
  },
  {
    panel: "seating",
    nav: "dayof",
    sub: "seating",
    ms: 3000,
    url: "dashboard.the-studio-digital-papeterie.fr/fr/jour-j/plan-de-table",
    rail: "Plan de table",
    title: "On attrape un invité, on le pose",
    body: "Les invités à placer attendent dans la colonne de gauche ; il suffit de les faire glisser sur une table. Seuls ceux qui ont accepté apparaissent, et une table refuse plus de convives qu'elle n'a de places.",
  },
  {
    panel: "dayof",
    nav: "dayof",
    sub: "qr",
    ms: 3000,
    url: "the-studio-digital-papeterie.fr/fr/jourj/marie-et-thomas",
    rail: "Ma table",
    title: "Le soir même, les invités se débrouillent",
    body: "Un QR code sur la table, l'invité tape son prénom et trouve sa place. Il découvre aussi le menu, le programme et dépose ses photos. La liste complète des invités, elle, reste privée.",
  },
  {
    panel: "stats",
    nav: "stats",
    sub: null,
    ms: 3000,
    url: "dashboard.the-studio-digital-papeterie.fr/fr/stats",
    rail: "Statistiques",
    title: "Savoir qui vient, et à quoi",
    body: "La répartition des réponses et la participation par événement — cérémonie, dîner, brunch. De quoi confirmer un traiteur sans relancer cent personnes une par une.",
  },
];

const TOTAL_MS = CHAPTERS.reduce((n, c) => n + c.ms, 0);

function clock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function DashboardDemo() {
  const t = useTranslations("Dashboard.demo");

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const rootRef = useRef<HTMLDivElement | null>(null);
  /** The active chapter's rail fill and the clock, written to directly. */
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  /** Count-up intervals, cancelled alongside the timers on a chapter change. */
  const counters = useRef<Array<ReturnType<typeof setInterval>>>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const heldMs = useRef(0);
  /** Set once the viewer has used a control, so autoplay stops fighting them. */
  const manual = useRef(false);

  const chapter = CHAPTERS[index];

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    counters.current.forEach(clearInterval);
    counters.current = [];
  }, []);

  const panelClass = (panel: string) =>
    panel === chapter.panel ? "panel live" : "panel";

  const navClass = (nav: string, leaf = false) => {
    const classes = [nav === chapter.nav ? "on" : "", leaf ? "leaf" : ""];
    return classes.filter(Boolean).join(" ");
  };

  const subClass = (sub: string) => (sub === chapter.sub ? "on" : "");

  /**
   * Queue a beat, remembering the handle so a chapter change can cancel it.
   * `prefers-reduced-motion` collapses every delay so the end state is
   * reached at once rather than animated.
   */
  const later = useCallback((fn: () => void, ms: number) => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(setTimeout(fn, reduced ? Math.min(ms, 40) : ms));
  }, []);

  /** Count a figure up from zero. Short by design: chapters are 2-4s. */
  const countUp = useCallback((el: HTMLElement, to: number, ms: number) => {
    const pad = Number(el.dataset.pad || 0);
    const write = (v: number) =>
      (el.textContent = pad ? String(v).padStart(pad, "0") : String(v));
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      write(to);
      return;
    }
    const t0 = performance.now();
    // setInterval, not requestAnimationFrame: rAF callbacks do not run for
    // content thousands of pixels outside the viewport, which left every KPI
    // frozen at 0. Progress comes from elapsed time, so the figure still
    // lands exactly on `to`.
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      // easeOutCubic: quick off the mark, gentle landing.
      write(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) {
        write(to);
        clearInterval(id);
      }
    }, 40);
    counters.current.push(id);
  }, []);

  // Both helpers read from a ref, so they are created once and never
  // invalidate the callbacks that depend on them. This matters: the beat
  // effect below lists them transitively, and an unstable identity there
  // means every render cancels the animation it just scheduled.
  const q = useCallback(<T extends Element>(sel: string): T | null => {
    return rootRef.current?.querySelector<T>(sel) ?? null;
  }, []);

  const qa = useCallback(<T extends Element>(sel: string): T[] => {
    return Array.from(rootRef.current?.querySelectorAll<T>(sel) ?? []);
  }, []);

  /** Put a panel back to its opening state, so replays look the same. */
  const resetPanel = useCallback(
    (panel: string) => {
      qa<HTMLElement>(`[data-panel="${panel}"] [data-count]`).forEach((el) => {
        el.textContent = el.dataset.pad ? "00" : "0";
      });

      if (panel === "stats") {
        qa<HTMLElement>('[data-panel="stats"] .seg, [data-panel="stats"] .ev-fill').forEach(
          (f) => (f.style.width = "0"),
        );
      }

      if (panel === "guests") {
        q<HTMLElement>('[data-flash="1"]')?.classList.remove("flash");
        const badge = q<HTMLElement>("#demoBadgeSwap");
        if (badge) {
          badge.className = "badge wait";
          badge.textContent = "En attente";
        }
      }

      if (panel === "seating") {
        const pill = q<HTMLElement>("#demoDragPill");
        if (pill) {
          pill.classList.remove("on");
          pill.style.transform = "";
        }
        q<HTMLElement>("#demoTargetTable")?.classList.remove("target");
        q<HTMLElement>("#demoToast")?.classList.remove("show");
        const cap = q<HTMLElement>("#demoTargetCap");
        if (cap) cap.textContent = "8 / 12 places";
        const list = q<HTMLElement>("#demoTargetList");
        if (list) {
          list.innerHTML =
            "<li>Camille Lef\u00e8vre</li><li>Hugo Lef\u00e8vre</li>";
        }
        const seated = q<HTMLElement>("#demoSeated");
        if (seated) seated.textContent = "116";
        const left = q<HTMLElement>("#demoLeft");
        if (left) left.textContent = "8";
        const count = q<HTMLElement>("#demoUnseatedCount");
        if (count) count.textContent = "8";
        qa<HTMLElement>("#demoUnseatedList li").forEach((li) =>
          li.classList.remove("gone"),
        );
      }

      if (panel === "dayof") {
        const typed = q<HTMLElement>("#demoTyped");
        if (typed) typed.textContent = "";
        const ph = q<HTMLElement>("#demoPlaceholder");
        if (ph) ph.style.display = "";
        const short = q<HTMLElement>("#demoTooShort");
        if (short) short.textContent = "";
        q<HTMLElement>("#demoResult")?.classList.remove("show");
      }
    },
    [q, qa],
  );

  /** Play a panel's beats. Every one lands inside the chapter's own window. */
  const runPanel = useCallback(
    (panel: string) => {
      if (panel === "home" || panel === "guests" || panel === "stats") {
        qa<HTMLElement>(`[data-panel="${panel}"] [data-count]`).forEach((el, i) => {
          later(() => countUp(el, Number(el.dataset.count), 380), 40 + i * 18);
        });
      }

      if (panel === "guests") {
        // A household answering while the couple watches.
        later(() => q<HTMLElement>('[data-flash="1"]')?.classList.add("flash"), 1200);
        later(() => {
          const badge = q<HTMLElement>("#demoBadgeSwap");
          if (badge) {
            badge.className = "badge ok";
            badge.textContent = "Confirm\u00e9s";
          }
        }, 1650);
        later(() => q<HTMLElement>('[data-flash="1"]')?.classList.remove("flash"), 3300);
      }

      if (panel === "seating") {
        // ONE guest dragged from the aside onto Maiori. SeatingBoard drags
        // guests, never tables -- and at 3s a second drag would not read.
        const name = "Th\u00e9o Barral";
        later(() => {
          const pill = q<HTMLElement>("#demoDragPill");
          if (!pill) return;
          pill.textContent = name;
          pill.style.transform = "translate(-176px, 10px)";
          pill.classList.add("on");
        }, 260);
        later(() => q<HTMLElement>("#demoTargetTable")?.classList.add("target"), 370);
        later(() => {
          const pill = q<HTMLElement>("#demoDragPill");
          if (pill) pill.style.transform = "translate(392px, 60px)";
        }, 450);
        later(() => {
          q<HTMLElement>("#demoDragPill")?.classList.remove("on");
          q<HTMLElement>("#demoTargetTable")?.classList.remove("target");

          const li = document.createElement("li");
          li.textContent = name;
          li.className = "landed";
          q<HTMLElement>("#demoTargetList")?.appendChild(li);

          const cap = q<HTMLElement>("#demoTargetCap");
          if (cap) cap.textContent = "9 / 12 places";
          const seated = q<HTMLElement>("#demoSeated");
          if (seated) seated.textContent = "117";
          const left = q<HTMLElement>("#demoLeft");
          if (left) left.textContent = "7";
          const count = q<HTMLElement>("#demoUnseatedCount");
          if (count) count.textContent = "7";
          q<HTMLElement>(`#demoUnseatedList li[data-guest="${name}"]`)?.classList.add("gone");
          q<HTMLElement>("#demoToast")?.classList.add("show");
        }, 900);
        later(() => q<HTMLElement>("#demoToast")?.classList.remove("show"), 2560);
      }

      if (panel === "dayof") {
        const word = "Camille";
        later(() => {
          const ph = q<HTMLElement>("#demoPlaceholder");
          if (ph) ph.style.display = "none";
        }, 180);
        word.split("").forEach((_, i) => {
          later(() => {
            const typed = q<HTMLElement>("#demoTyped");
            if (typed) typed.textContent = word.slice(0, i + 1);
            const short = q<HTMLElement>("#demoTooShort");
            // The real field needs two characters before it searches.
            if (short) short.textContent = i === 0 ? "Encore une lettre\u2026" : "";
          }, 220 + i * 55);
        });
        later(() => q<HTMLElement>("#demoResult")?.classList.add("show"), 850);
      }

      if (panel === "stats") {
        // Two frames after the reset zeroed them, so there is a real 0 width
        // to transition from. A plain timer here raced the reset and left the
        // bars empty.
        // A short timeout rather than nested rAF, same throttling reason:
        // two frames that never arrive meant the bars never grew.
        later(() => {
          qa<HTMLElement>('[data-panel="stats"] .seg').forEach((f, i) => {
            later(() => (f.style.width = `${f.dataset.w}%`), 40 + i * 40);
          });
          qa<HTMLElement>('[data-panel="stats"] .ev-fill').forEach((f, i) => {
            later(() => (f.style.width = `${f.dataset.w}%`), 40 + i * 60);
          });
        }, 30);
      }
    },
    [countUp, later, q, qa],
  );

  // The beat functions are read through a ref so the effect below can depend
  // on (index, playing) alone. Listing them directly made the effect re-run
  // whenever any of them was rebuilt, which cancelled the timers it had just
  // scheduled — the animations never played and the clock stayed at 00:00.
  const beats = useRef({ resetPanel, runPanel });
  beats.current = { resetPanel, runPanel };

  /**
   * Advance chapters, and paint the rail and clock without re-rendering.
   *
   * Writing progress into React state here re-rendered the whole component
   * every frame, which rebuilt the beat callbacks and re-fired the effect
   * below — cancelling every animation before it could run. The rail is a
   * readout, so it is written to the DOM directly.
   */
  useEffect(() => {
    const elapsedBefore = CHAPTERS.slice(0, index).reduce((n, c) => n + c.ms, 0);
    const { panel, ms } = CHAPTERS[index];

    // Reset first, then play: one effect owns the whole chapter, so there is
    // no second effect racing it.
    clearTimers();
    beats.current.resetPanel(panel);
    if (!playing) return clearTimers;
    beats.current.runPanel(panel);

    startedAt.current = performance.now();
    const tick = () => {
      const into = heldMs.current + (performance.now() - startedAt.current);
      if (into >= ms) {
        heldMs.current = 0;
        setIndex((i) => (i + 1) % CHAPTERS.length);
        return;
      }
      if (fillRef.current) {
        fillRef.current.style.width = `${(into / ms) * 100}%`;
      }
      if (clockRef.current) {
        clockRef.current.textContent = `${clock(elapsedBefore + into)} / ${clock(TOTAL_MS)}`;
      }
    };

    // Deliberately setInterval, NOT requestAnimationFrame: this block sits
    // thousands of pixels down the page, and Chrome runs no rAF callbacks for
    // content that far outside the viewport -- the loop never got a single
    // frame and the tour stayed frozen at 00:00. 20Hz is plenty for a
    // progress bar, and `into` comes from real elapsed time, so a throttled
    // background tab resumes on the correct chapter rather than drifting.
    ticker.current = setInterval(tick, 50);
    tick();
    return () => {
      if (ticker.current) clearInterval(ticker.current);
      clearTimers();
    };
  }, [playing, index, clearTimers]);

  /**
   * Start only once the block is actually on screen, and stop when it leaves.
   * A tour that played through while the visitor was still reading the hero
   * would be over before they arrived. Once they touch a control we stop
   * auto-pausing, so scrolling past does not fight their choice.
   */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Plain geometry rather than IntersectionObserver. The observer's callback
    // never fired here: the block mounts far below the fold inside a section
    // whose styles land after first commit, and Chrome delivered no entry for
    // it. A scroll listener is also simply what we mean -- "is any part of the
    // demo on screen" -- and it re-checks on resize for free.
    //
    // Both writes go through a functional update that returns the SAME value
    // when nothing changed: calling setPlaying unconditionally re-rendered the
    // component, whose beat effect mutates the DOM, which retriggered the
    // check -- a loop that froze the renderer.
    const check = () => {
      if (manual.current) return;
      const r = el.getBoundingClientRect();
      // Generous margins: "roughly on screen" is the intent, and a strict
      // test left the demo frozen when it failed.
      const onScreen = r.bottom > 0 && r.top < window.innerHeight;
      setPlaying((prev) => (prev === onScreen ? prev : onScreen));
    };

    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const goTo = (next: number) => {
    manual.current = true;
    clearTimers();
    heldMs.current = 0;
    setIndex(((next % CHAPTERS.length) + CHAPTERS.length) % CHAPTERS.length);
    setPlaying(true);
  };

  const togglePlay = () => {
    manual.current = true;
    setPlaying((p) => !p);
  };

  const elapsedBefore = CHAPTERS.slice(0, index).reduce((n, c) => n + c.ms, 0);

  return (
    <div className="demoRoot" ref={rootRef}>
      {/* Shown only under 760px. The tour stays fully usable there, but the
          back-office itself is built for desktop and tablet -- the seating
          plan is a drag-and-drop board, the guest list runs five columns --
          and a visitor deciding whether to buy should know that before they
          sign up rather than after. CSS decides, not a width read in JS: no
          hydration mismatch, and a rotated tablet needs no listener. */}
      <p className="mobileNote">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>{t("mobileNote")}</span>
      </p>

      {/* The wrapper exists so the responsive scale can correct the height:
          `transform: scale` leaves the original box reserved, which would
          otherwise leave a growing gap under the frame as it shrinks. */}
      <div className="screenWrap">
        <div className="screen">
        <div className="chrome">
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
          <div className="omnibox">{chapter.url}</div>
        </div>

        <div className="app">
        <nav className="side" aria-label="Navigation du back-office">
          <div className="side-logo">
  <Image
              src="/logo.svg"
              alt=""
              width={32}
              height={34}
              className="demoLogo"
            />
            <span>The Studio</span>
          </div>

          <ul className="nav">
            <li data-nav="home" className={navClass("home", true)}>
              <div className="nav-row">
                <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                <span className="lab">Accueil</span>
              </div>
            </li>
            <li data-nav="guests" className={navClass("guests")}>
              <div className="nav-row">
                <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                <span className="lab">Invités</span>
                <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
              <ul className="sub">
                <li data-sub="all" className={subClass("all")}>Tous les invités</li>
                <li data-sub="rsvp" className={subClass("rsvp")}>Réponses RSVP</li>
                <li data-sub="groups" className={subClass("groups")}>Groupes</li>
                <li data-sub="meals" className={subClass("meals")}>Repas</li>
              </ul>
            </li>
            <li data-nav="invitation" className={navClass("invitation")}>
              <div className="nav-row">
                <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12.127 22H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.125"/><path d="M14.62 18.8A2.25 2.25 0 1 1 18 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/></svg>
                <span className="lab">Invitation</span>
                <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
              <ul className="sub">
                <li data-sub="modules" className={subClass("modules")}>Mes modules</li>
                <li data-sub="events" className={subClass("events")}>Événements</li>
                <li data-sub="schedule" className={subClass("schedule")}>Programme</li>
                <li data-sub="venue" className={subClass("venue")}>Lieu &amp; infos pratiques</li>
                <li data-sub="faq" className={subClass("faq")}>FAQ</li>
                <li data-sub="playlist" className={subClass("playlist")}>Playlist</li>
              </ul>
            </li>
            <li data-nav="dayof" className={navClass("dayof")}>
              <div className="nav-row">
                <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>
                <span className="lab">Jour J</span>
                <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
              <ul className="sub">
                <li data-sub="seating" className={subClass("seating")}>Plan de table</li>
                <li data-sub="qr" className={subClass("qr")}>QR Code</li>
                <li data-sub="menu" className={subClass("menu")}>Menu</li>
                <li data-sub="photos" className={subClass("photos")}>Photos &amp; vidéos</li>
                <li data-sub="settings" className={subClass("settings")}>Paramètres</li>
              </ul>
            </li>
            <li data-nav="stats" className="leaf">
              <div className="nav-row">
                <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                <span className="lab">Statistiques</span>
              </div>
            </li>
            <li data-nav="settings" className={navClass("settings")}>
              <div className="nav-row">
                <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>
                <span className="lab">Paramètres</span>
                <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
              <ul className="sub">
                <li data-sub="couple" className={subClass("couple")}>Couple</li>
                <li data-sub="billing" className={subClass("billing")}>Facturation</li>
                <li data-sub="messages" className={subClass("messages")}>Messages</li>
              </ul>
            </li>
          </ul>

          <div className="view-site">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
            Voir mon faire-part
          </div>

          <div className="side-foot">
            <div className="lang">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              <span className="flag">🇫🇷</span>
              <span className="grow">Français</span>
              <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <div className="logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
              Déconnexion
            </div>
          </div>
        </nav>
          <div className="stage">
            {/* ============ 1 · Accueil ============ */}
            <section className={panelClass("home")} data-panel="home" aria-label="Accueil">
              <div className="pad">
                <div className="home-head">
                  <h2>Bonjour, Marie &amp; Thomas</h2>
                  <span className="ghost-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>
                    Réglages
                  </span>
                </div>

                {/* CountdownTimer inside its own card: label, then five units. */}
                <div className="card cd-card">
                  <p className="lbl">Compte à rebours</p>
                  <div className="cd-units">
                    <div className="cd-unit"><b data-count="9">0</b><span>Mois</span></div>
                    <div className="cd-unit"><b data-count="15">0</b><span>Jours</span></div>
                    <div className="cd-unit"><b data-count="5" data-pad="2">00</b><span>H</span></div>
                    <div className="cd-unit"><b data-count="32" data-pad="2">00</b><span>Min</span></div>
                    <div className="cd-unit"><b data-count="38" data-pad="2">00</b><span>Sec</span></div>
                  </div>
                </div>

                <div className="kpi-grid">
                  <div className="card kpi-card">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                      Invités
                    </h3>
                    <div className="tiles">
                      <div className="tile"><b data-count="140">0</b><span>Total</span></div>
                      <div className="tile"><b data-count="124">0</b><span>Confirmés</span></div>
                      <div className="tile"><b data-count="4">0</b><span>En attente</span></div>
                      <div className="tile"><b data-count="12">0</b><span>Enfants</span></div>
                    </div>
                  </div>

                  <div className="card kpi-card">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>
                      Jour J
                    </h3>
                    <div className="tiles">
                      <div className="tile"><b data-count="116">0</b><span>Placés</span></div>
                      <div className="tile"><b data-count="8">0</b><span>À placer</span></div>
                      <div className="tile"><b data-count="10">0</b><span>Tables</span></div>
                      <div className="tile"><b data-count="47">0</b><span>Photos &amp; vidéos</span></div>
                    </div>
                  </div>
                </div>

                {/* HomeQuickActions: "À faire", three creme tiles, each with a
                     white circular icon, a count label and a description. */}
                <div className="card sect">
                  <h3>À faire</h3>
                  <div className="qa-grid">
                    <div className="qa">
                      <span className="qa-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg></span>
                      <span className="qa-txt">
                        <b>4 invités sans réponse</b>
                        <span>Relancer les invités qui n'ont pas encore répondu</span>
                      </span>
                    </div>
                    <div className="qa">
                      <span className="qa-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg></span>
                      <span className="qa-txt">
                        <b>8 invités à placer</b>
                        <span>Terminer le plan de table</span>
                      </span>
                    </div>
                    <div className="qa">
                      <span className="qa-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg></span>
                      <span className="qa-txt">
                        <b>Imprimer le QR code</b>
                        <span>À afficher le jour J pour l'accès invités</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* InvitationPreviewCard: title + public URL, "En ligne" pill,
                     then an outlined "Voir" and a filled "Modifier le contenu". */}
                <div className="card sect">
                  <div className="ip-head">
                    <div className="ip-t">
                      <h3 style={{ margin: "0" }}>Faire-part</h3>
                      <p className="ip-url">the-studio-digital-papeterie.fr/fr/invitation/marie-et-thomas</p>
                    </div>
                    <span className="ip-pill">En ligne</span>
                  </div>
                  <div className="ip-btns">
                    <span className="btn-outline">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                      Voir
                    </span>
                    <span className="btn-solid">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                      Modifier le contenu
                    </span>
                  </div>
                  <p className="ip-hint">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                    Lien public partagé avec vos invités
                  </p>
                </div>
              </div>
            </section>

            {/* ============ 2 · Invités (par foyer) ============ */}
            <section className={panelClass("guests")} data-panel="guests" aria-label="Vos invités">
              <div className="pad">
                <div className="home-head">
                  <h2>Vos Invités</h2>
                  <span className="violet-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Ajouter un Foyer
                  </span>
                </div>

                <div className="gs-grid">
                  <div className="gs">
                    <div className="gs-top">
                      <span>Total Invités</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                    <b data-count="140">0</b>
                    <small>Personnes invitées</small>
                  </div>
                  <div className="gs teal">
                    <div className="gs-top">
                      <span>Confirmés</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>
                    </div>
                    <b data-count="124">0</b>
                    <small>Seront présents</small>
                  </div>
                  <div className="gs jaune">
                    <div className="gs-top">
                      <span>En attente</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
                    </div>
                    <b data-count="4">0</b>
                    <small>Pas encore de réponse</small>
                  </div>
                  <div className="gs red">
                    <div className="gs-top">
                      <span>Déclinés</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    </div>
                    <b data-count="12">0</b>
                    <small>Ne viendront pas</small>
                  </div>
                </div>

                <div className="toolbar">
                  <span className="field">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
                    Rechercher un foyer...
                  </span>
                  <div className="chips">
                    <span className="chip on">Tous</span>
                    <span className="chip">Confirmés</span>
                    <span className="chip">En attente</span>
                    <span className="chip">Déclinés</span>
                  </div>
                  <div className="tool-acts">
                    <span className="chip">Exporter</span>
                    <span className="chip">Importer</span>
                  </div>
                </div>

                <div className="hh-wrap">
                  <table className="hh">
                    <thead>
                      <tr>
                        <th style={{ width: "250px" }}>Foyer / Famille</th>
                        <th>Invités</th>
                        <th>Contact</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className="who">
                            <span className="av">L</span>
                            <span><span className="nm">Famille Lefèvre</span><span className="sub">4 invité(s)</span></span>
                          </div>
                        </td>
                        <td><div className="stack"><span>Camille, Hugo</span><span>Léonie, Jules</span></div></td>
                        <td><div className="stack"><span>c.lefevre@email.fr</span><span>06 12 34 56 78</span></div></td>
                        <td><span className="badge ok">Confirmés</span></td>
                        <td>
                          <div className="rowacts">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="who">
                            <span className="av">M</span>
                            <span><span className="nm">Famille Moreau</span><span className="sub">3 invité(s)</span></span>
                          </div>
                        </td>
                        <td><div className="stack"><span>Jeanne, Paul</span><span>Léa</span></div></td>
                        <td><div className="stack"><span>jeanne.moreau@email.fr</span><span>06 98 76 54 32</span></div></td>
                        <td><span className="badge ok">Confirmés</span></td>
                        <td>
                          <div className="rowacts">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </div>
                        </td>
                      </tr>
                      <tr data-flash="1">
                        <td>
                          <div className="who">
                            <span className="av">B</span>
                            <span><span className="nm">Famille Barral</span><span className="sub">2 invité(s)</span></span>
                          </div>
                        </td>
                        <td><div className="stack"><span>Théo, Sarah</span></div></td>
                        <td><div className="stack"><span>theo.barral@email.fr</span><span>07 45 12 88 03</span></div></td>
                        <td><span className="badge wait" id="demoBadgeSwap">En attente</span></td>
                        <td>
                          <div className="rowacts">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="who">
                            <span className="av">S</span>
                            <span><span className="nm">Famille Sorel</span><span className="sub">2 invité(s)</span></span>
                          </div>
                        </td>
                        <td><div className="stack"><span>Raphaël, Inès</span></div></td>
                        <td><div className="stack"><span>r.sorel@email.fr</span><span>—</span></div></td>
                        <td><span className="badge no">Déclinés</span></td>
                        <td>
                          <div className="rowacts">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ============ 3 · Plan de table ============ */}
            <section className={panelClass("seating")} data-panel="seating" aria-label="Plan de table">
              <div className="seat-wrap">
                <div className="seat-head">
                  <h2>Plan de table</h2>
                  <div className="seat-meta">
                    <dl className="seat-dl">
                      <div><dt>Placés</dt><dd id="demoSeated">116</dd></div>
                      <div><dt>À placer</dt><dd id="demoLeft">8</dd></div>
                      <div><dt>Capacité</dt><dd>120</dd></div>
                    </dl>
                    <div className="seat-tools">
                      <span className="field" style={{ minWidth: "180px" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
                        Rechercher un invité…
                      </span>
                      <span className="violet-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        Table
                      </span>
                    </div>
                  </div>
                </div>

                <div className="seat-body">
                  <aside className="unseated">
                    <div className="unseated-top">
                      <h3>Invités à placer</h3>
                      <span className="count-pill" id="demoUnseatedCount">8</span>
                    </div>
                    <ul id="demoUnseatedList">
                      <li data-guest="Théo Barral">Théo Barral</li>
                      <li data-guest="Sarah Barral">Sarah Barral</li>
                      <li>Inès Fabre</li>
                      <li>Malik Aouad</li>
                      <li>Clara Ruiz</li>
                      <li>Nathan Weber</li>
                    </ul>
                  </aside>

                  <div className="board" id="demoBoard">
                    <div className="tbl" style={{ left: "22px", top: "20px" }}>
                      <h4>Amalfi</h4>
                      <p className="cap">12 / 12 places</p>
                      <ul><li>Jeanne Moreau</li><li>Paul Moreau</li><li>Léa Sanchez</li></ul>
                    </div>

                    <div className="tbl" style={{ left: "196px", top: "20px" }}>
                      <h4>Positano</h4>
                      <p className="cap">12 / 12 places</p>
                      <ul><li>Alice Nguyen</li><li>Kim Nguyen</li><li>Rosa Bellini</li></ul>
                    </div>

                    <div className="tbl" id="demoTargetTable" style={{ left: "370px", top: "20px" }}>
                      <h4>Maiori</h4>
                      <p className="cap" id="demoTargetCap">8 / 12 places</p>
                      <ul id="demoTargetList">
                        <li>Camille Lefèvre</li>
                        <li>Hugo Lefèvre</li>
                      </ul>
                    </div>

                    <div className="tbl" style={{ left: "22px", top: "172px" }}>
                      <h4>Ravello</h4>
                      <p className="cap">12 / 12 places</p>
                      <ul><li>Yanis Cherif</li><li>Nour Cherif</li><li>Marc Abadie</li></ul>
                    </div>

                    <div className="tbl" style={{ left: "196px", top: "172px" }}>
                      <h4>Sorrento</h4>
                      <p className="cap">12 / 12 places</p>
                      <ul><li>Emma Ferrand</li><li>Luc Ferrand</li><li>Alba Costa</li></ul>
                    </div>

                    {/* DragOverlay pill: a guest travelling from the aside to a table. */}
                    <div className="drag-pill" id="demoDragPill">Théo Barral</div>

                    <div className="toast" id="demoToast">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      <span id="demoToastText">Invité placé</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ============ 4 · Ma table ============ */}
            <section className={panelClass("dayof")} data-panel="dayof" aria-label="Ma table, côté invités">
              <div className="pad">
                <div className="home-head">
                  <h2>Le jour J, côté invités</h2>
                  <span className="ghost-btn">Un QR code sur la table</span>
                </div>

                <div className="jourj">
                  <div className="phone">
                    <div className="phone-top"><i></i></div>
                    <div className="phone-body">
                      <h3>Ma table</h3>
                      <p className="hint">Entrez votre prénom ou votre nom.</p>
                      <div className="finder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
                        <span id="demoTyped"></span><span className="ph" id="demoPlaceholder">Marie…</span><span className="caret"></span>
                      </div>
                      <p className="tooshort" id="demoTooShort"></p>
                      <div className="result" id="demoResult">
                        <p className="lead">Camille, votre table est…</p>
                        <p className="tname">Maiori</p>
                        <p className="seat">Près de la terrasse · 12 couverts</p>
                      </div>
                    </div>
                  </div>

                  <ul className="featlist">
                    <li>
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg></span>
                      <div><b>Un QR code par mariage</b><span>Imprimé sur le menu ou le marque-place. Pas d'application à installer.</span></div>
                    </li>
                    <li>
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg></span>
                      <div><b>Chacun trouve sa table</b><span>Deux lettres suffisent, et seuls les invités placés remontent. La liste complète reste privée.</span></div>
                    </li>
                    <li>
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/></svg></span>
                      <div><b>Les photos remontent au fil de la soirée</b><span>Les invités déposent, vous validez. Une photo masquée devient inaccessible.</span></div>
                    </li>
                    <li>
                      <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16M4 12h16M4 19h10"/></svg></span>
                      <div><b>Menu, programme et FAQ</b><span>Modifiables jusqu'au dernier moment. Les invités voient la version à jour.</span></div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* ============ 5 · Statistiques ============ */}
            <section className={panelClass("stats")} data-panel="stats" aria-label="Statistiques">
              <div className="pad">
                <div>
                  <h2 className="pg-title">Statistiques</h2>
                  <p className="pg-sub">Des chiffres simples et utiles pour suivre votre faire-part.</p>
                </div>

                {/* Invitation: three StatCards, the third `variant="primary"`. */}
                <h3 className="sec-h">Invitation</h3>
                <div className="sc-grid">
                  <div className="sc">
                    <span className="sc-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg></span>
                    <div className="sc-top">
                      <span className="sc-lab">Visites</span>
                      <span className="sc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg></span>
                    </div>
                    <div className="sc-val" data-count="1842">0</div>
                  </div>

                  <div className="sc">
                    <span className="sc-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg></span>
                    <div className="sc-top">
                      <span className="sc-lab">Visiteurs uniques</span>
                      <span className="sc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg></span>
                    </div>
                    <div className="sc-val" data-count="214">0</div>
                  </div>

                  <div className="sc primary">
                    <span className="sc-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></span>
                    <div className="sc-top">
                      <span className="sc-lab">Taux de réponse</span>
                      <span className="sc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></span>
                    </div>
                    <div className="sc-val"><span data-count="97">0</span>%</div>
                    <p className="sc-desc">136 réponses sur 140 invités</p>
                  </div>
                </div>

                {/* VisitTrendChart: 30 thin bars, single violet hue. */}
                <div className="card sect">
                  <h4 className="trend-h">Visites sur 30 jours</h4>
                  <div className="trend-wrap">
                    <svg viewBox="0 0 600 160" className="trend" role="img" aria-label="Nombre de visites par jour sur les 30 derniers jours">
                      <defs>
                        <linearGradient id="demoVisitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4B3F72" stopOpacity="0.9"/>
                          <stop offset="100%" stopColor="#4B3F72" stopOpacity="0.55"/>
                        </linearGradient>
                      </defs>
                      <rect x="9.00" y="137.99" width="17.47" height="10.01" rx="2" fill="url(#demoVisitGradient)"/><rect x="28.47" y="136.32" width="17.47" height="11.68" rx="2" fill="url(#demoVisitGradient)"/><rect x="47.93" y="134.65" width="17.47" height="13.35" rx="2" fill="url(#demoVisitGradient)"/><rect x="67.40" y="133.82" width="17.47" height="14.18" rx="2" fill="url(#demoVisitGradient)"/><rect x="86.87" y="132.15" width="17.47" height="15.85" rx="2" fill="url(#demoVisitGradient)"/><rect x="106.33" y="130.48" width="17.47" height="17.52" rx="2" fill="url(#demoVisitGradient)"/><rect x="125.80" y="12.00" width="17.47" height="136.00" rx="2" fill="url(#demoVisitGradient)"/><rect x="145.27" y="77.08" width="17.47" height="70.92" rx="2" fill="url(#demoVisitGradient)"/><rect x="164.73" y="126.31" width="17.47" height="21.69" rx="2" fill="url(#demoVisitGradient)"/><rect x="184.20" y="124.64" width="17.47" height="23.36" rx="2" fill="url(#demoVisitGradient)"/><rect x="203.67" y="122.97" width="17.47" height="25.03" rx="2" fill="url(#demoVisitGradient)"/><rect x="223.13" y="121.30" width="17.47" height="26.70" rx="2" fill="url(#demoVisitGradient)"/><rect x="242.60" y="119.63" width="17.47" height="28.37" rx="2" fill="url(#demoVisitGradient)"/><rect x="262.07" y="118.80" width="17.47" height="29.20" rx="2" fill="url(#demoVisitGradient)"/><rect x="281.53" y="117.13" width="17.47" height="30.87" rx="2" fill="url(#demoVisitGradient)"/><rect x="301.00" y="115.46" width="17.47" height="32.54" rx="2" fill="url(#demoVisitGradient)"/><rect x="320.47" y="113.79" width="17.47" height="34.21" rx="2" fill="url(#demoVisitGradient)"/><rect x="339.93" y="112.12" width="17.47" height="35.88" rx="2" fill="url(#demoVisitGradient)"/><rect x="359.40" y="111.29" width="17.47" height="36.71" rx="2" fill="url(#demoVisitGradient)"/><rect x="378.87" y="109.62" width="17.47" height="38.38" rx="2" fill="url(#demoVisitGradient)"/><rect x="398.33" y="107.95" width="17.47" height="40.05" rx="2" fill="url(#demoVisitGradient)"/><rect x="417.80" y="106.28" width="17.47" height="41.72" rx="2" fill="url(#demoVisitGradient)"/><rect x="437.27" y="104.61" width="17.47" height="43.39" rx="2" fill="url(#demoVisitGradient)"/><rect x="456.73" y="103.78" width="17.47" height="44.22" rx="2" fill="url(#demoVisitGradient)"/><rect x="476.20" y="102.11" width="17.47" height="45.89" rx="2" fill="url(#demoVisitGradient)"/><rect x="495.67" y="100.44" width="17.47" height="47.56" rx="2" fill="url(#demoVisitGradient)"/><rect x="515.13" y="98.77" width="17.47" height="49.23" rx="2" fill="url(#demoVisitGradient)"/><rect x="534.60" y="97.10" width="17.47" height="50.90" rx="2" fill="url(#demoVisitGradient)"/><rect x="554.07" y="96.27" width="17.47" height="51.73" rx="2" fill="url(#demoVisitGradient)"/><rect x="573.53" y="94.60" width="17.47" height="53.40" rx="2" fill="url(#demoVisitGradient)"/>
                    </svg>
                  </div>
                  <div className="trend-x"><span>05-19</span><span>06-17</span></div>
                </div>

                <div className="stat-cols">
                  <div className="card sect">
                    <h3>RSVP</h3>
                    <div className="seg-bar">
                      <span className="seg c" data-w="88.6"></span>
                      <span className="seg d" data-w="8.6"></span>
                      <span className="seg p" data-w="2.8"></span>
                    </div>
                    <ul className="legend">
                      <li><span className="k"><span className="dot c"></span>Confirmés</span><span className="v">124</span></li>
                      <li><span className="k"><span className="dot d"></span>Déclinés</span><span className="v">12</span></li>
                      <li><span className="k"><span className="dot p"></span>Sans réponse</span><span className="v">4</span></li>
                    </ul>
                  </div>

                  <div className="card sect">
                    <h3>Événements</h3>
                    <ul className="events">
                      <li>
                        <div className="ev-top"><span className="n">Cérémonie</span><span className="c">122 / 124 confirmés</span></div>
                        <div className="ev-track"><span className="ev-fill" data-w="98"></span></div>
                      </li>
                      <li>
                        <div className="ev-top"><span className="n">Dîner</span><span className="c">117 / 124 confirmés</span></div>
                        <div className="ev-track"><span className="ev-fill" data-w="94"></span></div>
                      </li>
                      <li>
                        <div className="ev-top"><span className="n">Brunch</span><span className="c">76 / 124 confirmés</span></div>
                        <div className="ev-track"><span className="ev-fill" data-w="61"></span></div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      </div>

      {/* Narration. Its height is reserved in CSS: the bodies run two lines
          for some chapters and three for others, and a block that resizes
          under a frame we deliberately fixed defeats the point. */}
      <div className="narrate">
        <span className="chapno">{String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3>{chapter.title}</h3>
          <p>{chapter.body}</p>
        </div>
      </div>

      <div className="rail" role="tablist" aria-label={t("chapters")}>
        {CHAPTERS.map((c, i) => (
          <button
            key={c.panel}
            type="button"
            role="tab"
            aria-current={i === index}
            aria-label={`${i + 1}. ${c.rail}`}
            onClick={() => goTo(i)}
          >
            <span className="rail-track">
              <span
                className="rail-fill"
                ref={i === index ? fillRef : undefined}
                style={{ width: i < index ? "100%" : i === index ? "0%" : "0%" }}
              />
            </span>
            <span className="rail-name">{`${i + 1}. ${c.rail}`}</span>
          </button>
        ))}
      </div>

      <div className="transport">
        <button
          type="button"
          className="tbtn main"
          onClick={togglePlay}
          aria-label={playing ? t("pause") : t("resume")}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4l14 8-14 8z" />
            </svg>
          )}
          <span>{playing ? t("pause") : t("resume")}</span>
        </button>

        <button type="button" className="tbtn" onClick={() => goTo(index - 1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {t("previous")}
        </button>

        <button type="button" className="tbtn" onClick={() => goTo(index + 1)}>
          {t("next")}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <button type="button" className="tbtn" onClick={() => goTo(0)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          {t("replay")}
        </button>

        <span className="clock" ref={clockRef}>
          {clock(elapsedBefore)} / {clock(TOTAL_MS)}
        </span>
      </div>
    </div>
  );
}

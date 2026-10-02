"use client";

import { ChevronUp, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * The workshop's switcher, floating over a theme's demo opened full page
 * (`/<locale>/invitation/demo/<id>?atelier=1`).
 *
 * The invitation underneath is the real one: the same route, the same load, the
 * same scroll a guest gets — nothing is framed or scaled. The bar only changes
 * the address (theme, data, language: a fresh page, as when a guest opens a
 * link) or scrolls to a section, and folds away into a small button so the
 * page can be seen with nothing over it.
 *
 * Internal and French only (see `app/[locale]/invitation/atelier/page.tsx`).
 * Never drawn inside a frame: the home page's phone mock-up loads the same
 * demo route.
 */

type ThemeOption = { id: string; name: string };

const FIXTURES = [
  { id: "demo", label: "Démo du thème" },
  { id: "minimal", label: "Mariage presque vide" },
  { id: "heavy", label: "Mariage très rempli" },
];

const LOCALES = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "de", label: "Deutsch" },
  { id: "es", label: "Español" },
  { id: "pt", label: "Português" },
  { id: "it", label: "Italiano" },
  { id: "ar", label: "العربية" },
  { id: "zh", label: "中文" },
  { id: "ja", label: "日本語" },
];

/** Section names, in the editor's words (`shared/data/invitation-sections.ts`). */
const SECTION_LABELS: Record<string, string> = {
  hero: "Accueil (hero)",
  countdown: "Compte à rebours",
  "intro-video": "Vidéo d'introduction",
  timeline: "Programme",
  "dress-code": "Dress code",
  map: "Lieu et accès",
  accommodation: "Hébergements",
  transport: "Transport",
  menu: "Menu",
  gallery: "Galerie",
  "gift-list": "Liste de cadeaux",
  playlist: "Playlist",
  guestbook: "Livre d'or",
  "video-guestbook": "Livre d'or vidéo",
  rsvp: "RSVP",
  faq: "FAQ",
  footer: "Pied de page",
};

const FOLDED_KEY = "atelier-bar-folded";

const subscribeNever = () => () => {};

function readFolded(): boolean {
  try {
    return window.localStorage.getItem(FOLDED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeFolded(folded: boolean) {
  try {
    window.localStorage.setItem(FOLDED_KEY, folded ? "1" : "0");
  } catch {
    // A private window: the bar simply opens unfolded next time.
  }
}

/** Shows one section: scrolls to it, and with `isolate` hides the other top-level sections. */
function showSection(section: string, isolate: boolean) {
  for (const hidden of document.querySelectorAll<HTMLElement>("[data-atelier-hidden]")) {
    hidden.style.removeProperty("display");
    delete hidden.dataset.atelierHidden;
  }
  if (section === "all") return;

  const targets = Array.from(document.querySelectorAll<HTMLElement>(`[data-editor-section="${CSS.escape(section)}"]`));
  if (targets.length === 0) return;

  if (isolate) {
    const tops = Array.from(document.querySelectorAll<HTMLElement>("[data-editor-section]")).filter(
      (element) => !element.parentElement?.closest("[data-editor-section]"),
    );
    for (const element of tops) {
      if (targets.some((target) => element === target || element.contains(target))) continue;
      element.style.display = "none";
      element.dataset.atelierHidden = "";
    }
  }
  targets[0].scrollIntoView({ block: "start" });
}

export function AtelierBar({
  themes,
  themeId,
  fixture,
  locale,
}: {
  themes: ThemeOption[];
  themeId: string;
  fixture: string;
  locale: string;
}) {
  // False on the server and inside a frame; the bar exists only on the page itself.
  const onTop = useSyncExternalStore(
    subscribeNever,
    () => window.self === window.top,
    () => false,
  );
  const [folded, setFolded] = useState(false);
  const [sections, setSections] = useState<string[]>([]);
  const [section, setSection] = useState("all");
  const [isolate, setIsolate] = useState(false);

  // After hydration: the folded state, the sections this page drew, and the
  // section asked for in the address.
  useEffect(() => {
    if (!onTop) return;
    setFolded(readFolded());
    const ids = Array.from(document.querySelectorAll<HTMLElement>("[data-editor-section]")).map(
      (element) => element.dataset.editorSection ?? "",
    );
    setSections([...new Set(ids.filter(Boolean))]);
    const params = new URLSearchParams(window.location.search);
    const asked = params.get("section");
    if (asked) setSection(asked);
    if (params.get("isoler") === "1") setIsolate(true);
  }, [onTop]);

  useEffect(() => {
    if (!onTop) return;
    showSection(section, isolate);
    // Images load lazily above the section and push it down while they
    // arrive: land on it again once they have.
    const timers = [700, 1600].map((delay) => window.setTimeout(() => showSection(section, isolate), delay));
    // Kept in the address so a reload lands on the same section. `null`
    // state, not `history.state` (Conventions: Next would undo the change).
    const params = new URLSearchParams(window.location.search);
    if (section === "all") params.delete("section");
    else params.set("section", section);
    if (isolate && section !== "all") params.set("isoler", "1");
    else params.delete("isoler");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onTop, section, isolate]);

  /** A new page, loaded the way a guest loads it. */
  const go = useCallback(
    (next: { theme?: string; fixture?: string; locale?: string }) => {
      const params = new URLSearchParams({ atelier: "1" });
      const nextFixture = next.fixture ?? fixture;
      if (nextFixture !== "demo") params.set("fixture", nextFixture);
      window.location.assign(`/${next.locale ?? locale}/invitation/demo/${next.theme ?? themeId}?${params}`);
    },
    [fixture, locale, themeId],
  );

  const fold = (value: boolean) => {
    setFolded(value);
    writeFolded(value);
  };

  if (!onTop) return null;

  if (folded) {
    return (
      <button
        type="button"
        onClick={() => fold(false)}
        aria-label="Ouvrir l'atelier"
        title="Atelier"
        className="fixed left-3 top-3 z-[1000] inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2440]/85 text-white shadow-lg backdrop-blur hover:bg-[#2a2440]"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    );
  }

  const select =
    "h-8 shrink-0 rounded-full border border-white/20 bg-white/10 pl-3 pr-7 font-sans text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-white/40 [&>option]:text-[#2a2440]";

  return (
    <div
      dir="ltr"
      className="fixed inset-x-2 top-2 z-[1000] mx-auto flex max-w-max items-center gap-2 overflow-x-auto whitespace-nowrap rounded-full bg-[#2a2440]/85 py-1.5 pl-4 pr-1.5 font-sans text-white shadow-lg backdrop-blur"
    >
      <span className="shrink-0 text-[13px] font-semibold tracking-wide">Atelier</span>
      <select aria-label="Thème" className={select} value={themeId} onChange={(event) => go({ theme: event.target.value })}>
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
      <select aria-label="Section" className={select} value={section} onChange={(event) => setSection(event.target.value)}>
        <option value="all">Toute la page</option>
        {sections.map((id) => (
          <option key={id} value={id}>
            {SECTION_LABELS[id] ?? id}
          </option>
        ))}
      </select>
      <select aria-label="Données" className={select} value={fixture} onChange={(event) => go({ fixture: event.target.value })}>
        {FIXTURES.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <select aria-label="Langue" className={select} value={locale} onChange={(event) => go({ locale: event.target.value })}>
        {LOCALES.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <label className="flex shrink-0 items-center gap-1.5 text-[13px]">
        <input
          type="checkbox"
          name="isoler"
          checked={isolate && section !== "all"}
          disabled={section === "all"}
          onChange={(event) => setIsolate(event.target.checked)}
          className="h-3.5 w-3.5 accent-white"
        />
        Isoler
      </label>
      <button
        type="button"
        onClick={() => fold(true)}
        aria-label="Replier l'atelier"
        title="Replier"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </div>
  );
}

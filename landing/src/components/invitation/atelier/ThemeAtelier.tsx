"use client";

import { ExternalLink, RotateCw } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@shared/lib/utils";

/**
 * The theme workshop's screen (see `app/[locale]/invitation/atelier/page.tsx`).
 *
 * Each frame is an iframe on the demo route, same origin, so the workshop can
 * reach into it: list the sections the theme drew (`data-editor-section`),
 * scroll one into view, and — "isoler" — hide every other top-level section.
 * Nothing is re-implemented: the theme renders exactly as on a guest's phone.
 *
 * The choices live in the query string (`?theme=…&section=…`), so a view can
 * be reloaded or sent as a link.
 */

type ThemeOption = { id: string; name: string };
type Fixture = "demo" | "minimal" | "heavy";
type View = "mobile" | "tablet" | "desktop" | "trio" | "compare";
type DeviceId = "mobile" | "tablet" | "desktop";

const FIXTURES: { id: Fixture; label: string }[] = [
  { id: "demo", label: "Démo du thème" },
  { id: "minimal", label: "Mariage presque vide" },
  { id: "heavy", label: "Mariage très rempli" },
];

const LOCALES: { id: string; label: string }[] = [
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

const VIEWS: { id: View; label: string }[] = [
  { id: "mobile", label: "Mobile" },
  { id: "tablet", label: "Tablette" },
  { id: "desktop", label: "Bureau" },
  { id: "trio", label: "Les trois côte à côte" },
  { id: "compare", label: "Cette section sur tous les thèmes" },
];

/** The sections an invitation can have, in the editor's order (`shared/data/invitation-sections.ts`). */
const SECTIONS: { id: string; label: string }[] = [
  { id: "hero", label: "Accueil (hero)" },
  { id: "countdown", label: "Compte à rebours" },
  { id: "intro-video", label: "Vidéo d'introduction" },
  { id: "timeline", label: "Programme" },
  { id: "dress-code", label: "Dress code" },
  { id: "map", label: "Lieu et accès" },
  { id: "accommodation", label: "Hébergements" },
  { id: "transport", label: "Transport" },
  { id: "menu", label: "Menu" },
  { id: "gallery", label: "Galerie" },
  { id: "gift-list", label: "Liste de cadeaux" },
  { id: "playlist", label: "Playlist" },
  { id: "guestbook", label: "Livre d'or" },
  { id: "video-guestbook", label: "Livre d'or vidéo" },
  { id: "rsvp", label: "RSVP" },
  { id: "faq", label: "FAQ" },
  { id: "footer", label: "Pied de page" },
];

const DEVICES: Record<DeviceId, { width: number; height: number; label: string }> = {
  mobile: { width: 390, height: 844, label: "Mobile · 390 px" },
  tablet: { width: 768, height: 1024, label: "Tablette · 768 px" },
  desktop: { width: 1440, height: 900, label: "Bureau · 1440 px" },
};

const GAP = 24;

function demoUrl(theme: string, locale: string, fixture: Fixture): string {
  return `/${locale}/invitation/demo/${theme}${fixture === "demo" ? "" : `?fixture=${fixture}`}`;
}

/**
 * Shows `section` in a framed demo: scrolls to it, and with `isolate` hides
 * every top-level section that neither is it nor holds it. Returns whether the
 * theme drew that section at all. "all" undoes everything.
 */
function applySection(frame: HTMLIFrameElement | null, section: string, isolate: boolean): boolean {
  const doc = frame?.contentDocument;
  const win = frame?.contentWindow;
  if (!doc || !win) return false;

  for (const hidden of doc.querySelectorAll<HTMLElement>("[data-atelier-hidden]")) {
    hidden.style.removeProperty("display");
    delete hidden.dataset.atelierHidden;
  }
  if (section === "all") {
    win.scrollTo({ top: 0 });
    return true;
  }

  const targets = Array.from(doc.querySelectorAll<HTMLElement>(`[data-editor-section="${CSS.escape(section)}"]`));
  if (targets.length === 0) return false;

  if (isolate) {
    const tops = Array.from(doc.querySelectorAll<HTMLElement>("[data-editor-section]")).filter(
      (element) => !element.parentElement?.closest("[data-editor-section]"),
    );
    for (const element of tops) {
      if (targets.some((target) => element === target || element.contains(target))) continue;
      element.style.display = "none";
      element.dataset.atelierHidden = "";
    }
  }

  // Not `scrollIntoView`: from inside a frame it scrolls the workshop page too.
  const top = targets[0].getBoundingClientRect().top + win.scrollY;
  win.scrollTo({ top: Math.max(0, top) });
  return true;
}

/**
 * Resolves once React has hydrated the framed page — its first section carries
 * React's fiber key — or after `timeout`. Touching the DOM before that (hiding
 * a section) makes React report a hydration mismatch inside the frame.
 */
function whenHydrated(frame: HTMLIFrameElement | null, timeout = 8000): Promise<void> {
  const started = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const first = frame?.contentDocument?.querySelector("[data-editor-section]");
      const hydrated = first ? Object.keys(first).some((key) => key.startsWith("__reactFiber")) : false;
      if (hydrated || Date.now() - started > timeout) resolve();
      else window.setTimeout(check, 120);
    };
    check();
  });
}

/** The section ids a framed demo drew, in page order. */
function drawnSections(frame: HTMLIFrameElement | null): string[] {
  const doc = frame?.contentDocument;
  if (!doc) return [];
  const ids = Array.from(doc.querySelectorAll<HTMLElement>("[data-editor-section]")).map(
    (element) => element.dataset.editorSection ?? "",
  );
  return [...new Set(ids.filter(Boolean))];
}

function DemoFrame({
  src,
  device,
  scale,
  section,
  isolate,
  label,
  reloadKey,
  onSections,
}: {
  src: string;
  device: DeviceId;
  scale: number;
  section: string;
  isolate: boolean;
  label: string;
  reloadKey: number;
  onSections?: (ids: string[]) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [absent, setAbsent] = useState(false);
  const { width, height } = DEVICES[device];

  // A new page (theme, language, dataset, reload) starts unloaded again.
  useEffect(() => {
    setLoaded(false);
    setReady(false);
  }, [src, reloadKey]);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    void whenHydrated(frameRef.current).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  useEffect(() => {
    if (ready) onSections?.(drawnSections(frameRef.current));
  }, [ready, onSections]);

  useEffect(() => {
    if (!ready) return;
    const apply = () => setAbsent(!applySection(frameRef.current, section, isolate));
    apply();
    // Themes reveal and re-measure a moment after hydrating (fonts,
    // observers): apply once more when they have settled.
    const timer = window.setTimeout(apply, 900);
    return () => window.clearTimeout(timer);
  }, [ready, section, isolate]);

  return (
    <figure className="flex flex-col items-center gap-2">
      <figcaption className="font-body text-xs tracking-luxe text-studio-violet/70">{label}</figcaption>
      <div
        className="relative overflow-hidden rounded-2xl border border-studio-lavande/50 bg-white shadow-sm"
        style={{ width: width * scale, height: height * scale }}
      >
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <iframe
            key={`${src}#${reloadKey}`}
            ref={frameRef}
            src={src}
            title={label}
            className="block border-0"
            style={{ width, height }}
            onLoad={() => setLoaded(true)}
          />
        </div>
        {!ready ? (
          <div className="absolute inset-0 flex items-center justify-center bg-studio-creme/80">
            <div className="h-7 w-7 animate-spin rounded-full border border-studio-violet/30 border-t-studio-violet" />
          </div>
        ) : null}
        {ready && absent ? (
          <div className="absolute inset-0 flex items-center justify-center bg-studio-creme/90 p-6 text-center font-body text-sm text-studio-violet/70">
            Ce thème ne dessine pas cette section avec ces données.
          </div>
        ) : null}
      </div>
    </figure>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="font-body text-[11px] uppercase tracking-luxe text-studio-violet/60">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 min-w-0 rounded-full border border-studio-lavande bg-white px-4 font-body text-sm text-studio-violet focus:outline-none focus:ring-2 focus:ring-studio-violet/30"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Width available to the frames, measured on the client (null on the server). */
function useAvailableWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export function ThemeAtelier({ themes }: { themes: ThemeOption[] }) {
  const [theme, setTheme] = useState(themes[0]?.id ?? "");
  const [fixture, setFixture] = useState<Fixture>("demo");
  const [locale, setLocale] = useState("fr");
  const [view, setView] = useState<View>("trio");
  const [section, setSection] = useState("all");
  const [isolate, setIsolate] = useState(false);
  const [drawn, setDrawn] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [areaRef, available] = useAvailableWidth();

  // Read the view from the address once, on the client.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const known = (value: string | null, list: readonly string[]) => (value && list.includes(value) ? value : null);
    const themeParam = known(params.get("theme"), themes.map((t) => t.id));
    if (themeParam) setTheme(themeParam);
    const fixtureParam = known(params.get("fixture"), FIXTURES.map((f) => f.id));
    if (fixtureParam) setFixture(fixtureParam as Fixture);
    const localeParam = known(params.get("lang"), LOCALES.map((l) => l.id));
    if (localeParam) setLocale(localeParam);
    const viewParam = known(params.get("view"), VIEWS.map((v) => v.id));
    if (viewParam) setView(viewParam as View);
    const sectionParam = known(params.get("section"), SECTIONS.map((s) => s.id));
    if (sectionParam) setSection(sectionParam);
    if (params.get("isoler") === "1") setIsolate(true);
    setHydrated(true);
  }, [themes]);

  // Write it back, without a history entry per click. `null` state, not
  // `history.state`: Next's marker in it would undo the change (Conventions).
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams({ theme, fixture, lang: locale, view, section });
    if (isolate) params.set("isoler", "1");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [hydrated, theme, fixture, locale, view, section, isolate]);

  const onSections = useCallback((ids: string[]) => setDrawn(ids), []);

  const sectionOptions = [
    { id: "all", label: "Toute la page" },
    ...SECTIONS.map((s) => ({
      id: s.id,
      label: view === "compare" || drawn.length === 0 || drawn.includes(s.id) ? s.label : `${s.label} — absent`,
    })),
  ];

  const current = themes.find((t) => t.id === theme);
  const src = demoUrl(theme, locale, fixture);
  const width = available ?? 1200;

  let frames: ReactNode;
  if (view === "compare") {
    // The same section across every theme, at phone width.
    const columns = Math.max(1, Math.min(themes.length, Math.floor((width + GAP) / (DEVICES.mobile.width * 0.55 + GAP))));
    const scale = Math.min(1, (width - GAP * (columns - 1)) / columns / DEVICES.mobile.width);
    frames = (
      <div className="grid justify-center" style={{ gridTemplateColumns: `repeat(${columns}, max-content)`, gap: GAP }}>
        {themes.map((t) => (
          <DemoFrame
            key={t.id}
            src={demoUrl(t.id, locale, fixture)}
            device="mobile"
            scale={scale}
            section={section}
            isolate={section !== "all"}
            label={t.name}
            reloadKey={reloadKey}
          />
        ))}
      </div>
    );
  } else {
    const devices: DeviceId[] = view === "trio" ? ["mobile", "tablet", "desktop"] : [view];
    // One scale for every frame shown, so their sizes stay true to each other.
    // The gaps are not scaled, so they come off the width first.
    const total = devices.reduce((sum, d) => sum + DEVICES[d].width, 0);
    const scale = Math.min(1, (width - GAP * (devices.length - 1)) / total);
    frames = (
      <div className="flex flex-wrap items-start justify-center" style={{ gap: GAP }}>
        {devices.map((d, index) => (
          <DemoFrame
            key={d}
            src={src}
            device={d}
            scale={scale}
            section={section}
            isolate={isolate}
            label={DEVICES[d].label}
            reloadKey={reloadKey}
            onSections={index === 0 ? onSections : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-studio-creme px-4 pb-16 md:px-8">
      <header className="sticky top-0 z-30 -mx-4 mb-8 border-b border-studio-lavande/40 bg-studio-creme/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-heading text-h3 text-studio-violet">Atelier des thèmes</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-studio-lavande px-4 font-body text-xs text-studio-violet hover:bg-studio-lavande/20"
            >
              <RotateCw className="h-3.5 w-3.5" /> Recharger
            </button>
            {view !== "compare" ? (
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-studio-violet px-4 font-body text-xs text-white hover:opacity-90"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Ouvrir {current?.name ?? theme}
              </a>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Select
            label="Thème"
            value={theme}
            options={themes.map((t) => ({ id: t.id, label: t.name, disabled: view === "compare" }))}
            onChange={setTheme}
          />
          <Select label="Section" value={section} options={sectionOptions} onChange={setSection} />
          <Select label="Données" value={fixture} options={FIXTURES} onChange={setFixture} />
          <Select label="Langue" value={locale} options={LOCALES} onChange={setLocale} />
          <Select label="Affichage" value={view} options={VIEWS} onChange={setView} />
          <label className="flex items-end gap-2 pb-2 font-body text-sm text-studio-violet">
            <input
              type="checkbox"
              name="isoler"
              checked={section !== "all" && (view === "compare" || isolate)}
              disabled={view === "compare" || section === "all"}
              onChange={(event) => setIsolate(event.target.checked)}
              className="h-4 w-4 accent-studio-violet"
            />
            Isoler la section
          </label>
        </div>
      </header>

      <div ref={areaRef} className="w-full">
        {available === null ? null : frames}
      </div>
    </main>
  );
}

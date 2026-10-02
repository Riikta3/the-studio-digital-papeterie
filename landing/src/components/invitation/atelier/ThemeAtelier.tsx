"use client";

import { ExternalLink, RotateCw } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@shared/lib/utils";

/**
 * The theme workshop's screen (see `app/[locale]/invitation/atelier/page.tsx`).
 *
 * By default the invitation fills the window at its real size, under a bar of
 * dropdowns — theme, section, dataset, language, display — as if a guest had
 * opened it. The other displays (phone, tablet, the three side by side, one
 * section across every theme) are a choice in that bar.
 *
 * Each frame is an iframe on the demo route, same origin, so the workshop can
 * reach into it: list the sections the theme drew (`data-editor-section`),
 * scroll one into view, and — "isoler" — hide every other top-level section.
 * Nothing is re-implemented: the theme renders exactly as on a guest's screen.
 *
 * The choices live in the query string (`?theme=…&section=…`), so a view can
 * be reloaded or sent as a link.
 */

type ThemeOption = { id: string; name: string };
type Fixture = "demo" | "minimal" | "heavy";
type View = "normal" | "mobile" | "tablet" | "trio" | "compare";
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
  { id: "normal", label: "Vue normale" },
  { id: "mobile", label: "Vue mobile" },
  { id: "tablet", label: "Vue tablette" },
  { id: "trio", label: "Vue 3 tailles" },
  { id: "compare", label: "Vue tous les thèmes" },
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

/**
 * One framed demo. `size` null fills its container at real size (the normal
 * display); otherwise the frame has that device's size, drawn at `scale`.
 */
function DemoFrame({
  src,
  size,
  scale = 1,
  section,
  isolate,
  label,
  reloadKey,
  onSections,
}: {
  src: string;
  size: { width: number; height: number } | null;
  scale?: number;
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

  const iframe = (
    <iframe
      key={`${src}#${reloadKey}`}
      ref={frameRef}
      src={src}
      title={label}
      className="block h-full w-full border-0"
      style={size ? { width: size.width, height: size.height } : undefined}
      onLoad={() => setLoaded(true)}
    />
  );

  const overlays = (
    <>
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-studio-creme/80">
          <div className="h-7 w-7 animate-spin rounded-full border border-studio-violet/30 border-t-studio-violet" />
        </div>
      ) : null}
      {ready && absent ? (
        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
          <p className="rounded-full bg-studio-violet px-4 py-2 text-center font-body text-xs text-white shadow-md">
            Ce thème ne dessine pas cette section avec ces données.
          </p>
        </div>
      ) : null}
    </>
  );

  if (!size) {
    return (
      <div className="relative h-full w-full bg-white">
        {iframe}
        {overlays}
      </div>
    );
  }

  return (
    <figure className="flex flex-col items-center gap-2">
      <figcaption className="font-body text-xs tracking-luxe text-studio-violet/70">{label}</figcaption>
      <div
        className="relative overflow-hidden rounded-2xl border border-studio-lavande/50 bg-white shadow-sm"
        style={{ width: size.width * scale, height: size.height * scale }}
      >
        <div style={{ width: size.width, height: size.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {iframe}
        </div>
        {overlays}
      </div>
    </figure>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex shrink-0 items-center gap-2">
      {/* Shown only where the bar has room for it: every value already says
          what it is ("Toute la page", "Mariage presque vide", "Vue mobile"). */}
      <span className="sr-only font-body text-[11px] uppercase tracking-luxe text-studio-violet/60 2xl:not-sr-only">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 rounded-full border border-studio-lavande bg-white pl-3 pr-8 font-body text-sm text-studio-violet focus:outline-none focus:ring-2 focus:ring-studio-violet/30 disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Size available to the frames, measured on the client (null on the server). */
function useAvailableSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export function ThemeAtelier({ themes }: { themes: ThemeOption[] }) {
  const [theme, setTheme] = useState(themes[0]?.id ?? "");
  const [fixture, setFixture] = useState<Fixture>("demo");
  const [locale, setLocale] = useState("fr");
  const [view, setView] = useState<View>("normal");
  const [section, setSection] = useState("all");
  const [isolate, setIsolate] = useState(false);
  const [drawn, setDrawn] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [areaRef, available] = useAvailableSize();

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

  // In a single-theme display, the sections this theme did not draw say so.
  const sectionOptions = [
    { id: "all", label: "Toute la page" },
    ...SECTIONS.map((s) => ({
      id: s.id,
      label: view === "compare" || drawn.length === 0 || drawn.includes(s.id) ? s.label : `${s.label} (absente)`,
    })),
  ];

  const src = demoUrl(theme, locale, fixture);
  const current = themes.find((t) => t.id === theme);
  const isolated = section !== "all" && (view === "compare" || isolate);

  let frames: ReactNode = null;
  if (available) {
    if (view === "normal") {
      frames = (
        <DemoFrame
          src={src}
          size={null}
          section={section}
          isolate={isolate}
          label={current?.name ?? theme}
          reloadKey={reloadKey}
          onSections={onSections}
        />
      );
    } else if (view === "mobile" || view === "tablet") {
      // The device's real width, as tall as the window allows.
      const { width } = DEVICES[view];
      const height = Math.max(480, available.height - 2 * GAP - 24);
      frames = (
        <div className="flex justify-center py-6">
          <DemoFrame
            src={src}
            size={{ width, height }}
            section={section}
            isolate={isolate}
            label={DEVICES[view].label}
            reloadKey={reloadKey}
            onSections={onSections}
          />
        </div>
      );
    } else if (view === "trio") {
      const devices: DeviceId[] = ["mobile", "tablet", "desktop"];
      // One scale for the three, so their sizes stay true to each other; the
      // gaps are not scaled, so they come off the width first.
      const total = devices.reduce((sum, d) => sum + DEVICES[d].width, 0);
      const scale = Math.min(1, (available.width - 2 * GAP - GAP * (devices.length - 1)) / total);
      frames = (
        <div className="flex flex-wrap items-start justify-center p-6" style={{ gap: GAP }}>
          {devices.map((d, index) => (
            <DemoFrame
              key={d}
              src={src}
              size={DEVICES[d]}
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
    } else {
      // The same section across every theme, at phone width.
      const width = available.width - 2 * GAP;
      const columns = Math.max(1, Math.min(themes.length, Math.floor((width + GAP) / (DEVICES.mobile.width * 0.55 + GAP))));
      const scale = Math.min(1, (width - GAP * (columns - 1)) / columns / DEVICES.mobile.width);
      frames = (
        <div className="grid justify-center p-6" style={{ gridTemplateColumns: `repeat(${columns}, max-content)`, gap: GAP }}>
          {themes.map((t) => (
            <DemoFrame
              key={t.id}
              src={demoUrl(t.id, locale, fixture)}
              size={DEVICES.mobile}
              scale={scale}
              section={section}
              isolate={section !== "all"}
              label={t.name}
              reloadKey={reloadKey}
            />
          ))}
        </div>
      );
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-studio-creme">
      <header className="z-30 flex shrink-0 items-center gap-x-4 gap-y-2 overflow-x-auto whitespace-nowrap border-b border-studio-lavande/50 bg-white px-4 py-2.5 shadow-sm">
        <span className="shrink-0 font-heading text-lg text-studio-violet">Atelier</span>
        <Select
          label="Thème"
          value={theme}
          options={themes.map((t) => ({ id: t.id, label: t.name }))}
          onChange={setTheme}
          disabled={view === "compare"}
        />
        <Select label="Section" value={section} options={sectionOptions} onChange={setSection} />
        <Select label="Données" value={fixture} options={FIXTURES} onChange={setFixture} />
        <Select label="Langue" value={locale} options={LOCALES} onChange={setLocale} />
        <Select label="Affichage" value={view} options={VIEWS} onChange={setView} />
        <label className="flex shrink-0 items-center gap-2 font-body text-sm text-studio-violet">
          <input
            type="checkbox"
            name="isoler"
            checked={isolated}
            disabled={view === "compare" || section === "all"}
            onChange={(event) => setIsolate(event.target.checked)}
            className="h-4 w-4 accent-studio-violet"
          />
          Isoler
        </label>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            aria-label="Recharger"
            title="Recharger"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-studio-lavande text-studio-violet hover:bg-studio-lavande/20"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          {view !== "compare" ? (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              aria-label={`Ouvrir ${current?.name ?? theme} dans un onglet`}
              title="Ouvrir dans un onglet"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-studio-violet text-white hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </header>

      <div ref={areaRef} className={cn("min-h-0 flex-1", view === "normal" ? "overflow-hidden" : "overflow-auto")}>
        {frames}
      </div>
    </div>
  );
}

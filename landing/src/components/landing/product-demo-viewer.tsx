"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Monitor, Smartphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type DemoTheme = {
  key: string;
  labelKey: string;
  couple: string;
  dotColors: [string, string];
  url: string | null;
};

const DEMO_THEMES: DemoTheme[] = [
  { key: "floral",     labelKey: "Floral",      couple: "Sophie & Thomas",   dotColors: ["#c97a90", "#8b2040"], url: null },
  { key: "royal",      labelKey: "Royal",        couple: "Camille & Antoine", dotColors: ["#c9a96e", "#2d3a6b"], url: null },
  { key: "boho",       labelKey: "Bohème",       couple: "Léa & Hugo",        dotColors: ["#c4a882", "#8b5e3c"], url: null },
  { key: "minimalist", labelKey: "Minimaliste",  couple: "Marie & Julien",    dotColors: ["#999999", "#222222"], url: null },
  { key: "modern",     labelKey: "Modern",       couple: "Clara & Maxime",    dotColors: ["#b07acc", "#4a1570"], url: null },
];

function Placeholder({ couple, theme }: { couple: string; theme: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-secondary/30 px-8">
      <span className="text-4xl opacity-40">💌</span>
      <p className="font-heading text-xl italic text-foreground text-center">{couple}</p>
      <p className="text-xs text-muted-foreground">Thème {theme} — bientôt disponible</p>
    </div>
  );
}

function MobileFrame({ url, couple, theme }: { url: string | null; couple: string; theme: string }) {
  return (
    <div className="flex justify-center">
      <div
        className="relative"
        style={{
          background: "#1c1c1e",
          borderRadius: 44,
          padding: "14px 12px 20px",
          width: 300,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1.5px rgba(0,0,0,0.35), 0 32px 80px rgba(0,0,0,0.28)",
        }}
      >
        {/* Side buttons */}
        <div className="absolute left-[-3px] top-[90px] w-[3px] h-8 rounded-l bg-[#2a2a2c] shadow-[0_38px_0_#2a2a2c,0_76px_0_#2a2a2c]" />
        <div className="absolute right-[-3px] top-[120px] w-[3px] h-[60px] rounded-r bg-[#2a2a2c]" />
        {/* Notch */}
        <div className="w-[88px] h-7 bg-[#1c1c1e] rounded-b-[20px] mx-auto relative z-10 flex items-center justify-center gap-1.5 mb-[-6px]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2a2a2c] border border-[#333]" />
          <div className="w-9 h-1 bg-[#2a2a2c] rounded" />
        </div>
        {/* Screen */}
        <div className="rounded-[32px] overflow-hidden h-[560px] bg-background relative">
          {url ? (
            <iframe src={url} className="w-full h-full border-none block" title={`Démo ${theme}`} />
          ) : (
            <Placeholder couple={couple} theme={theme} />
          )}
        </div>
      </div>
    </div>
  );
}

function DesktopFrame({ url, couple, theme }: { url: string | null; couple: string; theme: string }) {
  const displayUrl = url
    ? `thestudio.wedding${url}`
    : `thestudio.wedding/invitation/demo-${theme.toLowerCase()}`;

  return (
    <div>
      <div
        style={{
          background: "#1c1c1e",
          borderRadius: 12,
          padding: 8,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1.5px rgba(0,0,0,0.4), 0 24px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Menu bar */}
        <div className="h-[22px] bg-[#2a2a2c] rounded-t-[6px] flex items-center px-2.5 gap-1.5 mb-px">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <div className="flex-1 mx-3 bg-[#3a3a3c] rounded h-3.5 flex items-center px-2">
            <span className="text-[8px] text-white/35 font-mono truncate">{displayUrl}</span>
          </div>
        </div>
        {/* Content */}
        <div className="rounded-b-[6px] overflow-hidden h-[480px] bg-background relative border border-[#3a3a3c]">
          {url ? (
            <iframe src={url} className="w-full h-full border-none block" title={`Démo ${theme}`} />
          ) : (
            <Placeholder couple={couple} theme={theme} />
          )}
        </div>
      </div>
      {/* Mac neck + foot */}
      <div
        className="mx-auto"
        style={{
          width: 120,
          height: 18,
          background: "linear-gradient(180deg, #3a3a3c, #2a2a2c)",
          clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
        }}
      />
      <div
        className="mx-auto"
        style={{
          width: 320,
          height: 8,
          background: "linear-gradient(180deg, #3a3a3c, #2a2a2c)",
          borderRadius: "0 0 4px 4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

export function ProductDemoViewer() {
  const t = useTranslations("ProductDemo");
  const [activeTheme, setActiveTheme] = useState(0);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const demo = DEMO_THEMES[activeTheme];

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
          {t("demosEyebrow")}
        </p>
        <h2 className="font-heading text-4xl md:text-5xl font-medium text-foreground leading-tight">
          {t("demosTitleLine1")}{" "}
          <span className="italic text-primary">{t("demosTitleLine2")}</span>
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{t("demosSub")}</p>
      </div>

      {/* Theme selector */}
      <div className="flex gap-2 justify-center flex-wrap mb-7">
        {DEMO_THEMES.map((theme, i) => (
          <button
            key={theme.key}
            onClick={() => setActiveTheme(i)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
              i === activeTheme
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            )}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme.dotColors[0]}, ${theme.dotColors[1]})` }}
            />
            {theme.labelKey}
          </button>
        ))}
      </div>

      {/* Device toggle */}
      <div className="flex justify-center mb-7">
        <div className="inline-flex bg-card border border-border rounded-full p-1 gap-0.5 shadow-sm">
          <button
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              device === "mobile"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            {t("deviceMobile")}
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              device === "desktop"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            {t("deviceDesktop")}
          </button>
        </div>
      </div>

      {/* Device frame */}
      {device === "mobile" ? (
        <MobileFrame url={demo.url} couple={demo.couple} theme={demo.labelKey} />
      ) : (
        <DesktopFrame url={demo.url} couple={demo.couple} theme={demo.labelKey} />
      )}

      {/* Open fullscreen — only shown when url is not null */}
      {demo.url && (
        <div className="flex justify-center mt-5">
          <a
            href={demo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 text-primary text-sm font-medium bg-card hover:bg-primary/5 transition-colors shadow-sm"
          >
            {t("openFullscreen")}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

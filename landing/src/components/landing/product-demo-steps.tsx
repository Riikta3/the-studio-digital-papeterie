import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { emoji: "✉️", titleKey: "step1Title", descKey: "step1Desc" },
  { emoji: "💌", titleKey: "step2Title", descKey: "step2Desc" },
  { emoji: "📋", titleKey: "step3Title", descKey: "step3Desc" },
  { emoji: "🖼️", titleKey: "step4Title", descKey: "step4Desc" },
  { emoji: "💬", titleKey: "step5Title", descKey: "step5Desc" },
] as const;

export async function ProductDemoSteps() {
  const t = await getTranslations("ProductDemo");

  return (
    <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-start max-w-4xl mx-auto">
      {/* Left — sticky header */}
      <div className="flex-1 md:sticky md:top-24">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
          {t("eyebrow")}
        </p>
        <h2 className="font-heading text-4xl md:text-5xl font-medium text-foreground leading-tight mb-4">
          {t("titleLine1")}{" "}
          <span className="italic text-primary">{t("titleLine2")}</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8 max-w-xs">
          {t("subtitle")}
        </p>
        <Link
          href="/studio/start"
          className="inline-flex items-center gap-3 rounded-full bg-primary px-8 py-3.5 font-heading text-base font-semibold italic text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
        >
          {t("createButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Right — steps list */}
      <div className="flex-1 flex flex-col">
        {STEPS.map(({ emoji, titleKey, descKey }, i) => (
          <div key={i} className="flex gap-4 px-3 py-4 relative">
            {/* Vertical connector */}
            {i < STEPS.length - 1 && (
              <div className="absolute left-[22px] top-14 bottom-[-8px] w-px bg-gradient-to-b from-border to-transparent" />
            )}
            {/* Icon */}
            <div className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-base flex-shrink-0 relative z-10 shadow-sm">
              {emoji}
            </div>
            {/* Text */}
            <div className="pt-1">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                {t(titleKey)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

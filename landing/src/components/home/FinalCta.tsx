"use client";

import { Button } from "@shared/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { FadeIn } from "./FadeIn";

export function FinalCta() {
  const t = useTranslations("FinalCta");

  return (
    <div className="px-6 py-20 text-center md:px-12">
      <FadeIn>
        <h2 className="mx-auto max-w-xl font-heading text-h1 text-white">
          {t("titleLine1")}
          <br />
          <span className="text-studio-jaune">{t("titleAccent")}</span>
        </h2>

        <div className="mt-8 flex justify-center">
          <Button variant="studio-jaune" size="pill">
            {t("createButton")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </FadeIn>
    </div>
  );
}

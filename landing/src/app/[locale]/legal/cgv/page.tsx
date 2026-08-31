import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.Cgv");
  return { title: t("metaTitle") };
}

export default async function CgvPage() {
  const t = await getTranslations("Legal.Cgv");

  return (
    <LegalPageLayout
      title={t("title")}
      sections={t.raw("sections")}
    />
  );
}

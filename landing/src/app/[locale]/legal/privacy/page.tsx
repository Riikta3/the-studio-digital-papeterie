import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildLegalMetadata } from "@/lib/legal-metadata";

import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLegalMetadata({ locale, namespace: "Legal.Privacy", path: "/legal/privacy" });
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal.Privacy");

  return (
    <LegalPageLayout
      title={t("title")}
      sections={t.raw("sections")}
    />
  );
}

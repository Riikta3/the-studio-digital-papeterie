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
  return buildLegalMetadata({ locale, namespace: "Legal.Cgv", path: "/legal/cgv" });
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

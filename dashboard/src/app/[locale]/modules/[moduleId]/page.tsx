import { getModuleConfig } from "@/actions/module-config-actions";
import { Link } from "@/navigation";
import { APP_MODULES } from "@shared/data/modules";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { ModuleConfigForm } from "./ModuleConfigForm";

// Modules that have no configurable fields
const NON_CONFIGURABLE = ["countdown", "guestbook", "gallery", "video-guestbook"];

export default async function ModuleConfigPage({
  params,
}: {
  params: Promise<{ moduleId: string; locale: string }>;
}) {
  const { moduleId, locale } = await params;
  const t = await getTranslations("Modules");

  const moduleInfo = APP_MODULES.find((m) => m.id === moduleId);
  if (!moduleInfo) notFound();

  const result = await getModuleConfig(moduleId);
  if (!result) redirect(`/${locale}/login`);

  const { config, enabledModules } = result;

  // Must be an enabled module
  if (!enabledModules.includes(moduleId)) notFound();

  // Redirect non-configurable modules back
  if (NON_CONFIGURABLE.includes(moduleId)) {
    redirect(`/${locale}/modules`);
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/modules"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          {t("back")}
        </Link>
        <h1 className="font-heading text-4xl md:text-5xl italic text-foreground mb-2">
          {moduleInfo.name}
        </h1>
        <p className="text-muted-foreground text-sm">{moduleInfo.description}</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <ModuleConfigForm moduleId={moduleId} initialConfig={config} />
      </div>
    </div>
  );
}

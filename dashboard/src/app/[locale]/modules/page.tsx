import { getOrderedModules } from "@/actions/module-order-actions";
import { LockedModulesList } from "@/components/modules/LockedModuleCard";
import { SortableModulesList } from "@/components/modules/SortableModulesList";
import { getModulesWithLabels } from "@shared/data/modules";
import { getTranslations } from "next-intl/server";

export default async function ModulesPage() {
  const t = await getTranslations("Modules");

  const HIDDEN_FROM_CONFIG = ["countdown"];

  const orderedIds = await getOrderedModules();
  const enabledIds = orderedIds.filter((id) => !HIDDEN_FROM_CONFIG.includes(id));
  const modulesWithLabels = getModulesWithLabels(t);
  const lockedModules = modulesWithLabels.filter(
    (m) => !orderedIds.includes(m.id) && !HIDDEN_FROM_CONFIG.includes(m.id),
  );

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="font-heading text-h1 italic text-studio-violet mb-2">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {/* Activated modules — drag & drop */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t("active_section")}
          </h2>
          {enabledIds.length > 1 && (
            <span className="text-xs text-muted-foreground/60">{t("reorder_hint")}</span>
          )}
        </div>
        {enabledIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_modules")}</p>
        ) : (
          <SortableModulesList initialIds={enabledIds} />
        )}
      </div>

      {/* Locked / non-purchased modules */}
      {lockedModules.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t("locked_section")}
            </h2>
            <span className="text-xs text-muted-foreground">{t("module_price")}</span>
          </div>
          <LockedModulesList
            modules={lockedModules.map((m) => ({
              id: m.id,
              name: m.name,
              description: m.description,
            }))}
          />
        </div>
      )}
    </div>
  );
}

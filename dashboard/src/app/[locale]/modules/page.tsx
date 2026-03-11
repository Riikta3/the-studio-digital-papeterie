import { getEnabledModules } from "@/actions/module-config-actions";
import { LockedModulesList } from "@/components/modules/LockedModuleCard";
import { Link } from "@/navigation";
import { APP_MODULES } from "@shared/data/modules";
import { ChevronRight, Settings2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ModulesPage() {
  const t = await getTranslations("Modules");
  const enabledIds = await getEnabledModules();

  // Modules hidden entirely from the config list
  const HIDDEN_FROM_CONFIG = ["countdown"];
  // Modules without configurable fields (shown as non-clickable)
  const NON_CONFIGURABLE = ["guestbook", "video-guestbook"];

  const enabledModules = APP_MODULES.filter((m) => enabledIds.includes(m.id) && !HIDDEN_FROM_CONFIG.includes(m.id));
  const lockedModules = APP_MODULES.filter((m) => !enabledIds.includes(m.id) && !HIDDEN_FROM_CONFIG.includes(m.id));

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="font-heading text-4xl md:text-5xl italic text-foreground mb-2">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {/* Activated modules */}
      <div className="space-y-3 mb-12">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          {t("active_section")}
        </h2>
        {enabledModules.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("no_modules")}</p>
        )}
        {enabledModules.map((module) => {
          const Icon = module.icon;
          const configurable = !NON_CONFIGURABLE.includes(module.id);
          return (
            <div key={module.id}>
              {configurable ? (
                <Link
                  href={`/modules/${module.id}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-primary shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{module.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border opacity-60">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-primary shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{module.name}</p>
                    <p className="text-xs text-muted-foreground">{t("auto_configured")}</p>
                  </div>
                  <Settings2 size={16} className="text-muted-foreground shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Locked / non-purchased modules */}
      {lockedModules.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t("locked_section")}
            </h2>
            <span className="text-xs text-muted-foreground">
              {t("module_price")}
            </span>
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

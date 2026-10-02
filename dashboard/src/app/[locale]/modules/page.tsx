import { getOrderedModules } from "@/actions/module-order-actions";
import { formatEuros } from "@/components/editor/format-euros";
import { AddableModulesList } from "@/components/modules/AddableModulesList";
import { SortableModulesList } from "@/components/modules/SortableModulesList";
import { getModuleShop } from "@/lib/db/module-shop";
import { addableModules } from "@shared/lib/addable-modules";
import { EXTRA_MODULE_PRICE, addOnQuote } from "@shared/lib/pricing";
import { getLocale, getTranslations } from "next-intl/server";

export default async function ModulesPage() {
  const [t, locale, orderedIds, shop] = await Promise.all([
    getTranslations("Modules"),
    getLocale(),
    getOrderedModules(),
    getModuleShop(),
  ]);

  const HIDDEN_FROM_CONFIG = ["countdown"];
  const enabledIds = orderedIds.filter((id) => !HIDDEN_FROM_CONFIG.includes(id));

  // The editor's own menu, as a list: the theme's modules the couple lacks.
  const addable = addableModules(shop.themeId, shop.owned, shop.pending);
  const nextIsPaid = addOnQuote(shop.planId, shop.owned.length + shop.pending.length, 1).billable > 0;
  const price = formatEuros(EXTRA_MODULE_PRICE * 100, locale);

  return (
    <div className="min-h-screen bg-studio-creme p-6 md:p-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="font-heading text-h1 italic text-studio-violet mb-2">{t("title")}</h1>
        <p className="text-studio-violet/70 text-sm">{t("subtitle")}</p>
      </div>

      {/* Activated modules — drag & drop */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-studio-violet/60">
            {t("active_section")}
          </h2>
          {enabledIds.length > 1 && (
            <span className="text-xs text-studio-violet/50">{t("reorder_hint")}</span>
          )}
        </div>
        {enabledIds.length === 0 ? (
          <p className="text-sm text-studio-violet/60">{t("no_modules")}</p>
        ) : (
          <SortableModulesList initialIds={enabledIds} />
        )}
      </div>

      {(addable.length > 0 || shop.pending.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-studio-violet/60">
              {t("locked_section")}
            </h2>
            <span className="text-xs text-studio-violet/60">
              {nextIsPaid ? t("price_each", { price }) : t("all_included")}
            </span>
          </div>
          <p className="mb-4 text-xs text-studio-violet/60">{t("add_hint")}</p>
          <AddableModulesList
            addable={addable}
            pending={shop.pending}
            priceLabel={nextIsPaid ? price : t("price_included")}
          />
        </div>
      )}
    </div>
  );
}

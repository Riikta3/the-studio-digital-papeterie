import { APP_MODULES, getModuleDescription, getModuleName } from "@shared/data/modules";
import { cn } from "@shared/lib/utils";
import { ArrowRight, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/navigation";

/**
 * The modules a couple can still add, and those saved but unpaid. Each opens
 * the editor — with the module added, or on its tab — where it is filled in,
 * previewed and paid for on save (spec D11).
 */
export async function AddableModulesList({
  addable,
  pending,
  priceLabel,
}: {
  addable: string[];
  pending: string[];
  priceLabel: string;
}) {
  const t = await getTranslations("Modules");

  const row = (id: string, href: string, badge: string, cta: string, due: boolean) => {
    const Icon = APP_MODULES.find((module) => module.id === id)?.icon;
    const Arrow = due ? ArrowRight : Plus;
    return (
      <Link
        key={id}
        href={href}
        className="group flex items-center gap-4 rounded-xl border border-dashed border-studio-lavande/50 bg-white p-4 transition-all hover:border-studio-violet/40 hover:shadow-sm"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-studio-lavande/20 text-studio-violet/70 transition-colors group-hover:text-studio-violet">
          {Icon ? <Icon size={18} aria-hidden="true" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-studio-violet">{getModuleName(t, id)}</span>
          <span className="block truncate text-xs text-studio-violet/60">{getModuleDescription(t, id)}</span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
            due ? "bg-amber-100 text-amber-800" : "bg-studio-card-selected text-studio-violet-clair",
          )}
        >
          {badge}
        </span>
        <span className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-studio-violet sm:inline-flex">
          <Arrow className="h-3.5 w-3.5" aria-hidden="true" />
          {cta}
        </span>
      </Link>
    );
  };

  return (
    <div className="space-y-3">
      {pending.map((id) => row(id, `/invitation?section=${id}`, t("unpaid_badge"), t("open_cta"), true))}
      {addable.map((id) => row(id, `/invitation?add=${id}`, priceLabel, t("add_cta"), false))}
    </div>
  );
}

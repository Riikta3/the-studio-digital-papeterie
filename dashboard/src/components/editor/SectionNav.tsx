"use client";

import type { EditorSectionId } from "@shared/data/invitation-sections";
import { EXTRA_MODULE_PRICE } from "@shared/lib/pricing";
import { cn } from "@shared/lib/utils";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronsUpDown, EyeOff, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { AddModuleRailButton, AddModuleSheet, AddModuleTrigger, useAddModuleChoices } from "./AddModuleMenu";
import { BottomSheet } from "./BottomSheet";
import { useEditor } from "./EditorProvider";
import { formatEuros } from "./format-euros";
import { groupSections, sectionBadge, stepSection } from "./section-nav";
import { SECTION_META, sectionErrors } from "./sections/registry";

/**
 * The summary of the invitation — variant B of the 2026-10-02 mock-up, chosen
 * for laptop and phone alike. Every section is listed with where it stands,
 * « Ajouter un module » sits under them: a column beside the form on a laptop
 * (`SectionRail`), a switcher that opens the same list as a sheet on a phone
 * (`SectionSwitcher`). It replaced a strip of tabs the couples did not see.
 */

type RowRefs = React.RefObject<Map<EditorSectionId, HTMLButtonElement>>;

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-studio-violet/50">
      {children}
    </p>
  );
}

function SectionRow({
  section,
  layout,
  onSelect,
  rowRefs,
}: {
  section: EditorSectionId;
  /** Which list the row is in, so the selection bar slides within it. */
  layout: "rail" | "sheet";
  onSelect: (section: EditorSectionId) => void;
  rowRefs?: RowRefs;
}) {
  const t = useTranslations("Editor");
  const locale = useLocale();
  const { activeSection, dirtySections, errors, preview, statusOf, unpaid } = useEditor();

  const Icon = SECTION_META[section].icon;
  const selected = section === activeSection;
  const edited = dirtySections.has(section);
  const failed = sectionErrors(section, errors, edited).length > 0;
  const hidden = preview.ready && !preview.sections.includes(section);
  const badge = sectionBadge(statusOf(section), unpaid.billable.includes(section));

  return (
    <button
      ref={(node) => {
        if (!rowRefs) return;
        if (node) rowRefs.current.set(section, node);
        else rowRefs.current.delete(section);
      }}
      type="button"
      aria-current={selected ? "true" : undefined}
      onClick={() => onSelect(section)}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-start text-sm font-semibold text-studio-violet transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-violet-clair/60",
        selected ? "bg-studio-card-selected" : "hover:bg-studio-card-bg",
      )}
    >
      {selected ? (
        <motion.span
          layoutId={`summary-selection-${layout}`}
          className="absolute inset-y-2 -start-2.5 w-1 rounded-e bg-studio-violet"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      ) : null}
      <span
        className={cn(
          "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl transition-colors",
          selected ? "bg-studio-violet text-white" : "bg-studio-card-selected text-studio-violet-clair",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{t(`sections.${section}.label`)}</span>

      {badge ? (
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none",
            badge === "due"
              ? "bg-amber-100 text-amber-800"
              : badge === "price"
                ? "bg-studio-card-selected text-studio-violet-clair"
                : "bg-emerald-50 text-emerald-700",
          )}
        >
          {badge === "due"
            ? t("moduleStatus.badgeDue")
            : badge === "price"
              ? formatEuros(EXTRA_MODULE_PRICE * 100, locale)
              : t("addModule.included")}
        </span>
      ) : null}
      {hidden ? (
        <EyeOff className="h-3.5 w-3.5 shrink-0 text-studio-violet/40" aria-label={t("tabs.hidden")} />
      ) : null}
      {failed ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label={t("tabs.error")} />
      ) : edited ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-label={t("tabs.unsaved")} />
      ) : null}
    </button>
  );
}

/** The three groups: the hero, the modules in the theme's order, the footer. */
function SectionList({
  layout,
  onSelect,
  rowRefs,
}: {
  layout: "rail" | "sheet";
  onSelect: (section: EditorSectionId) => void;
  rowRefs?: RowRefs;
}) {
  const t = useTranslations("Editor");
  const { sections } = useEditor();
  const groups = groupSections(sections);
  const row = (section: EditorSectionId) => (
    <SectionRow key={section} section={section} layout={layout} onSelect={onSelect} rowRefs={rowRefs} />
  );

  return (
    <div className="flex flex-col gap-0.5">
      <GroupLabel>{t("tabs.groupIntro")}</GroupLabel>
      {groups.intro.map(row)}
      {groups.modules.length > 0 ? (
        <GroupLabel>{t("tabs.groupModules", { count: groups.modules.length })}</GroupLabel>
      ) : null}
      {groups.modules.map(row)}
      <GroupLabel>{t("tabs.groupOutro")}</GroupLabel>
      {groups.outro.map(row)}
    </div>
  );
}

/** Laptop: the summary as a column beside the form. */
export function SectionRail() {
  const t = useTranslations("Editor");
  const { sections, activeSection, setActiveSection } = useEditor();
  const rowRefs = useRef(new Map<EditorSectionId, HTMLButtonElement>());

  // Keep the open section in view — it can change from the preview, too.
  useEffect(() => {
    rowRefs.current.get(activeSection)?.scrollIntoView({ block: "nearest" });
  }, [activeSection]);

  // Up/Down walk the list, Home/End jump to its ends — as the tabs did.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = sections.indexOf(activeSection);
    const target =
      event.key === "ArrowDown"
        ? sections[Math.min(index + 1, sections.length - 1)]
        : event.key === "ArrowUp"
          ? sections[Math.max(index - 1, 0)]
          : event.key === "Home"
            ? sections[0]
            : event.key === "End"
              ? sections[sections.length - 1]
              : null;
    if (!target) return;
    event.preventDefault();
    setActiveSection(target);
    rowRefs.current.get(target)?.focus();
  };

  return (
    <nav
      aria-label={t("tabs.label")}
      className="hidden min-h-0 shrink-0 flex-col border-e border-studio-lavande/40 bg-white lg:flex lg:w-[232px] xl:w-[260px]"
    >
      <div className="px-4 pb-1 pt-5">
        <p className="font-heading text-xl leading-tight text-studio-violet">{t("tabs.title")}</p>
        <p className="mt-1 text-xs leading-snug text-studio-violet/60">{t("tabs.summary", { count: sections.length })}</p>
      </div>
      <div onKeyDown={onKeyDown} className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        <SectionList layout="rail" onSelect={setActiveSection} rowRefs={rowRefs} />
      </div>
      <AddModuleRailButton />
    </nav>
  );
}

function StepButton({
  icon: Icon,
  label,
  target,
}: {
  icon: LucideIcon;
  label: string;
  target: EditorSectionId | null;
}) {
  const { setActiveSection } = useEditor();
  return (
    <button
      type="button"
      onClick={() => (target ? setActiveSection(target) : undefined)}
      disabled={!target}
      aria-label={label}
      className="flex h-12 w-11 shrink-0 items-center justify-center rounded-2xl border border-studio-lavande/70 bg-white text-studio-violet transition-opacity disabled:opacity-35"
    >
      <Icon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
    </button>
  );
}

/**
 * Phone: no room for a list beside the form, so the open section with its
 * place in the invitation, arrows to the next one, and the whole summary as a
 * sheet — « Ajouter un module » at its foot.
 */
export function SectionSwitcher() {
  const t = useTranslations("Editor");
  const { sections, activeSection, setActiveSection } = useEditor();
  const { choices } = useAddModuleChoices();
  const [listOpen, setListOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const closeList = useCallback(() => setListOpen(false), []);

  const Icon = SECTION_META[activeSection].icon;
  const label = t(`sections.${activeSection}.label`);
  const index = sections.indexOf(activeSection);

  return (
    <div className="flex items-center gap-2 border-t border-studio-lavande/30 px-3 pb-3 pt-2.5 lg:hidden">
      <StepButton icon={ChevronLeft} label={t("tabs.previous")} target={stepSection(sections, activeSection, -1)} />

      <button
        type="button"
        onClick={() => setListOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={listOpen}
        aria-label={t("tabs.open", { section: label })}
        className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-studio-violet bg-white px-3 text-start shadow-[0_6px_16px_rgba(75,63,114,0.12)]"
      >
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-studio-violet text-white">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold leading-tight text-studio-violet">{label}</span>
          <span className="block truncate text-[11.5px] text-studio-violet/60">
            {t("tabs.position", { index: index + 1, total: sections.length })}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-studio-violet/70" aria-hidden="true" />
      </button>

      <StepButton icon={ChevronRight} label={t("tabs.next")} target={stepSection(sections, activeSection, 1)} />

      <BottomSheet open={listOpen} onClose={closeList} label={t("tabs.title")}>
        <div className="flex max-h-[78dvh] flex-col">
          <div className="border-b border-studio-lavande/40 px-5 pb-3 pt-4">
            <p className="font-heading text-xl text-studio-violet">{t("tabs.title")}</p>
            <p className="mt-1 text-xs text-studio-violet/60">{t("tabs.summary", { count: sections.length })}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
            <SectionList
              layout="sheet"
              onSelect={(section) => {
                setListOpen(false);
                setActiveSection(section);
              }}
            />
          </div>
          {choices.length > 0 ? (
            <div className="border-t border-studio-lavande/40 p-3">
              <AddModuleTrigger
                count={choices.length}
                onClick={() => {
                  setListOpen(false);
                  setAddOpen(true);
                }}
              />
            </div>
          ) : null}
        </div>
      </BottomSheet>
      <AddModuleSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

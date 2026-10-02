"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";

type Props<T extends { id: string }> = {
  items: T[];
  onChange: (items: T[]) => void;
  /** The body of one row, open. */
  renderItem: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  /** The row's one-line summary when closed ("Cérémonie · 16 h 00"). */
  summary: (item: T, index: number) => string;
  /** Without it there is no add button — the caller offers its own. */
  createItem?: () => T;
  addLabel?: string;
  emptyLabel: string;
  max?: number;
  /** Whether deleting this row loses something worth a second click. */
  hasContent?: (item: T) => boolean;
  /** Rows that must stay (the ceremony, say) get no delete button. */
  canRemove?: (item: T) => boolean;
};

/**
 * A list the couple builds: add, reorder by dragging (or with the keyboard),
 * open one row to edit it, delete.
 *
 * Rows fold to a one-line summary so a FAQ of fifteen questions stays a list
 * you can scan and reorder, and a new row opens itself so the couple types
 * straight into it. Deleting a row that holds anything asks for a second click
 * rather than a dialog.
 */
export function ListEditor<T extends { id: string }>({
  items,
  onChange,
  renderItem,
  summary,
  createItem,
  addLabel,
  emptyLabel,
  max,
  hasContent = () => true,
  canRemove = () => true,
}: Props<T>) {
  const t = useTranslations("Editor.list");
  const [openId, setOpenId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from !== -1 && to !== -1) onChange(arrayMove(items, from, to));
  };

  const add = () => {
    if (!createItem) return;
    const item = createItem();
    onChange([...items, item]);
    setOpenId(item.id);
  };

  const full = max !== undefined && items.length >= max;

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-studio-lavande/60 px-4 py-5 text-center text-sm text-studio-violet/55">
          {emptyLabel}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {items.map((item, index) => (
                  <SortableRow
                    key={item.id}
                    id={item.id}
                    label={
                      summary(item, index) ||
                      t("untitled", { index: index + 1 })
                    }
                    open={openId === item.id}
                    onToggle={() =>
                      setOpenId(openId === item.id ? null : item.id)
                    }
                    onRemove={
                      canRemove(item)
                        ? () =>
                            onChange(items.filter((row) => row.id !== item.id))
                        : undefined
                    }
                    confirmRemove={hasContent(item)}
                  >
                    {renderItem(item, (patch) =>
                      onChange(
                        items.map((row) =>
                          row.id === item.id ? { ...row, ...patch } : row,
                        ),
                      ),
                    )}
                  </SortableRow>
                ))}
              </AnimatePresence>
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {createItem ? (
        <button
          type="button"
          onClick={add}
          disabled={full}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-studio-lavande/60 text-sm font-medium text-studio-violet/70 transition-colors hover:border-studio-violet/40 hover:bg-studio-card-bg hover:text-studio-violet disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {full ? t("full", { max: max ?? 0 }) : addLabel}
        </button>
      ) : null}
    </div>
  );
}

function SortableRow({
  id,
  label,
  open,
  onToggle,
  onRemove,
  confirmRemove,
  children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  confirmRemove: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Editor.list");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const [armed, setArmed] = useState(false);

  // The second click has to come soon after the first, or the row disarms.
  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  const remove = () => {
    if (!onRemove) return;
    if (confirmRemove && !armed) setArmed(true);
    else onRemove();
  };

  return (
    <motion.li
      ref={setNodeRef}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.18 }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "overflow-hidden rounded-xl border bg-white",
        isDragging
          ? "z-10 border-studio-violet-clair shadow-studio-card"
          : "border-studio-lavande/50",
      )}
    >
      <div className="flex items-center gap-1 pr-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={t("reorder", { label })}
          className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center text-studio-violet/35 hover:text-studio-violet/70 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-studio-violet"
        >
          <span className="truncate">{label}</span>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 shrink-0 text-studio-violet/40 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {onRemove ? (
          <button
            type="button"
            onClick={remove}
            aria-label={
              armed ? t("confirmRemove", { label }) : t("remove", { label })
            }
            className={cn(
              "flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors",
              armed
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-studio-violet/40 hover:bg-red-50 hover:text-red-500",
            )}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {armed ? <span>{t("confirmShort")}</span> : null}
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4 border-t border-studio-lavande/30 p-4">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

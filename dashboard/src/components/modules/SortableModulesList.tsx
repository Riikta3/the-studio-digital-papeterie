"use client";

import { updateModulesOrder } from "@/actions/module-order-actions";
import { Link } from "@/navigation";
import { APP_MODULES, getModuleDescription, getModuleName } from "@shared/data/modules";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const NON_CONFIGURABLE = ["guestbook", "video-guestbook"];

interface SortableModuleItemProps {
  id: string;
  t: ReturnType<typeof useTranslations>;
}

function SortableModuleItem({ id, t }: SortableModuleItemProps) {
  const module = APP_MODULES.find((m) => m.id === id);
  if (!module) return null;

  const Icon = module.icon;
  const configurable = !NON_CONFIGURABLE.includes(id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white rounded-xl border transition-all ${
        isDragging
          ? "border-primary/40 shadow-lg opacity-90"
          : "border-border"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="pl-3 py-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing touch-none"
        tabIndex={-1}
        aria-label={t("reorder")}
      >
        <GripVertical size={16} />
      </button>

      {/* Module content — linked or static */}
      {configurable ? (
        <Link
          href={`/modules/${id}`}
          className="flex items-center gap-3 flex-1 min-w-0 pr-4 py-4 hover:text-primary group"
        >
          <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-primary shrink-0">
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">{getModuleName(t, id)}</p>
            <p className="text-xs text-muted-foreground truncate">{getModuleDescription(t, id)}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </Link>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4 py-4 opacity-60">
          <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-primary shrink-0">
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">{getModuleName(t, id)}</p>
            <p className="text-xs text-muted-foreground">{t("auto_configured")}</p>
          </div>
          <Settings2 size={14} className="text-muted-foreground shrink-0" />
        </div>
      )}
    </div>
  );
}

interface SortableModulesListProps {
  initialIds: string[];
}

export function SortableModulesList({ initialIds }: SortableModulesListProps) {
  const [ids, setIds] = useState(initialIds);
  const t = useTranslations("Modules");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const newIds = arrayMove(ids, oldIndex, newIndex);

    // Optimistic update
    setIds(newIds);

    // Persist in background
    try {
      await updateModulesOrder(newIds);
      toast.success(t("order_saved"));
    } catch {
      setIds(ids);
      toast.error(t("order_save_error"));
    }
  };

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {ids.map((id) => (
              <SortableModuleItem key={id} id={id} t={t} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

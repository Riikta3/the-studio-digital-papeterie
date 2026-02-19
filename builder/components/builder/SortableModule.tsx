import { useBuilderStore } from "@/lib/store";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import React from "react";

interface SortableModuleProps {
  id: string;
  isSelected?: boolean;
  children: React.ReactNode;
}

export const SortableModule = ({
  id,
  isSelected,
  children,
}: SortableModuleProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const selectModule = useBuilderStore((state) => state.selectModule);
  const removeModule = useBuilderStore((state) => state.removeModule);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isSelected ? "ring-2 ring-blue-500 z-10" : "hover:ring-1 hover:ring-blue-300"}`}
      onClick={(e) => {
        e.stopPropagation();
        selectModule(id);
      }}
    >
      {/* Action Bar (Visible on Hover or Selected) */}
      <div
        className={`absolute top-2 right-2 flex items-center gap-1 bg-white shadow-sm rounded-md p-1 z-20 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className='cursor-grab p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600'
        >
          <GripVertical size={16} />
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeModule(id);
          }}
          className='p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500'
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* The Module Content */}
      <div className='pointer-events-none'>{children}</div>

      {/* Overlay to prevent interaction with module internal links/buttons during edit mode */}
      <div className='absolute inset-0 z-0' />
    </div>
  );
};

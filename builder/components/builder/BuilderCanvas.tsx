"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React from "react";

import { useBuilderStore } from "@/lib/store";
import { HeroModule } from "../modules/HeroModule";
import { TextModule } from "../modules/TextModule";
import { SortableModule } from "./SortableModule";

const RENDERERS: Record<string, React.ComponentType<any>> = {
  hero: HeroModule,
  text: TextModule,
};

export const BuilderCanvas = () => {
  const project = useBuilderStore((state) => state.project);
  const moveModule = useBuilderStore((state) => state.moveModule);
  const selectModule = useBuilderStore((state) => state.selectModule);
  const selectedModuleId = useBuilderStore((state) => state.selectedModuleId);
  const setDragging = useBuilderStore((state) => state.setDragging);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = () => {
    setDragging(true);
    selectModule(null); // Deselect while dragging
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragging(false);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      moveModule(active.id as string, over.id as string);
    }
  };

  return (
    <div
      className='flex-1 bg-gray-100 overflow-y-auto h-full flex justify-center p-8'
      onClick={() => selectModule(null)} // Deselect when clicking background
    >
      <div className='w-full max-w-4xl bg-white min-h-[800px] shadow-lg transition-all duration-300 transform origin-top'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={project.modules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {project.modules.length === 0 ? (
              <div className='h-full flex flex-col items-center justify-center text-gray-400 p-12 border-2 border-dashed border-gray-200 m-4 rounded-xl'>
                <p>Drag modules here from the sidebar</p>
              </div>
            ) : (
              <div className='flex flex-col'>
                {project.modules.map((module) => {
                  const Component = RENDERERS[module.type];
                  if (!Component) return null;

                  return (
                    <SortableModule
                      key={module.id}
                      id={module.id}
                      isSelected={selectedModuleId === module.id}
                    >
                      <Component
                        content={module.content}
                        id={module.id}
                      />
                    </SortableModule>
                  );
                })}
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

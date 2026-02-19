"use client";

import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import { ModuleSidebar } from "@/components/builder/ModuleSidebar";
import { PropertiesPanel } from "@/components/builder/PropertiesPanel";
import { PublishModal } from "@/components/builder/PublishModal";
import { useBuilderStore } from "@/lib/store";
import { useEffect, useState } from "react";

export default function BuilderPage() {
  const loadProject = useBuilderStore((state) => state.loadProject);
  const isLoading = useBuilderStore((state) => state.isLoading);
  const project = useBuilderStore((state) => state.project);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (isLoading || !project) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-50'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-black'></div>
      </div>
    );
  }

  const handlePublish = () => {
    // Here we would save to DB and redirect
    console.log("Project Published!");
    setIsPublishModalOpen(false);
    alert("Website Published Successfully! (Mock)");
  };

  return (
    <div className='flex h-screen w-full bg-gray-50 overflow-hidden'>
      {/* Left Sidebar: Module Library */}
      <ModuleSidebar />

      {/* Center: Canvas (The specific styling is handled inside BuilderCanvas) */}
      <div className='flex-1 flex flex-col relative h-full'>
        {/* Top Bar */}
        <header className='h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10'>
          <div className='flex items-center gap-2'>
            <span className='font-bold text-lg tracking-tight'>The Studio</span>
            <span className='text-gray-300'>/</span>
            <span className='text-sm text-gray-600'>My Wedding Website</span>
          </div>
          <div className='flex items-center gap-2'>
            <button className='px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium'>
              Preview
            </button>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className='px-4 py-2 text-sm bg-black text-white rounded-full font-medium hover:bg-gray-800'
            >
              Publish
            </button>
          </div>
        </header>

        <BuilderCanvas />
      </div>

      {/* Right Sidebar: Properties */}
      <PropertiesPanel />

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirm={handlePublish}
      />
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { ModuleConfigForm } from "./ModuleConfigForm";
import { ModulePreview } from "./ModulePreview";

// Modules for which no preview is available (non-configurable are already filtered)
const NO_PREVIEW_MODULES: string[] = [];

interface Props {
  moduleId: string;
  initialConfig: Record<string, unknown> | null;
}

export function ModuleConfigWithPreview({ moduleId, initialConfig }: Props) {
  const [previewConfig, setPreviewConfig] = useState<Record<string, unknown>>(
    initialConfig ?? {}
  );

  const handlePreview = useCallback((data: Record<string, unknown>) => {
    setPreviewConfig(data);
  }, []);

  const hasPreview = !NO_PREVIEW_MODULES.includes(moduleId);

  if (!hasPreview) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <ModuleConfigForm moduleId={moduleId} initialConfig={initialConfig} />
      </div>
    );
  }

  return (
    <div className="flex gap-8 items-start">
      {/* Form — left column, fixed width */}
      <div className="w-full xl:w-[480px] shrink-0">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
          <ModuleConfigForm
            moduleId={moduleId}
            initialConfig={initialConfig}
            onPreview={handlePreview}
          />
        </div>
      </div>

      {/* Preview — right column, sticky */}
      <div className="hidden xl:flex flex-col flex-1 min-w-0 sticky top-8" style={{ height: "calc(100vh - 4rem)" }}>
        <ModulePreview moduleId={moduleId} config={previewConfig} />
      </div>
    </div>
  );
}

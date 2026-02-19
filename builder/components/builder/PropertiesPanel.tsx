import { useBuilderStore } from "@/lib/store";
import { X } from "lucide-react";

export const PropertiesPanel = () => {
  const selectedModuleId = useBuilderStore((state) => state.selectedModuleId);
  const project = useBuilderStore((state) => state.project);
  const updateModuleContent = useBuilderStore(
    (state) => state.updateModuleContent,
  );
  const selectModule = useBuilderStore((state) => state.selectModule);

  const selectedModule = project.modules.find((m) => m.id === selectedModuleId);

  if (!selectedModule) {
    return (
      <div className='w-80 bg-white border-l border-gray-200 h-screen p-6 md:flex hidden flex-col items-center justify-center text-center text-gray-400'>
        <p>Select a module on the canvas to edit its properties.</p>
      </div>
    );
  }

  const handleInputChange = (key: string, value: any) => {
    updateModuleContent(selectedModule.id, { [key]: value });
  };

  return (
    <div className='w-80 bg-white border-l border-gray-200 h-screen flex flex-col shadow-xl z-20'>
      <div className='flex items-center justify-between p-4 border-b border-gray-100'>
        <div>
          <h2 className='font-semibold text-gray-800 capitalize'>
            {selectedModule.type} Settings
          </h2>
          <p className='text-xs text-gray-500'>
            ID: {selectedModule.id.slice(0, 8)}...
          </p>
        </div>
        <button
          onClick={() => selectModule(null)}
          className='text-gray-400 hover:text-gray-600'
        >
          <X size={20} />
        </button>
      </div>

      <div className='flex-1 overflow-y-auto p-4 space-y-6'>
        {/* Dynamic Fields based on Module Type */}
        {selectedModule.type === "hero" && (
          <>
            <div>
              <label className='block text-xs font-semibold text-gray-700 mb-1'>
                Title
              </label>
              <input
                type='text'
                value={selectedModule.content.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder='Couple Names'
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-xs font-semibold text-gray-700 mb-1'>
                Subtitle
              </label>
              <input
                type='text'
                value={selectedModule.content.subtitle || ""}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                placeholder='Are getting married'
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-xs font-semibold text-gray-700 mb-1'>
                Date
              </label>
              <input
                type='text'
                value={selectedModule.content.date || ""}
                onChange={(e) => handleInputChange("date", e.target.value)}
                placeholder='September 20, 2025'
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </>
        )}

        {selectedModule.type === "text" && (
          <>
            <div>
              <label className='block text-xs font-semibold text-gray-700 mb-1'>
                Heading
              </label>
              <input
                type='text'
                value={selectedModule.content.heading || ""}
                onChange={(e) => handleInputChange("heading", e.target.value)}
                placeholder='Section Heading'
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-xs font-semibold text-gray-700 mb-1'>
                Content
              </label>
              <textarea
                value={selectedModule.content.text || ""}
                onChange={(e) => handleInputChange("text", e.target.value)}
                rows={6}
                placeholder='Write your text here...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </>
        )}

        <div className='pt-4 border-t border-gray-100'>
          <button className='w-full py-2 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-colors'>
            Reset Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

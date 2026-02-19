import { useBuilderStore } from "@/lib/store";
import {
  Calendar,
  Image,
  LayoutTemplate,
  MapPin,
  Smile,
  Type,
} from "lucide-react";

const MODULES = [
  {
    type: "hero",
    label: "Hero Section",
    icon: LayoutTemplate,
    category: "Basics",
  },
  { type: "text", label: "Text Block", icon: Type, category: "Basics" },
  { type: "image-text", label: "Image & Text", icon: Image, category: "Media" },
  { type: "gallery", label: "Gallery", icon: Image, category: "Media" },
  {
    type: "rsvp",
    label: "RSVP Form",
    icon: Calendar,
    category: "Interactive",
    isPremium: true,
  },
  {
    type: "schedule",
    label: "Schedule",
    icon: MapPin,
    category: "Interactive",
  },
  { type: "faq", label: "Q&A", icon: Smile, category: "Basics" },
];

export const ModuleSidebar = () => {
  const addModule = useBuilderStore((state) => state.addModule);

  return (
    <div className='w-80 bg-white border-r border-gray-200 flex flex-col h-screen'>
      <div className='p-4 border-b border-gray-100'>
        <h2 className='font-semibold text-gray-800'>For Your Site</h2>
        <p className='text-xs text-gray-500 mt-1'>Click to add to your page</p>
      </div>

      <div className='flex-1 overflow-y-auto p-4 space-y-6'>
        {/* Categories could be dynamically generated */}
        <div>
          <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3'>
            Basics
          </h3>
          <div className='grid grid-cols-2 gap-3'>
            {MODULES.filter((m) => m.category === "Basics").map((module) => (
              <button
                key={module.type}
                onClick={() => addModule(module.type)}
                className='flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-center'
              >
                <module.icon className='w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-2' />
                <span className='text-sm font-medium text-gray-700'>
                  {module.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3'>
            Interactive
          </h3>
          <div className='grid grid-cols-2 gap-3'>
            {MODULES.filter((m) => m.category === "Interactive").map(
              (module) => (
                <button
                  key={module.type}
                  onClick={() => addModule(module.type)}
                  className='relative flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-center'
                >
                  {module.isPremium && (
                    <span className='absolute top-1 right-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold'>
                      PRO
                    </span>
                  )}
                  <module.icon className='w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-2' />
                  <span className='text-sm font-medium text-gray-700'>
                    {module.label}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import { ModuleProps } from "@/types/builder";

export const TextModule = ({ content, isEditing }: ModuleProps) => {
  return (
    <div className='w-full py-16 px-4 bg-white text-center'>
      <div className='max-w-prose mx-auto'>
        <h2 className='text-3xl font-serif mb-6 text-gray-900'>
          {content.heading || "Our Story"}
        </h2>
        <p className='text-gray-600 leading-relaxed whitespace-pre-wrap'>
          {content.text ||
            "Share your journey with your guests. How you met, the proposal, and what you're looking forward to."}
        </p>
      </div>
    </div>
  );
};

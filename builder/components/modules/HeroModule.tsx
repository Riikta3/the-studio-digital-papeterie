import { ModuleProps } from "@/types/builder";

export const HeroModule = ({ content, isEditing }: ModuleProps) => {
  return (
    <div className='relative h-96 w-full bg-gray-200 flex flex-col items-center justify-center text-center p-8'>
      {content.image && (
        <img
          src={content.image}
          alt='Hero'
          className='absolute inset-0 w-full h-full object-cover opacity-50'
        />
      )}
      <div className='relative z-10 max-w-2xl'>
        <h1 className='text-4xl md:text-6xl font-serif text-gray-900 mb-4'>
          {content.title || "Names of the Couple"}
        </h1>
        <p className='text-xl text-gray-700'>
          {content.subtitle || "Are getting married"}
        </p>
        <p className='mt-4 text-lg font-medium'>
          {content.date || "September 20, 2025"}
        </p>
      </div>
    </div>
  );
};

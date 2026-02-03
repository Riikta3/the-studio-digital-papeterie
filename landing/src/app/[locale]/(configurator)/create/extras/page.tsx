"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "@/navigation";
import { Ban } from "lucide-react";
import { useState } from "react";

export default function ExtrasPage() {
  const router = useRouter();
  const [adultsOnly, setAdultsOnly] = useState(false); // Should be in store ideally, but local state for now as requested "Front-only" style or add to store if needed.
  // User said "Ajoute un module ou une option textuelle".
  // I will assume we can just toggle it here.

  const handleNext = () => {
    // Save to store if needed using a generic 'setExtra' or similar?
    // For now, just navigate.
    router.push("/create/checkout");
  };

  return (
    <div className='flex flex-col gap-8'>
      <div className='text-center space-y-4'>
        <h1 className='font-heading text-4xl font-bold md:text-5xl'>
          Derniers <span className='italic text-primary'>Détails</span>
        </h1>
        <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
          Personnalisez les règles de votre événement.
        </p>
      </div>

      <div className='max-w-2xl mx-auto w-full space-y-6'>
        {/* Adults Only Option */}
        <div
          onClick={() => setAdultsOnly(!adultsOnly)}
          className={cn(
            "group cursor-pointer rounded-3xl border-2 p-6 flex items-center justify-between transition-all duration-300",
            adultsOnly
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border bg-card hover:border-primary/30",
          )}
        >
          <div className='flex items-center gap-4'>
            <div
              className={cn(
                "p-3 rounded-full transition-colors",
                adultsOnly
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground group-hover:text-primary",
              )}
            >
              <Ban className='w-6 h-6' />
            </div>
            <div>
              <h3 className='font-heading text-xl font-bold mb-1'>
                Mariage "Adults Only"
              </h3>
              <p className='text-sm text-muted-foreground'>
                Indiquer poliment que les enfants ne sont pas conviés.
              </p>
            </div>
          </div>

          <div
            className={cn(
              "w-12 h-6 rounded-full relative transition-colors duration-300",
              adultsOnly ? "bg-primary" : "bg-muted",
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm",
                adultsOnly ? "left-7" : "left-1",
              )}
            />
          </div>
        </div>

        {/* Message Preview */}
        {adultsOnly && (
          <div className='bg-muted/30 p-4 rounded-2xl text-sm italic text-muted-foreground text-center animate-in fade-in slide-in-from-top-2'>
            "Bien que nous adorions vos enfants, ce mariage sera une célébration
            entre adultes."
          </div>
        )}

        <div className='flex justify-center pt-8'>
          <button
            onClick={handleNext}
            className='text-primary hover:underline underline-offset-4'
          >
            Passer à l'étape suivante
          </button>
        </div>
      </div>
    </div>
  );
}

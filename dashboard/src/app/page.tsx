import { Button } from "@shared/components/ui/button";
import { ArrowRight, Bell, Calendar, ExternalLink, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardHome() {
  return (
    <div className='min-h-screen p-8 md:p-12 max-w-7xl mx-auto space-y-12'>
      {/* Header / Salutation */}
      <header className='flex justify-between items-end border-b border-stone-200 pb-8'>
        <div className='space-y-2'>
          <p className='text-stone-500 uppercase tracking-widest text-xs font-semibold'>
            Espace Mariés
          </p>
          <h1 className='text-5xl font-heading font-light text-stone-800'>
            Bonjour, Sophie & Thomas
          </h1>
        </div>
        <div className='hidden md:block'>
          <Button
            variant='outline'
            className='border-stone-300 text-stone-600 hover:bg-stone-50'
          >
            Accéder aux réglages
          </Button>
        </div>
      </header>

      {/* KPI Cards Section */}
      <section className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Card 1: Invités (Priority KPI) */}
        <div className='bg-white p-8 rounded-xl shadow-sm border border-stone-100 flex flex-col justify-between h-64 hover:shadow-md transition-shadow duration-300'>
          <div className='flex justify-between items-start'>
            <span className='text-stone-400 uppercase tracking-wider text-xs font-medium'>
              Réponses
            </span>
            <div className='p-2 bg-green-50 rounded-full text-green-700'>
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className='text-6xl font-heading text-stone-800'>85</div>
            <div className='text-stone-500 mt-2 font-light'>
              invités confirmés sur 120
            </div>
          </div>
          <div className='pt-4 border-t border-stone-100'>
            <Link
              href='/guests'
              className='text-sm text-stone-800 font-medium hover:text-stone-600 flex items-center gap-2 group'
            >
              Voir la liste{" "}
              <ArrowRight
                size={14}
                className='group-hover:translate-x-1 transition-transform'
              />
            </Link>
          </div>
        </div>

        {/* Card 2: Countdown (Emotion) */}
        <div className='bg-[#1B2A41] text-white p-8 rounded-xl shadow-sm flex flex-col justify-between h-64 relative overflow-hidden group'>
          {/* Decorative element */}
          <div className='absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700'></div>

          <div className='flex justify-between items-start relative z-10'>
            <span className='text-white/60 uppercase tracking-wider text-xs font-medium'>
              Compte à rebours
            </span>
            <Calendar
              size={18}
              className='text-white/60'
            />
          </div>
          <div className='relative z-10'>
            <div className='text-6xl font-heading'>J-45</div>
            <div className='text-white/70 mt-2 font-light'>
              On y est presque !
            </div>
          </div>
          <div className='pt-4 border-t border-white/10 relative z-10'>
            <div className='text-sm text-white/90'>
              Prochaine étape : Envoyer les infos hôtels
            </div>
          </div>
        </div>

        {/* Card 3: Notifications / Activity */}
        <div className='bg-white p-8 rounded-xl shadow-sm border border-stone-100 flex flex-col h-64'>
          <div className='flex justify-between items-start mb-6'>
            <span className='text-stone-400 uppercase tracking-wider text-xs font-medium'>
              Dernières nouvelles
            </span>
            <div className='p-2 bg-amber-50 rounded-full text-amber-700 relative'>
              <Bell size={18} />
              <span className='absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white'></span>
            </div>
          </div>
          <div className='flex-1 space-y-4 overflow-hidden'>
            <div className='flex items-start gap-3 text-sm'>
              <div className='w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0'></div>
              <p className='text-stone-600'>
                <span className='font-semibold text-stone-800'>
                  Tante Clara
                </span>{" "}
                a confirmé sa venue.
              </p>
            </div>
            <div className='flex items-start gap-3 text-sm'>
              <div className='w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 shrink-0'></div>
              <p className='text-stone-600'>
                <span className='font-semibold text-stone-800'>
                  Marc & Julie
                </span>{" "}
                ont posé une question sur l&apos;hébergement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mini-Site Preview Section */}
      <section className='space-y-6'>
        <div className='flex justify-between items-center'>
          <h2 className='text-2xl font-heading font-light text-stone-800'>
            Votre Faire-part Digital
          </h2>
          <Button
            variant='ghost'
            className='gap-2 text-stone-600'
          >
            <ExternalLink size={16} /> Ouvrir le site
          </Button>
        </div>

        <div className='w-full bg-stone-200 rounded-2xl h-[500px] flex items-center justify-center relative shadow-inner overflow-hidden border-8 border-white'>
          {/* Placeholder for iframe / preview */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0202128?q=80&w=3400&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale hover:grayscale-0 transition-all duration-1000 transform hover:scale-105"></div>
          <div className='relative z-10 bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-2xl text-center max-w-md border border-white/50'>
            <p className='font-heading text-4xl text-stone-800 mb-2'>
              Sophie & Thomas
            </p>
            <p className='text-stone-600 uppercase tracking-widest text-xs'>
              24 Juin 2026 • Château de la Roche
            </p>
            <div className='mt-8'>
              <Button className='bg-[#1B2A41] text-white hover:bg-[#2C3E50] rounded-full px-8 py-6 h-auto text-lg font-heading tracking-wide shadow-lg hover:shadow-xl transition-all'>
                Modifier le site
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

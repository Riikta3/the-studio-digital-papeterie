"use client";

import { motion } from "framer-motion";
import { Edit2, Eye } from "lucide-react";
import { useTranslations } from "next-intl";

export function DashboardPreview() {
  const t = useTranslations("DashboardPreview");

  return (
    <section
      id='apercu'
      className='py-32 bg-[#F9F6F2] overflow-hidden relative'
    >
      {/* Background Decor */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2' />
        <div className='absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2' />
      </div>

      <div className='container mx-auto px-4 relative z-10'>
        <div className='mb-20 text-center max-w-3xl mx-auto'>
          <h2 className='font-heading text-4xl md:text-5xl font-medium text-foreground mb-6'>
            Votre papeterie, <br />
            <span className='text-primary italic'>vivante et interactive.</span>
          </h2>
          <p className='text-muted-foreground text-lg'>
            Fini les allers-retour. Modifiez votre texte, changez les couleurs
            et visualisez le résultat instantanément sur tous les écrans.
          </p>
        </div>

        {/* The Scene Composition - Multi Device */}
        <div className='relative max-w-6xl mx-auto h-[500px] md:h-[600px] flex items-center justify-center'>
          {/* 1. Desktop Monitor (Background) */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 50, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className='absolute hidden md:flex flex-col items-center z-0 right-[20%] top-[30%] -translate-y-1/2 scale-[0.85]'
          >
            {/* Monitor Head */}
            <div className='w-[800px] aspect-[16/10] bg-black rounded-[20px] shadow-2xl border-[16px] border-black overflow-hidden ring-1 ring-white/10 relative z-10'>
              {/* Screen Content */}
              <div className='flex w-full h-full overflow-hidden bg-white rounded-[4px]'>
                {/* Split View */}
                <div className='w-1/2 h-full relative border-r border-gray-100'>
                  <div
                    className='absolute inset-0 bg-cover bg-center'
                    style={{
                      backgroundImage:
                        "url('/images/landing/invite-closeup.png')",
                    }}
                  />
                </div>
                <div className='w-1/2 h-full flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white'>
                  <div className='font-heading text-5xl text-primary italic'>
                    Sarah & Michael
                  </div>
                  <p className='font-body text-base text-gray-500 leading-relaxed max-w-sm'>
                    Nous sommes heureux de vous inviter à célébrer notre union
                    dans un cadre exceptionnel...
                  </p>
                  <div className='flex gap-4 pt-4'>
                    <div className='h-2.5 w-32 bg-gray-100 rounded-full' />
                    <div className='h-2.5 w-16 bg-primary/10 rounded-full' />
                  </div>
                  <button className='mt-4 px-8 py-3 bg-primary text-white rounded-full text-sm font-medium opacity-50 cursor-default shadow-sm'>
                    Confirmer ma présence
                  </button>
                </div>
              </div>
            </div>

            {/* Monitor Stand */}
            <div className='w-[200px] h-[60px] bg-gradient-to-b from-[#d1d5db] to-[#9ca3af] -mt-6 rounded-b-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] z-0 relative'>
              <div className='absolute top-0 left-0 w-full h-4 bg-black/20 blur-md' />{" "}
              {/* Shadow under screen */}
            </div>
          </motion.div>

          {/* 2. The Phone Device (Foreground) */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className='relative w-[280px] md:w-[320px] aspect-[9/19] bg-black rounded-[45px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border-[8px] border-slate-900 overflow-hidden ring-1 ring-white/20 z-10 md:-translate-x-12'
          >
            {/* Screen Content */}
            <div className='w-full h-full bg-[#FAFAFA] relative overflow-hidden flex flex-col'>
              {/* Fake Header */}
              <div className='h-14 bg-transparent absolute top-0 w-full z-20 flex justify-center pt-2'>
                <div className='w-24 h-6 bg-black rounded-b-[16px]' />{" "}
                {/* Notch */}
              </div>

              {/* Invitation Preview */}
              <div className='flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 bg-hero-pattern bg-cover relative'>
                <div className='font-heading text-3xl text-primary italic relative z-10 mt-8'>
                  Sarah & Michael
                </div>

                {/* Photo Placeholder - Real Image */}
                <div className='w-full aspect-[4/5] relative rounded-lg overflow-hidden shadow-md'>
                  <div
                    className='absolute inset-0 bg-cover bg-center'
                    style={{
                      backgroundImage:
                        "url('/images/landing/invite-closeup.png')",
                    }}
                  />
                </div>

                <p className='font-body text-xs text-gray-500 leading-relaxed relative z-10'>
                  Nous sommes heureux de vous inviter à célébrer notre union...
                </p>
                <button className='bg-primary text-white rounded-full px-5 py-2.5 text-xs font-medium shadow-lg hover:scale-105 transition-transform relative z-10'>
                  Confirmer ma présence
                </button>
              </div>

              {/* Floating Edit Switch (Centered Key Feature) */}
              <motion.div
                initial={{ y: 100, x: "-50%" }}
                animate={{ y: 0, x: "-50%" }}
                transition={{ delay: 1, duration: 0.8, type: "spring" }}
                className='absolute bottom-6 left-1/2 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full p-1.5 flex gap-1 z-30 ring-1 ring-black/5 w-fit'
              >
                <div className='flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-full shadow-sm text-[10px] font-semibold whitespace-nowrap'>
                  <Edit2 className='w-3 h-3' /> Édition
                </div>
                <div className='flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:bg-black/5 rounded-full transition-colors text-[10px] font-medium cursor-pointer whitespace-nowrap'>
                  <Eye className='w-3 h-3' /> Aperçu
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

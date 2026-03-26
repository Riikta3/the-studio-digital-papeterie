"use client";

import { motion } from "framer-motion";

interface ProfileData {
  first_name: string;
  partner_name: string;
  wedding_date?: string;
}

export function InvitationFooter({ profile }: { profile: ProfileData }) {
  const formattedDate = profile.wedding_date
    ? new Intl.DateTimeFormat("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(profile.wedding_date))
    : null;

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 1 }}
      className='bg-primary text-[#F5F7F5] py-24 px-6 mt-12 w-full relative overflow-hidden'
    >
      <div className='max-w-4xl mx-auto text-center relative z-10 font-sans'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className='font-heading text-6xl md:text-8xl italic mb-12 text-[#F5F7F5] drop-shadow-sm'>
            Merci
          </h2>
        </motion.div>

        <div className='flex flex-col items-center justify-center space-y-6'>
          <div className='h-[1px] w-24 bg-secondary/20 mb-8'></div>

          <h3 className='text-xl md:text-2xl tracking-[0.3em] uppercase font-light text-[#F5F7F5]/90'>
            {profile.first_name} <span className='opacity-50 px-2'>&</span>{" "}
            {profile.partner_name}
          </h3>

          {formattedDate && (
            <p className='text-sm md:text-base tracking-[0.2em] font-light text-[#F5F7F5]/70 uppercase pt-4'>
              {formattedDate}
            </p>
          )}

          <div className='h-[1px] w-24 bg-secondary/20 mt-16 mb-12'></div>
        </div>

        <p className='text-[10px] tracking-widest text-[#F5F7F5]/40 uppercase mt-auto'>
          Design par The Studio Digital Papeterie
        </p>
      </div>

      {/* Decorative large ampersand in background */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] font-heading italic text-white/[0.03] select-none pointer-events-none'>
        &
      </div>
    </motion.footer>
  );
}

"use client";

import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Navbar"); // Using Navbar translation for basic button for now

  return (
    <div className='min-h-screen w-full grid md:grid-cols-2'>
      {/* Left Column: Immersive Image */}
      <div className='relative hidden md:block h-full overflow-hidden bg-muted'>
        <div
          className='absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-105'
          style={{
            backgroundImage: "url('/images/landing/feature-table.png')",
          }}
        />
        <div className='absolute inset-0 bg-black/10' />
        <div className='absolute bottom-16 left-16 max-w-md text-white'>
          <blockquote className='font-heading text-5xl italic leading-tight mb-6'>
            "Les plus beaux souvenirs commencent par une invitation."
          </blockquote>
          <div className='flex gap-3 items-center opacity-80'>
            <div className='h-px w-12 bg-white' />
            <span className='text-sm uppercase tracking-widest font-medium'>
              The Studio
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className='flex flex-col justify-center items-center p-8 md:p-24 bg-[#FDFBF7] relative'>
        <Link
          href='/'
          className='absolute top-8 left-8 text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors group'
        >
          <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
          Retour à l'accueil
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className='w-full max-w-sm'
        >
          <div className='text-center mb-12'>
            <h1 className='font-heading text-4xl text-primary italic mb-3'>
              Espace Mariés
            </h1>
            <p className='text-muted-foreground font-body'>
              Reprenez le fil de votre création là où vous l'avez laissé.
            </p>
          </div>

          <form
            className='space-y-8'
            onSubmit={(e) => e.preventDefault()}
          >
            <div className='space-y-2 group'>
              <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors'>
                Email
              </label>
              <input
                type='email'
                className='w-full bg-transparent border-b border-border/40 py-3 outline-none focus:border-primary transition-all text-lg font-medium placeholder:text-muted-foreground/30'
                placeholder='votre@email.com'
              />
            </div>

            <div className='space-y-2 group'>
              <div className='flex justify-between items-baseline'>
                <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors'>
                  Mot de passe
                </label>
                <a
                  href='#'
                  className='text-xs text-muted-foreground hover:text-primary transition-colors'
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <input
                type='password'
                className='w-full bg-transparent border-b border-border/40 py-3 outline-none focus:border-primary transition-all text-lg font-medium placeholder:text-muted-foreground/30'
                placeholder='••••••••'
              />
            </div>

            <button className='w-full bg-primary text-white rounded-full py-4 text-sm font-semibold hover:scale-[1.02] hover:shadow-lg transition-all duration-300 transform active:scale-[0.98]'>
              Accéder à mon carnet
            </button>

            <p className='text-center text-sm text-muted-foreground mt-8'>
              Vous n'avez pas encore de compte ?{" "}
              <Link
                href='/#tarifs'
                className='text-primary font-medium hover:underline underline-offset-4'
              >
                Créer une invitation
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Heart, PenTool, Send } from "lucide-react";
import { ModuleIconCircle } from "@/components/invitation/ModuleIconCircle";
import { useState } from "react";

export function GuestbookModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const [formData, setFormData] = useState({
    name: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    // Simuler l'envoi
    setTimeout(() => {
      setStatus("success");
    }, 1500);
  };

  if (status === "success") {
    return (
      <section className='w-full py-10'>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='max-w-2xl mx-auto bg-card rounded-[2.5rem] p-12 md:p-16 border border-primary/20 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] text-center'
        >
          <ModuleIconCircle size="lg" className="mx-auto mb-8">
            <Heart
              className='w-8 h-8'
              fill='currentColor'
            />
          </ModuleIconCircle>
          <h3 className='font-heading text-4xl italic text-foreground mb-4'>
            Message Envoyé
          </h3>
          <p className='text-muted-foreground/60 text-lg font-light leading-relaxed'>
            Merci pour votre mot doux. Il a été transmis avec soin aux futurs
            mariés.
          </p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-4xl mx-auto px-4 text-center'
      >
        <p className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-foreground/60 mb-4'>
          Livre d'Or
        </p>
        <h3 className='font-heading text-5xl md:text-6xl italic text-foreground mb-8'>
          Un mot doux
        </h3>

        <div className='bg-card rounded-[2.5rem] p-8 md:p-16 border border-primary/20 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] max-w-2xl mx-auto'>
          <ModuleIconCircle size="md" className="mx-auto mb-8">
            <PenTool className='w-6 h-6' />
          </ModuleIconCircle>

          <p className='text-foreground/60 text-base md:text-lg leading-relaxed font-light mb-12 max-w-sm mx-auto'>
            Laissez une petite trace de votre passage. Vos messages seront
            gardés précieusement et transmis uniquement aux mariés.
          </p>

          <form
            onSubmit={handleSubmit}
            className='space-y-8 text-left'
          >
            <div className='space-y-3'>
              <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/60 ml-4'>
                Votre Nom
              </label>
              <input
                required
                type='text'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Comment devons-nous vous appeler ?'
                className='w-full bg-muted/50 border border-primary/20 text-foreground placeholder:text-muted-foreground/30 rounded-full py-4 px-8 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60 transition-all font-light'
              />
            </div>

            <div className='space-y-3'>
              <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/60 ml-4'>
                Votre Message
              </label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder='Écrivez votre mot doux ici...'
                className='w-full bg-muted/50 border border-primary/20 text-foreground placeholder:text-muted-foreground/30 rounded-[2rem] py-5 px-8 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60 transition-all font-light resize-none'
              />
            </div>

            <button
              type='submit'
              disabled={
                status === "submitting" || !formData.name || !formData.message
              }
              className='w-full bg-primary hover:bg-primary/90 disabled:bg-muted-foreground/40 text-primary-foreground py-5 rounded-full font-bold text-xs uppercase tracking-[0.3em] transition-all duration-300 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.12)] shadow-primary/10 flex items-center justify-center gap-3 group'
            >
              <span className='relative z-10'>
                {status === "submitting"
                  ? "Envoi en cours..."
                  : "Envoyer mon message"}
              </span>
              <Send
                className={`w-4 h-4 transition-transform duration-300 ${status === "submitting" ? "translate-x-10 opacity-0" : "group-hover:translate-x-1"}`}
              />
            </button>
          </form>
        </div>
      </motion.div>
    </section>
  );
}

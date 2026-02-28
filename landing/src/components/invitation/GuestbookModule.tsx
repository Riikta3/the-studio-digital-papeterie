"use client";

import { motion } from "framer-motion";
import { MessageSquare, Send } from "lucide-react";

const MOCK_MESSAGES = [
  {
    id: 1,
    author: "Camille & Lucas",
    text: "Félicitations ! Nous avons hâte de célébrer avec vous.",
  },
  {
    id: 2,
    author: "Tante Marie",
    text: "Plein de bonheur à tous les deux. Bisous !",
  },
  { id: 3, author: "Julien", text: "Préparez-vous à une soirée mémorable 🥳" },
];

export function GuestbookModule({ weddingId }: { weddingId: string }) {
  return (
    <section className='w-full'>
      <div className='text-center mb-16 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-primary'>
          Un mot doux
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>Livre d'Or</h3>
      </div>

      <div className='grid md:grid-cols-5 gap-12 max-w-5xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className='md:col-span-2 space-y-8'
        >
          <div className='bg-primary/5 rounded-[2rem] p-8 border border-primary/10'>
            <h4 className='font-heading text-2xl mb-2'>
              Laissez votre empreinte
            </h4>
            <p className='text-muted-foreground text-sm mb-6'>
              Votre présence est notre plus grand bonheur. Laissez-nous un petit
              souvenir de cette journée inoubliable !
            </p>
            <form className='space-y-4'>
              <input
                type='text'
                placeholder='Votre nom'
                className='w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm'
              />
              <textarea
                placeholder='Votre message...'
                rows={4}
                className='w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none'
              />
              <button
                type='button'
                className='w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:opacity-90'
              >
                Envoyer <Send className='w-4 h-4' />
              </button>
            </form>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className='md:col-span-3 space-y-4'
        >
          {MOCK_MESSAGES.map((msg, i) => (
            <div
              key={msg.id}
              className='bg-background rounded-2xl p-6 border border-border/50 shadow-sm relative'
            >
              <MessageSquare className='absolute top-6 right-6 w-4 h-4 text-primary/20' />
              <p className='text-sm text-muted-foreground italic mb-4'>
                "{msg.text}"
              </p>
              <p className='font-bold text-sm'>— {msg.author}</p>
            </div>
          ))}
          <div className='text-center pt-4'>
            <button className='text-xs font-bold uppercase tracking-widest text-primary hover:underline'>
              Voir tous les messages
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

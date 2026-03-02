"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Send, X } from "lucide-react";
import { useState } from "react";

export function RsvpModule({ weddingId }: { weddingId: string }) {
  const [formData, setFormData] = useState({
    name: "",
    attendance: "" as "yes" | "no" | "",
    dietary: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    // Simulate API call for now
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
          className='max-w-2xl mx-auto bg-white rounded-[2.5rem] p-12 md:p-16 border border-[#EAEAEA] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] text-center'
        >
          <div className='w-20 h-20 bg-[#F5F7F5] rounded-full flex items-center justify-center mx-auto mb-8 text-[#4B6856]'>
            <Heart
              className='w-8 h-8'
              fill='currentColor'
            />
          </div>
          <h3 className='font-heading text-4xl italic text-[#333333] mb-4'>
            Merci infiniment
          </h3>
          <p className='text-[#556B5D] text-lg font-light leading-relaxed'>
            Votre réponse a bien été enregistrée. Nous avons hâte de célébrer ce
            moment avec vous !
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
        <p className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#6C7A6E] mb-4'>
          Votre Présence
        </p>
        <h3 className='font-heading text-5xl md:text-6xl italic text-[#333333] mb-8'>
          R.S.V.P
        </h3>

        <div className='bg-white rounded-[2.5rem] p-8 md:p-16 border border-[#EAEAEA] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] max-w-2xl mx-auto'>
          <p className='text-[#556B5D] text-base md:text-lg leading-relaxed font-light mb-12 max-w-md mx-auto'>
            Nous serions honorés de vous compter parmi nous. Merci de bien
            vouloir confirmer votre présence avant le 1er Mars 2026.
          </p>

          <form
            onSubmit={handleSubmit}
            className='space-y-10 text-left'
          >
            {/* Nom & Prénom */}
            <div className='space-y-3'>
              <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#6C7A6E] ml-4'>
                Prénom & Nom
              </label>
              <input
                required
                type='text'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='Ex: Jean Dupont'
                className='w-full bg-[#F9F9F9]/50 border border-[#EBEBEB] text-[#333333] placeholder:text-[#6C7A6E]/30 rounded-full py-4 px-8 focus:outline-none focus:ring-1 focus:ring-[#4B6856]/40 focus:border-[#4B6856]/60 transition-all font-light'
              />
            </div>

            {/* Attendance Selection */}
            <div className='space-y-4'>
              <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#6C7A6E] ml-4'>
                Confirmez-vous votre présence ?
              </label>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <button
                  type='button'
                  onClick={() =>
                    setFormData({ ...formData, attendance: "yes" })
                  }
                  className={`relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                    formData.attendance === "yes"
                      ? "bg-[#F5F7F5] border-[#4B6856] shadow-sm"
                      : "bg-white border-[#EBEBEB] hover:border-[#D0D8D3]"
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        formData.attendance === "yes"
                          ? "bg-[#4B6856] border-[#4B6856]"
                          : "border-[#EBEBEB]"
                      }`}
                    >
                      {formData.attendance === "yes" && (
                        <Check className='w-3.5 h-3.5 text-white' />
                      )}
                    </div>
                    <span
                      className={`text-sm tracking-wide ${formData.attendance === "yes" ? "text-[#333333] font-medium" : "text-[#6C7A6E]"}`}
                    >
                      Oui, avec plaisir !
                    </span>
                  </div>
                </button>

                <button
                  type='button'
                  onClick={() => setFormData({ ...formData, attendance: "no" })}
                  className={`relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                    formData.attendance === "no"
                      ? "bg-[#FFF9F9] border-[#D6A1A1] shadow-sm"
                      : "bg-white border-[#EBEBEB] hover:border-[#D0D8D3]"
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        formData.attendance === "no"
                          ? "bg-[#D6A1A1] border-[#D6A1A1]"
                          : "border-[#EBEBEB]"
                      }`}
                    >
                      {formData.attendance === "no" && (
                        <X className='w-3.5 h-3.5 text-white' />
                      )}
                    </div>
                    <span
                      className={`text-sm tracking-wide ${formData.attendance === "no" ? "text-[#333333] font-medium" : "text-[#6C7A6E]"}`}
                    >
                      Non, avec regrets
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Régime Alimentaire */}
            <AnimatePresence>
              {formData.attendance === "yes" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className='space-y-3 overflow-hidden'
                >
                  <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#6C7A6E] ml-4'>
                    Régime alimentaire & Allergies
                  </label>
                  <input
                    type='text'
                    value={formData.dietary}
                    onChange={(e) =>
                      setFormData({ ...formData, dietary: e.target.value })
                    }
                    placeholder='Végétarien, sans gluten, etc.'
                    className='w-full bg-[#F9F9F9]/50 border border-[#EBEBEB] text-[#333333] placeholder:text-[#6C7A6E]/30 rounded-full py-4 px-8 focus:outline-none focus:ring-1 focus:ring-[#4B6856]/40 focus:border-[#4B6856]/60 transition-all font-light'
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message pour les mariés */}
            <div className='space-y-3'>
              <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-[#6C7A6E] ml-4'>
                Petit mot pour les mariés
              </label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder='Laissez-nous un message...'
                className='w-full bg-[#F9F9F9]/50 border border-[#EBEBEB] text-[#333333] placeholder:text-[#6C7A6E]/30 rounded-3xl py-4 px-8 focus:outline-none focus:ring-1 focus:ring-[#4B6856]/40 focus:border-[#4B6856]/60 transition-all font-light resize-none'
              />
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={
                status === "submitting" ||
                !formData.name ||
                !formData.attendance
              }
              className='w-full bg-[#333333] hover:bg-[#1A1A1A] disabled:bg-[#CCCCCC] text-white py-5 rounded-full font-bold text-xs uppercase tracking-[0.3em] transition-all duration-300 shadow-xl shadow-black/5 flex items-center justify-center gap-3 overflow-hidden group'
            >
              <span className='relative z-10'>
                {status === "submitting"
                  ? "Envoi en cours..."
                  : "Confirmer ma réponse"}
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

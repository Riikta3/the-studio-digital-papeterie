"use client";

import { submitRsvp } from "@/actions/submit-rsvp";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Send, X } from "lucide-react";
import { useState } from "react";

export function RsvpModule({
  weddingId,
  extras,
  config,
}: {
  weddingId: string;
  extras?: {
    rsvp_deadline?: string;
  };
  config?: Record<string, any> | null;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    attendance: "" as "yes" | "no" | "",
    guests: "0",
    dietary: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      await submitRsvp({
        weddingId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        attendance: formData.attendance === "yes",
        guestCount: formData.attendance === "yes" ? parseInt(formData.guests) || 0 : 0,
        dietary: formData.dietary,
        message: formData.message,
      });
      setStatus("success");
    } catch {
      setStatus("idle");
      alert("Une erreur est survenue. Merci de réessayer.");
    }
  };

  if (status === "success") {
    return (
      <section className='w-full py-10'>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='max-w-2xl mx-auto bg-card rounded-[2.5rem] p-12 md:p-16 border border-border shadow-xl text-center'
        >
          <div className='w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-8 text-primary'>
            <Heart
              className='w-8 h-8'
              fill='currentColor'
            />
          </div>
          <h3 className='font-heading text-4xl italic text-foreground mb-4'>
            Merci infiniment
          </h3>
          <p className='text-muted-foreground text-lg font-light leading-relaxed'>
            Votre réponse a bien été enregistrée. Nous avons hâte de célébrer ce
            moment avec vous !
          </p>
        </motion.div>
      </section>
    );
  }

  const deadline =
    config?.rsvp_deadline || extras?.rsvp_deadline || "14 Novembre 2026";

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-4xl mx-auto px-4 text-center'
      >
        <p className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4'>
          Votre Présence
        </p>
        <h3 className='font-heading text-5xl md:text-6xl italic text-foreground mb-8'>
          R.S.V.P
        </h3>

        <div className='bg-card rounded-[2.5rem] p-8 md:p-16 border border-border shadow-xl max-w-2xl mx-auto'>
          <p className='text-muted-foreground text-base md:text-lg leading-relaxed font-light mb-12 max-w-md mx-auto'>
            Nous serions honorés de vous compter parmi nous (présence,
            allergies, accompagnants). Merci de bien vouloir confirmer votre
            présence avant le {deadline}.
          </p>

          <form
            onSubmit={handleSubmit}
            className='space-y-10 text-left'
          >
            {/* Prénom & Nom */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-3'>
                <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4'>
                  Prénom
                </label>
                <input
                  required
                  type='text'
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder='Jean'
                  className='w-full bg-transparent border border-border/70 text-foreground placeholder:text-muted-foreground/40 rounded-full py-4 px-8 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/70 transition-all font-light'
                />
              </div>
              <div className='space-y-3'>
                <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4'>
                  Nom
                </label>
                <input
                  required
                  type='text'
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder='Dupont'
                  className='w-full bg-transparent border border-border/70 text-foreground placeholder:text-muted-foreground/40 rounded-full py-4 px-8 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/70 transition-all font-light'
                />
              </div>
            </div>

            {/* Attendance Selection */}
            <div className='space-y-4'>
              <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4'>
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
                      ? "bg-secondary border-primary shadow-sm"
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        formData.attendance === "yes"
                          ? "bg-primary border-primary"
                          : "border-border"
                      }`}
                    >
                      {formData.attendance === "yes" && (
                        <Check className='w-3.5 h-3.5 text-white' />
                      )}
                    </div>
                    <span
                      className={`text-sm tracking-wide ${formData.attendance === "yes" ? "text-foreground font-medium" : "text-muted-foreground"}`}
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
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        formData.attendance === "no"
                          ? "bg-[#D6A1A1] border-[#D6A1A1]"
                          : "border-border"
                      }`}
                    >
                      {formData.attendance === "no" && (
                        <X className='w-3.5 h-3.5 text-white' />
                      )}
                    </div>
                    <span
                      className={`text-sm tracking-wide ${formData.attendance === "no" ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    >
                      Non, avec regrets
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Accompagnants & Régime Alimentaire */}
            <AnimatePresence mode='wait'>
              {formData.attendance === "yes" && (
                <motion.div
                  key='extra-fields'
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='space-y-8'
                >
                  <div className='space-y-3'>
                    <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4'>
                      Nombre d'accompagnants
                    </label>
                    <input
                      type='number'
                      min={0}
                      value={formData.guests}
                      onChange={(e) =>
                        setFormData({ ...formData, guests: e.target.value })
                      }
                      className='w-full bg-transparent border border-border/70 text-foreground rounded-full py-4 px-8 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/70 transition-all font-light'
                    />
                  </div>

                  <div className='space-y-3'>
                    <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4'>
                      Régime alimentaire & Allergies
                    </label>
                    <input
                      type='text'
                      value={formData.dietary}
                      onChange={(e) =>
                        setFormData({ ...formData, dietary: e.target.value })
                      }
                      placeholder='Végétarien, sans gluten, etc.'
                      className='w-full bg-transparent border border-border/70 text-foreground placeholder:text-muted-foreground/40 rounded-full py-4 px-8 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/70 transition-all font-light'
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message pour les mariés */}
            <div className='space-y-3'>
              <label className='text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-4'>
                Petit mot pour les mariés
              </label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder='Laissez-nous un message...'
                className='w-full bg-transparent border border-border/70 text-foreground placeholder:text-muted-foreground/40 rounded-3xl py-4 px-8 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/70 transition-all font-light resize-none'
              />
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={
                status === "submitting" ||
                !formData.firstName ||
                !formData.lastName ||
                !formData.attendance
              }
              className='w-full bg-primary hover:bg-primary/90 disabled:bg-primary/30 disabled:cursor-not-allowed text-primary-foreground py-4 md:py-5 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.3em] transition-all duration-300 shadow-xl shadow-primary/10 flex items-center justify-center gap-2 group'
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

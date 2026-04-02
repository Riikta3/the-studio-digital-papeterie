"use client";
import { submitRsvp } from "@/actions/submit-rsvp";
import { DIETARY_OPTIONS_FR } from "@shared/data/dietary-options";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, HeartCrack, Minus, Plane, Plus } from "lucide-react";
import { useState } from "react";
import type { ModuleProps } from "../../module-registry";

const FILTER_NUIT =
  "brightness(0) saturate(100%) invert(13%) sepia(40%) saturate(800%) hue-rotate(178deg) brightness(80%)";

const inputClass =
  "w-full bg-muted/50 border border-border rounded-full px-5 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-card transition-all font-sans";
const selectClass =
  "w-full bg-muted/50 border border-border rounded-full px-5 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-sans appearance-none cursor-pointer";
const textareaClass =
  "w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-card transition-all font-sans resize-none";

export function RsvpModule({ weddingId, isDemo = false, extras }: ModuleProps) {
  const adultsOnly = extras?.adults_only === true;
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    attendance: "" as "yes" | "no" | "",
    adults: 0,
    children: 0,
    dietary: [] as string[],
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  const isValid =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.attendance !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo || !isValid) return;
    setStatus("submitting");
    await submitRsvp({
      weddingId,
      firstName: form.firstName,
      lastName: form.lastName,
      attendance: form.attendance === "yes",
      guestCount: form.attendance === "yes" ? form.adults + form.children : 0,
      dietary: form.dietary.join(", "),
      message: form.message,
    });
    setStatus("success");
  };

  return (
    <section className='w-full py-20 pt-10'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-xl mx-auto px-4'
      >
        {/* Header */}
        <div className='text-center mb-10'>
          <p className='text-[11px] sm:text-xs uppercase tracking-[0.4em] text-primary/60 font-sans mb-3'>
            Votre réponse
          </p>
          <h2
            className='text-4xl md:text-5xl text-foreground font-normal leading-tight'
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Serez-vous des nôtres ?
          </h2>
        </div>

        {/* Card */}
        <div className='relative bg-card rounded-[2rem] border border-primary/20 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-8 md:p-10 overflow-hidden'>
          {/* Watermark passeport */}
          <img
            src='/videos/theme/travel/Image iLoveIMG (3).png'
            alt=''
            aria-hidden='true'
            className='absolute -bottom-6 -right-6 w-44 pointer-events-none select-none'
            style={{ filter: FILTER_NUIT, opacity: 0.04 }}
          />

          <AnimatePresence mode='wait'>
            {status === "success" ? (
              <motion.div
                key='success'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='text-center flex flex-col items-center gap-4 py-8'
              >
                <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center'>
                  <Heart
                    className='w-7 h-7 text-primary'
                    fill='currentColor'
                  />
                </div>
                <p className='text-foreground font-sans text-sm tracking-wide'>
                  Merci pour votre réponse.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key='form'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className='flex flex-col gap-5 relative z-10'
              >
                {/* Noms */}
                <div className='grid grid-cols-2 gap-3'>
                  <input
                    className={inputClass}
                    placeholder='Prénom *'
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder='Nom *'
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                  />
                </div>

                {/* Présence — cards cliquables */}
                <div className='grid grid-cols-2 gap-3'>
                  {[
                    {
                      val: "yes",
                      label: "Avec joie",
                      icon: <Plane className='w-5 h-5' />,
                    },
                    {
                      val: "no",
                      label: "Dans mon cœur",
                      icon: <HeartCrack className='w-5 h-5' />,
                    },
                  ].map(
                    ({
                      val,
                      label,
                      icon,
                    }: {
                      val: string;
                      label: string;
                      icon: React.ReactNode;
                    }) => (
                      <button
                        key={val}
                        type='button'
                        onClick={() =>
                          setForm({ ...form, attendance: val as "yes" | "no" })
                        }
                        className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${
                          form.attendance === val
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-border/60"
                        }`}
                      >
                        <span
                          className={`${form.attendance === val ? "text-primary" : "text-muted-foreground"} transition-colors`}
                        >
                          {icon}
                        </span>
                        <span className='text-[11px] uppercase tracking-[0.15em] font-sans text-foreground/70'>
                          {label}
                        </span>
                      </button>
                    ),
                  )}
                </div>

                {/* Accompagnants + dietary */}
                {form.attendance === "yes" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className='flex flex-col gap-4'
                  >
                    {/* Compteurs adultes + enfants */}
                    <div
                      className={`grid gap-3 ${adultsOnly ? "grid-cols-1" : "grid-cols-2"}`}
                    >
                      {(
                        [
                          {
                            key: "adults" as const,
                            label: "Adultes accompagnants",
                          },
                          ...(!adultsOnly
                            ? [{ key: "children" as const, label: "Enfants" }]
                            : []),
                        ] as { key: "adults" | "children"; label: string }[]
                      ).map(({ key, label }) => (
                        <div
                          key={key}
                          className='flex flex-col gap-2'
                        >
                          <p className='text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-sans px-1'>
                            {label}
                          </p>
                          <div className='flex items-center justify-between bg-muted/50 border border-border rounded-full px-3 py-2'>
                            <button
                              type='button'
                              onClick={() =>
                                setForm({
                                  ...form,
                                  [key]: Math.max(0, form[key] - 1),
                                })
                              }
                              className='w-7 h-7 rounded-full flex items-center justify-center text-foreground/50 hover:bg-muted transition-colors'
                            >
                              <Minus className='w-3 h-3' />
                            </button>
                            <span className='text-sm font-semibold text-foreground w-6 text-center'>
                              {form[key]}
                            </span>
                            <button
                              type='button'
                              onClick={() =>
                                setForm({
                                  ...form,
                                  [key]: Math.min(10, form[key] + 1),
                                })
                              }
                              className='w-7 h-7 rounded-full flex items-center justify-center text-foreground/50 hover:bg-muted transition-colors'
                            >
                              <Plus className='w-3 h-3' />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {adultsOnly && (
                      <p className='text-[11px] text-foreground/50 font-sans italic px-1 text-center'>
                        Notre célébration se déroulera en présence des adultes
                        uniquement — nous vous remercions de votre
                        compréhension.
                      </p>
                    )}
                    <div className='flex flex-col gap-2'>
                      <p className='text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-sans px-1'>
                        Régime alimentaire (optionnel)
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {DIETARY_OPTIONS_FR.map((o) => {
                          const selected = form.dietary.includes(o);
                          return (
                            <button
                              key={o}
                              type='button'
                              onClick={() =>
                                setForm({
                                  ...form,
                                  dietary: selected
                                    ? form.dietary.filter((d) => d !== o)
                                    : [...form.dietary, o],
                                })
                              }
                              className={`px-4 py-1.5 rounded-full text-[11px] font-sans border transition-all duration-150 ${
                                selected
                                  ? "bg-foreground border-foreground text-background font-bold"
                                  : "bg-transparent border-border text-foreground/60 hover:border-border/80"
                              }`}
                            >
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Message */}
                <textarea
                  className={textareaClass}
                  rows={3}
                  placeholder='Un message pour les mariés (optionnel)'
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                />

                {/* CTA */}
                <button
                  type='submit'
                  disabled={status === "submitting" || !isValid}
                  className='w-full bg-foreground hover:bg-foreground/90 disabled:bg-foreground/25 disabled:cursor-not-allowed text-background py-4 rounded-full font-sans text-[11px] uppercase tracking-[0.3em] font-bold transition-all duration-300 shadow-lg shadow-foreground/20 mt-1'
                >
                  {status === "submitting"
                    ? "Envoi en cours..."
                    : "Envoyer ma réponse"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}

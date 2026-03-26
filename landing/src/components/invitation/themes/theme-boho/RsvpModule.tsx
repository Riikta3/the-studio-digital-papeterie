"use client";
import { submitRsvp } from "@/actions/submit-rsvp";
import { DIETARY_OPTIONS_FR } from "@shared/data/dietary-options";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";
import type { ModuleProps } from "../../module-registry";

export function RsvpModule({ weddingId, isDemo = false }: ModuleProps) {
  const [form, setForm] = useState({ firstName:"", lastName:"", attendance:"" as "yes"|"no"|"", guests:"0", dietary:"", message:"" });
  const [status, setStatus] = useState<"idle"|"submitting"|"success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (isDemo) return; setStatus("submitting");
    await submitRsvp({ weddingId, firstName: form.firstName, lastName: form.lastName, attendance: form.attendance==="yes", guestCount: form.attendance==="yes" ? parseInt(form.guests)||0 : 0, dietary: form.dietary, message: form.message });
    setStatus("success");
  };

  const inputClass = "w-full bg-transparent border-b border-[#a98467]/20 py-3 text-sm text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:border-[#a98467]/50 transition-colors font-sans";

  return (
    <section className="w-full py-16 bg-[#fdf0e5]">
      <div className="max-w-md mx-auto px-4">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#a98467]/60 font-sans mb-2 text-center">Votre réponse</p>
        <h2 className="text-3xl text-center text-[#4a3728] mb-10" style={{ fontFamily:"'Playfair Display', Georgia, serif", fontStyle:"italic" }}>
          Serez-vous des nôtres ?
        </h2>
        <AnimatePresence mode="wait">
          {status==="success" ? (
            <motion.div key="success" initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center flex flex-col items-center gap-4">
              <Heart className="w-8 h-8 text-[#a98467]" fill="currentColor" />
              <p className="text-[#4a3728] font-sans text-sm">Merci pour votre réponse.</p>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity:0 }} animate={{ opacity:1 }} onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <input className={inputClass} placeholder="Prénom" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required />
                <input className={inputClass} placeholder="Nom" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required />
              </div>
              <div className="flex gap-6">
                {[{val:"yes",label:"Avec joie ✓"},{val:"no",label:"Dans mon cœur"}].map(({val,label})=>(
                  <label key={val} className="flex items-center gap-2 text-sm text-[#4a3728]/70 font-sans cursor-pointer">
                    <input type="radio" name="attendance" value={val} checked={form.attendance===val} onChange={()=>setForm({...form,attendance:val as "yes"|"no"})} className="accent-[#a98467]" />
                    {label}
                  </label>
                ))}
              </div>
              {form.attendance==="yes" && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} className="flex flex-col gap-5">
                  <select className={inputClass} value={form.guests} onChange={e=>setForm({...form,guests:e.target.value})}>
                    {[0,1,2,3,4].map(n=><option key={n} value={n}>{n===0?"Venu(e) seul(e)":`+${n} accompagnant${n>1?"s":""}`}</option>)}
                  </select>
                  <select className={inputClass} value={form.dietary} onChange={e=>setForm({...form,dietary:e.target.value})}>
                    <option value="">Régime alimentaire (optionnel)</option>
                    {DIETARY_OPTIONS_FR.map((o: any)=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </motion.div>
              )}
              <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Un message pour les mariés (optionnel)" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} />
              <button type="submit" disabled={status==="submitting"||!form.attendance}
                className="self-center px-8 py-3 rounded-full border border-[#a98467]/40 text-[#4a3728] text-[11px] uppercase tracking-[0.3em] font-sans hover:bg-[#a98467]/10 disabled:opacity-30 transition-colors mt-2">
                {status==="submitting"?"Envoi en cours...":"Envoyer ma réponse"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

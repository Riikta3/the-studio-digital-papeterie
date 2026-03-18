"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";

const MONTHS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

export default function WeddingPage() {
  const { weddingInfo, setWeddingInfo } = useOrderStore();

  const previewNames =
    weddingInfo.partner1 || weddingInfo.partner2
      ? `${weddingInfo.partner1 || "Prénom 1"} & ${weddingInfo.partner2 || "Prénom 2"}`
      : "Sophie & Pierre";

  const previewDate =
    weddingInfo.day && weddingInfo.month && weddingInfo.year
      ? `${weddingInfo.day} ${weddingInfo.month} ${weddingInfo.year}`
      : "14 Juin 2026";

  const previewVenue = weddingInfo.venue || "Château des Roses, Provence";

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Parlez-nous de votre <span className="italic text-primary">mariage</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          Ces informations personaliseront votre site d&apos;invitation.
        </p>
      </div>

      {/* Live preview */}
      <div
        className="mx-4 rounded-2xl relative overflow-hidden py-6 text-center"
        style={{ background: "linear-gradient(160deg, #fdf6f0, #f0d9cc)" }}
      >
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px]" />
        <p className="relative z-10 text-xl font-bold text-[#c97a90]" style={{ fontFamily: "Georgia, serif" }}>
          {previewNames}
        </p>
        <div className="relative z-10 w-6 h-[1.5px] bg-[#c97a90] opacity-50 mx-auto my-2" />
        <p className="relative z-10 text-[10px] uppercase tracking-widest text-[#c4a882] font-sans">
          {previewDate}
        </p>
        <p className="relative z-10 text-xs italic text-[#c4a882] mt-1" style={{ fontFamily: "Georgia, serif" }}>
          {previewVenue}
        </p>
        <p className="relative z-10 text-[10px] text-muted-foreground/50 font-sans mt-3">
          Aperçu de votre invitation
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full px-4">
        {/* Partners */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Les mariés
          </p>
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border/60">
              <div className="flex-1 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Prénom marié·e 1</p>
                <input
                  type="text"
                  placeholder="Sophie"
                  value={weddingInfo.partner1}
                  onChange={(e) => setWeddingInfo({ partner1: e.target.value })}
                  className="w-full text-sm font-heading bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic"
                />
              </div>
              <div className="flex-1 px-4 py-3 border-l border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Prénom marié·e 2</p>
                <input
                  type="text"
                  placeholder="Pierre"
                  value={weddingInfo.partner2}
                  onChange={(e) => setWeddingInfo({ partner2: e.target.value })}
                  className="w-full text-sm font-heading bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Date */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Date & lieu
          </p>
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border/60">
              <div className="w-[72px] px-4 py-3 border-r border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Jour</p>
                <input
                  type="number"
                  placeholder="14"
                  min="1"
                  max="31"
                  value={weddingInfo.day}
                  onChange={(e) => setWeddingInfo({ day: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex-1 px-4 py-3 border-r border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Mois</p>
                <select
                  value={weddingInfo.month}
                  onChange={(e) => setWeddingInfo({ month: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none text-foreground"
                >
                  <option value="">—</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="w-[80px] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Année</p>
                <input
                  type="number"
                  placeholder="2026"
                  value={weddingInfo.year}
                  onChange={(e) => setWeddingInfo({ year: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Lieu de la cérémonie</p>
              <input
                type="text"
                placeholder="Château des Roses, Provence"
                value={weddingInfo.venue}
                onChange={(e) => setWeddingInfo({ venue: e.target.value })}
                className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic"
              />
            </div>
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Votre compte
          </p>
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Adresse email</p>
              <input
                type="email"
                placeholder="sophie@exemple.fr"
                value={weddingInfo.email}
                onChange={(e) => setWeddingInfo({ email: e.target.value })}
                className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Mot de passe</p>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
              />
              <p className="text-[10px] text-muted-foreground/50 font-sans mt-1">8 caractères minimum</p>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="flex gap-3 pt-1">
          {[
            { label: "Personnalise votre site" },
            { label: "Accès sécurisé à votre espace" },
            { label: "Support disponible après achat" },
          ].map((item) => (
            <div key={item.label} className="flex-1 border border-border rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground/70 font-sans leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

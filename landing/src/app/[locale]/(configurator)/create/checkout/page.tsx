"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { selectTotalPrice, useOrderStore } from "@/stores/use-order-store";
import { processCheckout } from "@/actions/checkout-actions";
import { cn } from "@/lib/utils";
import { Edit2, Eye, CreditCard, Loader2 } from "lucide-react";
import { ThemeDemoOverlay } from "@/components/configurator/ThemeDemoOverlay";

const THEME_NAMES: Record<string, string> = {
  "theme-floral":     "Floral",
  "theme-minimalist": "Minimalist",
  "theme-boho":       "Boho",
  "theme-royal":      "Royal",
  "theme-modern":     "Modern",
};

const PAYMENT_METHODS = [
  { id: "card",   label: "Carte" },
  { id: "apple",  label: "Apple Pay" },
  { id: "google", label: "Google Pay" },
  { id: "paypal", label: "PayPal" },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export default function CheckoutPage() {
  const router = useRouter();
  const { plan, animation, theme, modules, languages, extras, adultsOnly, weddingInfo } = useOrderStore();
  const totalPrice = useOrderStore(selectTotalPrice);

  const [showPreview, setShowPreview] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("card");
  const [isLoading, setIsLoading] = useState(false);

  // Billing form state
  const [billing, setBilling] = useState({
    firstName: "",
    lastName: "",
    address: "",
    zip: "",
    city: "",
    country: "France",
  });

  async function handlePayment() {
    setIsLoading(true);
    try {
      const result = await processCheckout({
        plan: plan || "unknown",
        amount: totalPrice,
        period: "lifetime",
      });
      if (result.error) {
        alert("Erreur: " + result.error);
      } else {
        const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
        if (dashboardUrl) {
          const target = new URL(dashboardUrl);
          target.pathname = "/fr/billing";
          target.searchParams.set("success", "true");
          setTimeout(() => { window.location.href = target.toString(); }, 1500);
        }
      }
    } catch {
      alert("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  const RecapRow = ({
    label, value, href, children,
  }: {
    label: string;
    value?: string;
    href?: string;
    children?: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans">{label}</p>
        {value && <p className="text-sm font-semibold mt-0.5">{value}</p>}
        {children}
      </div>
      {href && (
        <button
          onClick={() => router.push(href)}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center flex-shrink-0 hover:border-primary transition-colors"
        >
          <Edit2 className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-5 max-w-lg mx-auto px-4">
        <div className="text-center space-y-2 pb-2">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">
            Votre commande est <span className="italic text-primary">prête</span>
          </h1>
          <p className="text-muted-foreground text-sm font-sans">
            Vérifiez vos choix et finalisez votre site d&apos;invitation.
          </p>
        </div>

        {/* Récap */}
        <div className="bg-card border-2 border-border/60 rounded-2xl overflow-hidden">
          <RecapRow
            label="Les mariés"
            value={`${weddingInfo.partner1 || "—"} & ${weddingInfo.partner2 || "—"} · ${weddingInfo.day || "—"} ${weddingInfo.month || ""} ${weddingInfo.year || ""}`}
            href="/create/wedding"
          />
          <RecapRow label="Offre" value={`Pack ${plan === "premium" ? "Premium" : "Essentiel"} — ${plan === "premium" ? "575" : "175"}€`} href="/create/plan" />
          <RecapRow label="Animation & Thème" value={`${animation || "—"} · ${THEME_NAMES[theme] || "—"}`} href="/create/animation" />
          <RecapRow label="Modules" href="/create/modules">
            <div className="flex flex-wrap gap-1 mt-1">
              {modules.slice(0, 4).map((m) => (
                <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans">{m}</span>
              ))}
              {modules.length > 4 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-sans">+{modules.length - 4}</span>
              )}
            </div>
          </RecapRow>
          {(languages.length > 0 || extras.length > 0 || adultsOnly) && (
            <RecapRow label="Options" href="/create/extras">
              <div className="flex flex-wrap gap-1 mt-1">
                {languages.map((l) => (
                  <span key={l} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans">{l.toUpperCase()} +15€</span>
                ))}
                {extras.map((e) => (
                  <span key={e} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans">{e}</span>
                ))}
                {adultsOnly && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-sans">Adults Only</span>
                )}
              </div>
            </RecapRow>
          )}
        </div>

        {/* Aperçu */}
        <button
          onClick={() => setShowPreview(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-primary text-primary font-bold text-sm font-sans hover:bg-primary/5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Voir l&apos;aperçu de mon site
        </button>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-sans">Paiement</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Billing */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Informations de facturation
          </p>
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border/60">
              <div className="flex-1 px-4 py-3 border-r border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Prénom</p>
                <input
                  type="text"
                  placeholder="Sophie"
                  value={billing.firstName}
                  onChange={(e) => setBilling({ ...billing, firstName: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex-1 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Nom</p>
                <input
                  type="text"
                  placeholder="Dupont"
                  value={billing.lastName}
                  onChange={(e) => setBilling({ ...billing, lastName: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="px-4 py-3 border-b border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Adresse</p>
              <input
                type="text"
                placeholder="12 rue des Roses"
                value={billing.address}
                onChange={(e) => setBilling({ ...billing, address: e.target.value })}
                className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="flex border-b border-border/60">
              <div className="w-[90px] px-4 py-3 border-r border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Code postal</p>
                <input
                  type="text"
                  placeholder="75001"
                  value={billing.zip}
                  onChange={(e) => setBilling({ ...billing, zip: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex-1 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Ville</p>
                <input
                  type="text"
                  placeholder="Paris"
                  value={billing.city}
                  onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Pays</p>
              <select
                value={billing.country}
                onChange={(e) => setBilling({ ...billing, country: e.target.value })}
                className="w-full text-sm font-sans bg-transparent outline-none text-foreground"
              >
                {["France","Belgique","Suisse","Luxembourg","Canada","Autre"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between px-5 py-4 bg-card border-2 border-border rounded-2xl">
          <div>
            <p className="text-sm font-semibold font-sans">Total à régler</p>
            <p className="text-[10px] text-muted-foreground font-sans">Paiement unique · Accès à vie</p>
          </div>
          <span className="font-heading text-3xl font-bold text-primary">{totalPrice}€</span>
        </div>

        {/* Payment methods */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Mode de paiement
          </p>
          <div className="flex gap-2 mb-3">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayMethod(m.id)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl border-2 text-[11px] font-bold font-sans transition-all",
                  payMethod === m.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {payMethod === "card" && (
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden mb-3">
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Numéro de carte</p>
                <input type="text" placeholder="1234  5678  9012  3456" className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40" readOnly />
              </div>
              <div className="flex">
                <div className="flex-1 px-4 py-3 border-r border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Expiration</p>
                  <input type="text" placeholder="MM / AA" className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40" readOnly />
                </div>
                <div className="w-[100px] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">CVC</p>
                  <input type="text" placeholder="•••" className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40" readOnly />
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Nom sur la carte</p>
                <input type="text" placeholder="Sophie Dupont" className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40" readOnly />
              </div>
            </div>
          )}

          {(payMethod === "apple" || payMethod === "google" || payMethod === "paypal") && (
            <div className="bg-muted/30 rounded-2xl p-4 text-center mb-3">
              <p className="text-sm text-muted-foreground font-sans">
                {payMethod === "apple" && "Apple Pay sera activé via Stripe au moment du paiement."}
                {payMethod === "google" && "Google Pay sera activé via Stripe au moment du paiement."}
                {payMethod === "paypal" && "Vous serez redirigé vers PayPal pour finaliser le paiement."}
              </p>
            </div>
          )}
        </div>

        {/* Stripe badge */}
        <p className="text-center text-[11px] text-muted-foreground/60 font-sans flex items-center justify-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          Paiement sécurisé par Stripe
        </p>

        {/* Pay button */}
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base font-sans flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
          {isLoading ? "Traitement..." : `Payer ${totalPrice}€`}
        </button>

        <p className="text-center text-[10px] text-muted-foreground/50 font-sans leading-relaxed">
          En validant, vous acceptez nos CGV et notre politique de confidentialité.<br />
          Paiement unique · Sans abonnement · Accès à vie garanti.
        </p>
      </div>

      {/* Preview overlay */}
      {showPreview && (
        <ThemeDemoOverlay
          themeId={theme}
          themeName={THEME_NAMES[theme] ?? "Floral"}
          onClose={() => setShowPreview(false)}
          onSelect={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

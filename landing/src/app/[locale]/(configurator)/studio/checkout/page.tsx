"use client";

import { useState, useEffect } from "react";
import { StepTransition } from "@/components/configurator/StepTransition";
import { useRouter } from "@/navigation";
import { selectTotalPrice, useOrderStore } from "@/stores/use-order-store";
import { cn } from "@/lib/utils";
import { Edit2, Eye, CreditCard, Loader2 } from "lucide-react";
import { ThemeDemoOverlay } from "@/components/configurator/ThemeDemoOverlay";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const THEME_NAMES: Record<string, string> = {
  "theme-floral":     "Floral",
  "theme-minimalist": "Minimalist",
  "theme-boho":       "Boho",
  "theme-royal":      "Royal",
  "theme-modern":     "Modern",
};

function StripePaymentForm({ totalPrice, onSuccess }: { totalPrice: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/fr/studio/checkout?payment_success=true`,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "Une erreur est survenue.");
      setIsLoading(false);
    }
    // Si succès, Stripe redirige vers return_url
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {errorMessage && (
        <p className="text-sm text-red-500 font-sans">{errorMessage}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base font-sans flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
        {isLoading ? "Traitement..." : `Payer ${totalPrice}€`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { plan, animation, theme, modules, languages, extras, adultsOnly, weddingInfo } = useOrderStore();
  const totalPrice = useOrderStore(selectTotalPrice);

  const [showPreview, setShowPreview] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntent() {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: { plan, modules, languages, extras },
            email: weddingInfo.email,
          }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setFetchError(data.error ?? "Impossible d'initialiser le paiement.");
        }
      } catch {
        setFetchError("Erreur de connexion au serveur de paiement.");
      }
    }
    fetchIntent();
  }, [plan, modules, languages, extras, weddingInfo.email]);

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
    <StepTransition>
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
            href="/studio/wedding"
          />
          <RecapRow label="Offre" value={`Pack ${plan === "premium" ? "Premium" : "Essentiel"} — ${plan === "premium" ? "575" : "175"}€`} href="/studio/plan" />
          <RecapRow label="Animation & Thème" value={`${animation || "—"} · ${THEME_NAMES[theme] || "—"}`} href="/studio/animation" />
          <RecapRow label="Modules" href="/studio/modules">
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
            <RecapRow label="Options" href="/studio/extras">
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

        {/* Total */}
        <div className="flex items-center justify-between px-5 py-4 bg-card border-2 border-border rounded-2xl">
          <div>
            <p className="text-sm font-semibold font-sans">Total à régler</p>
            <p className="text-[10px] text-muted-foreground font-sans">Paiement unique · Accès à vie</p>
          </div>
          <span className="font-heading text-3xl font-bold text-primary">{totalPrice}€</span>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-sans">Paiement sécurisé</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Stripe Elements */}
        {fetchError ? (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-sm text-red-500 font-sans">{fetchError}</p>
          </div>
        ) : !clientSecret ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-sans animate-pulse">Initialisation du paiement sécurisé...</p>
          </div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" }, wallets: { applePay: "auto", googlePay: "auto" } }}
          >
            <StripePaymentForm totalPrice={totalPrice} onSuccess={() => {}} />
          </Elements>
        )}

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
    </StepTransition>
  );
}

"use client";

import { createWedding } from "@/actions/create-wedding";
import { StepTransition } from "@/components/configurator/StepTransition";
import { ThemeDemoOverlay } from "@/components/configurator/ThemeDemoOverlay";
import { useRouter } from "@/navigation";
import {
  EXTRA_PRICES,
  LANGUAGE_PRICE,
  selectTotalPrice,
  useOrderStore,
} from "@/stores/use-order-store";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { APP_MODULES } from "@shared/data/modules";
import { CreditCard, Edit2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const MODULE_NAMES: Record<string, string> = Object.fromEntries(
  APP_MODULES.map((m) => [m.id, m.name]),
);

function PaymentSkeleton() {
  return (
    <div className='flex flex-col gap-3 animate-pulse'>
      <div className='h-12 rounded-xl bg-muted/60' />
      <div className='h-12 rounded-xl bg-muted/60' />
      <div className='grid grid-cols-2 gap-3'>
        <div className='h-12 rounded-xl bg-muted/60' />
        <div className='h-12 rounded-xl bg-muted/60' />
      </div>
      <div className='h-12 rounded-xl bg-muted/60' />
      <div className='h-14 rounded-2xl bg-muted/40 mt-1' />
    </div>
  );
}

const THEME_NAMES: Record<string, string> = {
  "theme-floral": "Floral",
  "theme-minimalist": "Minimalist",
  "theme-boho": "Boho",
  "theme-royal": "Royal",
  "theme-modern": "Modern",
};

const EXTRA_NAMES: Record<string, string> = {
  "custom-music": "Musique personnalisée",
  "custom-illustration": "Illustration sur mesure",
  "animated-video": "Vidéo animée",
  "custom-domain": "Domaine personnalisé",
};

function StripePaymentForm({
  totalPrice,
  onSuccess,
}: {
  totalPrice: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !agreedToTerms) return;

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
    <form
      onSubmit={handleSubmit}
      className='flex flex-col gap-4'
    >
      <PaymentElement
        options={{ wallets: { applePay: "auto", googlePay: "auto" } }}
      />
      {errorMessage && (
        <p className='text-sm text-red-500 font-sans'>{errorMessage}</p>
      )}

      {/* CGV checkbox */}
      <label className='flex items-start gap-3 cursor-pointer group'>
        <div className='relative mt-0.5 flex-shrink-0'>
          <input
            type='checkbox'
            checked={agreedToTerms}
            onChange={(e) => { setAgreedToTerms(e.target.checked); if (e.target.checked) setErrorMessage(null); }}
            className='sr-only'
          />
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              agreedToTerms
                ? "bg-primary border-primary"
                : "border-border group-hover:border-primary/50"
            }`}
          >
            {agreedToTerms && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-primary-foreground">
                <polyline points="1 4 3.5 6.5 9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>
        <span className='text-xs text-muted-foreground font-sans leading-relaxed'>
          J&apos;accepte les{" "}
          <a
            href='/cgv'
            target='_blank'
            rel='noopener noreferrer'
            className='underline underline-offset-2 hover:text-primary transition-colors'
            onClick={(e) => e.stopPropagation()}
          >
            Conditions Générales de Vente
          </a>{" "}
          et la{" "}
          <a
            href='/politique-de-confidentialite'
            target='_blank'
            rel='noopener noreferrer'
            className='underline underline-offset-2 hover:text-primary transition-colors'
            onClick={(e) => e.stopPropagation()}
          >
            politique de confidentialité
          </a>
        </span>
      </label>

      <button
        type='submit'
        disabled={!stripe || isLoading || !agreedToTerms}
        className='w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base font-sans flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors'
      >
        {isLoading ? (
          <Loader2 className='w-5 h-5 animate-spin' />
        ) : (
          <CreditCard className='w-5 h-5' />
        )}
        {isLoading ? "Traitement..." : `Payer ${totalPrice}€`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    plan,
    animation,
    theme,
    modules,
    languages,
    extras,
    adultsOnly,
    weddingInfo,
  } = useOrderStore();
  const totalPrice = useOrderStore(selectTotalPrice);

  const isPaymentSuccess = searchParams.get("payment_success") === "true";
  const hasHydrated = useOrderStore((state) => state._hasHydrated);

  const [showPreview, setShowPreview] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [agreedToTermsAfterPayment, setAgreedToTermsAfterPayment] = useState(false);

  async function provision() {
    setIsProvisioning(true);
    const nameParts = weddingInfo.partner1.trim().split(" ");
    const firstName = nameParts[0] || weddingInfo.partner1;
    const lastName = nameParts.slice(1).join(" ") || "";
    const MONTHS_FR = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    const monthIndex = MONTHS_FR.indexOf(weddingInfo.month) + 1;
    const weddingDate =
      weddingInfo.day && monthIndex > 0 && weddingInfo.year
        ? `${weddingInfo.year}-${String(monthIndex).padStart(2, "0")}-${String(weddingInfo.day).padStart(2, "0")}`
        : undefined;

    const result = await createWedding({
      email: weddingInfo.email,
      password: weddingInfo.password,
      firstName,
      lastName,
      partnerName: weddingInfo.partner2,
      weddingDate,
      themeId: theme,
      modules,
      extras,
      languages,
      plan: plan ?? "experience",
      adultsOnly,
      animationId: animation,
    });

    if (result.success && result.loginLink) {
      window.location.href = result.loginLink;
    } else if (result.success) {
      router.push("/studio/success");
    } else {
      setProvisionError(result.error ?? "Une erreur est survenue.");
      setIsProvisioning(false);
    }
  }

  // Fetch payment intent (only when not in payment success state)
  useEffect(() => {
    if (isPaymentSuccess) return;

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
  }, [isPaymentSuccess, plan, modules, languages, extras, weddingInfo.email]);

  const RecapRow = ({
    label,
    value,
    href,
    children,
  }: {
    label: string;
    value?: string;
    href?: string;
    children?: React.ReactNode;
  }) => (
    <div className='flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-b-0'>
      <div className='flex-1 min-w-0'>
        <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans'>
          {label}
        </p>
        {value && <p className='text-sm font-semibold mt-0.5'>{value}</p>}
        {children}
      </div>
      {href && (
        <button
          onClick={() => router.push(href)}
          className='w-7 h-7 rounded-full border border-border flex items-center justify-center flex-shrink-0 hover:border-primary transition-colors'
        >
          <Edit2 className='w-3 h-3 text-muted-foreground' />
        </button>
      )}
    </div>
  );

  // Show CGV confirmation screen after PayPal redirect, then provisioning
  if (isPaymentSuccess) {
    return (
      <StepTransition>
        <div className='flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4'>
          {provisionError ? (
            <div className='bg-red-50 border border-red-100 rounded-2xl p-6 max-w-sm'>
              <p className='text-red-500 font-sans text-sm'>{provisionError}</p>
            </div>
          ) : isProvisioning ? (
            <>
              <Loader2 className='w-12 h-12 text-primary animate-spin' />
              <div>
                <p className='font-heading text-2xl font-bold'>Création de votre site...</p>
                <p className='text-muted-foreground text-sm font-sans mt-2'>Cela prend quelques secondes.</p>
              </div>
            </>
          ) : (
            <div className='flex flex-col items-center gap-6 max-w-sm w-full'>
              <div className='w-14 h-14 rounded-full bg-green-50 flex items-center justify-center'>
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='text-green-500'>
                  <polyline points='20 6 9 17 4 12' />
                </svg>
              </div>
              <div>
                <p className='font-heading text-2xl font-bold'>Paiement confirmé !</p>
                <p className='text-muted-foreground text-sm font-sans mt-2'>Acceptez les conditions pour finaliser la création de votre site.</p>
              </div>
              <label className='flex items-start gap-3 cursor-pointer group text-left w-full bg-card border border-border/60 rounded-2xl p-4'>
                <div className='relative mt-0.5 flex-shrink-0'>
                  <input
                    type='checkbox'
                    checked={agreedToTermsAfterPayment}
                    onChange={(e) => setAgreedToTermsAfterPayment(e.target.checked)}
                    className='sr-only'
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${agreedToTermsAfterPayment ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"}`}>
                    {agreedToTermsAfterPayment && (
                      <svg width='10' height='8' viewBox='0 0 10 8' fill='none' className='text-primary-foreground'>
                        <polyline points='1 4 3.5 6.5 9 1' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
                      </svg>
                    )}
                  </div>
                </div>
                <span className='text-xs text-muted-foreground font-sans leading-relaxed'>
                  J&apos;accepte les{" "}
                  <a href='/cgv' target='_blank' rel='noopener noreferrer' className='underline underline-offset-2 hover:text-primary transition-colors' onClick={(e) => e.stopPropagation()}>
                    Conditions Générales de Vente
                  </a>{" "}
                  et la{" "}
                  <a href='/politique-de-confidentialite' target='_blank' rel='noopener noreferrer' className='underline underline-offset-2 hover:text-primary transition-colors' onClick={(e) => e.stopPropagation()}>
                    politique de confidentialité
                  </a>
                </span>
              </label>
              <button
                onClick={provision}
                disabled={!agreedToTermsAfterPayment}
                className='w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base font-sans flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors'
              >
                Créer mon site
              </button>
            </div>
          )}
        </div>
      </StepTransition>
    );
  }

  return (
    <StepTransition>
      <>
        {/* Title — full width above grid */}
        <div className='text-center space-y-2 pb-2 max-w-lg mx-auto px-4 md:max-w-4xl'>
          <h1 className='font-heading text-3xl font-bold md:text-4xl'>
            Votre commande est{" "}
            <span className='italic text-primary'>prête</span>
          </h1>
          <p className='text-muted-foreground text-sm font-sans'>
            Vérifiez vos choix et finalisez votre site d&apos;invitation.
          </p>
        </div>

        {/* 2-col grid on desktop */}
        <div className='flex flex-col gap-5 max-w-lg mx-auto px-4 md:max-w-4xl md:grid md:grid-cols-2 md:gap-10 md:items-start'>
          {/* LEFT COL: recap + pricing + preview + total */}
          <div className='flex flex-col gap-4'>
            {/* Recap */}
            <div className='bg-card border-2 border-border/60 rounded-2xl overflow-hidden'>
              <RecapRow
                label='Les mariés'
                value={`${weddingInfo.partner1 || "—"} & ${weddingInfo.partner2 || "—"} · ${weddingInfo.day || "—"} ${weddingInfo.month || ""} ${weddingInfo.year || ""}`}
                href='/studio/start'
              />
              <RecapRow
                label='Animation & Thème'
                value={`${animation || "—"} · ${THEME_NAMES[theme] || "—"}`}
                href='/studio/animation'
              />
              <RecapRow
                label='Modules'
                href='/studio/modules'
              >
                <div className='flex flex-wrap gap-1 mt-1'>
                  {modules.slice(0, 4).map((m) => (
                    <span
                      key={m}
                      className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans'
                    >
                      {MODULE_NAMES[m] ?? m}
                    </span>
                  ))}
                  {modules.length > 4 && (
                    <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-sans'>
                      +{modules.length - 4}
                    </span>
                  )}
                </div>
              </RecapRow>
              <RecapRow
                label='Compte'
                value={weddingInfo.email || "—"}
                href='/studio/start'
              />
              <RecapRow
                label='Mot de passe'
                href='/studio/start'
              >
                <div className='flex items-center gap-2 mt-0.5'>
                  <span className='text-sm font-semibold tracking-widest'>
                    {showPassword ? (weddingInfo.password || "—") : (weddingInfo.password ? "••••••••" : "—")}
                  </span>
                  {weddingInfo.password && (
                    <button
                      onClick={() => setShowPassword((v) => !v)}
                      className='text-muted-foreground hover:text-primary transition-colors'
                    >
                      {showPassword ? <EyeOff className='w-3.5 h-3.5' /> : <Eye className='w-3.5 h-3.5' />}
                    </button>
                  )}
                </div>
              </RecapRow>
              {(languages.length > 0 || extras.length > 0 || adultsOnly) && (
                <RecapRow
                  label='Options'
                  href='/studio/options'
                >
                  <div className='flex flex-wrap gap-1 mt-1'>
                    {languages.map((l) => (
                      <span
                        key={l}
                        className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans'
                      >
                        {l.toUpperCase()} +{LANGUAGE_PRICE}€
                      </span>
                    ))}
                    {extras.map((e) => (
                      <span
                        key={e}
                        className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans'
                      >
                        {e}
                      </span>
                    ))}
                    {adultsOnly && (
                      <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-sans'>
                        Adults Only
                      </span>
                    )}
                  </div>
                </RecapRow>
              )}
            </div>

            {/* Pricing breakdown */}
            {plan && (
              <div className='rounded-2xl border border-border/60 bg-card overflow-hidden'>
                <div className='flex items-center justify-between px-4 py-3 border-b border-border/40'>
                  <span className='text-sm font-bold'>
                    Pack {plan === "premium" ? "Premium" : "Essentiel"}
                  </span>
                  <span className='text-sm font-bold'>
                    {plan === "premium" ? "575" : "175"}€
                  </span>
                </div>
                {plan === "experience" && modules.length > 4 && (
                  <div className='flex items-center justify-between px-4 py-3 border-b border-border/40'>
                    <span className='text-sm text-muted-foreground font-sans'>
                      {modules.length - 4} module
                      {modules.length - 4 > 1 ? "s" : ""} supplémentaire
                      {modules.length - 4 > 1 ? "s" : ""}
                    </span>
                    <span className='text-sm font-semibold text-muted-foreground font-sans'>
                      +{(modules.length - 4) * 5}€
                    </span>
                  </div>
                )}
                {languages.map((l) => (
                  <div
                    key={l}
                    className='flex items-center justify-between px-4 py-3 border-b border-border/40'
                  >
                    <span className='text-sm text-muted-foreground font-sans'>
                      Langue : {l.toUpperCase()}
                    </span>
                    <span className='text-sm font-semibold text-muted-foreground font-sans'>
                      +{LANGUAGE_PRICE}€
                    </span>
                  </div>
                ))}
                {extras.map((e) => (
                  <div
                    key={e}
                    className='flex items-center justify-between px-4 py-3 border-b border-border/40 last:border-b-0'
                  >
                    <span className='text-sm text-muted-foreground font-sans'>
                      {EXTRA_NAMES[e] ?? e}
                    </span>
                    <span className='text-sm font-semibold text-muted-foreground font-sans'>
                      +{EXTRA_PRICES[e] ?? 0}€
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className='flex items-center justify-between px-5 py-4 bg-card border-2 border-border rounded-2xl'>
              <div>
                <p className='text-sm font-semibold font-sans'>
                  Total à régler
                </p>
                <p className='text-[10px] text-muted-foreground font-sans'>
                  Paiement unique · Accès à vie
                </p>
              </div>
              <span className='font-heading text-3xl font-bold text-primary'>
                {totalPrice}€
              </span>
            </div>

            {/* Guarantees */}
            <div className='flex flex-col gap-2'>
              {[
                "Paiement unique — sans abonnement",
                "Accès immédiat après confirmation",
                "Support par email sous 24h",
              ].map((g) => (
                <div
                  key={g}
                  className='flex items-center gap-2 text-xs text-muted-foreground font-sans'
                >
                  <svg
                    width='12'
                    height='12'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='text-primary flex-shrink-0'
                  >
                    <polyline points='20 6 9 17 4 12' />
                  </svg>
                  {g}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COL: Stripe payment */}
          <div className='flex flex-col gap-5'>
            <h2 className='hidden md:block font-heading text-xl font-bold'>
              Paiement sécurisé
            </h2>

            {/* Separator — mobile only */}
            <div className='flex items-center gap-3 md:hidden'>
              <div className='flex-1 h-px bg-border' />
              <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 font-sans'>
                Paiement sécurisé
              </span>
              <div className='flex-1 h-px bg-border' />
            </div>

            {/* Preview button — above payment form */}
            <button
              onClick={() => setShowPreview(true)}
              className='w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-primary text-primary font-bold text-sm font-sans hover:bg-primary/5 transition-colors'
            >
              <Eye className='w-4 h-4' />
              Voir l&apos;aperçu de mon site
            </button>

            {/* Stripe Elements */}
            {fetchError ? (
              <div className='rounded-2xl bg-red-50 border border-red-100 px-4 py-3'>
                <p className='text-sm text-red-500 font-sans'>{fetchError}</p>
              </div>
            ) : !clientSecret ? (
              <PaymentSkeleton />
            ) : (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: "stripe" } }}
              >
                <StripePaymentForm
                  totalPrice={totalPrice}
                  onSuccess={() => {}}
                />
              </Elements>
            )}

            <p className='text-center text-[10px] text-muted-foreground/50 font-sans leading-relaxed'>
              Paiement unique · Sans abonnement · Accès à vie garanti.
            </p>
          </div>
        </div>

        {/* Preview overlay — OUTSIDE grid, at fragment level */}
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

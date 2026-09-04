"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  CreditCard,
  Loader2,
  Mail,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { getModuleName } from "@shared/data/modules";
import { cn } from "@shared/lib/utils";
import { createWedding } from "@/actions/create-wedding";
import { StepTransition } from "@/components/studio/StepTransition";
import { ANIMATION_CATEGORIES } from "@/components/studio/animations";
import { ALL_LANGUAGES, EXTRAS } from "@/components/studio/options";
import { THEMES } from "@/components/studio/themes";
import { useRouter } from "@/navigation";
import { selectTotalPrice, useOrderStore } from "@/stores/use-order-store";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

/** Where a customer whose provisioning failed can reach a human. */
const SUPPORT_EMAIL = "contact@thestudiopapeteriedigitale.com";

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const ALL_VARIANTS = ANIMATION_CATEGORIES.flatMap((c) => c.variants);

function labelFor(id: string, list: { id: string; name: string }[]): string {
  return list.find((x) => x.id === id)?.name ?? id;
}

function PaymentForm({
  totalPrice,
  onSuccess,
}: {
  totalPrice: number;
  onSuccess: () => void;
}) {
  const t = useTranslations("StudioCheckout");
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !agreed) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Locale-prefixed: a redirect-based method (Klarna, iDEAL, Bancontact —
        // all enabled by automatic_payment_methods) must bring the customer
        // back to the language they were paying in, not to /fr.
        return_url: `${window.location.origin}/${locale}/studio/checkout?payment_success=true`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? t("paymentError"));
      setIsLoading(false);
      return;
    }

    // Payment methods that settle inline (cards) never redirect, so
    // provisioning has to be kicked off here as well.
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement
        options={{ wallets: { applePay: "auto", googlePay: "auto" } }}
      />

      {errorMessage && (
        <p className="font-body text-sm text-red-500">{errorMessage}</p>
      )}

      <label className="group flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            if (e.target.checked) setErrorMessage(null);
          }}
          className="sr-only"
        />
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors",
            agreed
              ? "border-studio-violet bg-studio-violet"
              : "border-studio-lavande bg-white group-hover:border-studio-violet/50",
          )}
        >
          {agreed && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
        </span>
        <span className="font-body text-xs leading-relaxed text-studio-violet/70">
          {t("acceptTerms")}{" "}
          <a
            href="/legal/cgv"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-studio-violet"
            onClick={(e) => e.stopPropagation()}
          >
            {t("cgv")}
          </a>{" "}
          {t("and")}{" "}
          <a
            href="/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-studio-violet"
            onClick={(e) => e.stopPropagation()}
          >
            {t("privacy")}
          </a>
        </span>
      </label>

      <button
        type="submit"
        disabled={!stripe || isLoading || !agreed}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-studio-violet py-4 font-body text-base font-semibold text-white transition-colors hover:bg-studio-violet/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CreditCard className="h-5 w-5" />
        )}
        {isLoading ? t("processing") : t("payButton", { amount: totalPrice })}
      </button>

      <p className="text-center font-body text-[11px] text-studio-violet/50">
        {t("magicLinkNote")}
      </p>
    </form>
  );
}

export default function StudioCheckoutPage() {
  const t = useTranslations("StudioCheckout");
  const tLayout = useTranslations("StudioLayout");
  const tModules = useTranslations("StudioModules");
  const locale = useLocale();
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
  const hasHydrated = useOrderStore((s) => s._hasHydrated);

  const isPaymentSuccess = searchParams.get("payment_success") === "true";

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  // Mirrors paymentIntentId for the repricing effect below, which must not
  // re-run when the id changes (that would loop) yet still needs the current
  // value. Reading the state variable there captured the initial null and
  // created a fresh intent on every cart edit instead of repricing one.
  const intentIdRef = useRef<string | null>(null);

  // Provisioning must fire exactly once per payment: the effect that triggers
  // it runs again on every re-render caused by its own state updates.
  const provisionStartedRef = useRef(false);

  // Stripe appends this on redirect-based methods; for inline ones we still
  // hold the id in state.
  const intentIdFromUrl = searchParams.get("payment_intent");

  const provision = useCallback(async () => {
    const intentId = intentIdFromUrl ?? intentIdRef.current;
    if (!intentId) {
      setProvisionError(t("paymentError"));
      return;
    }

    provisionStartedRef.current = true;
    setIsProvisioning(true);
    setProvisionError(null);

    const nameParts = weddingInfo.partner1.trim().split(" ");
    const firstName = nameParts[0] || weddingInfo.partner1;
    const lastName = nameParts.slice(1).join(" ") || "";

    const monthIndex = MONTHS_FR.indexOf(weddingInfo.month) + 1;
    const weddingDate =
      weddingInfo.day && monthIndex > 0 && weddingInfo.year
        ? `${weddingInfo.year}-${String(monthIndex).padStart(2, "0")}-${String(weddingInfo.day).padStart(2, "0")}`
        : undefined;

    const result = await createWedding({
      paymentIntentId: intentId,
      email: weddingInfo.email,
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
      // Opens the dashboard in the language they bought in.
      locale,
    });

    if (result.success && result.loginLink) {
      window.location.href = result.loginLink;
    } else if (!result.success) {
      setProvisionError(result.error ?? t("paymentError"));
      setIsProvisioning(false);
    }
  }, [
    weddingInfo, theme, modules, extras, languages, plan, adultsOnly,
    animation, t, intentIdFromUrl, locale,
  ]);

  // Provision right away when Stripe redirected back after payment.
  useEffect(() => {
    if (!isPaymentSuccess || !hasHydrated) return;
    if (provisionStartedRef.current) return;
    provision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaymentSuccess, hasHydrated]);

  // Create the payment intent once the persisted order is available.
  useEffect(() => {
    if (isPaymentSuccess || !hasHydrated || !plan) return;

    // A fast sequence of cart edits fires overlapping requests; only the last
    // one may set the client secret, or the PaymentElement ends up mounted
    // against a superseded (wrongly priced) intent.
    let cancelled = false;

    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: { plan, modules, languages, extras },
        email: weddingInfo.email,
        // Reprice the same intent when the cart changed, instead of leaving a
        // stale amount attached to the mounted PaymentElement.
        paymentIntentId: intentIdRef.current,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;

        // A zero total yields no client secret by design. Surface it instead
        // of dropping into the loading branch, which never resolves.
        if (!data.error && data.clientSecret === null && data.amount === 0) {
          setFetchError(t("paymentError"));
          return;
        }

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          intentIdRef.current = data.paymentIntentId ?? null;
          setPaymentIntentId(data.paymentIntentId ?? null);
          setFetchError(null);
        } else {
          setFetchError(data.error ?? t("paymentError"));
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError(t("paymentError"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isPaymentSuccess, plan, modules, languages, extras]);

  // ── Post-payment: provisioning screen ──
  //
  // The failure branch here is the costliest state in the whole funnel: the
  // money has left the customer's account and they have nothing to show for
  // it. It used to reuse the success title ("Paiement confirmé !") with the
  // raw error underneath and a retry button labelled "Traitement…", and it
  // never showed the payment reference — so a customer who could not recover
  // had nothing to quote to support either.
  if (isPaymentSuccess) {
    const reference = intentIdFromUrl ?? paymentIntentId;

    if (provisionError) {
      const supportSubject = t("paymentReference") + (reference ? `: ${reference}` : "");

      return (
        <StepTransition>
          <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-studio-jaune">
              <AlertTriangle
                className="h-7 w-7 text-studio-violet"
                strokeWidth={2}
              />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-h3 text-studio-violet">
                {t("provisionFailedTitle")}
              </h1>
              <p className="font-body text-sm leading-relaxed text-studio-violet/70">
                {t("provisionFailedBody")}
              </p>
            </div>

            {/* Reassurance first: the charge succeeded, and retrying cannot
                double-bill — provisioning is idempotent per PaymentIntent. */}
            <p className="flex items-center gap-2 font-body text-xs font-semibold text-studio-violet/60">
              <ShieldCheck className="h-4 w-4" />
              {t("reassurePaid")}
            </p>

            {reference && (
              <div className="w-full rounded-2xl border border-studio-lavande/60 bg-white/60 px-4 py-3 text-left">
                <p className="font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
                  {t("paymentReference")}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-studio-violet">
                  {reference}
                </p>
                <p className="mt-2 font-body text-[11px] leading-relaxed text-studio-violet/50">
                  {t("paymentReferenceHint")}
                </p>
              </div>
            )}

            {/* The underlying reason, folded away. Server-side failures carry
                hardcoded strings in mixed French and English
                ("Failed to create wedding entity.") that no locale translates,
                so it must never be the headline a paying customer reads — but
                it is the first thing support will ask for. */}
            <details className="w-full text-left">
              <summary className="cursor-pointer list-none font-body text-[11px] text-studio-violet/50 underline underline-offset-2 hover:text-studio-violet/80">
                {t("errorDetails")}
              </summary>
              <p className="mt-2 break-words font-mono text-[11px] leading-relaxed text-studio-violet/60">
                {provisionError}
              </p>
            </details>

            <div className="flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={provision}
                disabled={isProvisioning}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-studio-violet px-6 py-3.5 font-body text-sm font-semibold text-white transition-colors hover:bg-studio-violet/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProvisioning && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isProvisioning ? t("provisionRetrying") : t("provisionRetry")}
              </button>

              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(supportSubject)}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-studio-lavande px-6 py-3 font-body text-sm font-semibold text-studio-violet/80 transition-colors hover:border-studio-violet hover:text-studio-violet"
              >
                <Mail className="h-4 w-4" />
                {t("contactSupport")}
              </a>
            </div>
          </div>
        </StepTransition>
      );
    }

    return (
      <StepTransition>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-studio-violet">
            <Check className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-h3 text-studio-violet">
              {t("paymentSuccessTitle")}
            </h1>
            <p className="mx-auto max-w-xs font-body text-sm text-studio-violet/60">
              {t("paymentSuccessBody")}
            </p>
          </div>
          <div className="flex items-center gap-2 font-body text-sm text-studio-violet/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("creatingAccount")}
          </div>
        </div>
      </StepTransition>
    );
  }

  const recapRows = [
    {
      label: t("offer"),
      // Falls back to the "none" label rather than silently claiming Essentiel:
      // the guard in the steps layout sends a planless order back to /start.
      value: plan === "premium" ? "Premium" : plan ? "Essentiel" : t("none"),
      href: "/studio/start",
    },
    {
      label: t("animation"),
      value: labelFor(animation, ALL_VARIANTS) || t("none"),
      href: "/studio/animation",
    },
    {
      label: t("theme"),
      value: labelFor(theme, THEMES),
      href: "/studio/theme",
    },
    {
      label: t("modulesLabel"),
      value: modules.length
        ? modules.map((m) => getModuleName(tModules, m)).join(", ")
        : t("none"),
      href: "/studio/modules",
    },
    {
      label: t("languagesLabel"),
      value: languages.length
        ? languages
            .map((c) => ALL_LANGUAGES.find((l) => l.code === c)?.name ?? c)
            .join(", ")
        : t("none"),
      href: "/studio/options",
    },
    {
      label: t("extrasLabel"),
      value: extras.length
        ? extras.map((e) => labelFor(e, EXTRAS)).join(", ")
        : t("none"),
      href: "/studio/options",
    },
    ...(adultsOnly
      ? [{ label: t("adultsOnly"), value: "✓", href: "/studio/options" }]
      : []),
    { label: t("contact"), value: weddingInfo.email, href: "/studio/start" },
  ];

  return (
    <StepTransition>
      <div className="flex flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-h2 leading-tight text-studio-violet">
            {t("titlePrefix")}
            <span className="text-studio-pourpre">{t("titleHighlight")}</span>
          </h1>
          <p className="mx-auto max-w-xs font-body text-sm text-studio-violet/60">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 md:grid md:grid-cols-2 md:items-start">
          {/* Recap */}
          <section className="studio-card-border studio-card-fill overflow-hidden rounded-3xl">
            {recapRows.map((row) => (
              <div
                key={row.label}
                className="flex items-start gap-3 border-b border-studio-lavande/30 px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
                    {row.label}
                  </p>
                  <p className="mt-0.5 break-words font-body text-sm font-semibold text-studio-violet">
                    {row.value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(row.href)}
                  aria-label={`${t("edit")} — ${row.label}`}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-studio-lavande/60 transition-colors hover:border-studio-violet"
                >
                  <Pencil className="h-3 w-3 text-studio-violet/60" />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between bg-studio-violet px-4 py-4">
              <span className="font-body text-sm font-semibold uppercase tracking-wider text-white/80">
                {t("total")}
              </span>
              <span className="font-heading text-2xl text-white">
                {totalPrice}€
              </span>
            </div>
          </section>

          {/* Payment */}
          <section className="studio-card-border studio-card-fill rounded-3xl p-5">
            {fetchError ? (
              <p className="font-body text-sm text-red-500">{fetchError}</p>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "flat",
                    variables: {
                      colorPrimary: "#4B3F72",
                      colorText: "#4B3F72",
                      fontFamily: "var(--font-body), sans-serif",
                      borderRadius: "12px",
                    },
                  },
                }}
              >
                <PaymentForm totalPrice={totalPrice} onSuccess={provision} />
              </Elements>
            ) : (
              <div className="flex items-center justify-center gap-2 py-10 font-body text-sm text-studio-violet/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loadingPayment")}
              </div>
            )}
          </section>
        </div>

        {/* The shared layout hides its nav here, so keep a way back. */}
        <button
          type="button"
          onClick={() => router.push("/studio/options")}
          className="mx-auto flex items-center gap-1.5 rounded-full border border-studio-lavande px-5 py-2.5 font-body text-sm font-semibold text-studio-violet/70 transition-colors hover:border-studio-violet hover:text-studio-violet"
        >
          <ChevronLeft className="h-4 w-4" />
          {tLayout("back")}
        </button>
      </div>
    </StepTransition>
  );
}

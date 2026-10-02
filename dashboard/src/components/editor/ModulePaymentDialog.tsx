"use client";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { getModuleName } from "@shared/data/modules";
import { FREE_MODULES_LIMIT, hasMeteredAddOns } from "@shared/lib/pricing";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { type StripeElementLocale, loadStripe } from "@stripe/stripe-js";
import { Check, Loader2, Lock, PartyPopper } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  type ModulePaymentResult,
  completeModulePayment,
  startModulePayment,
} from "@/actions/module-purchase-actions";

import { useEditor } from "./EditorProvider";
import { formatEuros } from "./format-euros";
import { isCharged, paymentOutcome } from "./payment-flow";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/** The fast path; a dropped connection is a failure like any other, not an unhandled rejection. */
const complete = (paymentIntentId: string): Promise<ModulePaymentResult> =>
  completeModulePayment(paymentIntentId).catch(() => ({ ok: false, error: "network" }));

type Step =
  | { kind: "summary" }
  | { kind: "card"; clientSecret: string; modules: string[]; amountCents: number }
  | { kind: "success" };

/**
 * « Publiez votre module » — the summary, the CGV, then Stripe's Payment
 * Element, inside the editor (spec D1, D4). Opened by the save that first
 * stores an unpaid module, by the header chip, the phone strip, or the
 * module's banner.
 */
export function ModulePaymentDialog() {
  const t = useTranslations("Editor.payment");
  const tm = useTranslations("Modules");
  const locale = useLocale();
  const { paymentOpen, paymentFromSave, closePayment, due, meta, applyModuleLists } = useEditor();
  const [step, setStep] = useState<Step>({ kind: "summary" });
  const [accepted, setAccepted] = useState(false);
  const [starting, setStarting] = useState(false);

  const close = () => {
    closePayment();
    setStep({ kind: "summary" });
    setAccepted(false);
  };

  const finish = (result: ModulePaymentResult, charged: boolean) => {
    const outcome = paymentOutcome(result, { charged });
    if (outcome.kind === "failed") {
      toast.error(t("failed"));
      return;
    }
    if (outcome.kind === "confirming") {
      toast.message(t("confirming"));
      close();
      return;
    }
    applyModuleLists(outcome.modules);
    if (outcome.kind === "already-owned") {
      toast.message(t("alreadyOwned"));
      close();
      return;
    }
    setStep({ kind: "success" });
  };

  const pay = async () => {
    setStarting(true);
    const result = await startModulePayment(locale);
    setStarting(false);
    if (!result.ok) {
      toast.error(t("unavailable"));
      return;
    }
    if (result.kind === "nothing") {
      applyModuleLists(result.modules);
      close();
      return;
    }
    if (result.kind === "confirming") {
      toast.message(t("confirming"));
      close();
      return;
    }
    if (result.kind === "settled") {
      applyModuleLists(result.modules);
      setStep({ kind: "success" });
      return;
    }
    setStep({ kind: "card", clientSecret: result.clientSecret, modules: result.modules, amountCents: result.amountCents });
  };

  const later = () => {
    close();
    if (paymentFromSave) toast(t("laterToast"));
  };

  const count = due?.modules.length ?? 0;
  const unitCents = due && count > 0 ? due.amountCents / count : 0;
  const names = (due?.modules ?? []).map((id) => getModuleName(tm, id));

  return (
    <Dialog open={paymentOpen && (Boolean(due) || step.kind !== "summary")} onOpenChange={(open) => (open ? null : close())}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        {step.kind === "summary" && due ? (
          <>
            <DialogHeader className="space-y-2 text-left">
              {paymentFromSave ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("savedKicker")}
                </span>
              ) : null}
              <DialogTitle className="font-heading text-2xl font-normal text-studio-violet">
                {t("title", { count, name: names[0] ?? "" })}
              </DialogTitle>
              <DialogDescription>{t("body", { count })}</DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-studio-lavande/50 p-4 text-sm text-studio-violet">
              {due.modules.map((id, index) => (
                <div key={id} className="flex items-center justify-between gap-3 py-1">
                  <span className="font-semibold">{names[index]}</span>
                  <span>{formatEuros(unitCents, locale)}</span>
                </div>
              ))}
              {hasMeteredAddOns(meta.planId) ? (
                <p className="mt-1 text-xs text-studio-violet/60">{t("planNote", { included: FREE_MODULES_LIMIT })}</p>
              ) : null}
              <div className="mt-3 flex items-center justify-between border-t border-studio-lavande/40 pt-3 font-bold">
                <span>{t("total")}</span>
                <span>{formatEuros(due.amountCents, locale)}</span>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-studio-violet/85">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-studio-violet"
              />
              <span>
                {t.rich("cgv", {
                  count,
                  link: (chunks) => (
                    <a
                      href={`${meta.landingUrl}/${locale}/legal/cgv`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-studio-lavande underline-offset-2"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </span>
            </label>

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={later} className="rounded-full">
                {t("later")}
              </Button>
              <Button
                type="button"
                onClick={() => void pay()}
                disabled={!accepted || starting}
                className="rounded-full bg-studio-violet px-5 font-semibold text-white hover:bg-studio-violet-fonce"
              >
                {starting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {t("pay", { price: formatEuros(due.amountCents, locale) })}
              </Button>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-studio-violet/55">
              <Lock className="h-3 w-3" aria-hidden="true" />
              {t("secure")}
            </p>
          </>
        ) : null}

        {step.kind === "card" ? (
          stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: step.clientSecret,
                locale: locale as StripeElementLocale,
                appearance: { theme: "stripe", variables: { borderRadius: "12px", colorPrimary: "#4B3F72" } },
              }}
            >
              <DialogHeader className="text-left">
                <DialogTitle className="font-heading text-2xl font-normal text-studio-violet">
                  {t("title", { count: step.modules.length, name: getModuleName(tm, step.modules[0]) })}
                </DialogTitle>
              </DialogHeader>
              <CardStep
                modules={step.modules}
                amountCents={step.amountCents}
                onBack={() => setStep({ kind: "summary" })}
                onPaid={async (intentId, charged) => finish(await complete(intentId), charged)}
              />
            </Elements>
          ) : (
            <p className="text-sm text-red-600">{t("unavailable")}</p>
          )
        ) : null}

        {step.kind === "success" ? (
          <div className="space-y-3 py-2 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <PartyPopper className="h-7 w-7" aria-hidden="true" />
            </span>
            <DialogTitle className="font-heading text-2xl font-normal text-studio-violet">{t("successTitle")}</DialogTitle>
            <DialogDescription>{t("successBody")}</DialogDescription>
            <Button
              type="button"
              onClick={close}
              className="rounded-full bg-studio-violet px-6 font-semibold text-white hover:bg-studio-violet-fonce"
            >
              {t("continue")}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CardStep({
  modules,
  amountCents,
  onBack,
  onPaid,
}: {
  modules: string[];
  amountCents: number;
  onBack: () => void;
  onPaid: (paymentIntentId: string, charged: boolean) => Promise<void>;
}) {
  const t = useTranslations("Editor.payment");
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    // PayPal and Klarna leave the page; they come back to this tab of the editor.
    const back = new URL(window.location.href);
    back.searchParams.set("section", modules[0]);
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: back.toString() },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? t("failed"));
      setPaying(false);
      return;
    }
    if (paymentIntent) await onPaid(paymentIntent.id, isCharged(paymentIntent.status));
    setPaying(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Tabs, card open: an accordion hid the card fields behind one more click. */}
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={paying} className="rounded-full">
          {t("back")}
        </Button>
        <Button
          type="submit"
          disabled={!stripe || paying}
          className="rounded-full bg-studio-violet px-5 font-semibold text-white hover:bg-studio-violet-fonce"
        >
          {paying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {paying ? t("processing") : t("pay", { price: formatEuros(amountCents, locale) })}
        </Button>
      </div>
    </form>
  );
}

/**
 * Back from PayPal or Klarna: Stripe appends the intent to the return URL.
 * The save happened before the payment, so the redirect lost nothing.
 */
export function useModulePaymentReturn() {
  const t = useTranslations("Editor.payment");
  const { applyModuleLists } = useEditor();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const url = new URL(window.location.href);
    const intentId = url.searchParams.get("payment_intent");
    if (!intentId) return;
    const charged = isCharged(url.searchParams.get("redirect_status"));
    for (const key of ["payment_intent", "payment_intent_client_secret", "redirect_status"]) {
      url.searchParams.delete(key);
    }
    // `null`, not the current state: with Next's own state the router ignores
    // the change and puts the old address back on its next render.
    window.history.replaceState(null, "", url);

    void complete(intentId).then((result) => {
      const outcome = paymentOutcome(result, { charged });
      if (outcome.kind === "failed") toast.error(t("failed"));
      else if (outcome.kind === "confirming") toast.message(t("confirming"));
      else {
        applyModuleLists(outcome.modules);
        if (outcome.kind === "live") toast.success(t("successTitle"));
        else toast.message(t("alreadyOwned"));
      }
    });
  }, [applyModuleLists, t]);
}

"use client";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { DAY_OF_MODULE, getModuleName } from "@shared/data/modules";
import { EXTRA_MODULE_PRICE } from "@shared/lib/pricing";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { type StripeElementLocale, loadStripe } from "@stripe/stripe-js";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  type ModulePaymentResult,
  completeModulePayment,
  startDayOfPayment,
} from "@/actions/module-purchase-actions";
import { formatEuros } from "@/components/editor/format-euros";
import { isCharged, paymentOutcome } from "@/components/editor/payment-flow";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const LANDING_URL = (
  process.env.NEXT_PUBLIC_LANDING_URL || "https://www.thestudiopapeteriedigitale.com"
).replace(/\/+$/, "");

const complete = (paymentIntentId: string): Promise<ModulePaymentResult> =>
  completeModulePayment(paymentIntentId).catch(() => ({ ok: false, error: "network" }));

/**
 * Adds « Trouve ta place » from the Jour J screen when the plan lacks it:
 * free when Signature still has a slot, otherwise the same 5 € add-on the
 * editor sells, paid here (`startDayOfPayment`).
 */
export function DayOfPurchase({ free }: { free: boolean }) {
  const t = useTranslations("DayOfSettings");
  const tp = useTranslations("Editor.payment");
  const tm = useTranslations("Modules");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [card, setCard] = useState<{ clientSecret: string; amountCents: number } | null>(null);

  const price = formatEuros(EXTRA_MODULE_PRICE * 100, locale);
  const name = getModuleName(tm, DAY_OF_MODULE);

  const unlocked = () => {
    toast.success(t("unlocked"));
    setOpen(false);
    setCard(null);
    router.refresh();
  };

  const finish = (result: ModulePaymentResult, charged: boolean) => {
    const outcome = paymentOutcome(result, { charged });
    if (outcome.kind === "failed") toast.error(tp("failed"));
    else if (outcome.kind === "confirming") {
      toast.message(tp("confirming"));
      setOpen(false);
    } else unlocked();
  };

  // Back from PayPal or Klarna: Stripe appends the intent to the return URL.
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
    window.history.replaceState(null, "", url);
    void complete(intentId).then((result) => finish(result, charged));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    setStarting(true);
    const result = await startDayOfPayment(locale);
    setStarting(false);
    if (!result.ok) {
      toast.error(tp("unavailable"));
      return;
    }
    if (result.kind === "granted") unlocked();
    else if (result.kind === "confirming") {
      toast.message(tp("confirming"));
      setOpen(false);
    } else setCard({ clientSecret: result.clientSecret, amountCents: result.amountCents });
  };

  if (free) {
    return (
      <Button
        type="button"
        onClick={() => void start()}
        disabled={starting}
        className="mt-3 rounded-full bg-studio-violet px-5 font-semibold text-white hover:bg-studio-violet-fonce"
      >
        {starting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {t("add_free_cta")}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 rounded-full bg-studio-violet px-5 font-semibold text-white hover:bg-studio-violet-fonce"
      >
        {t("add_cta", { price })}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setCard(null);
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-heading text-2xl font-normal text-studio-violet">{name}</DialogTitle>
            <DialogDescription>{tm(`catalog.${DAY_OF_MODULE}.description`)}</DialogDescription>
          </DialogHeader>

          {card && stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: card.clientSecret,
                locale: locale as StripeElementLocale,
                appearance: { theme: "stripe", variables: { borderRadius: "12px", colorPrimary: "#4B3F72" } },
              }}
            >
              <CardStep
                amountCents={card.amountCents}
                onBack={() => setCard(null)}
                onPaid={async (intentId, charged) => finish(await complete(intentId), charged)}
              />
            </Elements>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-2xl border border-studio-lavande/50 p-4 text-sm font-bold text-studio-violet">
                <span>{tp("total")}</span>
                <span>{price}</span>
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-studio-violet/85">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-studio-violet"
                />
                <span>
                  {tp.rich("cgv", {
                    count: 1,
                    link: (chunks) => (
                      <a
                        href={`${LANDING_URL}/${locale}/legal/cgv`}
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
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void start()}
                  disabled={!accepted || starting}
                  className="rounded-full bg-studio-violet px-5 font-semibold text-white hover:bg-studio-violet-fonce"
                >
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {tp("pay", { price })}
                </Button>
              </div>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-studio-violet/55">
                <Lock className="h-3 w-3" aria-hidden="true" />
                {tp("secure")}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CardStep({
  amountCents,
  onBack,
  onPaid,
}: {
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

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
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

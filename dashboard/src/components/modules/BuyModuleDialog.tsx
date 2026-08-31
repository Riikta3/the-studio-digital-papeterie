"use client";

import { activatePurchasedModule } from "@/actions/purchase-module-actions";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { APP_MODULES, getModuleName } from "@shared/data/modules";
import { CheckCircle2, Loader2, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PendingActivation {
  moduleId: string;
  moduleName: string;
  paymentIntentId: string;
}

// ─── Inner payment form (CB) ───────────────────────────────────────────────

interface PaymentFormProps {
  moduleId: string;
  moduleName: string;
  onSuccess: () => void;
}

function PaymentForm({ moduleId, moduleName, onSuccess }: PaymentFormProps) {
  const t = useTranslations("BuyModuleDialog");
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set("module_pending", moduleId);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl.toString() },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || t("generic_error"));
        return;
      }

      // CB path: no redirect, activate directly
      if (paymentIntent?.status === "succeeded") {
        await activatePurchasedModule({ moduleId, paymentIntentId: paymentIntent.id });
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || t("unexpected_error"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-secondary/40 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm text-foreground font-medium">{moduleName}</span>
        <span className="font-bold text-foreground">10 €</span>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />

      {errorMessage && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
          {errorMessage}
        </div>
      )}

      <Button type="submit" disabled={isProcessing || !stripe || !elements} className="w-full">
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("processing_payment")}
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t("pay_and_activate")}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("secured_by_stripe")}
      </p>
    </form>
  );
}

// ─── Confirmation state (PayPal / Klarna return) ───────────────────────────

interface ConfirmActivationProps {
  moduleName: string;
  moduleId: string;
  paymentIntentId: string;
  onSuccess: () => void;
}

function ConfirmActivation({ moduleName, moduleId, paymentIntentId, onSuccess }: ConfirmActivationProps) {
  const t = useTranslations("BuyModuleDialog");
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleActivate = async () => {
    setIsActivating(true);
    setErrorMessage("");
    try {
      await activatePurchasedModule({ moduleId, paymentIntentId });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || t("activation_error"));
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm text-teal-600">{t("payment_confirmed")}</p>
          <p className="text-xs text-teal-600 mt-0.5">
            {t("payment_received", { moduleName })}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
          {errorMessage}
        </div>
      )}

      <Button onClick={handleActivate} disabled={isActivating} className="w-full">
        {isActivating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("activating")}
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t("activate_module")}
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Success state ─────────────────────────────────────────────────────────

function SuccessState({
  moduleName,
  moduleId,
  onClose,
}: {
  moduleName: string;
  moduleId: string;
  onClose: () => void;
}) {
  const t = useTranslations("BuyModuleDialog");
  const router = useRouter();

  const handleConfigure = () => {
    onClose();
    router.push(`/modules/${moduleId}`);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <p className="font-semibold text-foreground text-lg">{t("module_activated")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("module_available", { moduleName })}
        </p>
      </div>
      <Button onClick={handleConfigure} className="mt-2">
        {t("configure_module")}
      </Button>
    </div>
  );
}

// ─── Redirect return handler (singleton — mounted once at page level) ──────

function RedirectReturnInner({
  onPendingActivation,
}: {
  onPendingActivation: (data: PendingActivation) => void;
}) {
  const t = useTranslations("BuyModuleDialog");
  const searchParams = useSearchParams();

  useEffect(() => {
    const clientSecret = searchParams.get("payment_intent_client_secret");
    const modulePending = searchParams.get("module_pending");
    const redirectStatus = searchParams.get("redirect_status");

    if (!clientSecret || !modulePending) return;

    // Clean URL immediately to avoid loops on refresh
    const clean = new URL(window.location.href);
    clean.searchParams.delete("payment_intent");
    clean.searchParams.delete("payment_intent_client_secret");
    clean.searchParams.delete("redirect_status");
    clean.searchParams.delete("module_pending");
    window.history.replaceState({}, "", clean.pathname + (clean.search || ""));

    if (redirectStatus !== "succeeded") {
      toast.error(t("payment_failed_or_canceled"));
      return;
    }

    async function handleReturn() {
      const stripe = await stripePromise;
      if (!stripe) return;

      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret!);
      if (paymentIntent?.status !== "succeeded") {
        toast.error(t("payment_not_confirmed"));
        return;
      }

      const mod = APP_MODULES.find((m) => m.id === modulePending);
      onPendingActivation({
        moduleId: modulePending!,
        moduleName: mod ? getModuleName(t, mod.id) : modulePending!,
        paymentIntentId: paymentIntent.id,
      });
    }

    handleReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * Mount this ONCE at the page level (not inside each dialog).
 * It detects PayPal/Klarna redirects and triggers the confirmation dialog
 * for the correct module.
 */
export function ModuleRedirectReturnHandler({
  onPendingActivation,
}: {
  onPendingActivation: (data: PendingActivation) => void;
}) {
  return (
    <Suspense fallback={null}>
      <RedirectReturnInner onPendingActivation={onPendingActivation} />
    </Suspense>
  );
}

// ─── Main dialog ───────────────────────────────────────────────────────────

interface BuyModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  /** Pre-filled after a PayPal/Klarna redirect — skips payment form */
  pendingActivation?: PendingActivation | null;
  onClearPending?: () => void;
}

export function BuyModuleDialog({
  open,
  onOpenChange,
  moduleId,
  moduleName,
  pendingActivation,
  onClearPending,
}: BuyModuleDialogProps) {
  const t = useTranslations("BuyModuleDialog");
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSuccess = useCallback(() => {
    setSucceeded(true);
    onClearPending?.();
    const name = pendingActivation?.moduleName ?? moduleName;
    toast.success(t("module_activated_toast", { name }));
    // Refresh immediately so the page re-fetches server data in the background
    router.refresh();
  }, [moduleName, pendingActivation, onClearPending, router, t]);

  const createIntent = useCallback(async () => {
    setIsLoadingIntent(true);
    setClientSecret(null);
    try {
      const res = await fetch("/api/create-module-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      toast.error(err.message || t("create_intent_error"));
      onOpenChange(false);
    } finally {
      setIsLoadingIntent(false);
    }
  }, [moduleId, onOpenChange, t]);

  useEffect(() => {
    // Don't create a new intent if we're in pending activation state
    if (open && !succeeded && !pendingActivation) {
      createIntent();
    }
    if (!open) {
      setSucceeded(false);
      setClientSecret(null);
    }
  }, [open, succeeded, pendingActivation, createIntent]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const activeModuleId = pendingActivation?.moduleId ?? moduleId;
  const activeModuleName = pendingActivation?.moduleName ?? moduleName;

  const renderContent = () => {
    if (succeeded) {
      return (
        <SuccessState
          moduleName={activeModuleName}
          moduleId={activeModuleId}
          onClose={handleClose}
        />
      );
    }
    if (pendingActivation) {
      return (
        <ConfirmActivation
          moduleName={pendingActivation.moduleName}
          moduleId={pendingActivation.moduleId}
          paymentIntentId={pendingActivation.paymentIntentId}
          onSuccess={handleSuccess}
        />
      );
    }
    if (isLoadingIntent || !clientSecret) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: { borderRadius: "12px", colorPrimary: "#4B3F72" },
          },
        }}
      >
        <PaymentForm
          moduleId={moduleId}
          moduleName={moduleName}
          onSuccess={handleSuccess}
        />
      </Elements>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialog_title")}</DialogTitle>
          <DialogDescription>
            {pendingActivation
              ? t("dialog_desc_pending")
              : t("dialog_desc_default")}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

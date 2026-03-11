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
import { APP_MODULES } from "@shared/data/modules";
import { CheckCircle2, Loader2, ShoppingCart } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Inner payment form (CB) ───────────────────────────────────────────────

interface PaymentFormProps {
  moduleId: string;
  moduleName: string;
  onSuccess: () => void;
}

function PaymentForm({ moduleId, moduleName, onSuccess }: PaymentFormProps) {
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
        setErrorMessage(error.message || "Une erreur est survenue.");
        return;
      }

      // CB path: no redirect, activate directly
      if (paymentIntent?.status === "succeeded") {
        await activatePurchasedModule({ moduleId, paymentIntentId: paymentIntent.id });
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur inattendue est survenue.");
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
            Paiement en cours...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Payer 10 € et activer
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Paiement sécurisé par Stripe
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
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleActivate = async () => {
    setIsActivating(true);
    setErrorMessage("");
    try {
      await activatePurchasedModule({ moduleId, paymentIntentId });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue lors de l'activation.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm text-green-800">Paiement confirmé</p>
          <p className="text-xs text-green-700 mt-0.5">
            Votre paiement pour <span className="font-medium">{moduleName}</span> a bien été reçu. Cliquez sur le bouton ci-dessous pour activer le module.
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
            Activation en cours...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Activer le module
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
        <p className="font-semibold text-foreground text-lg">Module activé !</p>
        <p className="text-sm text-muted-foreground mt-1">
          Le module <span className="font-medium">{moduleName}</span> est maintenant disponible.
        </p>
      </div>
      <Button onClick={handleConfigure} className="mt-2">
        Configurer le module
      </Button>
    </div>
  );
}

// ─── Redirect return hook (PayPal / Klarna) ────────────────────────────────

interface RedirectReturn {
  moduleId: string;
  moduleName: string;
  paymentIntentId: string;
}

function useRedirectReturn(onPendingActivation: (data: RedirectReturn) => void) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const clientSecret = searchParams.get("payment_intent_client_secret");
    const modulePending = searchParams.get("module_pending");
    const redirectStatus = searchParams.get("redirect_status");

    if (!clientSecret || !modulePending) return;

    // Clean up URL immediately to avoid loops on refresh
    const clean = new URL(window.location.href);
    clean.searchParams.delete("payment_intent");
    clean.searchParams.delete("payment_intent_client_secret");
    clean.searchParams.delete("redirect_status");
    clean.searchParams.delete("module_pending");
    window.history.replaceState({}, "", clean.pathname + (clean.search || ""));

    if (redirectStatus !== "succeeded") {
      toast.error("Le paiement a échoué ou a été annulé. Veuillez réessayer.");
      return;
    }

    async function handleReturn() {
      const stripe = await stripePromise;
      if (!stripe) return;

      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret!);
      if (paymentIntent?.status !== "succeeded") {
        toast.error("Le paiement n'a pas pu être confirmé.");
        return;
      }

      const module = APP_MODULES.find((m) => m.id === modulePending);
      onPendingActivation({
        moduleId: modulePending!,
        moduleName: module?.name ?? modulePending!,
        paymentIntentId: paymentIntent.id,
      });
    }

    handleReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function RedirectReturnHandler({
  onPendingActivation,
}: {
  onPendingActivation: (data: RedirectReturn) => void;
}) {
  useRedirectReturn(onPendingActivation);
  return null;
}

// ─── Main dialog ───────────────────────────────────────────────────────────

interface BuyModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
}

export function BuyModuleDialog({
  open,
  onOpenChange,
  moduleId,
  moduleName,
}: BuyModuleDialogProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  // Pending activation after PayPal/Klarna redirect
  const [pendingActivation, setPendingActivation] = useState<RedirectReturn | null>(null);

  const handleSuccess = useCallback(() => {
    setSucceeded(true);
    setPendingActivation(null);
    toast.success(`Module "${moduleName}" activé !`);
  }, [moduleName]);

  const handlePendingActivation = useCallback((data: RedirectReturn) => {
    setPendingActivation(data);
    onOpenChange(true); // open dialog in confirmation state
  }, [onOpenChange]);

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
      toast.error(err.message || "Impossible de créer le paiement.");
      onOpenChange(false);
    } finally {
      setIsLoadingIntent(false);
    }
  }, [moduleId, onOpenChange]);

  useEffect(() => {
    // Don't create a new intent if we're in pending activation state
    if (open && !succeeded && !pendingActivation) {
      createIntent();
    }
    if (!open) {
      setSucceeded(false);
      setClientSecret(null);
      // Keep pendingActivation so the dialog can reopen in confirmation state
    }
  }, [open, succeeded, pendingActivation, createIntent]);

  const handleClose = () => {
    onOpenChange(false);
    router.refresh();
  };

  const renderContent = () => {
    if (succeeded) {
      return (
        <SuccessState
          moduleName={pendingActivation?.moduleName ?? moduleName}
          moduleId={pendingActivation?.moduleId ?? moduleId}
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
            variables: { borderRadius: "12px", colorPrimary: "#a06c4a" },
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
    <>
      <Suspense fallback={null}>
        <RedirectReturnHandler onPendingActivation={handlePendingActivation} />
      </Suspense>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un module</DialogTitle>
            <DialogDescription>
              {pendingActivation
                ? "Votre paiement a été reçu. Confirmez l'activation du module."
                : "Activez ce module pour 10 € — disponible immédiatement sur votre faire-part."}
            </DialogDescription>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}

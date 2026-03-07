"use client";

import { Spinner } from "@shared/components/ui/spinner";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CheckoutFormProps {
  onSuccess: () => Promise<void>;
  disabled: boolean;
  totalPrice: number;
  email: string;
  formDataToSave: any;
}

export function CheckoutForm({
  onSuccess,
  disabled,
  totalPrice,
  email,
  formDataToSave,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    if (disabled) {
      toast.error(
        "Veuillez remplir tous les champs obligatoires avant de valider.",
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // 1. Pre-flight email check
      if (email) {
        const checkRes = await fetch("/api/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const checkData = await checkRes.json();

        if (checkRes.status === 409) {
          setErrorMessage(checkData.error || "Email déjà utilisé.");
          setIsProcessing(false);
          return;
        } else if (!checkRes.ok) {
          setErrorMessage("Impossible de vérifier l'email.");
          setIsProcessing(false);
          return;
        }
      }

      // Save form data to localStorage before redirecting to Stripe
      localStorage.setItem(
        "checkout_form_data",
        JSON.stringify(formDataToSave),
      );

      // 2. Confirm the PaymentIntent with the PaymentElement
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Une erreur inattendue est survenue.");
      }
      // Note: If successful and a redirect is required, Stripe will handle it.
      // If no redirect is required (e.g., payment already succeeded), we could handle it,
      // but for this flow, we rely on the redirect to page.tsx for consistency.
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='w-full'
    >
      <div className='mb-6'>
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: {
              applePay: "auto",
              googlePay: "auto",
            },
          }}
        />
      </div>

      {errorMessage && (
        <div className='text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-xl border border-red-100'>
          {errorMessage}
        </div>
      )}

      <button
        type='submit'
        disabled={isProcessing || disabled || !stripe || !elements}
        className='w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'
      >
        {isProcessing ? (
          <div className='flex items-center gap-2'>
            <Spinner className='text-white' />
            <span>Paiement en cours...</span>
          </div>
        ) : (
          <>
            <span>Payer {totalPrice}€ & Créer</span>
            <ChevronRight className='w-5 h-5' />
          </>
        )}
      </button>
      <p className='text-center text-xs text-gray-400 mt-4'>
        Paiement sécurisé par Stripe (Mode Test).
      </p>
    </form>
  );
}

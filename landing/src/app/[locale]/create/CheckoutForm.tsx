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
}

export function CheckoutForm({
  onSuccess,
  disabled,
  totalPrice,
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
      // Confirm the PaymentIntent with the PaymentElement
      // We use `redirect: "if_required"` so we can manually handle the success flow
      // and call `onSuccess` right away to provision the Supabase user.
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/auth/login`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Une erreur inattendue est survenue.");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded! Let's trigger the actual account creation
        await onSuccess();
      } else {
        // Some other status like processing or requires_action (3DS)
        // In a real prod environment with 3DS, redirect="always" might be preferred,
        // but that requires using webhooks to provision the server.
        setErrorMessage(
          "Le paiement nécessite une validation supplémentaire non supportée dans ce POC.",
        );
      }
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

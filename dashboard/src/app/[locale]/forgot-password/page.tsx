"use client";

import { Link } from "@/navigation";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { useActionState, useEffect, useState } from "react";
import { requestPasswordReset } from "./actions";

const initialState = {
  error: "",
};

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setEmailSent(true);
    }
  }, [state?.success]);

  if (emailSent) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F8F6F3] to-[#F5F3EF] flex flex-col items-center justify-center p-4 relative overflow-hidden'>
        {/* Decorative background */}
        <div className='absolute inset-0 opacity-[0.03]'>
          <div className='absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-[100px]' />
          <div className='absolute bottom-20 right-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]' />
        </div>

        <div className='relative w-full max-w-md'>
          <div className='relative bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-primary/10 p-14 space-y-6 text-center'>
            {/* Success icon */}
            <div className='flex justify-center'>
              <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center'>
                <svg
                  className='w-8 h-8 text-primary'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76'
                  />
                </svg>
              </div>
            </div>

            <h1 className='font-heading text-3xl font-light text-gray-900'>
              Email envoyé
            </h1>
            <p className='text-sm text-gray-500 font-light leading-relaxed'>
              Si cette adresse email est associée à un compte, vous recevrez un
              lien de réinitialisation dans quelques minutes.
              <br />
              <span className='text-xs'>
                Pensez également à vérifier vos spams.
              </span>
            </p>

            <Link
              href='/login'
              className='inline-block text-sm text-primary/60 hover:text-primary font-light tracking-wide transition-colors'
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F8F6F3] to-[#F5F3EF] flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      {/* Decorative background elements */}
      <div className='absolute inset-0 opacity-[0.03]'>
        <div className='absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-[100px]' />
        <div className='absolute bottom-20 right-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]' />
      </div>

      <div className='relative w-full max-w-md'>
        <div className='relative bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-primary/10 p-14 space-y-10'>
          <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/0 via-primary/[0.02] to-primary/0 pointer-events-none' />

          {/* Header */}
          <div className='relative text-center space-y-4'>
            <h1 className='font-heading text-4xl font-light text-gray-900 tracking-wide'>
              Mot de passe oublié ?
            </h1>
            <p className='text-sm text-gray-500 font-light leading-relaxed'>
              Entrez votre adresse email et nous vous enverrons un lien pour
              réinitialiser votre mot de passe.
            </p>
          </div>

          {/* Form */}
          <form
            action={formAction}
            className='relative space-y-7'
          >
            <div className='space-y-3'>
              <Label
                htmlFor='email'
                className='text-xs uppercase tracking-[0.15em] font-medium text-gray-600'
              >
                Email
              </Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='votre@email.com'
                required
                className='h-14 bg-white border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-300 text-base placeholder:text-gray-400'
              />
            </div>

            {state?.error && (
              <div className='bg-red-50/80 border border-red-200/60 rounded-xl p-4 backdrop-blur-sm'>
                <p className='text-sm text-red-600 text-center font-light tracking-wide'>
                  {state.error}
                </p>
              </div>
            )}

            <Button
              type='submit'
              disabled={isPending}
              className='w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl text-base font-light tracking-[0.1em] uppercase transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isPending ? "Envoi..." : "Envoyer le lien"}
            </Button>

            <div className='text-center pt-2'>
              <Link
                href='/login'
                className='text-sm text-gray-500 hover:text-primary font-light tracking-wide transition-colors'
              >
                Retour à la connexion
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { useActionState, useEffect } from "react";
import { resetPassword } from "./actions";

const initialState = {
  error: "",
};

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      window.location.href = "/login";
    }
  }, [state?.success]);

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
              Nouveau mot de passe
            </h1>
            <p className='text-sm text-gray-500 font-light leading-relaxed'>
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
          </div>

          {/* Form */}
          <form
            action={formAction}
            className='relative space-y-7'
          >
            <div className='space-y-3'>
              <Label
                htmlFor='password'
                className='text-xs uppercase tracking-[0.15em] font-medium text-gray-600'
              >
                Nouveau mot de passe
              </Label>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='••••••••••'
                required
                minLength={6}
                className='h-14 bg-white border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-300 text-base'
              />
            </div>

            <div className='space-y-3'>
              <Label
                htmlFor='confirmPassword'
                className='text-xs uppercase tracking-[0.15em] font-medium text-gray-600'
              >
                Confirmer le mot de passe
              </Label>
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                placeholder='••••••••••'
                required
                minLength={6}
                className='h-14 bg-white border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-300 text-base'
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
              {isPending ? "Réinitialisation..." : "Réinitialiser"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

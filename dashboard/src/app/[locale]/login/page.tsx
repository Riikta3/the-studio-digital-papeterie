"use client";

import { Link } from "@/navigation";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { useActionState, useEffect } from "react";
import { login } from "./actions";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  // Redirect on successful login with full page reload to update auth state
  useEffect(() => {
    if (state?.success) {
      window.location.href = "/";
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
        {/* Elegant card container with golden border */}
        <div className='relative bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-primary/10 p-14 space-y-10'>
          {/* Subtle glow */}
          <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/0 via-primary/[0.02] to-primary/0 pointer-events-none' />

          {/* Header with refined ornamental touch */}
          <div className='relative text-center space-y-6'>
            {/* Top ornament */}
            <div className='flex items-center justify-center gap-4'>
              <div className='h-[1px] w-16 bg-gradient-to-r from-transparent via-primary/30 to-transparent' />
              <svg
                width='8'
                height='8'
                viewBox='0 0 8 8'
                fill='none'
                className='text-primary/50'
              >
                <circle
                  cx='4'
                  cy='4'
                  r='3'
                  fill='currentColor'
                />
              </svg>
              <div className='h-[1px] w-16 bg-gradient-to-r from-transparent via-primary/30 to-transparent' />
            </div>

            <div className='space-y-3'>
              <h1 className='font-heading text-6xl font-light text-gray-900 tracking-wide'>
                The Studio
              </h1>
              <div className='flex items-center justify-center gap-3'>
                <div className='h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/40' />
                <p className='text-[10px] uppercase tracking-[0.35em] text-primary/60 font-medium'>
                  Digital Papeterie
                </p>
                <div className='h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/40' />
              </div>
            </div>

            <p className='text-sm text-gray-500 font-light pt-4 tracking-wide'>
              Accédez à votre espace privé
            </p>
          </div>

          {/* Login form */}
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

            <div className='space-y-3'>
              <Label
                htmlFor='password'
                className='text-xs uppercase tracking-[0.15em] font-medium text-gray-600'
              >
                Mot de passe
              </Label>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='••••••••••'
                required
                className='h-14 bg-white border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-300 text-base'
              />
              <div className='text-right mt-2'>
                <Link
                  href='/forgot-password'
                  className='text-xs text-primary/60 hover:text-primary font-light tracking-wide transition-colors'
                >
                  Mot de passe oublié ?
                </Link>
              </div>
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
              className='w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl text-base font-light tracking-[0.1em] uppercase transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-10'
            >
              {isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          {/* Footer */}
          <div className='relative text-center pt-6 border-t border-gray-100'>
            <p className='text-[11px] text-gray-400 font-light tracking-[0.2em] leading-relaxed'>
              L&apos;élégance de la papeterie,
              <br />
              <span className='text-primary/50'>la puissance du digital</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

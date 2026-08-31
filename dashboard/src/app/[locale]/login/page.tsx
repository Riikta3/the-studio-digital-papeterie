"use client";

import { Link } from "@/navigation";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { login } from "./actions";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const t = useTranslations("Login");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(login, initialState);

  // Redirect on successful login with full page reload to update auth state
  useEffect(() => {
    if (state?.success) {
      window.location.href = "/";
    }
  }, [state?.success]);

  return (
    <div className='min-h-screen bg-studio-creme flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      {/* Decorative background elements */}
      <div className='absolute inset-0 opacity-[0.03]'>
        <div className='absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-[100px]' />
        <div className='absolute bottom-20 right-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]' />
      </div>

      <div className='relative w-full max-w-md'>
        {/* Elegant card container with golden border */}
        <div className='relative bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-primary/10 p-14 pt-7 space-b-10'>
          {/* Subtle glow */}
          <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/0 via-primary/[0.02] to-primary/0 pointer-events-none' />

          {/* Header */}
          <div className='relative text-center space-y-6'>
            <div className='flex justify-center items-center gap-3'>
              <Image
                src='/logo-violet.svg'
                alt=''
                width={44}
                height={46}
                className='h-11 w-auto'
                priority
              />
              <span className='font-heading text-h2 text-studio-violet'>
                The Studio
              </span>
            </div>

            <p className='text-sm text-gray-500 font-light tracking-wide'>
              {t("tagline")}
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
                {t("email_label")}
              </Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder={t("email_placeholder")}
                required
                className='h-14 bg-white border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-300 text-base placeholder:text-gray-400'
              />
            </div>

            <div className='space-y-3'>
              <Label
                htmlFor='password'
                className='text-xs uppercase tracking-[0.15em] font-medium text-gray-600'
              >
                {t("password_label")}
              </Label>
              <div className='relative'>
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? "text" : "password"}
                  placeholder='••••••••••'
                  required
                  className='h-14 bg-white border-gray-200/80 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-300 text-base pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                >
                  {showPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>
              <div className='text-right mt-2'>
                <Link
                  href='/forgot-password'
                  className='text-xs text-primary/60 hover:text-primary font-light tracking-wide transition-colors'
                >
                  {t("forgot_password")}
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
              {isPending ? t("signing_in") : t("sign_in")}
            </Button>
          </form>

          {/* Footer */}
          <div className='relative text-center pt-6 border-t border-gray-100'>
            <p className='text-[11px] text-gray-400 font-light tracking-[0.2em] leading-relaxed'>
              {t("footer_line1")}
              <br />
              <span className='text-primary/50'>{t("footer_line2")}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { routing } from "@/navigation";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

/**
 * Supabase accepts 6 characters by default; this is the floor we ask for.
 * Checked here only to answer before a round trip — the auth server's own
 * rule still applies and its refusal is shown the same way.
 */
const MIN_LENGTH = 8;

function isLocale(value: string | null): value is string {
  return (routing.locales as readonly string[]).includes(value ?? "");
}

/**
 * The language the couple uses in the app, carried by the reset link as
 * `?locale=`. The browser's language is only a fallback: it is often English
 * on a French couple's machine, which is how this page came up in English.
 */
function detectLocale(): string {
  if (typeof window === "undefined") return routing.defaultLocale;
  const requested = new URLSearchParams(window.location.search).get("locale");
  if (isLocale(requested)) return requested;
  const browserLocales = navigator.languages || [navigator.language];
  for (const browserLocale of browserLocales) {
    const short = browserLocale.split("-")[0];
    if (isLocale(short)) return short;
  }
  return routing.defaultLocale;
}

/**
 * The same card as the login page — background, logo, spacing, fields — so
 * the reset reads as part of the sign-in flow rather than a stray screen.
 * Shared by the form and by the placeholder shown while messages load.
 */
function Card({ children }: { children: ReactNode }) {
  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-studio-creme p-4'>
      <div className='absolute inset-0 opacity-[0.03]'>
        <div className='absolute left-20 top-20 h-96 w-96 rounded-full bg-primary/30 blur-[100px]' />
        <div className='absolute bottom-20 right-20 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]' />
      </div>

      <div className='relative w-full max-w-md'>
        <div className='relative space-y-8 rounded-3xl border border-primary/10 bg-white/90 p-8 pt-7 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-14 sm:pt-7'>
          <div className='flex items-center justify-center gap-3'>
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
          {children}
        </div>
      </div>
    </div>
  );
}

/** The form's shape, pulsing, until the locale's messages have arrived. */
function CardSkeleton() {
  return (
    <Card>
      <div className='space-y-3' aria-hidden>
        <div className='mx-auto h-6 w-48 animate-pulse rounded-lg bg-studio-lavande/20' />
        <div className='mx-auto h-4 w-64 animate-pulse rounded bg-studio-lavande/10' />
      </div>
      <div className='space-y-7' aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className='space-y-3'>
            <div className='h-3 w-32 animate-pulse rounded bg-studio-lavande/20' />
            <div className='h-14 animate-pulse rounded-xl bg-studio-lavande/10' />
          </div>
        ))}
        <div className='h-14 animate-pulse rounded-xl bg-primary/20' />
      </div>
    </Card>
  );
}

const fieldClass =
  "h-14 rounded-xl border-gray-200/80 bg-white pe-10 text-base transition-all duration-300 placeholder:text-gray-400 focus:border-primary/50 focus:ring-primary/20";

const labelClass =
  "text-xs font-medium uppercase tracking-[0.15em] text-gray-600";

function UpdatePasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("UpdatePassword");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // The recovery link signs the couple in on the way here; without that
    // session there is no account to set a password on.
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.replace(`/${locale}/login?error=invalid_link`);
      }
    });
  }, [locale]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(t("error_too_short", { min: MIN_LENGTH }));
      return;
    }
    if (password !== confirm) {
      setError(t("error_mismatch"));
      return;
    }

    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({
      password,
    });

    if (updateError) {
      // Inline rather than a toast: this document sits outside `[locale]`
      // and has no <Toaster />, so the toasts it used to raise never showed.
      setError(`${t("toast_error")} — ${updateError.message}`);
      setLoading(false);
      return;
    }

    // A full navigation: the dashboard is under another root layout, and its
    // server components must render with the session the link opened.
    window.location.replace(`/${locale}`);
  };

  const toggle = (
    <button
      type='button'
      onClick={() => setShowPassword((v) => !v)}
      aria-label={t(showPassword ? "hide_password" : "show_password")}
      className='absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
    >
      {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
    </button>
  );

  return (
    <Card>
      <div className='space-y-2 text-center'>
        <h1 className='font-heading text-lg text-studio-violet'>{t("title")}</h1>
        <p className='text-sm font-light leading-relaxed text-gray-500'>
          {t("subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-7' noValidate>
        <div className='space-y-3'>
          <Label htmlFor='new-password' className={labelClass}>
            {t("password_placeholder")}
          </Label>
          <div className='relative'>
            <Input
              id='new-password'
              type={showPassword ? "text" : "password"}
              autoComplete='new-password'
              placeholder='••••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              required
            />
            {toggle}
          </div>
        </div>

        <div className='space-y-3'>
          <Label htmlFor='confirm-password' className={labelClass}>
            {t("confirm_label")}
          </Label>
          <Input
            id='confirm-password'
            type={showPassword ? "text" : "password"}
            autoComplete='new-password'
            placeholder='••••••••••'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={fieldClass}
            required
          />
        </div>

        {error && (
          <div
            role='alert'
            className='rounded-xl border border-red-200/60 bg-red-50/80 p-4 backdrop-blur-sm'
          >
            <p className='text-center text-sm font-light tracking-wide text-red-600'>
              {error}
            </p>
          </div>
        )}

        <Button
          type='submit'
          disabled={loading || !password || !confirm}
          className='mt-10 h-14 w-full rounded-xl bg-primary text-base font-light uppercase tracking-[0.1em] text-white shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
        >
          {loading ? t("loading") : t("submit")}
        </Button>
      </form>
    </Card>
  );
}

export default function UpdatePasswordPage() {
  const [locale] = useState(() => detectLocale());
  const [messages, setMessages] = useState<Record<string, unknown> | null>(
    null,
  );

  useEffect(() => {
    import(`../../../messages/${locale}.json`).then((mod) =>
      setMessages(mod.default),
    );
  }, [locale]);

  if (!messages) return <CardSkeleton />;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
        <UpdatePasswordForm locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}

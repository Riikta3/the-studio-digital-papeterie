"use client";

import { Link } from "@/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { login } from "./actions";
import { requestMagicLink } from "./magic-link-action";

const initialState = {
  error: "",
};

/**
 * Explains why the couple is looking at the login page when they did not ask
 * for it.
 *
 * Two redirects land here with a reason and, until now, said nothing: the
 * middleware signs out an idle session with `?reason=expired`, and
 * `update-password` bounces a spent recovery link with `?error=invalid_link`.
 * Both looked to the couple like being logged out at random.
 *
 * Kept in its own component so the toast logic sits apart from the form rather
 * than adding a third effect to it. Both it and the form read
 * `useSearchParams`, so the Suspense boundary they need lives once at the
 * bottom of this file rather than around each of them.
 */
function RedirectNotice() {
  const t = useTranslations("Login");
  const searchParams = useSearchParams();
  const shown = useRef(false);

  const reason = searchParams.get("reason");
  const error = searchParams.get("error");

  useEffect(() => {
    // Sonner is not idempotent and React runs effects twice in development, so
    // without this the same toast stacks.
    if (shown.current) return;

    if (reason === "expired") {
      shown.current = true;
      toast.info(t("session_expired_title"), {
        description: t("session_expired_description"),
        duration: 8000,
      });
    } else if (reason === "no_wedding") {
      shown.current = true;
      // The account is signed in but owns nothing (see `requireWedding`).
      // Ending that session here is what lets the couple sign in with the
      // right address instead of bouncing straight back.
      void createClient().auth.signOut();
      toast.error(t("no_wedding_title"), {
        description: t("no_wedding_description"),
        duration: 10000,
      });
    } else if (error === "invalid_link") {
      shown.current = true;
      toast.error(t("invalid_link_title"), {
        description: t("invalid_link_description"),
        duration: 8000,
      });
    }
  }, [reason, error, t]);

  return null;
}

/**
 * Where to send the couple after signing in.
 *
 * The middleware redirects here with `?next=` carrying the page they were
 * trying to reach, and that was being thrown away — everyone landed on the
 * dashboard home no matter what they had clicked.
 *
 * Only a path from our own app is honoured. `next` arrives in the URL, so a
 * caller can put anything in it: without this check, a link to
 * `/fr/login?next=https://evil.example` would sign the couple in and then hand
 * them to someone else's site, with our domain in the referrer. Anything not
 * starting with a single `/` — an absolute URL, a protocol-relative `//host`,
 * a backslash Chrome normalises to one — falls back to the home page.
 */
function safeNext(next: string | null): string {
  if (!next) return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";

  return next;
}

/**
 * Asks for a fresh sign-in link.
 *
 * The accounts created at checkout have no password at all — the couple is
 * meant to arrive through the magic link in their welcome email. That link is
 * single-use and expires, and once spent the only thing on this page was
 * "Mot de passe oublié": a reset for a password that does not exist. A couple
 * who had paid could not get back into their own space.
 *
 * Shown in place of the password form rather than beside it, so the page keeps
 * one obvious action instead of two competing ones.
 */
function MagicLinkForm({ onBack }: { onBack: () => void }) {
  const t = useTranslations("Login");
  const [state, formAction, isPending] = useActionState(requestMagicLink, {});

  if (state?.success) {
    return (
      <div className='relative space-y-6 text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
          <Mail className='h-5 w-5 text-primary' />
        </div>
        <div className='space-y-2'>
          <p className='font-heading text-lg text-studio-violet'>
            {t("magic_link_sent_title")}
          </p>
          <p className='text-sm font-light leading-relaxed text-gray-500'>
            {t("magic_link_sent_description")}
          </p>
        </div>
        <button
          type='button'
          onClick={onBack}
          className='text-xs font-light tracking-wide text-primary/60 transition-colors hover:text-primary'
        >
          {t("magic_link_back")}
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className='relative space-y-7'
    >
      <div className='space-y-2 text-center'>
        <p className='font-heading text-lg text-studio-violet'>
          {t("magic_link_title")}
        </p>
        <p className='text-sm font-light leading-relaxed text-gray-500'>
          {t("magic_link_description")}
        </p>
      </div>

      <div className='space-y-3'>
        <Label
          htmlFor='magic-email'
          className='text-xs font-medium uppercase tracking-[0.15em] text-gray-600'
        >
          {t("email_label")}
        </Label>
        <Input
          id='magic-email'
          name='email'
          type='email'
          placeholder={t("email_placeholder")}
          required
          className='h-14 rounded-xl border-gray-200/80 bg-white text-base transition-all duration-300 placeholder:text-gray-400 focus:border-primary/50 focus:ring-primary/20'
        />
      </div>

      {state?.error && (
        <div className='rounded-xl border border-red-200/60 bg-red-50/80 p-4 backdrop-blur-sm'>
          <p className='text-center text-sm font-light tracking-wide text-red-600'>
            {state.error}
          </p>
        </div>
      )}

      <Button
        type='submit'
        disabled={isPending}
        className='mt-10 h-14 w-full rounded-xl bg-primary text-base font-light uppercase tracking-[0.1em] text-white shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
      >
        {isPending ? t("magic_link_sending") : t("magic_link_submit")}
      </Button>

      <button
        type='button'
        onClick={onBack}
        className='w-full text-xs font-light tracking-wide text-primary/60 transition-colors hover:text-primary'
      >
        {t("magic_link_back")}
      </button>
    </form>
  );
}

function LoginForm() {
  const t = useTranslations("Login");
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(login, initialState);

  /*
   * Opened automatically when the couple arrives from a link that no longer
   * works. That is the exact moment they need a new one, and leaving them to
   * find the button themselves is how the dead end felt like a dead end.
   */
  const [wantsMagicLink, setWantsMagicLink] = useState(
    searchParams.get("error") === "invalid_link",
  );

  // Redirect on successful login with full page reload to update auth state
  useEffect(() => {
    if (state?.success) {
      window.location.href = safeNext(searchParams.get("next"));
    }
  }, [state?.success, searchParams]);

  return (
    <div className='min-h-screen bg-studio-creme flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      <RedirectNotice />

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

          {wantsMagicLink ? (
            <MagicLinkForm onBack={() => setWantsMagicLink(false)} />
          ) : (
          /* Login form */
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

            {/*
              A second way in, given the same weight as the first.

              Every account created at checkout starts without a password, and
              setting one is optional — so for a good share of couples the
              field above is one they cannot fill. Offered as a footnote, it
              read as a fallback for people who had forgotten something, which
              is not what it is. The separator says plainly that these are two
              equal routes.
            */}
            <div className='flex items-center gap-4 pt-2'>
              <span className='h-px flex-1 bg-gray-200' />
              <span className='text-[11px] font-light uppercase tracking-[0.15em] text-gray-400'>
                {t("or")}
              </span>
              <span className='h-px flex-1 bg-gray-200' />
            </div>

            <button
              type='button'
              onClick={() => setWantsMagicLink(true)}
              className='flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white text-base font-light uppercase tracking-[0.1em] text-primary transition-all duration-300 hover:border-primary/40 hover:bg-primary/[0.03]'
            >
              <Mail className='h-4 w-4' />
              {t("magic_link_cta")}
            </button>
          </form>
          )}

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

/**
 * `useSearchParams` is read by both children, so the boundary sits here rather
 * than in each of them. It is what lets this route keep prerendering its shell
 * instead of being forced fully dynamic by the hook.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

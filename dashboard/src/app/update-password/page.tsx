"use client";

import { createClient } from "@/lib/supabase/client";
import { routing } from "@/navigation";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function detectLocale(): string {
  if (typeof navigator === "undefined") return routing.defaultLocale;
  const browserLocales = navigator.languages || [navigator.language];
  for (const browserLocale of browserLocales) {
    const short = browserLocale.split("-")[0];
    if (routing.locales.includes(short as (typeof routing.locales)[number])) {
      return short;
    }
  }
  return routing.defaultLocale;
}

function UpdatePasswordForm() {
  const t = useTranslations("UpdatePassword");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we have a session (handled by Supabase implicitly via the link)
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // If the link is invalid or expired, redirect to login
        router.push(`/${detectLocale()}/login?error=invalid_link`);
      }
    });
  }, [router]);

  const handleUpdate = async () => {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error(t("toast_error"), {
        description: error.message,
      });
      setLoading(false);
    } else {
      toast.success(t("toast_success"));
      router.push(`/${detectLocale()}`); // Redirect to dashboard home
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-studio-creme p-4'>
      <div className='max-w-md w-full bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-primary/10 p-8 space-y-6 text-center'>
        <div className='flex justify-center items-center gap-2'>
          <Image
            src='/logo-violet.svg'
            alt=''
            width={32}
            height={34}
            className='h-8 w-auto'
            priority
          />
          <span className='font-heading text-h2 text-studio-violet'>
            The Studio
          </span>
        </div>
        <h1 className='font-heading text-h1 text-studio-violet'>{t("title")}</h1>
        <p className='text-studio-violet/60'>{t("subtitle")}</p>

        <input
          type='password'
          placeholder={t("password_placeholder")}
          className='w-full px-4 py-3 rounded-xl border border-studio-lavande/40'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleUpdate}
          disabled={loading || !password}
          className='w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50'
        >
          {loading ? t("loading") : t("submit")}
        </button>
      </div>
    </div>
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

  if (!messages) return null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <UpdatePasswordForm />
    </NextIntlClientProvider>
  );
}

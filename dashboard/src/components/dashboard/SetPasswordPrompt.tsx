"use client";

import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/utils/supabase/client";

/**
 * Invites a couple who has no password to set one.
 *
 * Accounts created at checkout are passwordless — `createUser` is called
 * without one and the couple arrives through a magic link. Nothing then ever
 * offered them a password, so the login page showed a field they could not
 * fill and "Mot de passe oublié" offered to reset something that did not
 * exist. Their only way back was the sign-in link, one email round trip at a
 * time.
 *
 * Deliberately an invitation and not a gate. The couple has just paid and
 * wants to see their invitation, not fill in a form; and they are never stuck
 * without it, because the login page can always email them a fresh link.
 * Dismissing it is a real choice, remembered for the session.
 *
 * Shown only while `user_metadata.needs_password` is true. That flag is set at
 * checkout and cleared here, because Supabase exposes no way to ask whether a
 * user has a password.
 */

/** Supabase's own minimum; stated up front rather than after a failed submit. */
const MIN_LENGTH = 6;

export function SetPasswordPrompt() {
  const t = useTranslations("SetPassword");
  const router = useRouter();

  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSave() {
    if (password.length < MIN_LENGTH) {
      toast.error(t("too_short", { min: MIN_LENGTH }));
      return;
    }

    setSaving(true);
    const supabase = createClient();

    /*
     * The flag is cleared in the same call that sets the password, so the two
     * cannot disagree: a password saved while the flag stayed true would keep
     * this prompt coming back for ever.
     */
    const { error } = await supabase.auth.updateUser({
      password,
      data: { needs_password: false },
    });

    if (error) {
      // Supabase rejects a password it considers too weak or already in use;
      // its message is the useful part and is already localised.
      toast.error(t("error_title"), { description: error.message });
      setSaving(false);
      return;
    }

    toast.success(t("success_title"), { description: t("success_body") });
    setOpen(false);

    // So the server component re-reads the user and stops rendering this.
    router.refresh();
  }

  return (
    <div className='relative mb-6 rounded-2xl border border-primary/15 bg-white/80 p-5 shadow-[0_2px_12px_rgba(75,63,114,0.06)]'>
      <button
        type='button'
        onClick={() => setOpen(false)}
        aria-label={t("dismiss")}
        className='absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600'
      >
        <X className='h-4 w-4' />
      </button>

      <div className='flex items-start gap-4'>
        <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10'>
          <KeyRound className='h-5 w-5 text-primary' />
        </div>

        <div className='flex-1 space-y-3'>
          <div className='space-y-1'>
            <p className='font-heading text-base text-studio-violet'>
              {t("title")}
            </p>
            <p className='pr-6 text-sm font-light leading-relaxed text-gray-500'>
              {t("body")}
            </p>
          </div>

          {expanded ? (
            <div className='space-y-3 pt-1'>
              <div className='space-y-2'>
                <Label
                  htmlFor='new-password'
                  className='text-xs font-medium uppercase tracking-[0.15em] text-gray-600'
                >
                  {t("label")}
                </Label>
                <div className='relative'>
                  <Input
                    id='new-password'
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    // A password manager must be told this is a new password,
                    // or it offers to fill the old one — which does not exist.
                    autoComplete='new-password'
                    placeholder={t("placeholder", { min: MIN_LENGTH })}
                    className='h-12 rounded-xl border-gray-200/80 bg-white pr-10'
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !saving) void handleSave();
                    }}
                  />
                  <button
                    type='button'
                    onClick={() => setShow(!show)}
                    aria-label={show ? t("hide") : t("reveal")}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
                  >
                    {show ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-3'>
                <Button
                  type='button'
                  onClick={handleSave}
                  disabled={saving || password.length < MIN_LENGTH}
                  className='h-11 rounded-xl bg-primary px-6 text-sm font-light uppercase tracking-[0.1em] text-white hover:bg-primary/90 disabled:opacity-50'
                >
                  {saving ? t("saving") : t("save")}
                </Button>
                <button
                  type='button'
                  onClick={() => setOpen(false)}
                  className='text-xs font-light tracking-wide text-primary/60 transition-colors hover:text-primary'
                >
                  {t("later")}
                </button>
              </div>
            </div>
          ) : (
            <div className='flex flex-wrap items-center gap-3 pt-1'>
              <Button
                type='button'
                onClick={() => setExpanded(true)}
                className='h-11 rounded-xl bg-primary px-6 text-sm font-light uppercase tracking-[0.1em] text-white hover:bg-primary/90'
              >
                {t("cta")}
              </Button>
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='text-xs font-light tracking-wide text-primary/60 transition-colors hover:text-primary'
              >
                {t("later")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

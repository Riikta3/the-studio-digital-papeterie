"use client";

import { updateEmail, updateProfile } from "@/actions/settings-actions";
import { Button } from "@shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type Profile = {
  first_name?: string | null;
  partner_name?: string | null;
  email?: string | null;
};

export default function ProfileSettings({
  profile,
  weddingDate,
}: {
  profile: Profile | null;
  /** Plain "YYYY-MM-DD" from public.weddings, or null when not set yet. */
  weddingDate?: string | null;
}) {
  const t = useTranslations("Settings.profile");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  async function handleProfileUpdate(formData: FormData) {
    setLoadingProfile(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success(t("toast_profile_success"));
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("toast_tech_error"));
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleEmailUpdate(formData: FormData) {
    setLoadingEmail(true);
    try {
      const result = await updateEmail(formData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("toast_tech_error"));
    } finally {
      setLoadingEmail(false);
    }
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={handleProfileUpdate}
            className='space-y-4 max-w-md'
          >
            <div className='space-y-2'>
              <Label htmlFor='firstName'>{t("firstname")}</Label>
              <Input
                id='firstName'
                name='firstName'
                defaultValue={profile?.first_name || ""}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='partnerName'>{t("partnername")}</Label>
              <Input
                id='partnerName'
                name='partnerName'
                defaultValue={profile?.partner_name || ""}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='weddingDate'>{t("weddingdate")}</Label>
              <Input
                id='weddingDate'
                name='weddingDate'
                type='date'
                // Stored as a plain YYYY-MM-DD date, which is what the input
                // both reads and writes — no timezone conversion either way.
                defaultValue={weddingDate ?? ""}
              />
              <p className='text-xs text-studio-violet/60'>
                {t("weddingdate_hint")}
              </p>
            </div>
            <Button
              type='submit'
              disabled={loadingProfile}
            >
              {loadingProfile && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {t("save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("email_title")}</CardTitle>
          <CardDescription>{t("email_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={handleEmailUpdate}
            className='space-y-4 max-w-md'
          >
            <div className='space-y-2'>
              <Label htmlFor='email'>{t("new_email")}</Label>
              <Input
                id='email'
                name='email'
                type='email'
                defaultValue={profile?.email || ""}
                required
              />
            </div>
            <Button
              type='submit'
              variant='outline'
              disabled={loadingEmail}
            >
              {loadingEmail && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {t("update_email_btn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

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

export default function ProfileSettings({ profile }: { profile: any }) {
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
      toast.error("Erreur technique");
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
      toast.error("Erreur technique");
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

"use client";

import { updatePassword } from "@/actions/settings-actions";
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
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function SecuritySettings() {
  const t = useTranslations("Settings.security");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handlePasswordUpdate(formData: FormData) {
    setLoading(true);
    try {
      const result = await updatePassword(formData);
      if (result.success) {
        toast.success(result.message);
        formRef.current?.reset();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("toast_tech_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("password_title")}</CardTitle>
        <CardDescription>{t("password_desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={handlePasswordUpdate}
          className='space-y-4 max-w-md'
        >
          <div className='space-y-2'>
            <Label htmlFor='password'>{t("new_password")}</Label>
            <Input
              id='password'
              name='password'
              type='password'
              placeholder='••••••••'
              required
              minLength={6}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>{t("confirm_password")}</Label>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              placeholder='••••••••'
              required
              minLength={6}
            />
          </div>
          <Button
            type='submit'
            disabled={loading}
          >
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {t("update_password_btn")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { updateSettings } from "@/actions/settings-actions";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: any;
}) {
  const t = useTranslations("SettingsForm");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await updateSettings(formData);
      if (result.success) {
        toast.success(t("toast_success"));
      } else {
        toast.error(result.error || t("toast_error"));
      }
    } catch (e) {
      toast.error(t("toast_tech_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className='space-y-4 max-w-md'
    >
      <div className='space-y-2'>
        <Label htmlFor='wedding_code'>{t("guest_code")}</Label>
        <Input
          id='wedding_code'
          name='wedding_code'
          defaultValue={initialSettings?.wedding_code || ""}
          placeholder={t("code_placeholder")}
          className='uppercase tracking-widest'
          required
        />
      </div>

      <div className='pt-2'>
        <Button
          type='submit'
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              {t("saving")}
            </>
          ) : (
            t("save")
          )}
        </Button>
      </div>
    </form>
  );
}

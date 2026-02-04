"use client";

import { updateSettings } from "@/actions/settings-actions";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: any;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await updateSettings(formData);
      if (result.success) {
        toast.success("Réglages mis à jour !");
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (e) {
      toast.error("Erreur technique");
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
        <Label htmlFor='wedding_code'>Code Invité</Label>
        <Input
          id='wedding_code'
          name='wedding_code'
          defaultValue={initialSettings?.wedding_code || ""}
          placeholder='Ex: AMOUR2026'
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
              Enregistrement...
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </div>
    </form>
  );
}

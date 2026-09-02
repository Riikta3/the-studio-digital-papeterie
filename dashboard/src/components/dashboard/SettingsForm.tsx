"use client";

import { updateSettings } from "@/actions/settings-actions";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { KeyRound, Loader2, X } from "lucide-react";
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
  const [resetting, setResetting] = useState(false);
  const [currentCode, setCurrentCode] = useState<string | null>(
    initialSettings?.guest_code ?? null,
  );
  const [inputValue, setInputValue] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("guest_code", inputValue.trim());
      const result = await updateSettings(fd);
      if (result.success) {
        setCurrentCode(inputValue.trim().toUpperCase());
        setInputValue("");
        toast.success(t("toast_code_saved"));
      } else {
        toast.error(result.error || t("toast_error"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const fd = new FormData();
      fd.append("guest_code", "");
      const result = await updateSettings(fd);
      if (result.success) {
        setCurrentCode(null);
        toast.success(t("toast_code_removed"));
      } else {
        toast.error(result.error || t("toast_remove_error"));
      }
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-md">
      {/* Current code display */}
      {currentCode ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-studio-lavande/10 border border-studio-violet/20 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-studio-violet/10 flex items-center justify-center shrink-0">
            <KeyRound size={15} className="text-studio-violet" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-studio-violet/60">{t("active_code")}</p>
            <p className="font-bold tracking-widest text-studio-violet text-sm">
              {currentCode}
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-studio-lavande/40 text-studio-violet/60 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
            title={t("remove_code")}
          >
            {resetting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <X size={12} />
            )}
            {t("reset")}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 bg-studio-lavande/5 border border-dashed border-studio-lavande/40 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-studio-lavande/20 flex items-center justify-center shrink-0">
            <KeyRound size={15} className="text-studio-violet/60" />
          </div>
          <p className="text-sm text-studio-violet/60">{t("no_active_code")}</p>
        </div>
      )}

      {/* Input to set/change code */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="wedding_code">
            {currentCode ? t("change_code") : t("guest_code")}
          </Label>
          <Input
            id="wedding_code"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            placeholder={t("code_placeholder")}
            className="uppercase tracking-widest"
            maxLength={20}
          />
          <p className="text-xs text-studio-violet/60">
            {t("guest_code_hint")}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-studio-violet text-white hover:bg-studio-violet/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {currentCode ? t("change_code") : t("save")}
        </button>
      </form>
    </div>
  );
}

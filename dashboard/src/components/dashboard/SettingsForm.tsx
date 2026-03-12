"use client";

import { updateSettings } from "@/actions/settings-actions";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { KeyRound, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: any;
}) {
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
        toast.success("Code invité enregistré");
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
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
        toast.success("Code invité supprimé");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-md">
      {/* Current code display */}
      {currentCode ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <KeyRound size={15} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Code actif</p>
            <p className="font-bold tracking-widest text-foreground text-sm">
              {currentCode}
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
            title="Supprimer le code"
          >
            {resetting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <X size={12} />
            )}
            Réinitialiser
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <KeyRound size={15} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Aucun code invité actif — votre faire-part est accessible à tous.</p>
        </div>
      )}

      {/* Input to set/change code */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="wedding_code">
            {currentCode ? "Modifier le code" : "Définir un code invité"}
          </Label>
          <Input
            id="wedding_code"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            placeholder="ex. MARIAGE2026"
            className="uppercase tracking-widest"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground">
            Les invités devront saisir ce code pour accéder à votre faire-part.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {currentCode ? "Modifier le code" : "Activer le code"}
        </button>
      </form>
    </div>
  );
}

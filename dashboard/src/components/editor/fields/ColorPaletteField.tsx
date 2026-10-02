"use client";

import { Button } from "@shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/components/ui/popover";
import { cn } from "@shared/lib/utils";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactElement, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { parseHexColor, withColor } from "./color";
import { hintClass, inputClass, labelClass } from "./styles";

const DEFAULT_NEW_COLOR = "#e7bdc6";

/**
 * The dress-code palette: up to `max` swatches.
 *
 * A swatch, or « + », opens a picker: a colour field, the colour's code to
 * type (« #E7BDC6 »), Annuler and Valider. Nothing reaches the palette — nor
 * the preview — until « Valider ». The native picker it replaced changed the
 * colour at every move of the cursor and took no code.
 *
 * Hex only — the swatches go into a `style` attribute on the invitation and
 * the landing accepts nothing but a colour there.
 */
export function ColorPaletteField({
  label,
  value,
  onChange,
  max = 6,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (colors: string[]) => void;
  max?: number;
  hint?: string;
}) {
  const t = useTranslations("Editor.palette");

  return (
    <div className="space-y-2">
      <span className={labelClass}>{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {value.map((color, index) => (
          <div key={`${color}-${index}`} className="relative">
            <ColorPicker
              title={t("swatch", { index: index + 1 })}
              initial={color}
              onApply={(next) => onChange(withColor(value, index, next))}
            >
              <button
                type="button"
                aria-label={t("edit", { index: index + 1 })}
                className="block h-11 w-11 rounded-full border border-studio-lavande/60 shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-violet-clair/60 focus-visible:ring-offset-2"
                style={{ background: color }}
              />
            </ColorPicker>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              aria-label={t("remove", { index: index + 1 })}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {value.length < max ? (
          <ColorPicker
            title={t("newTitle")}
            initial={DEFAULT_NEW_COLOR}
            onApply={(next) => onChange(withColor(value, "new", next))}
          >
            <button
              type="button"
              aria-label={t("add")}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-studio-lavande/60 text-studio-violet/60 transition-colors hover:border-studio-violet/40 hover:bg-studio-beurre"
            >
              <Plus className="h-4 w-4" />
            </button>
          </ColorPicker>
        ) : null}
      </div>
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

/**
 * The picker, beside the swatch that opened it. The colour field and the code
 * follow each other; a code half-typed or mistyped keeps « Valider » off.
 * Annuler, Escape or a click elsewhere leave the palette as it was.
 */
function ColorPicker({
  title,
  initial,
  onApply,
  children,
}: {
  title: string;
  initial: string;
  onApply: (color: string) => void;
  children: ReactElement;
}) {
  const t = useTranslations("Editor.palette");
  const [open, setOpen] = useState(false);
  // The colour being chosen, not yet in the palette, and its code as typed.
  const [color, setColor] = useState(DEFAULT_NEW_COLOR);
  const [code, setCode] = useState("");

  const typed = parseHexColor(code);

  const onOpenChange = (next: boolean) => {
    if (next) {
      // A colour saved as rgb() or hsl() — older screens allowed them — opens on black.
      const start = parseHexColor(initial) ?? "#000000";
      setColor(start);
      setCode(start.toUpperCase());
    }
    setOpen(next);
  };

  const apply = () => {
    if (!typed) return;
    onApply(typed);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={16}
        className="w-[272px] rounded-3xl border-studio-lavande/60 bg-white p-4 shadow-studio-card"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="space-y-3"
        >
          <p className="font-heading text-lg leading-tight text-studio-violet">{title}</p>

          <HexColorPicker
            color={color}
            onChange={(next) => {
              setColor(next);
              setCode(next.toUpperCase());
            }}
            style={{ width: "100%", height: 168 }}
          />

          <label className="block space-y-1.5">
            <span className={labelClass}>{t("code")}</span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-11 w-11 shrink-0 rounded-full border border-studio-lavande/60 shadow-sm"
                style={{ background: typed ?? color }}
              />
              <input
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  const parsed = parseHexColor(event.target.value);
                  if (parsed) setColor(parsed);
                }}
                placeholder="#E7BDC6"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={9}
                aria-invalid={!typed}
                className={cn(
                  inputClass,
                  "font-mono uppercase tracking-wide",
                  !typed && "border-red-400 focus:border-red-400 focus:ring-red-300/40",
                )}
              />
            </span>
          </label>
          {!typed ? (
            <p role="alert" className="text-xs leading-snug text-red-600">
              {t("codeInvalid")}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-9 rounded-full px-4 text-sm text-studio-violet hover:bg-studio-card-selected"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!typed}
              className="h-9 rounded-full bg-studio-violet px-5 text-sm font-semibold text-white hover:bg-studio-violet-fonce disabled:opacity-40"
            >
              {t("apply")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

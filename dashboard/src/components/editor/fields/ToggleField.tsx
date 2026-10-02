"use client";

import { Switch } from "@shared/components/ui/switch";
import { useId } from "react";

/** A labelled on/off switch, with a line explaining what "on" does. */
export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-studio-violet">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-studio-violet/60">{description}</p>
        ) : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </div>
  );
}

"use client";

import { cn } from "@shared/lib/utils";
import { useId } from "react";

import { labelClass } from "./styles";

/**
 * A labelled choice between a few options, drawn as pills like the preview's
 * phone / desktop switch: a labelled group of toggle buttons (`aria-pressed`).
 */
export function SegmentedControl<V extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: V;
  options: ReadonlyArray<{ value: V; label: string }>;
  onChange: (value: V) => void;
  disabled?: boolean;
}) {
  const labelId = useId();

  return (
    <div className="space-y-1.5">
      <span id={labelId} className={labelClass}>
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex rounded-full border border-studio-lavande/60 p-0.5"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-10 flex-1 rounded-full px-3 py-1.5 text-sm font-medium leading-tight transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-violet-clair/60",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selected ? "bg-studio-violet text-white" : "text-studio-violet/60 hover:text-studio-violet",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

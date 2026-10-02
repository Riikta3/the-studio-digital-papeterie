"use client";

import { type ReactNode, useId } from "react";

import { hintClass, inputClass, labelClass, textareaClass } from "./styles";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  /** Mirrors the server's limit for this field; the count appears near it. */
  maxLength?: number;
  type?: "text" | "url" | "tel";
  inputMode?: "text" | "url" | "tel" | "numeric";
  /** Beside the label — a reset button, a link. */
  action?: ReactNode;
};

/**
 * One labelled text input or textarea, controlled.
 *
 * The character count only appears in the last fifth of the allowance: a
 * counter under every field is noise, one that shows up as the limit nears is
 * information.
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline,
  rows = 3,
  maxLength,
  type = "text",
  inputMode,
  action,
}: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const nearLimit = maxLength !== undefined && value.length > maxLength * 0.8;

  return (
    <div className="space-y-1.5">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {action}
      </div>

      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={textareaClass}
        />
      ) : (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}

      {hint || nearLimit ? (
        <div className="flex items-start justify-between gap-3">
          {hint ? (
            <p id={hintId} className={hintClass}>
              {hint}
            </p>
          ) : (
            <span />
          )}
          {nearLimit ? (
            <span className="shrink-0 text-[11px] tabular-nums text-studio-violet/50">
              {value.length}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

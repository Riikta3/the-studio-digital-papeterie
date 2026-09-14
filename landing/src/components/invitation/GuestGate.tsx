"use client";

import { useState, useTransition } from "react";

import { submitGuestCode } from "@/actions/guest-gate-actions";

/**
 * The door in front of a couple's invitation.
 *
 * Nothing of the wedding is on this screen — no names, no date, no venue.
 * The page that renders it has not loaded any of that: the gate is decided
 * before the content is fetched, so a locked invitation is absent from the
 * HTML rather than merely hidden in it.
 *
 * ── Why it is styled from the manifest, not from theme CSS ────────────────
 * The three themes share almost no class vocabulary — `.panel` and `.card`
 * exist only in Belle Rive, and their palettes are named differently
 * (`--ivory`, `--white`, `--paper`); the single variable all three define is
 * `--line`. Building this out of their classes would have looked right on one
 * theme and broken on the others, and would break again on the fourth.
 *
 * So it takes what every manifest guarantees: the scope class, the font
 * variables and the accent colour. The couple's typography and accent carry
 * through, the paper tone is derived from the accent, and a theme added
 * tomorrow gets a door that fits without touching this file.
 */
export function GuestGate({
  weddingId,
  scopeClass,
  fontVars,
  accentColor,
}: {
  weddingId: string;
  scopeClass: string;
  fontVars: string;
  accentColor: string;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !code.trim()) return;

    setError(null);

    startTransition(async () => {
      const result = await submitGuestCode(weddingId, code);

      if (result.ok) {
        // A full reload, not a router refresh: the pass is a cookie the
        // server reads while rendering, and the page must be re-requested for
        // it to be seen.
        window.location.reload();
        return;
      }

      setError(result.error ?? "Ce code ne correspond pas.");
      setCode("");
    });
  }

  return (
    <main className={`${scopeClass} ${fontVars} gate-root`}>
      <div className="gate-card">
        <p className="gate-eyebrow">Invitation privée</p>

        <div className="gate-rule" aria-hidden />

        <h1 className="gate-title">Votre code d&apos;accès</h1>

        <p className="gate-help">
          Il figure sur votre faire-part.
        </p>

        <form onSubmit={handleSubmit} className="gate-form">
          <label htmlFor="guest-code" className="gate-label">
            Code d&apos;accès
          </label>

          <input
            id="guest-code"
            name="code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            // No autofocus: on a phone it throws up the keyboard before the
            // guest has read what is being asked of them.
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="go"
            className="gate-input"
            aria-describedby={error ? "guest-code-error" : undefined}
            aria-invalid={error ? true : undefined}
          />

          {/* `aria-live` so a screen reader announces the refusal, which is
              otherwise a silent visual change. */}
          <p
            id="guest-code-error"
            role="status"
            aria-live="polite"
            className={`gate-error${error ? " is-shown" : ""}`}
          >
            {error ?? ""}
          </p>

          <button type="submit" className="gate-submit" disabled={pending || !code.trim()}>
            {pending ? "Vérification…" : "Entrer"}
          </button>
        </form>
      </div>

      {/*
        Scoped to this component and driven by the accent the theme declares.
        `color-mix` keeps the paper and the ink in the couple's own hue without
        every theme having to define a palette this file knows the names of.
      */}
      <style>{`
        /*
         * Doubled deliberately. The theme styles its own root element — the
         * very element this class sits on — at the same specificity, and its
         * stylesheet loads after this block, so a single .gate-root lost every
         * tie: the padding that holds the card off the screen edge was being
         * dropped to 0.
         */
        .gate-root.gate-root {
          --gate-accent: ${accentColor};
          --gate-paper: color-mix(in srgb, ${accentColor} 7%, #fdfbf7);
          --gate-ink: color-mix(in srgb, ${accentColor} 72%, #2b2622);
          --gate-line: color-mix(in srgb, ${accentColor} 32%, transparent);

          min-height: 100svh;
          display: grid;
          place-items: center;
          /* The side padding IS the gutter — the card above fills what is
             left, so these 20px are what keeps it off the screen edge. */
          padding: 32px 20px;
          background: var(--gate-paper);
          color: var(--gate-ink);
        }

        .gate-root .gate-card {
          /*
           * box-sizing plus a margin, not a vw calculation: 100vw is the
           * window, so it cannot be relied on inside a constrained container,
           * and it also ignores a visible scrollbar. A margin on the card
           * itself keeps the gutter whatever the width.
           */
          box-sizing: border-box;
          width: 100%;
          max-width: 400px;
          margin-inline: auto;
          padding: 52px 32px 44px;
          text-align: center;
          background: #fffdfa;
          border: 1px solid var(--gate-line);
          box-shadow: 0 18px 44px color-mix(in srgb, var(--gate-accent) 14%, transparent);
        }

        .gate-root .gate-eyebrow {
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.26em;
          font-size: 10px;
          color: var(--gate-accent);
        }

        .gate-root .gate-rule {
          width: 44px;
          height: 1px;
          margin: 22px auto;
          background: var(--gate-accent);
        }

        /*
         * Measured in ch, not px: a theme may uppercase headings and track
         * them wide — Belle Rive does both — and the title then broke onto
         * three lines. Capping the measure and letting the size shrink keeps
         * it to one or two lines whatever the theme does to it.
         */
        .gate-root .gate-title {
          margin: 0 0 10px;
          font-size: clamp(17px, 4.4vw, 22px);
          font-weight: 400;
          /*
           * Overrides the theme, which is the point: Belle Rive tracks its
           * headings at .08em on top of uppercasing them, which pushed this
           * title onto three lines and made the card read as a ransom note
           * rather than a doorplate. The themes own the invitation; the door
           * only borrows their type and colour.
           */
          letter-spacing: 0.02em;
          text-transform: none;
          line-height: 1.3;
          max-width: 20ch;
          margin-inline: auto;
          text-wrap: balance;
        }

        .gate-root .gate-help {
          margin: 0 0 30px;
          font-size: 13px;
          line-height: 1.6;
          opacity: 0.72;
        }

        .gate-form { display: block; }

        .gate-root .gate-label {
          display: block;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 9px;
          opacity: 0.75;
        }

        .gate-root .gate-input {
          width: 100%;
          padding: 15px 14px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          /* 16px or iOS Safari zooms the page the moment the field is tapped. */
          font-size: 16px;
          color: var(--gate-ink);
          background: var(--gate-paper);
          border: 1px solid var(--gate-line);
          border-radius: 0;
          outline-offset: 3px;
        }

        .gate-root .gate-input:focus-visible {
          outline: 2px solid var(--gate-accent);
        }

        /* Reserves its own line so the card does not jump when a code is
           refused. */
        .gate-root .gate-error {
          min-height: 17px;
          margin: 10px 0 0;
          font-size: 12px;
          line-height: 1.4;
          color: #9b3f39;
          opacity: 0;
          transition: opacity 160ms ease;
        }

        .gate-root .gate-error.is-shown { opacity: 1; }

        .gate-root .gate-submit {
          width: 100%;
          margin-top: 18px;
          padding: 16px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 10px;
          color: #fffdfa;
          background: var(--gate-accent);
          border: 0;
          cursor: pointer;
          transition: opacity 150ms ease;
        }

        .gate-root .gate-submit:disabled { opacity: 0.45; cursor: default; }

        @media (max-width: 390px) {
          .gate-card { padding: 42px 22px 36px; }
          .gate-title { font-size: 24px; }
        }
      `}</style>
    </main>
  );
}

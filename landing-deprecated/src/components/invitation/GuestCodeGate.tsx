"use client";

import { useState, useEffect } from "react";

interface GuestCodeGateProps {
  weddingCode: string;
  partnerNames: string;
  children: React.ReactNode;
}

const SESSION_KEY = "invitation_unlocked";

export function GuestCodeGate({ weddingCode, partnerNames, children }: GuestCodeGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  // Check session storage on mount (avoid re-asking on refresh)
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === weddingCode) setUnlocked(true);
    setReady(true);
  }, [weddingCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().toUpperCase() === weddingCode.toUpperCase()) {
      sessionStorage.setItem(SESSION_KEY, weddingCode);
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1800);
    }
  };

  if (!ready) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Envelope icon */}
      <div className="mb-8 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-9 h-9 text-primary"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m2 7 10 7 10-7" />
        </svg>
      </div>

      <h1 className="font-heading text-3xl md:text-4xl italic text-foreground text-center mb-2">
        {partnerNames}
      </h1>
      <p className="text-muted-foreground text-center mb-10 max-w-xs">
        Saisissez le code invité pour accéder au faire-part.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="CODE INVITÉ"
            maxLength={20}
            autoComplete="off"
            className={`w-full text-center tracking-[0.3em] uppercase text-lg px-4 py-3.5 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all ${
              error
                ? "border-red-400 focus:ring-red-200 animate-shake"
                : "border-border focus:ring-primary/30 focus:border-primary/50"
            }`}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">
            Code incorrect. Veuillez réessayer.
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Accéder au faire-part
        </button>
      </form>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Hourglass, Loader2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@shared/lib/utils";
import { THEMES } from "@/components/studio/themes";

/**
 * The building blocks of the screens shown once the couple has paid: the
 * success / provisioning screen, the "payment received, creation pending"
 * screen and the "order already complete" screen a Back press lands on.
 *
 * They used to be a bare icon, a title and a button floating on the beige
 * page — the least finished-looking screens of the funnel, right after the
 * moment that matters most. They now share one stationery card: a seal
 * pinned on its top edge, an eyebrow, and the order's own invitation.
 */

/** A white card with the studio's lavender shadow and two leaves in its corners. */
export function PostPaymentCard({
  seal,
  children,
}: {
  seal: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto mt-10 w-full max-w-md">
      <div className="studio-card-fill relative rounded-[32px] px-6 pb-8 pt-14 text-center shadow-studio-card ring-1 ring-studio-lavande/30 sm:px-10">
        {/* Clipped on their own layer: the card itself cannot clip, or the
            seal riding on its top edge would be cut in half. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]"
        >
          <Image
            src="/images/leaf-top-lavande.svg"
            alt=""
            width={82}
            height={138}
            className="absolute -right-3 top-6 h-auto w-12 opacity-40 sm:w-16"
          />
          <Image
            src="/images/leaf-bottom-lavande.svg"
            alt=""
            width={106}
            height={188}
            className="absolute -left-4 bottom-4 h-auto w-14 opacity-30 sm:w-20"
          />
        </div>

        <div className="absolute -top-9 left-1/2 -translate-x-1/2">{seal}</div>

        <div className="relative flex flex-col items-center gap-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * The round seal on the card's top edge: a drawn check on violet once the
 * payment is through, an hourglass on yellow while creation is pending.
 */
export function PaymentSeal({ tone }: { tone: "success" | "pending" }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={cn(
        "relative flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-[0_10px_24px_rgba(75,63,114,0.22)] ring-[6px] ring-studio-beurre",
        tone === "success" ? "bg-studio-violet" : "bg-studio-jaune",
      )}
    >
      {/* Perforated inner ring, like a postage stamp's edge. */}
      <svg
        aria-hidden
        viewBox="0 0 72 72"
        className={cn(
          "absolute inset-0 h-full w-full",
          !reduce && "animate-[spin_24s_linear_infinite]",
        )}
      >
        <circle
          cx="36"
          cy="36"
          r="30"
          fill="none"
          strokeWidth="1.2"
          strokeDasharray="1.5 4"
          strokeLinecap="round"
          className={tone === "success" ? "stroke-white/45" : "stroke-studio-violet/35"}
        />
      </svg>

      {tone === "success" ? (
        <svg aria-hidden viewBox="0 0 24 24" className="relative h-8 w-8">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
          />
        </svg>
      ) : (
        <Hourglass className="relative h-7 w-7 text-studio-violet" strokeWidth={1.8} />
      )}
    </motion.div>
  );
}

/** The small uppercase line framed by the home page's eyebrow separators. */
export function PaymentEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 font-body text-[11px] font-semibold uppercase tracking-luxe text-studio-pourpre">
      <Image src="/images/eyebrow-separator-left.svg" alt="" width={32} height={1} />
      <span>{children}</span>
      <Image src="/images/eyebrow-separator-right.svg" alt="" width={32} height={1} />
    </div>
  );
}

export function PaymentHeading({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="font-heading text-h3 leading-tight text-studio-violet">{title}</h1>
      <p className="mx-auto max-w-sm font-body text-sm leading-relaxed text-studio-violet/70">
        {body}
      </p>
    </div>
  );
}

/**
 * The invitation just bought: its theme's cover, tilted like a printed card,
 * with the couple's names beside it. Rendered only while the order is still
 * known — the basket is emptied once the wedding exists.
 */
export function InvitationKeepsake({
  themeId,
  names,
}: {
  themeId: string;
  names: string;
}) {
  const reduce = useReducedMotion();
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme && !names) return null;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45, ease: "easeOut" }}
      className="flex w-full items-center gap-4 rounded-2xl bg-studio-card-selected/70 p-3 text-left"
    >
      {theme && (
        <div className="relative h-[84px] w-[46px] flex-shrink-0 -rotate-6 overflow-hidden rounded-md bg-white p-[3px] shadow-[0_6px_14px_rgba(75,63,114,0.18)]">
          <Image
            src={theme.image}
            alt=""
            width={78}
            height={145}
            className="h-full w-full rounded-[4px] object-cover object-top"
          />
        </div>
      )}
      <div className="min-w-0">
        {names && (
          <p className="truncate font-heading text-lg leading-tight text-studio-violet">
            {names}
          </p>
        )}
        {theme && (
          <p className="mt-1 font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
            {theme.name}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export type ProgressStep = {
  label: string;
  status: "done" | "active" | "todo";
};

/** What is happening behind the scenes, so the wait reads as progress. */
export function ProgressSteps({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="w-full space-y-0 text-left" aria-live="polite">
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex items-center gap-3 py-2">
          {/* Connector to the next step. */}
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn(
                "absolute left-[11px] top-[calc(50%+12px)] h-[calc(100%-24px)] w-px",
                step.status === "done" ? "bg-studio-violet/40" : "bg-studio-lavande/50",
              )}
            />
          )}
          <span
            className={cn(
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-300",
              step.status === "done" && "bg-studio-violet text-white",
              step.status === "active" && "bg-studio-jaune text-studio-violet",
              step.status === "todo" && "border border-studio-lavande/70 bg-white",
            )}
          >
            {step.status === "done" && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
            {step.status === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </span>
          <span
            className={cn(
              "font-body text-sm transition-colors duration-300",
              step.status === "todo"
                ? "text-studio-violet/40"
                : "font-semibold text-studio-violet",
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** A thin divider between the card's sections. */
export function PaymentDivider() {
  return <div aria-hidden className="h-px w-full bg-studio-lavande/30" />;
}

export const primaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-full bg-studio-violet px-6 py-3.5 font-body text-sm font-semibold text-white shadow-[0_8px_20px_rgba(75,63,114,0.22)] transition-all hover:-translate-y-0.5 hover:bg-studio-violet-fonce disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const secondaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-full border border-studio-lavande bg-white/70 px-6 py-3 font-body text-sm font-semibold text-studio-violet/80 transition-colors hover:border-studio-violet hover:text-studio-violet";

"use client";

import { MapPin, ScanLine, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { FadeIn } from "./FadeIn";

// Same order as JourJ.steps in the message files: scan, first name, table.
const STEP_ICONS = [ScanLine, Search, MapPin];

type Step = {
  label: string;
};

// Decorative QR placeholder. Drawn as a grid of squares rather than shipping a
// PNG: it scales cleanly, carries no scannable payload (the real code is
// generated per wedding) and stays in the studio palette.
const QR_PATTERN = [
  "1111111011010001111111",
  "1000001010110101000001",
  "1011101001001101011101",
  "1011101011110101011101",
  "1011101000101101011101",
  "1000001011011001000001",
  "1111111010101011111111",
  "0000000001100100000000",
  "1101101110011011010110",
  "0010110101101100101101",
  "1101001011010011010011",
  "0110110110101101101101",
  "1011011001011010110110",
  "0100101101100101001011",
  "0000000101101101101101",
  "1111111010011010010110",
  "1000001011010110101101",
  "1011101001101001011011",
  "1011101010110110100101",
  "1011101101001011011010",
  "1000001010110101101101",
  "1111111011010010110011",
];

function QrPlaceholder() {
  const size = QR_PATTERN.length;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="presentation"
      aria-hidden="true"
      className="h-full w-full"
      shapeRendering="crispEdges"
    >
      {QR_PATTERN.map((row, y) =>
        row
          .split("")
          .map((cell, x) =>
            cell === "1" ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill="#4B3F72"
              />
            ) : null,
          ),
      )}
    </svg>
  );
}

/**
 * The phone mock: what an actual guest sees after scanning. It answers the
 * promise of the section literally — a first-name field, then the table.
 *
 * An illustration, not a control: the working version lives on the guest
 * route (`/jourj/[slug]/ma-table`), so nothing here is focusable or typable.
 */
function TableLookupMock({
  fieldLabel,
  fieldValue,
  resultLabel,
  resultValue,
}: {
  fieldLabel: string;
  fieldValue: string;
  resultLabel: string;
  resultValue: string;
}) {
  return (
    // The 4px bezel and the notch are what make this read as a phone rather
    // than as a second card next to the QR one — without them the two objects
    // look like a pair of panels and the "scan, then look" story is lost.
    <div className="w-[248px] rounded-[2.5rem] border-4 border-studio-violet bg-white p-4 pt-3 shadow-studio-card">
      <div
        aria-hidden
        className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-studio-violet/25"
      />
      <p className="font-body text-h5 tracking-luxe text-studio-pourpre">
        {fieldLabel}
      </p>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-studio-beige bg-studio-creme px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-studio-violet/50" />
        <span className="font-body text-h4 text-studio-violet">
          {fieldValue}
        </span>
      </div>
      {/* The answer, on the section's light surface: the violet card next to
          it is the code, this is the screen it opens. */}
      <div className="mt-4 rounded-2xl bg-studio-beurre px-4 py-5 text-center">
        <p className="font-body text-h5 tracking-luxe text-studio-pourpre">
          {resultLabel}
        </p>
        <p className="mt-1 font-heading text-h2 text-studio-violet">
          {resultValue}
        </p>
      </div>
    </div>
  );
}

export function JourJ() {
  const t = useTranslations("JourJ");
  const steps = t.raw("steps") as Step[];

  return (
    <section
      id="jour-j"
      className="relative overflow-hidden bg-studio-beurre px-6 py-20 md:px-12"
    >
      <Image
        src="/images/leaf-bottom-lavande.svg"
        alt=""
        width={106}
        height={188}
        className="pointer-events-none absolute -bottom-6 right-0 h-auto w-24 -scale-x-100 rotate-90 md:w-32"
      />

      <FadeIn className="mx-auto mb-14 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
          <Image
            src="/images/eyebrow-separator-left.svg"
            alt=""
            width={42}
            height={1}
          />
          <span>{t("eyebrow")}</span>
          <Image
            src="/images/eyebrow-separator-right.svg"
            alt=""
            width={42}
            height={1}
          />
        </div>
        <h2 className="mt-4 font-heading text-h1 text-studio-violet">
          {t("titleLine1")}
          <br />
          <span className="text-studio-lavande">{t("titleAccent")}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl font-body text-sm text-studio-violet/70 md:text-base">
          {t("intro")}
        </p>
      </FadeIn>

      {/* Two objects, in the order the guest meets them: the code on the
          stationery, then the screen it opens. The arrow between them is the
          whole story of the section, so it points across on desktop and down
          on mobile where the mocks stack. */}
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 md:max-w-4xl md:flex-row md:justify-center md:gap-12">
        <FadeIn className="flex justify-center">
          <div className="overflow-hidden rounded-3xl bg-studio-violet p-8 shadow-studio-card md:p-10">
            <div className="mx-auto h-44 w-44 rounded-2xl bg-studio-jaune p-4 md:h-52 md:w-52">
              <QrPlaceholder />
            </div>
            <p className="mt-6 max-w-[13rem] text-center font-body text-h5 tracking-luxe text-studio-lavande">
              {t("qrCaption")}
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.05} aria-hidden className="text-studio-lavande">
          <svg
            viewBox="0 0 40 24"
            className="h-6 w-10 rotate-90 md:rotate-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12h34" />
            <path d="M28 5l8 7-8 7" />
          </svg>
        </FadeIn>

        <FadeIn delay={0.1} className="flex justify-center">
          <TableLookupMock
            fieldLabel={t("mockFieldLabel")}
            fieldValue={t("mockFieldValue")}
            resultLabel={t("mockResultLabel")}
            resultValue={t("mockResultValue")}
          />
        </FadeIn>
      </div>

      {/* "Un scan. Un prénom. Sa table." — the punchline, laid out as the
          three beats it is rather than run together in a paragraph. */}
      <FadeIn className="mx-auto mt-14 flex max-w-3xl flex-col items-stretch gap-4 sm:flex-row sm:justify-center">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? ScanLine;
          return (
            <div
              key={step.label}
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-studio-creme px-5 py-4 shadow-studio-card"
            >
              <Icon className="h-5 w-5 shrink-0 text-studio-lavande" />
              <span className="font-heading text-h3 text-studio-violet">
                {step.label}
              </span>
            </div>
          );
        })}
      </FadeIn>

      <FadeIn className="mx-auto mt-12 max-w-2xl text-center">
        <p className="font-body text-sm text-studio-violet/70 md:text-base">
          {t("outro")}
        </p>
      </FadeIn>
    </section>
  );
}

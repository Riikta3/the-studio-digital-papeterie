"use client";

import { Camera, Images, QrCode, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { FadeIn } from "./FadeIn";

// Same order as JourJ.features in the message files.
const FEATURE_ICONS = [ScanLine, QrCode, Images, Camera];

type Feature = {
  title: string;
  description: string;
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

export function JourJ() {
  const t = useTranslations("JourJ");
  const features = t.raw("features") as Feature[];

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
        <p className="mx-auto mt-6 max-w-md font-body text-sm text-studio-violet/70 md:text-base">
          {t("subtitle")}
        </p>
      </FadeIn>

      <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-12 md:max-w-5xl md:grid-cols-2 md:gap-16">
        {/* The QR card: the one violet surface in this section, so the code
            reads as the object it is rather than as another text block.
            No TextureOverlay here — the grain is sized for full-width section
            backgrounds, and its soft-light blend washes the violet out at
            card scale. */}
        <FadeIn className="flex justify-center">
          <div className="overflow-hidden rounded-3xl bg-studio-violet p-8 shadow-studio-card md:p-10">
            <div className="mx-auto h-48 w-48 rounded-2xl bg-studio-jaune p-4 md:h-56 md:w-56">
              <QrPlaceholder />
            </div>
            <p className="mt-6 text-center font-body text-h5 tracking-luxe text-studio-lavande">
              {t("qrCaption")}
            </p>
          </div>
        </FadeIn>

        <div className="flex flex-col gap-8">
          {features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i] ?? ScanLine;
            return (
              <FadeIn
                key={feature.title}
                delay={i * 0.05}
                className="flex gap-5"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-studio-lavande shadow-sm">
                  <Icon className="h-6 w-6 text-studio-violet" />
                </div>
                <div>
                  <h3 className="font-heading text-h3 text-studio-violet">
                    {feature.title}
                  </h3>
                  <p className="mt-2 font-body text-sm text-studio-violet/70 md:text-base">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

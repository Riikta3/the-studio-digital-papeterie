import Image from "next/image";

import { assets } from "./tokens";
import { Rule } from "./ui";

/**
 * Footer: the domaine watercolour, then the sand plate carrying "Merci !".
 * The RSVP card's arched foot overlaps the top of the image in the mock, hence
 * the negative margin on the section.
 */
export function FooterSection({
  image,
  title,
  partner1,
  partner2,
  dateLabel,
}: {
  image: string;
  title: string;
  partner1: string;
  partner2: string;
  dateLabel: string;
}) {
  return (
    <footer className="relative -mt-24">
      <Image
        src={image}
        alt=""
        width={1400}
        height={933}
        className="h-auto max-h-[520px] w-full object-cover"
      />

      <div className="relative isolate overflow-hidden bg-mc-beige px-6 py-14 text-center md:py-20">
        <Image
          src={assets.textureFooter}
          alt=""
          width={1920}
          height={1200}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.72] mix-blend-multiply"
        />

        <h2 className="font-mc-serif text-[40px] font-semibold uppercase leading-none text-mc-green md:text-[52px]">
          {title}
        </h2>
        <Rule className="mt-5 bg-mc-green/40" />
        <p className="mt-6 font-mc-sans text-[18px] font-semibold text-mc-green">
          {partner1} &amp; {partner2}
        </p>
        <p className="mt-2 font-mc-sans text-[18px] text-mc-sage">{dateLabel}</p>
      </div>
    </footer>
  );
}

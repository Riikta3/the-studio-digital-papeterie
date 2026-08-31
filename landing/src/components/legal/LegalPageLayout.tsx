import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import type { ReactNode } from "react";

import { Link } from "@/navigation";

type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export async function LegalPageLayout({
  title,
  sections,
}: {
  title: string;
  sections: LegalSection[];
}) {
  const t = await getTranslations("Legal");

  return (
    <main className="min-h-screen bg-studio-creme px-6 py-16 md:px-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-body text-sm text-studio-pourpre hover:text-studio-violet"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backHome")}
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt=""
            width={32}
            height={34}
            className="h-auto w-8"
          />
          <h1 className="font-heading text-h2 text-studio-violet">{title}</h1>
        </div>

        <article className="mt-10 flex flex-col gap-10">
          {sections.map((section) => (
            <LegalSectionBlock key={section.heading} {...section} />
          ))}
        </article>
      </div>
    </main>
  );
}

function LegalSectionBlock({ heading, paragraphs }: LegalSection) {
  return (
    <section>
      <h2 className="font-heading text-lg text-studio-violet md:text-xl">
        {heading}
      </h2>
      <div className="mt-3 flex flex-col gap-3">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            className="font-body text-sm leading-relaxed text-studio-violet/70 md:text-base"
          >
            {renderWithLinks(paragraph)}
          </p>
        ))}
      </div>
    </section>
  );
}

function renderWithLinks(text: string): ReactNode {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <Link
        key={match.index}
        href={match[2]}
        className="underline underline-offset-2 hover:text-studio-violet"
      >
        {match[1]}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

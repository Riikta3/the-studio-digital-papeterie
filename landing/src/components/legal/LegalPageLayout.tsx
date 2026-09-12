import type { ReactNode } from "react";

import { PageHeader } from "@/components/home/PageHeader";
import { Link } from "@/navigation";

type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export function LegalPageLayout({
  title,
  sections,
}: {
  title: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-studio-creme">
      {/* Replaces the "← back home" link and the small logo that used to sit
          beside the title: the header's own logo is the way back, the same as
          on every other page outside the homepage, and it also opens the menu
          — which the bare link never did. */}
      <PageHeader />

      <div className="mx-auto max-w-3xl px-6 pb-16 pt-8 md:px-12">
        <h1 className="font-heading text-h2 text-studio-violet">{title}</h1>

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

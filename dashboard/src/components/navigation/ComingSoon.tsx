import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Stands in for a page the brief specifies but that isn't built yet, so the
 * couple can walk the whole architecture without us faking its content.
 */
export async function ComingSoon({ titleKey }: { titleKey: string }) {
  const t = await getTranslations("ComingSoon");
  const tNav = await getTranslations("Sidebar.sections");

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-studio-lavande/40 bg-white p-8 text-center shadow-studio-card md:mt-16'>
        <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-studio-jaune/40'>
          <Sparkles className='h-6 w-6 text-studio-violet' />
        </div>
        <h1 className='font-heading text-h3 text-studio-violet'>
          {tNav(titleKey)}
        </h1>
        <p className='mt-3 text-sm text-studio-violet/70'>{t("body")}</p>
      </div>
    </div>
  );
}

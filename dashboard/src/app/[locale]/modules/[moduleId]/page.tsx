import { redirect } from "next/navigation";

/**
 * Each module used to have its own screen here, with a generic mock-up as its
 * preview. Modules are configured in the invitation editor now, in their own
 * tab, beside the couple's real theme. The editor opens the hero instead when
 * the module is not one the wedding owns.
 */
export default async function ModuleConfigPage({
  params,
}: {
  params: Promise<{ moduleId: string; locale: string }>;
}) {
  const { moduleId, locale } = await params;
  redirect(`/${locale}/invitation?section=${encodeURIComponent(moduleId)}`);
}

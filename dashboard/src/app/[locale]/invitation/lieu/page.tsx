import { redirect } from "next/navigation";

/**
 * The venue and its practical notes now live in the invitation editor's "Lieu" tab. Kept as a redirect
 * so bookmarks, emails and old links still land somewhere useful.
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/invitation?section=map`);
}

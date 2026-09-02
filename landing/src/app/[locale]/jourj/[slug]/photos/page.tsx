import {
  listGuestGallery,
  resolveGuestPage,
} from "@/actions/guest-page-actions";
import { PhotoUpload } from "@/components/jourj/PhotoUpload";
import { notFound } from "next/navigation";

/**
 * The gallery is read here, in a Server Component, so `hidden` rows are
 * dropped by the database before anything reaches the browser —
 * `listGuestGallery` filters on `hidden = false` and returns nothing at all
 * when the couple has not made the gallery visible.
 *
 * Fresh on every request: a guest who has just uploaded a photo should see it,
 * and the couple can hide one mid-party.
 */
export const dynamic = "force-dynamic";

export default async function GuestPhotosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await resolveGuestPage(slug);
  if (!page) notFound();

  const media = await listGuestGallery(slug);

  const uploadsOpen =
    page.uploadsOpenUntil !== null &&
    new Date(page.uploadsOpenUntil).getTime() > Date.now();

  return (
    <PhotoUpload
      slug={slug}
      galleryVisibleToGuests={page.galleryVisibleToGuests}
      uploadsOpen={uploadsOpen}
      media={media}
    />
  );
}

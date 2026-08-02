import type { Metadata, Viewport } from "next";

import { CountdownModule } from "@/components/invitation/theme-floral/CountdownModule";
import { Divider } from "@/components/invitation/theme-floral/Divider";
import { InvitationFooter } from "@/components/invitation/theme-floral/InvitationFooter";
import { InvitationHero } from "@/components/invitation/theme-floral/InvitationHero";
import { MapModule } from "@/components/invitation/theme-floral/MapModule";
import { TimelineModule } from "@/components/invitation/theme-floral/TimelineModule";
import { INVITATION_DEMO, weddingDateISO } from "@/lib/invitation-demo-data";

// Demo page: static preview embedded in the phone mockup on the home page
// (see `src/components/home/Preview.tsx`). No `searchParams` parsing —
// the viewport is hardcoded to a mobile width since there is no device
// switch in this scope.
export async function generateViewport(): Promise<Viewport> {
  return { width: 390, initialScale: 1 };
}

// Preview page, should never be indexed.
export const metadata: Metadata = {
  title: "Aperçu — The Studio",
  robots: { index: false, follow: false },
};

export default function InvitationDemoPage() {
  return (
    <main className="min-h-screen bg-[#fdf6f0]">
      <InvitationHero
        firstName={INVITATION_DEMO.partner1}
        partnerName={INVITATION_DEMO.partner2}
        weddingDate={weddingDateISO}
      />
      <Divider />
      <CountdownModule
        weddingDate={weddingDateISO}
        partner1={INVITATION_DEMO.partner1}
        partner2={INVITATION_DEMO.partner2}
      />
      <Divider />
      <TimelineModule />
      <Divider />
      <MapModule />
      <Divider />
      <InvitationFooter
        partner1={INVITATION_DEMO.partner1}
        partner2={INVITATION_DEMO.partner2}
        weddingDate={weddingDateISO}
      />
    </main>
  );
}

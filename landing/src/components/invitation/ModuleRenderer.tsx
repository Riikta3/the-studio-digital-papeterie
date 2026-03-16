import { supabaseAdmin } from "@/lib/supabase-admin";
import { AccommodationModule } from "./AccommodationModule";
import { CountdownModule } from "./CountdownModule";
import { Divider } from "./Divider";
import { DressCodeModule } from "./DressCodeModule";
import { FaqModule } from "./FaqModule";
import { GalleryModule } from "./GalleryModule";
import { GiftListModule } from "./GiftListModule";
import { GuestbookModule } from "./GuestbookModule";
import { IntroVideoModule } from "./IntroVideoModule";
import { MapModule } from "./MapModule";
import { MenuModule } from "./MenuModule";
import { PlaylistModule } from "./PlaylistModule";
import { RsvpModule } from "./RsvpModule";
import { TimelineModule } from "./TimelineModule";
import { TransportModule } from "./TransportModule";
import { VideoGuestbookModule } from "./VideoGuestbookModule";

// Define a map of module IDs to their respective React components
const MODULE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  countdown: CountdownModule,
  "intro-video": IntroVideoModule,
  timeline: TimelineModule,
  "dress-code": DressCodeModule,
  rsvp: RsvpModule,
  gallery: GalleryModule,
  map: MapModule,
  "gift-list": GiftListModule,
  guestbook: GuestbookModule,
  accommodation: AccommodationModule,
  transport: TransportModule,
  menu: MenuModule,
  playlist: PlaylistModule,
  faq: FaqModule,
  "video-guestbook": VideoGuestbookModule,
};

export async function ModuleRenderer({
  modules,
  weddingId,
  siteId,
  weddingDate,
  extras,
  partner1,
  partner2,
  isDemo,
}: {
  modules: string[];
  weddingId: string;
  siteId: string;
  weddingDate?: string | null;
  extras?: any;
  partner1?: string;
  partner2?: string;
  isDemo?: boolean;
}) {
  if (!modules || modules.length === 0) return null;

  // Fetch all module configs + positions for this site in a single query
  const { data: siteModules } = await supabaseAdmin
    .from("site_modules")
    .select("module_id, config, position")
    .eq("site_id", siteId);

  const configMap: Record<string, Record<string, unknown> | null> = {};
  const positionMap: Record<string, number> = {};
  (siteModules || []).forEach(({ module_id, config, position }) => {
    configMap[module_id] = config ?? null;
    positionMap[module_id] = position;
  });

  // Only keep modules that have a registered component, sorted by position
  const knownModules = modules
    .filter((id) => MODULE_COMPONENTS[id])
    .sort((a, b) => {
      const posA = positionMap[a] ?? 99;
      const posB = positionMap[b] ?? 99;
      return posA - posB;
    });

  return (
    <div className='flex flex-col w-full'>
      {knownModules.map((moduleId, index) => {
        const ModuleComponent = MODULE_COMPONENTS[moduleId];
        const isLast = index === knownModules.length - 1;
        const config = configMap[moduleId] ?? null;

        return (
          <div key={moduleId}>
            <ModuleComponent
              weddingId={weddingId}
              weddingDate={weddingDate}
              extras={extras}
              config={config}
              partner1={partner1}
              partner2={partner2}
              {...(moduleId === "rsvp" || moduleId === "gallery" ? { isDemo } : {})}
            />
            {!isLast && <Divider />}
          </div>
        );
      })}
    </div>
  );
}

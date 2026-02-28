import { AccommodationModule } from "./AccommodationModule";
import { CountdownModule } from "./CountdownModule";
import { Divider } from "./Divider";
import { GalleryModule } from "./GalleryModule";
import { GenericInfoModule } from "./GenericInfoModule";
import { GiftListModule } from "./GiftListModule";
import { GuestbookModule } from "./GuestbookModule";
import { MapModule } from "./MapModule";
import { MenuModule } from "./MenuModule";
import { RsvpModule } from "./RsvpModule";
import { TimelineModule } from "./TimelineModule";
import { TransportModule } from "./TransportModule";
import { VideoGuestbookModule } from "./VideoGuestbookModule";

// Define a map of module IDs to their respective React components
const MODULE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  countdown: CountdownModule,
  timeline: TimelineModule,
  rsvp: RsvpModule,
  gallery: GalleryModule,
  map: MapModule,
  "gift-list": GiftListModule,
  guestbook: GuestbookModule,
  accommodation: AccommodationModule,
  transport: TransportModule,
  menu: MenuModule,
  "video-guestbook": VideoGuestbookModule,
};

export function ModuleRenderer({
  modules,
  weddingId,
  weddingDate,
}: {
  modules: string[];
  weddingId: string;
  weddingDate?: string | null;
}) {
  if (!modules || modules.length === 0) return null;

  return (
    <div className='flex flex-col w-full'>
      {modules.map((moduleId, index) => {
        const ModuleComponent = MODULE_COMPONENTS[moduleId];
        const isLast = index === modules.length - 1;

        if (!ModuleComponent) {
          // Fallback to a nice generic info module for things like guestbook, menu, transport
          const fallbackTitles: Record<string, string> = {
            guestbook: "Livre d'Or",
            accommodation: "Hébergement",
            transport: "Transport",
            menu: "Menu",
          };

          return (
            <div key={moduleId}>
              <GenericInfoModule
                id={moduleId}
                title={fallbackTitles[moduleId] || moduleId}
                weddingId={weddingId}
              />
              {!isLast && <Divider />}
            </div>
          );
        }

        return (
          <div key={moduleId}>
            <ModuleComponent
              weddingId={weddingId}
              weddingDate={weddingDate}
            />
            {!isLast && <Divider />}
          </div>
        );
      })}
    </div>
  );
}

import { MapPin } from "lucide-react";

interface EventData {
  id: string;
  time: string;
  title: string;
  location: string | null;
  description: string | null;
  order_index: number;
}

const MOCK_EVENTS: EventData[] = [
  {
    id: "mock-1",
    time: "15:00",
    title: "Cérémonie Civile",
    location: "Mairie du 8e arrondissement, Paris",
    description: "Merci d'arriver 15 minutes en avance.",
    order_index: 1,
  },
  {
    id: "mock-2",
    time: "17:30",
    title: "Vin d'Honneur",
    location: "Jardins du Palais Royal, Paris 1er",
    description: "Cocktails et petits fours dans les jardins.",
    order_index: 2,
  },
  {
    id: "mock-3",
    time: "20:00",
    title: "Dîner & Soirée",
    location: "Château de Vaux-le-Vicomte, Maincy (77)",
    description: "Dress code élégant. Préparez-vous à danser !",
    order_index: 3,
  },
];

export function TimelineModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const events: EventData[] =
    config?.events && Array.isArray(config.events) && config.events.length > 0
      ? config.events
      : MOCK_EVENTS;

  return (
    <section className='w-full'>
      <div className='text-center mb-20 space-y-4'>
        <h2 className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground'>
          Programme
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic text-foreground'>
          Le Jour J
        </h3>
      </div>

      <div className='relative max-w-4xl mx-auto px-4 md:px-0'>
        {/* Subtle Central Line */}
        <div className='absolute left-8 md:left-1/2 top-4 bottom-4 w-px bg-primary/20 md:-translate-x-1/2 z-0 hidden md:block' />
        <div className='absolute left-12 top-4 bottom-4 w-px bg-primary/20 -translate-x-1/2 z-0 md:hidden' />

        <div className='space-y-12 md:space-y-16'>
          {events.map((event: EventData, i: number) => {
            const isEven = i % 2 === 0;

            return (
              <div
                key={event.id}
                className={`relative flex flex-col md:flex-row items-center animate-fade-in-up ${
                  isEven ? "md:flex-row-reverse" : ""
                }`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Desktop Empty Spacer */}
                <div className='hidden md:block w-1/2' />

                {/* Center Node (Just Time, no dots) */}
                <div className='absolute left-12 md:left-1/2 md:-translate-x-1/2 -translate-x-1/2 flex items-center justify-center z-10 w-24 bg-background py-4'>
                  <span className='text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-primary border border-border bg-card px-4 py-1.5 rounded-full shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] mb-0'>
                    {event.time}
                  </span>
                </div>

                {/* Content Area (Luxurious Card) */}
                <div
                  className={`w-full md:w-1/2 pl-24 md:pl-0 ${
                    isEven
                      ? "md:pr-20 md:text-right"
                      : "md:pl-20 md:text-left text-left"
                  }`}
                >
                  <div className='bg-card border border-border shadow-xl hover:border-primary/30 transition-colors p-10 rounded-[2rem]'>
                    <h4 className='font-heading text-2xl md:text-3xl mb-3 text-foreground'>
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className='text-muted-foreground font-light text-[14px] leading-relaxed mb-5'>
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <div className={`flex ${isEven ? "md:justify-end justify-start" : "justify-start"}`}>
                        <div className='flex items-start gap-1.5'>
                          <MapPin className='w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5' />
                          <span className='text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground leading-tight'>{event.location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

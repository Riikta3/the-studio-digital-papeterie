// Make sure you remove "use client" from the top of the file!
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MapPin } from "lucide-react";

interface EventData {
  id: string;
  time: string;
  title: string;
  location: string | null;
  description: string | null;
  order_index: number;
}

export async function TimelineModule({ weddingId }: { weddingId: string }) {
  // Fetch real events from database
  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("order_index", { ascending: true });

  const MOCK_EVENTS = [
    {
      id: "mock-1",
      time: "14:30",
      title: "Cérémonie Religieuse",
      location: "Église Sainte-Marie",
      description: "Merci d'arriver 15 minutes en avance.",
      order_index: 1,
    },
    {
      id: "mock-2",
      time: "17:00",
      title: "Vin d'Honneur",
      location: "Château de la Roche",
      description: "Cocktails et petits fours dans les jardins.",
      order_index: 2,
    },
    {
      id: "mock-3",
      time: "20:00",
      title: "Dîner & Soirée",
      location: "Salle des Fêtes du Château",
      description: "Dress code élégant. Préparez-vous à danser !",
      order_index: 3,
    },
  ];

  // If table doesn't exist yet or there's an error, fallback to mock data for design purposes
  const displayEvents =
    error || !events || events.length === 0 ? MOCK_EVENTS : events;

  return (
    <section className='w-full'>
      <div className='text-center mb-20 space-y-4'>
        <h2 className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#6C7A6E]'>
          Programme
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic text-[#333333]'>
          Le Jour J
        </h3>
      </div>

      <div className='relative max-w-4xl mx-auto px-4 md:px-0'>
        {/* Subtle Central Line */}
        <div className='absolute left-8 md:left-1/2 top-4 bottom-4 w-px bg-primary/20 md:-translate-x-1/2 z-0 hidden md:block' />
        <div className='absolute left-8 md:left-1/2 top-4 bottom-4 w-px bg-primary/20 -translate-x-1/2 z-0 md:hidden' />

        <div className='space-y-12 md:space-y-16'>
          {displayEvents.map((event: EventData, i: number) => {
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
                <div className='absolute left-8 md:left-1/2 md:-translate-x-1/2 -translate-x-1/2 flex items-center justify-center z-10 w-24 bg-background py-4'>
                  <span className='text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#4B6856] border border-[#EAEAEA] bg-white px-4 py-1.5 rounded-full shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] mb-0'>
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
                  <div className='bg-white border border-[#EAEAEA] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] hover:border-[#D0D8D3] transition-colors p-8 rounded-[2rem]'>
                    <h4 className='font-heading text-2xl md:text-3xl mb-3 text-[#333333]'>
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className='text-[#556B5D] font-light text-[14px] leading-relaxed mb-5 max-w-sm mr-auto ml-0 md:max-w-none md:mx-0'>
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <div
                        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#6C7A6E] ${
                          isEven ? "md:justify-end" : "justify-start"
                        }`}
                      >
                        <MapPin className='w-3.5 h-3.5 opacity-70' />
                        {event.location}
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

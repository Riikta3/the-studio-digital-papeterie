"use client";

import { motion } from "framer-motion";
import { Shirt } from "lucide-react";

export interface DressCodeData {
  title: string;
  subtitle: string;
  mode?: "global" | "split";
  description?: string;
  description_men?: string;
  description_women?: string;
}

const MOCK_DRESS_CODE: DressCodeData = {
  title: "Dress Code",
  subtitle: "Tenue de Soirée",
  mode: "global",
  description:
    "Pour que la fête soit belle, nous vous invitons à porter une touche de vert sapin ou de doré dans vos tenues. Laissez parler votre créativité !",
};

export function DressCodeModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const data: DressCodeData = {
    ...MOCK_DRESS_CODE,
    ...(config
      ? Object.fromEntries(
          Object.entries(config).filter(([, v]) => v !== "" && v !== null && v !== undefined)
        )
      : {}),
  } as DressCodeData;

  const isSplit =
    data.mode === "split" &&
    (data.description_men || data.description_women);

  return (
    <section className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl mx-auto px-4 text-center"
      >
        <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-foreground/60 mb-4">
          {data.title}
        </p>
        <h3 className="font-heading text-5xl md:text-6xl italic text-foreground mb-8">
          {data.subtitle}
        </h3>

        {isSplit ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Men */}
            <div className="bg-background rounded-[2rem] p-8 md:p-10 border border-primary/20 shadow-xl flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center text-primary">
                <Shirt className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-foreground/60">
                Homme
              </p>
              <p className="text-muted-foreground/60 text-sm md:text-base leading-relaxed font-light">
                {data.description_men}
              </p>
            </div>

            {/* Women */}
            <div className="bg-background rounded-[2rem] p-8 md:p-10 border border-primary/20 shadow-xl flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center text-primary">
                <Shirt className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-foreground/60">
                Femme
              </p>
              <p className="text-muted-foreground/60 text-sm md:text-base leading-relaxed font-light">
                {data.description_women}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-background rounded-[2rem] p-10 md:p-14 border border-primary/20 shadow-xl max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6 text-primary">
              <Shirt className="w-6 h-6 opacity-80" />
            </div>
            <p className="text-muted-foreground/60 text-base md:text-lg leading-relaxed font-light">
              {data.description}
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
}

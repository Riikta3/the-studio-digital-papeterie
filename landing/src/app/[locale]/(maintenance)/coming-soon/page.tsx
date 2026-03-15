// landing/src/app/[locale]/(maintenance)/coming-soon/page.tsx
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Bientôt disponible — The Studio Digital Papeterie",
  description: "L'art du faire-part repensé pour l'ère digitale.",
};

export default function ComingSoonPage() {
  // Note: `bg-background` and `bg-noise` are inherited from root layout's <body>.
  // They do not need to be repeated here.
  return (
    <main className='relative min-h-screen overflow-hidden flex flex-col items-center justify-center text-center px-4'>
      {/* Radial halo crème */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 40%, transparent 20%, rgba(253,251,247,0.7) 80%)",
        }}
        aria-hidden='true'
      />

      {/* Ornement coin haut-gauche */}
      <OrnamentSvg
        className='absolute -top-10 -left-10 w-64 h-64 -rotate-[15deg] opacity-[0.07] pointer-events-none'
        aria-hidden='true'
      />

      {/* Ornement coin bas-droit */}
      <OrnamentSvg
        className='absolute -bottom-10 -right-10 w-60 h-60 rotate-[165deg] opacity-[0.07] pointer-events-none'
        aria-hidden='true'
      />

      {/* Contenu */}
      <div className='relative z-10 flex flex-col items-center gap-8 max-w-lg'>
        {/* Logo */}
        <Image
          src='/images/logo.png'
          alt='The Studio Digital Papeterie'
          width={280}
          height={64}
          className='h-16 w-auto object-contain opacity-90'
          priority
        />

        <Divider />

        {/* Eyebrow */}
        <p className='text-[0.6rem] uppercase tracking-[0.28em] text-primary font-medium'>
          Faire-part digital haut de gamme
        </p>

        {/* Titre */}
        <h1 className='font-heading text-[clamp(3rem,8vw,5.5rem)] font-medium leading-[0.95] tracking-tight'>
          Quelque chose <br />
          de <em className='italic text-primary font-semibold'>beau</em>
          <br />
          arrive.
        </h1>

        {/* Sous-titre */}
        <p className='font-heading italic text-muted-foreground text-[clamp(1rem,2.5vw,1.3rem)] leading-relaxed max-w-sm'>
          L&apos;art du faire-part repensé pour l&apos;ère digitale — bientôt
          disponible.
        </p>

        <Divider />

        {/* Contact */}
        <p className='text-xs text-muted-foreground'>
          Une question ?{" "}
          <a
            href='mailto:contact@thestudiopapeteriedigitale.com'
            className='text-primary border-b border-primary/30 hover:opacity-70 transition-opacity'
          >
            contact@thestudiopapeteriedigitale.com
          </a>
        </p>
      </div>

      {/* Footer */}
      <p className='absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.65rem] uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap'>
        © The Studio Digital Papeterie
      </p>
    </main>
  );
}

function Divider() {
  return (
    <div className='flex items-center justify-center gap-3 w-full'>
      <div className='h-px w-14 bg-primary/30' />
      <div className='w-1.5 h-1.5 bg-primary/50 rotate-45 shrink-0' />
      <div className='h-px w-14 bg-primary/30' />
    </div>
  );
}

function OrnamentSvg({
  className,
  "aria-hidden": ariaHidden,
}: {
  className?: string;
  "aria-hidden"?: boolean | "true";
}) {
  return (
    <svg
      className={className}
      aria-hidden={ariaHidden}
      viewBox='0 0 300 300'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M150 20 C90 20 20 90 20 150 C20 210 90 280 150 280 C210 280 280 210 280 150 C280 90 210 20 150 20Z'
        stroke='hsl(344,53%,35%)'
        strokeWidth='1'
      />
      <path
        d='M150 50 C100 50 50 100 50 150 C50 200 100 250 150 250 C200 250 250 200 250 150 C250 100 200 50 150 50Z'
        stroke='hsl(344,53%,35%)'
        strokeWidth='0.5'
      />
      <line
        x1='150'
        y1='0'
        x2='150'
        y2='300'
        stroke='hsl(344,53%,35%)'
        strokeWidth='0.3'
        opacity='0.5'
      />
      <line
        x1='0'
        y1='150'
        x2='300'
        y2='150'
        stroke='hsl(344,53%,35%)'
        strokeWidth='0.3'
        opacity='0.5'
      />
      <circle
        cx='150'
        cy='150'
        r='8'
        stroke='hsl(344,53%,35%)'
        strokeWidth='1'
      />
      <path
        d='M150 30 C150 30 178 80 150 120 C122 80 150 30 150 30Z'
        fill='hsl(344,53%,35%)'
        opacity='0.6'
      />
      <path
        d='M150 270 C150 270 178 220 150 180 C122 220 150 270 150 270Z'
        fill='hsl(344,53%,35%)'
        opacity='0.6'
      />
      <path
        d='M30 150 C30 150 80 122 120 150 C80 178 30 150 30 150Z'
        fill='hsl(344,53%,35%)'
        opacity='0.6'
      />
      <path
        d='M270 150 C270 150 220 122 180 150 C220 178 270 150 270 150Z'
        fill='hsl(344,53%,35%)'
        opacity='0.6'
      />
    </svg>
  );
}

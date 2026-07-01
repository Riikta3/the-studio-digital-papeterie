interface FooterProps {
  profile: { first_name: string; partner_name: string; wedding_date?: string | null };
}
export function InvitationFooter({ profile }: FooterProps) {
  return (
    <footer className="w-full py-16 text-center bg-[#fdf6f0] border-t border-[#c97a90]/10">
      <p className="text-2xl text-[#5a3040]/70" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}>
        {profile.first_name} & {profile.partner_name}
      </p>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c97a90]/40 mt-3 font-sans">Fait avec amour · The Studio Digital</p>
    </footer>
  );
}

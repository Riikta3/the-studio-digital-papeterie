interface FooterProps { profile: { first_name: string; partner_name: string; wedding_date?: string | null }; }
export function InvitationFooter({ profile }: FooterProps) {
  return (
    <footer className="w-full py-16 text-center bg-[#fdf0e5] border-t border-[#a98467]/10">
      <p className="text-2xl text-[#4a3728]/60" style={{ fontFamily:"Georgia, serif", fontStyle:"italic" }}>
        {profile.first_name} & {profile.partner_name}
      </p>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#a98467]/40 mt-3 font-sans">Fait avec soin · The Studio Digital</p>
    </footer>
  );
}

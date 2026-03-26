interface FooterProps { profile: { first_name: string; partner_name: string; wedding_date?: string | null }; }
export function InvitationFooter({ profile }: FooterProps) {
  return (
    <footer className="w-full py-16 text-center bg-[#eef2ff] border-t border-[#c4a23a]/10">
      <p className="text-2xl text-[#1e3a8a]/60" style={{ fontFamily:"Georgia, serif" }}>{profile.first_name} & {profile.partner_name}</p>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#c4a23a]/40 mt-3 font-sans">Fait avec élégance · The Studio Digital</p>
    </footer>
  );
}

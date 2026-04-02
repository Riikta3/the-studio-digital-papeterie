interface FooterProps { profile: { first_name: string; partner_name: string; wedding_date?: string | null }; }
export function InvitationFooter({ profile }: FooterProps) {
  return (
    <footer className="w-full py-16 text-center bg-[#FDFDFA] border-t border-[#D35400]/10">
      <p className="text-xl text-[#0E2F44] font-black" style={{ fontFamily:"'Montserrat', system-ui, sans-serif" }}>
        {profile.first_name} & {profile.partner_name}
      </p>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#D35400]/40 mt-3 font-sans">The Studio Digital</p>
    </footer>
  );
}

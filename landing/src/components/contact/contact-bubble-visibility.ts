/*
 * Hidden on /contact — the form is already on screen there, so the bubble
 * would only offer a route to the page the visitor is standing on.
 *
 * And hidden on the three guest pages. Those belong to the couple, not to
 * us: an invitation, a Jour J screen and a wedding journal are read by their
 * guests, and a floating "nous contacter" bubble there offers a stranger a
 * line to OUR support about someone else's wedding. It also puts our brand
 * on top of a page the couple paid to make theirs.
 *
 * Takes next-intl's `usePathname`, which strips the locale prefix — hence
 * the comparison against `/contact` rather than `/fr/contact`.
 *
 * Its own module so `ContactBubbleLoader` can decide without importing the
 * bubble, and with it framer-motion, on pages that never show it.
 */
const HIDDEN_PREFIXES = ["/invitation/", "/jourj/", "/journal/"];

export function contactBubbleHidden(pathname: string): boolean {
  return pathname === "/contact" || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Navigates to one of the homepage's sections from anywhere in the app.
 *
 * The menu and footer links used to call `getElementById(...)?.scrollIntoView()`
 * directly. That works on the homepage and silently does nothing anywhere else:
 * off the homepage none of those ids exist, so the optional chaining swallows
 * the miss and the click just closes the drawer. Every product link in the
 * studio funnel was therefore dead.
 *
 * On the homepage we still scroll in place — no navigation, no reload. Off it,
 * we route to the homepage carrying the section in the hash, which
 * `useScrollToHash` picks up once the page has rendered.
 */
export function scrollToSection(
  anchor: string,
  {
    isHome,
    navigate,
  }: {
    isHome: boolean;
    /** Locale-aware push, from `@/navigation`'s router. */
    navigate: (href: string) => void;
  },
) {
  if (isHome) {
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  navigate(`/#${anchor}`);
}

import {
  BARE_PAGE_CLASS,
  BARE_PAGE_CSS,
  CUSTOM_DOMAIN_NOT_FOUND_COPY,
} from "@/lib/custom-domain-routing";

/**
 * The 404 on a couple's own domain, as the app renders it: the same copy and
 * stylesheet as the proxy's `CUSTOM_DOMAIN_NOT_FOUND_HTML`, so a guest sees one
 * page whichever of the two answered. No link: `NotFoundView` carries the
 * shop's menu and studio links, which do not belong on that domain.
 */
export function CustomDomainNotFound() {
  const { eyebrow, title } = CUSTOM_DOMAIN_NOT_FOUND_COPY;

  return (
    <main className={BARE_PAGE_CLASS}>
      {/* A constant of ours, never user input. */}
      <style dangerouslySetInnerHTML={{ __html: BARE_PAGE_CSS }} />
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <hr />
      </div>
    </main>
  );
}

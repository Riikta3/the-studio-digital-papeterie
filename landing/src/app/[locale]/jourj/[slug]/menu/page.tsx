import { getGuestPageData } from "@/actions/guest-page-actions";
import { notFound } from "next/navigation";
import type { MenuCategoryKey } from "@shared/types/jour-j";

/**
 * The keys are the fixed set from `shared/types/jour-j.ts` / the
 * `menu_categories.key` check constraint, so this map is total by
 * construction. Disabled categories never arrive here: the anon policy and
 * `getGuestPageData`'s own `.eq("enabled", true)` both drop them.
 */
const LABELS: Record<MenuCategoryKey, string> = {
  cocktail: "Cocktail",
  starter: "Entrée",
  main: "Plat",
  cheese: "Fromage",
  dessert: "Dessert",
  drinks: "Boissons",
};

export default async function GuestMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getGuestPageData(slug);
  if (!data) notFound();

  // A category the couple enabled but never filled would render as a bare
  // heading; drop it rather than show an empty section.
  const categories = data.menu.filter((c) => c.items.length > 0);

  return (
    <div>
      <h1 className='text-center font-heading text-2xl text-studio-violet'>
        Le menu
      </h1>

      {categories.length === 0 ? (
        <p className='mt-8 text-center text-sm text-studio-violet/60'>
          Le menu n&apos;est pas encore publié. Revenez un peu plus tard !
        </p>
      ) : (
        <div className='mt-8 space-y-8'>
          {categories.map((category) => (
            <section key={category.id} className='text-center'>
              <h2 className='text-xs uppercase tracking-[0.2em] text-studio-violet/50'>
                {LABELS[category.key]}
              </h2>
              <ul className='mt-3 space-y-2'>
                {category.items.map((item) => (
                  <li key={item.id} className='text-sm text-studio-violet'>
                    {item.name}
                    {item.description && (
                      <span className='mt-0.5 block text-xs text-studio-violet/50'>
                        {item.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

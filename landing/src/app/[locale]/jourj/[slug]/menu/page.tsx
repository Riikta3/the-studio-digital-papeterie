import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

const LABELS: Record<string, string> = {
  cocktail: "Cocktail",
  starter: "Entrée",
  main: "Plat",
  cheese: "Fromage",
  dessert: "Dessert",
  drinks: "Boissons",
};

export default function GuestMenuPage() {
  const categories = JOUR_J_MOCK.menu
    .filter((c) => c.enabled)
    .sort((a, b) => a.position - b.position);

  return (
    <div>
      <h1 className='text-center font-heading text-2xl text-studio-violet'>
        Le menu
      </h1>

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
    </div>
  );
}

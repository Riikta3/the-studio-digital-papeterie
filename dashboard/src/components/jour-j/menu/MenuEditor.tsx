"use client";

import type { MenuCategory, MenuItem } from "@shared/types/jour-j";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MenuCategoryCard } from "./MenuCategoryCard";

export function MenuEditor({ initialMenu }: { initialMenu: MenuCategory[] }) {
  const t = useTranslations("DayOfMenu");
  const [menu, setMenu] = useState(initialMenu);

  const update = (id: string, fn: (c: MenuCategory) => MenuCategory) =>
    setMenu((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("subtitle")}</p>

        <div className='mt-6 space-y-3'>
          {[...menu]
            .sort((a, b) => a.position - b.position)
            .map((category) => (
              <MenuCategoryCard
                key={category.id}
                category={category}
                onToggle={() =>
                  update(category.id, (c) => ({ ...c, enabled: !c.enabled }))
                }
                onAddItem={(item: MenuItem) =>
                  update(category.id, (c) => ({ ...c, items: [...c.items, item] }))
                }
                onRemoveItem={(itemId) =>
                  update(category.id, (c) => ({
                    ...c,
                    items: c.items.filter((i) => i.id !== itemId),
                  }))
                }
              />
            ))}
        </div>
      </div>
    </div>
  );
}

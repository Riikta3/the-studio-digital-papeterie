"use client";

import {
  createMenuItem,
  deleteMenuItem,
  toggleCategory,
} from "@/actions/menu-actions";
import type { MenuCategory, MenuItem } from "@shared/types/jour-j";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { MenuCategoryCard } from "./MenuCategoryCard";

export function MenuEditor({ initialMenu }: { initialMenu: MenuCategory[] }) {
  const t = useTranslations("DayOfMenu");
  const [menu, setMenu] = useState(initialMenu);

  const update = (id: string, fn: (c: MenuCategory) => MenuCategory) =>
    setMenu((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));

  const onToggle = async (category: MenuCategory) => {
    const previous = menu;
    const nextEnabled = !category.enabled;
    update(category.id, (c) => ({ ...c, enabled: nextEnabled }));
    const res = await toggleCategory(category.id, nextEnabled);
    if (!res.success) {
      setMenu(previous);
      toast.error(res.error || t("toggle_failed"));
    }
  };

  // `MenuCategoryCard` mints a temporary `mi-<uuid>` id so the item renders
  // immediately; that id is not a valid Postgres uuid, so it is never sent
  // to the server. Once the write returns, the temp item is swapped for the
  // real one so its id matches what is now in the database.
  const onAddItem = async (category: MenuCategory, tempItem: MenuItem) => {
    const previous = menu;
    update(category.id, (c) => ({ ...c, items: [...c.items, tempItem] }));
    const position = category.items.length;
    const res = await createMenuItem(
      category.id,
      { name: tempItem.name },
      position,
    );
    if (!res.success) {
      setMenu(previous);
      toast.error(res.error || t("add_failed"));
      return;
    }
    update(category.id, (c) => ({
      ...c,
      items: c.items.map((i) => (i.id === tempItem.id ? res.item : i)),
    }));
  };

  const onRemoveItem = async (category: MenuCategory, itemId: string) => {
    const previous = menu;
    update(category.id, (c) => ({
      ...c,
      items: c.items.filter((i) => i.id !== itemId),
    }));
    const res = await deleteMenuItem(category.id, itemId);
    if (!res.success) {
      setMenu(previous);
      toast.error(res.error || t("remove_failed"));
    }
  };

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
                onToggle={() => onToggle(category)}
                onAddItem={(item: MenuItem) => onAddItem(category, item)}
                onRemoveItem={(itemId) => onRemoveItem(category, itemId)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

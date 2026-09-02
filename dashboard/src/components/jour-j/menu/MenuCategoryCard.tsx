"use client";

import type { MenuCategory, MenuItem } from "@shared/types/jour-j";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  category: MenuCategory;
  onToggle: () => void;
  onAddItem: (item: MenuItem) => void;
  onRemoveItem: (itemId: string) => void;
};

export function MenuCategoryCard({
  category,
  onToggle,
  onAddItem,
  onRemoveItem,
}: Props) {
  const t = useTranslations("DayOfMenu");
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    onAddItem({ id: `mi-${crypto.randomUUID()}`, name });
    setDraft("");
  };

  return (
    <section className='rounded-xl border border-studio-lavande/40 bg-white p-4'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='font-heading text-sm text-studio-violet'>
          {t(`categories.${category.key}`)}
        </h2>
        <label className='flex min-h-11 shrink-0 items-center gap-2 text-xs text-studio-violet/70'>
          <input
            type='checkbox'
            checked={category.enabled}
            onChange={onToggle}
            className='h-4 w-4 accent-[#4B3F72]'
          />
          {t("enabled")}
        </label>
      </div>

      {category.enabled && (
        <>
          <ul className='mt-3 space-y-1'>
            {category.items.map((item) => (
              <li
                key={item.id}
                className='flex min-h-11 items-center justify-between rounded-lg bg-studio-creme px-3 text-sm text-studio-violet'
              >
                <span className='truncate'>
                  {item.name}
                  {item.description && (
                    <span className='ml-2 text-xs text-studio-violet/50'>
                      {item.description}
                    </span>
                  )}
                </span>
                <button
                  type='button'
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={t("remove_item")}
                  className='flex h-11 w-11 shrink-0 items-center justify-center'
                >
                  <Trash2 className='h-4 w-4 text-studio-violet/40 hover:text-red-500' />
                </button>
              </li>
            ))}
          </ul>

          <div className='mt-2 flex gap-2'>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder={t("add_placeholder")}
              className='min-h-11 flex-1 rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet'
            />
            <button
              type='button'
              onClick={add}
              aria-label={t("add_item")}
              className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-studio-violet text-white'
            >
              <Plus className='h-4 w-4' />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

"use client";

import type { FaqEntry } from "@shared/types/invitation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  createFaqEntry,
  deleteFaqEntry,
  reorderFaqEntries,
  updateFaqEntry,
} from "@/actions/faq-actions";
import { DeleteFaqDialog } from "./DeleteFaqDialog";
import { FaqRow } from "./FaqRow";

type Props = {
  initialFaq: FaqEntry[];
};

export function FaqPageClient({ initialFaq }: Props) {
  const t = useTranslations("InvitationFaq");
  const [faq, setFaq] = useState(initialFaq);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sorted = [...faq].sort((a, b) => a.position - b.position);
  const pendingDelete = faq.find((entry) => entry.id === pendingDeleteId);

  const updateEntry = async (id: string, patch: Partial<FaqEntry>) => {
    const previous = faq; // capture BEFORE mutating, for rollback
    setFaq((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
    const res = await updateFaqEntry(id, patch);
    if (!res.success) {
      setFaq(previous);
      toast.error(res.error || t("save_failed"));
      return;
    }
    // The publish toggle is a deliberate visibility decision worth
    // confirming — question/answer text edits on the same row are not: they
    // already show their saved value inline.
    if (typeof patch.published === "boolean") {
      toast.success(patch.published ? t("published_toast") : t("unpublished_toast"));
    }
  };

  const swapPositions = (id: string, direction: -1 | 1) => {
    const previous = faq;
    const list = [...previous].sort((a, b) => a.position - b.position);
    const index = list.findIndex((entry) => entry.id === id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const positions = list.map((entry) => entry.position);
    list[index] = { ...list[index], position: positions[targetIndex] };
    list[targetIndex] = { ...list[targetIndex], position: positions[index] };
    setFaq(list);

    void reorderFaqEntries(list.map((entry) => entry.id)).then((res) => {
      if (!res.success) {
        setFaq(previous);
        toast.error(res.error || t("save_failed"));
        return;
      }
      toast.success(t("order_saved"));
    });
  };

  const deleteEntry = async (id: string) => {
    const previous = faq;
    setFaq((prev) => prev.filter((entry) => entry.id !== id));
    const res = await deleteFaqEntry(id);
    if (!res.success) {
      setFaq(previous);
      toast.error(res.error || t("save_failed"));
      return;
    }
    toast.success(t("entry_deleted"));
  };

  const addEntry = async () => {
    const res = await createFaqEntry({
      question: "",
      answer: "",
      position: faq.length,
      published: false,
    });
    if (!res.success) {
      toast.error(res.error || t("save_failed"));
      return;
    }
    // Adopt the database's id — a client-generated one is not a valid uuid,
    // and every later update would target a row that does not exist.
    setFaq((prev) => [...prev, res.entry]);
    toast.success(t("entry_added"));
  };

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
          <button
            type='button'
            onClick={() => void addEntry()}
            className='flex min-h-11 items-center gap-1.5 rounded-full bg-studio-violet px-4 text-sm font-medium text-white'
          >
            <Plus className='h-4 w-4' />
            {t("add")}
          </button>
        </div>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("subtitle")}</p>

        {sorted.length === 0 ? (
          <p className='mt-6 rounded-2xl border border-dashed border-studio-lavande/50 bg-white p-6 text-center text-sm text-studio-violet/60'>
            {t("empty")}
          </p>
        ) : (
          <ul className='mt-6 space-y-3'>
            {sorted.map((entry, index) => (
              <FaqRow
                key={entry.id}
                entry={entry}
                isFirst={index === 0}
                isLast={index === sorted.length - 1}
                onChange={(patch) => void updateEntry(entry.id, patch)}
                onMoveUp={() => swapPositions(entry.id, -1)}
                onMoveDown={() => swapPositions(entry.id, 1)}
                onDelete={() => setPendingDeleteId(entry.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <DeleteFaqDialog
        open={pendingDeleteId !== null}
        question={pendingDelete?.question ?? ""}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) void deleteEntry(pendingDeleteId);
        }}
      />
    </div>
  );
}

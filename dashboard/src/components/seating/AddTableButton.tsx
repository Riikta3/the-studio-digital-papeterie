"use client";

import { createTable } from "@/actions/table-actions";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner"; // Assuming sonner is installed as per package.json

export function AddTableButton({ className }: { className?: string }) {
  const t = useTranslations("AddTableButton");
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    // For V1, we just create a standard round table.
    // Later we should open a Dialog to ask for name/capacity.
    const formData = new FormData();
    formData.append("name", "Table " + Math.floor(Math.random() * 100)); // Temporary name
    formData.append("capacity", "8");
    formData.append("shape", "round");

    startTransition(async () => {
      const result = await createTable(null, formData);
      if (result.success) {
        toast.success(t("toast_success"));
      } else {
        toast.error(t("toast_error", { error: result.error }));
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={className}
    >
      <Plus className='w-4 h-4 mr-2' />
      {isPending ? t("creating") : t("add_table")}
    </button>
  );
}

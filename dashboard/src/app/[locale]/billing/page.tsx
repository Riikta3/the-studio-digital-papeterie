import { getBillingHistory } from "@/actions/billing-actions";
import { BillingHistory } from "@/components/dashboard/BillingHistory";
import { getTranslations } from "next-intl/server";

export default async function BillingPage() {
  const t = await getTranslations("Billing");
  const { data: history, error } = await getBillingHistory();

  return (
    <div className='flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto'>
      <div className='flex flex-col space-y-2'>
        <h2 className='font-heading text-h2 tracking-tight text-studio-violet'>
          {t("title")}
        </h2>
        <p className='text-muted-foreground'>{t("subtitle")}</p>
      </div>

      {error ? (
        <div className='p-4 rounded-lg bg-red-50 border border-red-200 text-red-700'>
          {error}
        </div>
      ) : (
        <BillingHistory history={history || []} />
      )}
    </div>
  );
}

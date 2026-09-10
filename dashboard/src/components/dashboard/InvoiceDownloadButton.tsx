"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getInvoiceDownloadUrl } from "@/actions/invoice-actions";

/**
 * Fetches a signed URL, then opens the invoice.
 *
 * Invoices sit in a private bucket, so there is no stable href to put on a
 * link: the URL is minted per click and expires shortly after. Opening it in a
 * new tab (rather than assigning `window.location`) keeps the dashboard where
 * it is while the browser handles the PDF.
 */
export function InvoiceDownloadButton({
  paymentIntentId,
  label,
}: {
  paymentIntentId: string;
  label: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);

    const result = await getInvoiceDownloadUrl(paymentIntentId);

    setIsLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={isLoading}
      className='inline-flex items-center gap-1.5 text-sm font-medium text-studio-violet transition-colors hover:text-studio-violet/80 disabled:cursor-not-allowed disabled:opacity-60'
    >
      {isLoading ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <Download className='h-4 w-4' />
      )}
      {label}
    </button>
  );
}

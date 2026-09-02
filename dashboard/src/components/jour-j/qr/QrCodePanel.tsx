"use client";

import { Download, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type Props = { url: string; svg: string; pngDataUrl: string };

export function QrCodePanel({ url, svg, pngDataUrl }: Props) {
  const t = useTranslations("QrCode");

  const download = (href: string, filename: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    // Some browsers ignore .click() on an anchor that is not in the document.
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    download(href, "qr-code-jour-j.svg");
    // Revoking synchronously can free the blob before the save has read it.
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  };

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("permanent_note")}</p>

        <div className='mt-6 rounded-2xl border border-studio-lavande/40 bg-white p-6 shadow-studio-card'>
          <div
            className='mx-auto w-full max-w-[260px] [&>svg]:h-auto [&>svg]:w-full'
            dangerouslySetInnerHTML={{ __html: svg }}
          />

          <div className='mt-5 flex items-center gap-2 rounded-lg bg-studio-creme px-3 py-2'>
            <Link2 className='h-4 w-4 shrink-0 text-studio-violet/50' />
            <code className='flex-1 truncate text-xs text-studio-violet'>{url}</code>
            <button
              type='button'
              onClick={() => {
                navigator.clipboard
                  .writeText(url)
                  .then(() => toast.success(t("copied")))
                  .catch(() => toast.error(t("copy_failed")));
              }}
              className='min-h-11 shrink-0 px-2 text-xs font-medium text-studio-violet underline'
            >
              {t("copy")}
            </button>
          </div>

          <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
            <button
              type='button'
              onClick={() => download(pngDataUrl, "qr-code-jour-j.png")}
              className='flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-studio-violet text-sm font-medium text-white'
            >
              <Download className='h-4 w-4' />
              {t("download_png")}
            </button>
            <button
              type='button'
              onClick={downloadSvg}
              className='flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-studio-violet text-sm font-medium text-studio-violet'
            >
              <Download className='h-4 w-4' />
              {t("download_svg")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

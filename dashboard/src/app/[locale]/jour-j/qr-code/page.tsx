import { getDayOfSettings } from "@/actions/day-of-settings-actions";
import { QrCodePanel } from "@/components/jour-j/qr/QrCodePanel";
import { getTranslations } from "next-intl/server";
import QRCode from "qrcode";

export default async function QrCodePage() {
  const { qrSlug } = await getDayOfSettings();

  // `qrSlug` comes from `sites.slug`, which does not exist until the couple
  // has published a site. Rendering a QR code from an empty slug would
  // print a broken URL — better to say so than hand out a code that 404s.
  if (!qrSlug) {
    const t = await getTranslations("QrCode");
    return (
      <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
        <div className='mx-auto max-w-2xl'>
          <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
          <p className='mt-6 rounded-2xl border border-studio-lavande/40 bg-white p-6 text-sm text-studio-violet/70 shadow-studio-card'>
            {t("no_slug")}
          </p>
        </div>
      </div>
    );
  }

  // `thestudio.fr` was hardcoded here and is not this project's domain — the
  // configured one is NEXT_PUBLIC_LANDING_URL. Every QR code generated before
  // this fix pointed at a host that was never ours, so none of them could have
  // worked.
  //
  // ⚠️ This URL is PRINTED. Once a couple has printed their code, changing the
  // domain here breaks it permanently — a guest scanning the card gets
  // nothing, and there is no way to reach them. If the domain ever moves, keep
  // the old host alive and redirect it rather than editing this line.
  const landingBase =
    process.env.NEXT_PUBLIC_LANDING_URL || "https://www.thestudiopapeteriedigitale.com";
  const url = `${landingBase}/fr/jourj/${qrSlug}`;

  // Rendered here rather than in the browser: the printable export must not
  // depend on a canvas being mounted. The URL depends only on the slug, so
  // this QR code is permanent — it never changes when tables, menu, guests
  // or the schedule are edited.
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    color: { dark: "#4B3F72", light: "#FFFFFF" },
  });

  const pngDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 1024,
    color: { dark: "#4B3F72", light: "#FFFFFF" },
  });

  return <QrCodePanel url={url} svg={svg} pngDataUrl={pngDataUrl} />;
}

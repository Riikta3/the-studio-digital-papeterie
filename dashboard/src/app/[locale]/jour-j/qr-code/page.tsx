import { QrCodePanel } from "@/components/jour-j/qr/QrCodePanel";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
import QRCode from "qrcode";

export default async function QrCodePage() {
  const { qrSlug } = JOUR_J_MOCK.settings;
  const url = `https://thestudio.fr/jourj/${qrSlug}`;

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

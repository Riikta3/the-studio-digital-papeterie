import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import {
  COMPANY,
  PAYMENT_TERMS,
  VAT_EXEMPTION_NOTICE,
  VAT_REGIME,
  companyAddressLines,
} from "@/lib/company";
import type { InvoiceLine } from "@/lib/invoice-lines";

/**
 * Renders an invoice to PDF.
 *
 * pdf-lib rather than a headless browser: this runs inside the Stripe webhook
 * on Vercel's serverless runtime, where Puppeteer/Chromium does not fit in the
 * bundle or the cold-start budget. The layout is deliberately plain — an
 * invoice is an accounting document, and every element on it is there because
 * the law requires it.
 */

/** A4 in PostScript points. */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

const INK = rgb(0.29, 0.25, 0.45); // studio violet
const MUTED = rgb(0.45, 0.45, 0.5);
const RULE = rgb(0.85, 0.85, 0.89);

export interface InvoicePdfInput {
  invoiceNumber: string;
  issuedAt: Date;
  customerName?: string;
  customerEmail: string;
  lines: InvoiceLine[];
  /** In euros. */
  subtotal: number;
  vat: number;
  total: number;
  /** Card, PayPal, Apple Pay… as recorded on the payment. */
  paymentMethod: string;
}

/** Formats a euro amount the French way: "1 234,56 €". */
function euros(amount: number): string {
  return (
    amount
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €"
  );
}

function frenchDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

/**
 * Wraps text to a pixel width, since pdf-lib draws single lines only.
 * Long module enumerations otherwise run off the page edge.
 */
function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return lines.length > 0 ? lines : [""];
}

/** Draws right-aligned text ending at `right`. */
function drawRight(
  page: PDFPage,
  text: string,
  right: number,
  y: number,
  font: PDFFont,
  size: number,
  color = INK,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: right - width, y, size, font, color });
}

export async function renderInvoicePdf(
  input: InvoicePdfInput,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  pdf.setTitle(`Facture ${input.invoiceNumber}`);
  pdf.setProducer(COMPANY.tradingName);
  pdf.setCreationDate(input.issuedAt);

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const rightEdge = PAGE_WIDTH - MARGIN;
  let y = PAGE_HEIGHT - MARGIN;

  // ── Letterhead ──
  page.drawText(COMPANY.tradingName, {
    x: MARGIN,
    y: y - 18,
    size: 18,
    font: bold,
    color: INK,
  });

  drawRight(page, "FACTURE", rightEdge, y - 18, bold, 18);
  drawRight(page, input.invoiceNumber, rightEdge, y - 34, regular, 11, MUTED);
  drawRight(
    page,
    `Émise le ${frenchDate(input.issuedAt)}`,
    rightEdge,
    y - 48,
    regular,
    9,
    MUTED,
  );

  y -= 70;

  // ── Seller / buyer blocks ──
  const blockTop = y;

  page.drawText("ÉMETTEUR", { x: MARGIN, y, size: 8, font: bold, color: MUTED });
  y -= 14;

  for (const line of companyAddressLines()) {
    page.drawText(line, { x: MARGIN, y, size: 8.5, font: regular, color: INK });
    y -= 11;
  }

  const sellerBottom = y;
  y = blockTop;
  const buyerX = MARGIN + contentWidth / 2;

  page.drawText("CLIENT", { x: buyerX, y, size: 8, font: bold, color: MUTED });
  y -= 14;

  if (input.customerName) {
    page.drawText(input.customerName, {
      x: buyerX,
      y,
      size: 8.5,
      font: regular,
      color: INK,
    });
    y -= 11;
  }
  page.drawText(input.customerEmail, {
    x: buyerX,
    y,
    size: 8.5,
    font: regular,
    color: INK,
  });
  y -= 11;

  y = Math.min(sellerBottom, y) - 24;

  // ── Line-item table ──
  const colQty = MARGIN + contentWidth * 0.62;
  const colUnit = MARGIN + contentWidth * 0.78;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: rightEdge, y },
    thickness: 0.75,
    color: RULE,
  });
  y -= 13;

  page.drawText("DÉSIGNATION", { x: MARGIN, y, size: 8, font: bold, color: MUTED });
  drawRight(page, "QTÉ", colQty + 24, y, bold, 8, MUTED);
  drawRight(page, "P.U.", colUnit + 34, y, bold, 8, MUTED);
  drawRight(page, "TOTAL", rightEdge, y, bold, 8, MUTED);
  y -= 8;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: rightEdge, y },
    thickness: 0.75,
    color: RULE,
  });
  y -= 16;

  const labelWidth = colQty - MARGIN - 16;

  for (const line of input.lines) {
    const wrapped = wrap(line.label, regular, 9, labelWidth);

    for (const [index, text] of wrapped.entries()) {
      page.drawText(text, { x: MARGIN, y, size: 9, font: regular, color: INK });

      // Figures sit on the item's first line only.
      if (index === 0) {
        drawRight(page, String(line.quantity), colQty + 24, y, regular, 9);
        drawRight(page, euros(line.unitPrice), colUnit + 34, y, regular, 9);
        drawRight(page, euros(line.total), rightEdge, y, regular, 9);
      }
      y -= 12;
    }
    y -= 4;
  }

  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: rightEdge, y },
    thickness: 0.75,
    color: RULE,
  });
  y -= 18;

  // ── Totals ──
  // Under the franchise en base there is no VAT to break out, so a single
  // total is shown; the article 293 B mention below carries the explanation.
  if (VAT_REGIME === "standard") {
    drawRight(page, "Total HT", colUnit + 34, y, regular, 9, MUTED);
    drawRight(page, euros(input.subtotal), rightEdge, y, regular, 9);
    y -= 14;

    drawRight(page, "TVA 20 %", colUnit + 34, y, regular, 9, MUTED);
    drawRight(page, euros(input.vat), rightEdge, y, regular, 9);
    y -= 14;
  }

  drawRight(page, "TOTAL", colUnit + 34, y, bold, 11);
  drawRight(page, euros(input.total), rightEdge, y, bold, 11);
  y -= 24;

  // ── Mandatory notices ──
  const notices: string[] = [];

  if (VAT_REGIME === "franchise") notices.push(VAT_EXEMPTION_NOTICE);

  notices.push(
    `Facture acquittée le ${frenchDate(input.issuedAt)} par ${input.paymentMethod}.`,
  );
  notices.push(PAYMENT_TERMS);

  for (const notice of notices) {
    for (const text of wrap(notice, regular, 7.5, contentWidth)) {
      page.drawText(text, { x: MARGIN, y, size: 7.5, font: regular, color: MUTED });
      y -= 10;
    }
    y -= 4;
  }

  // ── Footer ──
  page.drawText(COMPANY.website, {
    x: MARGIN,
    y: MARGIN - 14,
    size: 7.5,
    font: regular,
    color: MUTED,
  });
  drawRight(page, input.invoiceNumber, rightEdge, MARGIN - 14, regular, 7.5, MUTED);

  return pdf.save();
}

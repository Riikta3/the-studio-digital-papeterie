import assert from "node:assert/strict";
import test from "node:test";

import { buildCoupleNoticeEmail, buildStudioAlertEmail, dashboardHome } from "./emails.ts";

const COUPLE = { email: "sophie@example.com", firstName: "Sophie", partnerName: "Pierre", locale: "fr" };
const DASHBOARD = "https://espace.example.com/fr";

test("the active email names the domain and links to it", () => {
  const email = buildCoupleNoticeEmail({ code: "active", name: "sophie-et-pierre.com", contact: COUPLE }, DASHBOARD);
  assert.equal(email.subject, "Votre domaine sophie-et-pierre.com est en ligne ✨");
  assert.match(email.html, /href="https:\/\/sophie-et-pierre\.com"/);
  assert.match(email.html, /Sophie &amp; Pierre/);
  assert.match(email.text, /https:\/\/sophie-et-pierre\.com/);
});

test("the name_unavailable email says which name was lost, and links to the dashboard", () => {
  const email = buildCoupleNoticeEmail({ code: "name_unavailable", name: "sophie-et-pierre.com", contact: COUPLE }, DASHBOARD);
  assert.equal(email.subject, "sophie-et-pierre.com a été pris, choisissez-en un autre");
  assert.match(email.html, /href="https:\/\/espace\.example\.com\/fr"/);
  assert.match(email.html, /sans aucun frais/);
  assert.match(email.text, /https:\/\/espace\.example\.com\/fr/);
});

test("without a name (lost to another couple) the email still reads", () => {
  const email = buildCoupleNoticeEmail({ code: "name_unavailable", name: null, contact: COUPLE }, DASHBOARD);
  assert.equal(email.subject, "Votre nom de domaine a été pris, choisissez-en un autre");
  assert.doesNotMatch(email.html, /null/);
});

test("the reminder links to the dashboard", () => {
  const email = buildCoupleNoticeEmail({ code: "reminder", name: null, contact: { ...COUPLE, firstName: undefined, partnerName: undefined } }, DASHBOARD);
  assert.equal(email.subject, "Votre nom de domaine vous attend");
  assert.match(email.html, /href="https:\/\/espace\.example\.com\/fr"/);
});

test("names from the database are escaped", () => {
  const email = buildCoupleNoticeEmail({ code: "reminder", name: null, contact: { ...COUPLE, firstName: "<b>Sophie</b>" } }, DASHBOARD);
  assert.doesNotMatch(email.html, /<b>Sophie<\/b>/);
  assert.match(email.html, /&lt;b&gt;Sophie/);
});

const ALERT = {
  id: "row-1",
  name: "sophie-et-pierre.com",
  siteId: "site-1",
  weddingId: "wed-1",
  status: "failed",
  previousStatus: "purchasing",
  lastError: "http_500",
  orderId: "ord_1",
  attempts: 5,
  orderMayExist: true,
};

test("the studio alert carries the row id, name, status, last_error and site", () => {
  const email = buildStudioAlertEmail(ALERT);
  assert.equal(email.subject, "[Domaine · échec] sophie-et-pierre.com — http_500");
  for (const value of ["row-1", "sophie-et-pierre.com", "failed", "purchasing", "http_500", "site-1", "wed-1", "ord_1"]) {
    assert.ok(email.html.includes(value), value);
    assert.ok(email.text.includes(value), value);
  }
  // An order may exist: the studio must look before relaunching.
  assert.match(email.text, /commande/);
});

test("the dashboard link uses the site's language, or French", () => {
  const origin = "https://espace.example.com";
  assert.equal(dashboardHome("en", origin), "https://espace.example.com/en");
  assert.equal(dashboardHome("xx", origin), "https://espace.example.com/fr");
  assert.equal(dashboardHome("", origin), "https://espace.example.com/fr");
});

test("an alert without a possible order does not send the studio looking for one", () => {
  const email = buildStudioAlertEmail({ ...ALERT, previousStatus: "purchasing", lastError: "tld_not_supported", orderId: null, orderMayExist: false });
  assert.doesNotMatch(email.text, /commande a peut-être été passée/);
});

test("an unconfirmed purchase tells the studio to check the Vercel dashboard", () => {
  const email = buildStudioAlertEmail({ ...ALERT, lastError: "buy_unconfirmed", orderId: null });
  assert.match(email.text, /tableau de bord Vercel/);
  assert.match(email.text, /commande a peut-être été passée/);
});

test("an auth alert is an action to take, not a failure, and carries Vercel's answer", () => {
  const email = buildStudioAlertEmail({
    ...ALERT,
    status: "queued",
    previousStatus: "queued",
    lastError: "vercel_unauthorized",
    orderId: null,
    attempts: 0,
    orderMayExist: false,
    detail: "403 forbidden: Not authorized",
  });
  assert.equal(email.subject, "[Domaine · action requise] sophie-et-pierre.com — vercel_unauthorized");
  assert.match(email.text, /Statut : queued/);
  assert.match(email.text, /403 forbidden: Not authorized/);
  assert.match(email.text, /VERCEL_API_TOKEN/);
});

test("every code the engine fails a row with has its own explanation", () => {
  const generic = buildStudioAlertEmail({ ...ALERT, lastError: "some-vercel-code" }).text.split("\n")[0];
  for (const code of [
    "buy_unconfirmed",
    "order_pending_timeout",
    "domain_already_in_account",
    "paid_amount_mismatch",
    "order_id_not_saved",
    "search_unknown",
    "quote_unavailable",
    "vercel_unauthorized",
    "order_too_expensive",
    "tld_not_supported",
  ]) {
    assert.notEqual(buildStudioAlertEmail({ ...ALERT, lastError: code }).text.split("\n")[0], generic, code);
  }
});

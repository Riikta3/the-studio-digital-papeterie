import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_INVITATION_MESSAGE,
  fillMessage,
  joinFirstNames,
  sendingQueue,
  smsLink,
  smsNumber,
  whatsappLink,
  whatsappNumber,
} from "./invitation-sending.ts";

test("whatsappNumber turns the numbers couples type into wa.me digits", () => {
  assert.equal(whatsappNumber("06 12 34 56 78"), "33612345678");
  assert.equal(whatsappNumber("06.12.34.56.78"), "33612345678");
  assert.equal(whatsappNumber("+33 6 12 34 56 78"), "33612345678");
  assert.equal(whatsappNumber("0033612345678"), "33612345678");
  assert.equal(whatsappNumber("+32 470 12 34 56"), "32470123456");
  assert.equal(whatsappNumber("+1 (415) 555-0100"), "14155550100");
});

test("whatsappNumber refuses what cannot be a phone number", () => {
  assert.equal(whatsappNumber(""), null);
  assert.equal(whatsappNumber(null), null);
  assert.equal(whatsappNumber("pas de numéro"), null);
  assert.equal(whatsappNumber("12 34"), null);
});

test("smsNumber dials the international form", () => {
  assert.equal(smsNumber("06 12 34 56 78"), "+33612345678");
  assert.equal(smsNumber("abc"), null);
});

test("joinFirstNames reads like a sentence", () => {
  assert.equal(joinFirstNames(["Paul"]), "Paul");
  assert.equal(joinFirstNames(["Paul", "Claire"]), "Paul et Claire");
  assert.equal(joinFirstNames(["Paul", "Claire", "Léo"]), "Paul, Claire et Léo");
  assert.equal(joinFirstNames([" ", ""]), "");
});

test("fillMessage replaces the placeholders and keeps anything else", () => {
  const text = fillMessage("Bonjour {prenoms} ({foyer}) : {lien} — {couple} {autre}", {
    prenoms: "Paul et Claire",
    foyer: "Famille Martin",
    lien: "https://charlotte-et-tarik.com",
    couple: "Charlotte & Tarik",
  });
  assert.equal(
    text,
    "Bonjour Paul et Claire (Famille Martin) : https://charlotte-et-tarik.com — Charlotte & Tarik {autre}",
  );
  assert.ok(!fillMessage(DEFAULT_INVITATION_MESSAGE, { prenoms: "a", foyer: "b", lien: "c", couple: "d" }).includes("{"));
});

test("links carry the message encoded", () => {
  assert.equal(whatsappLink("33612345678", "Salut & à bientôt"), "https://wa.me/33612345678?text=Salut%20%26%20%C3%A0%20bient%C3%B4t");
  assert.equal(smsLink("+33612345678", "Oui ?"), "sms:+33612345678?&body=Oui%20%3F");
});

test("sendingQueue: invite the unsent, remind the sent who have not answered", () => {
  const households = [
    { id: "a", status: "pending", invitation_sent_at: null },
    { id: "b", status: "pending", invitation_sent_at: "2026-10-01T10:00:00Z" },
    { id: "c", status: "confirmed", invitation_sent_at: "2026-10-01T10:00:00Z" },
    { id: "d", status: "partial", invitation_sent_at: null },
  ];
  assert.deepEqual(sendingQueue(households, "invite").map((h) => h.id), ["a", "d"]);
  assert.deepEqual(sendingQueue(households, "remind").map((h) => h.id), ["b"]);
});

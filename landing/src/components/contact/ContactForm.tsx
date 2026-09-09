"use client";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { ArrowRight, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import type {
  ContactCollection,
  ContactInterest,
  GuestBand,
  ProjectStage,
} from "@/actions/submit-contact";
import { submitContact } from "@/actions/submit-contact";
import { Link } from "@/navigation";

const GUEST_BANDS: readonly GuestBand[] = [
  "lt-50",
  "50-100",
  "100-150",
  "150-200",
  "gt-200",
  "unknown",
];

const INTERESTS: readonly ContactInterest[] = [
  "collection",
  "personnaliser",
  "sur-mesure",
  "question",
  "unknown",
];

const COLLECTIONS: readonly ContactCollection[] = [
  "ciao-amore",
  "blanc-couture",
  "belle-rive",
  "unknown",
];

const PROJECT_STAGES: readonly ProjectStage[] = [
  "decouvre",
  "univers-choisi",
  "idee-precise",
  "besoin-conseil",
];

// The collection question only makes sense for these two interests — see
// submit-contact.ts, which drops any collection value arriving with any
// other interest rather than store it against a question never shown.
const INTERESTS_WITH_COLLECTION: readonly ContactInterest[] = [
  "collection",
  "personnaliser",
];

type FieldErrors = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  consent: string;
}>;

/**
 * The contact form itself — hero and editorial column live in the page.
 *
 * ── Antispam ─────────────────────────────────────────────────────────────
 * Two cheap, non-load-bearing filters mirrored from submit-contact.ts: a
 * honeypot field a human never sees or fills, and a minimum elapsed time
 * between mount and submit that a scripted POST never respects. Both are
 * decided server-side; here they just get measured and forwarded.
 *
 * ── Kept data on error ───────────────────────────────────────────────────
 * Every field lives in local state and nothing is reset on failure — only
 * `globalError` (or a field error) is set. A couple who just wrote three
 * paragraphs about their wedding must never see that erased by a transient
 * rate limit.
 */
export function ContactForm() {
  const t = useTranslations("Contact.form");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  // Lazy useState initializer rather than `useRef(Date.now())`: the latter
  // calls an impure function directly during render, which React's purity
  // rules flag even though the value is only ever read, never causing a
  // re-render itself.
  const [mountedAt] = useState(() => Date.now());
  // Same reasoning for the date input's bounds — computed once, matching the
  // RPC's own "today .. +10 years" window (20260909140000_contact_
  // qualification_fields.sql) so the native picker cannot even offer a date
  // the server would refuse.
  const [dateBounds] = useState(() => {
    const toISODate = (d: Date) => d.toISOString().slice(0, 10);
    const max = new Date();
    max.setFullYear(max.getFullYear() + 10);
    return { min: toISODate(new Date()), max: toISODate(max) };
  });
  const submittedOnce = useRef(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [weddingPlace, setWeddingPlace] = useState("");
  const [guestBand, setGuestBand] = useState<GuestBand | undefined>();
  const [interest, setInterest] = useState<ContactInterest | undefined>();
  const [collection, setCollection] = useState<ContactCollection | undefined>();
  const [projectStage, setProjectStage] = useState<ProjectStage | undefined>();
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState(false);
  const [success, setSuccess] = useState(false);

  const showCollection =
    interest !== undefined && INTERESTS_WITH_COLLECTION.includes(interest);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (firstName.trim().length < 1) errors.firstName = t("errors.firstName");
    if (lastName.trim().length < 1) errors.lastName = t("errors.lastName");
    if (!/^[^@\s]+@[^@\s.]+\.[a-z]{2,}$/i.test(email.trim())) {
      errors.email = t("errors.email");
    }
    if (message.trim().length < 10) errors.message = t("errors.message");
    if (!consent) errors.consent = t("errors.consent");
    return errors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Belt-and-braces against a double click landing two submits before the
    // button's own `disabled` re-renders.
    if (isPending || submittedOnce.current) return;

    const errors = validate();
    setFieldErrors(errors);
    setGlobalError(false);
    if (Object.keys(errors).length > 0) return;

    submittedOnce.current = true;

    startTransition(async () => {
      const result = await submitContact({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        message: message.trim(),
        locale,
        weddingDate: weddingDate || undefined,
        weddingPlace: weddingPlace.trim() || undefined,
        guestBand,
        interest,
        collection: showCollection ? collection : undefined,
        projectStage,
        consent,
        honeypot,
        elapsedMs: Date.now() - mountedAt,
      });

      if (result.ok) {
        setSuccess(true);
        return;
      }

      // Never a raw technical error — "invalid" here in practice means the
      // rate limit (fields were already validated above), and neither is
      // something the visitor can act on beyond trying again shortly.
      submittedOnce.current = false;
      setGlobalError(true);
    });
  }

  if (success) {
    return <ContactSuccess />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      {/* Honeypot: visually and semantically hidden, never focusable. A real
          visitor never sees or fills this; a scripted form-filler does. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          id="firstName"
          label={t("firstNameLabel")}
          error={fieldErrors.firstName}
        >
          <TextInput
            id="firstName"
            value={firstName}
            onChange={setFirstName}
            placeholder={t("firstNamePlaceholder")}
            autoComplete="given-name"
            invalid={Boolean(fieldErrors.firstName)}
          />
        </Field>

        <Field
          id="lastName"
          label={t("lastNameLabel")}
          error={fieldErrors.lastName}
        >
          <TextInput
            id="lastName"
            value={lastName}
            onChange={setLastName}
            placeholder={t("lastNamePlaceholder")}
            autoComplete="family-name"
            invalid={Boolean(fieldErrors.lastName)}
          />
        </Field>
      </div>

      <Field id="email" label={t("emailLabel")} error={fieldErrors.email}>
        <TextInput
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          invalid={Boolean(fieldErrors.email)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="weddingDate" label={t("weddingDateLabel")}>
          <TextInput
            id="weddingDate"
            type="date"
            value={weddingDate}
            onChange={setWeddingDate}
            min={dateBounds.min}
            max={dateBounds.max}
          />
        </Field>

        <Field id="weddingPlace" label={t("weddingPlaceLabel")}>
          <TextInput
            id="weddingPlace"
            value={weddingPlace}
            onChange={setWeddingPlace}
            placeholder={t("weddingPlacePlaceholder")}
            autoComplete="address-level2"
          />
        </Field>
      </div>

      <PillGroup
        legend={t("guestBandLabel")}
        options={GUEST_BANDS}
        value={guestBand}
        onChange={setGuestBand}
        getLabel={(v) => t(`guestBandOptions.${v}`)}
      />

      <PillGroup
        legend={t("interestLabel")}
        options={INTERESTS}
        value={interest}
        onChange={(v) => {
          setInterest(v);
          if (!INTERESTS_WITH_COLLECTION.includes(v)) setCollection(undefined);
        }}
        getLabel={(v) => t(`interestOptions.${v}`)}
      />

      {/* Soft height transition, the same max-height technique as the FAQ
          accordion — NOT `grid-template-rows: 1fr/0fr`, which was tried here
          first and stayed collapsed at 0px exactly as Faq.tsx documents: the
          container has no height of its own to distribute, so the row never
          resolves. The cap is generous so no locale's label set clips.

          `visibility` rides along so a collapsed panel leaves the tab order
          and the accessibility tree instead of being merely invisible, and is
          delayed on close so the collapse stays watchable. */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: showCollection ? "16rem" : 0,
          opacity: showCollection ? 1 : 0,
          visibility: showCollection ? "visible" : "hidden",
          transitionProperty: "max-height, opacity, visibility",
        }}
      >
        <div>
          <PillGroup
            legend={t("collectionLabel")}
            options={COLLECTIONS}
            value={collection}
            onChange={setCollection}
            getLabel={(v) => t(`collectionOptions.${v}`)}
          />
        </div>
      </div>

      <PillGroup
        legend={t("projectStageLabel")}
        options={PROJECT_STAGES}
        value={projectStage}
        onChange={setProjectStage}
        getLabel={(v) => t(`projectStageOptions.${v}`)}
      />

      <Field id="message" label={t("messageLabel")} error={fieldErrors.message}>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          rows={5}
          className={cn(
            "w-full resize-none rounded-2xl border bg-transparent px-4 py-3 font-body text-sm text-studio-violet placeholder:text-studio-violet/40 transition-colors focus:outline-none focus:ring-1 focus:ring-studio-violet",
            fieldErrors.message
              ? "border-red-400"
              : "border-studio-violet/20 focus:border-studio-violet",
          )}
          aria-invalid={Boolean(fieldErrors.message)}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 font-body text-xs leading-relaxed text-studio-violet/70">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-studio-violet/30 text-studio-violet focus:ring-studio-violet"
            aria-invalid={Boolean(fieldErrors.consent)}
          />
          <span>
            {t("consentLabel")}{" "}
            <Link
              href="/legal/privacy"
              className="underline underline-offset-2 hover:text-studio-violet"
            >
              {t("privacyLinkLabel")}
            </Link>
          </span>
        </label>
        {fieldErrors.consent && (
          <p className="font-body text-xs text-red-500" role="alert">
            {fieldErrors.consent}
          </p>
        )}
      </div>

      {globalError && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 font-body text-sm text-red-600"
        >
          {t("errors.global")}
        </p>
      )}

      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <Button
          type="submit"
          variant="studio-violet"
          size="pill"
          disabled={isPending}
          className="w-full transition-transform active:scale-[0.98] sm:w-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            <>
              {t("submit")}
              <ArrowRight className="ms-2 h-4 w-4" />
            </>
          )}
        </Button>
        <p className="font-body text-sm text-studio-violet/70">
          {t("submitCaption")}
        </p>
        <p className="font-body text-[11px] text-studio-violet/40">
          {t("privacyNote")}
        </p>
      </div>
    </form>
  );
}

function ContactSuccess() {
  const t = useTranslations("Contact.success");

  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center animate-fade-in-up">
      <h2 className="font-heading text-h2 text-studio-violet">{t("title")}</h2>
      <p className="max-w-md whitespace-pre-line font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
        {t("text")}
      </p>
      {/* studio-outline is drawn for the hero's violet ground: yellow border,
          yellow text. On this page's yellow ground it was invisible. Same
          violet override Preview.tsx and ThemeConfigSheet.tsx already use for
          this variant on light backgrounds. */}
      <Button
        variant="studio-outline"
        size="pill"
        asChild
        className="mt-2 border-studio-violet text-studio-violet hover:bg-studio-violet/10"
      >
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-body text-xs font-semibold uppercase tracking-luxe text-studio-violet/60"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="font-body text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  invalid,
  min,
  max,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  invalid?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-invalid={invalid}
      min={min}
      max={max}
      className={cn(
        "h-12 w-full rounded-2xl border bg-transparent px-4 font-body text-sm text-studio-violet placeholder:text-studio-violet/40 transition-colors focus:outline-none focus:ring-1 focus:ring-studio-violet",
        invalid
          ? "border-red-400"
          : "border-studio-violet/20 focus:border-studio-violet",
      )}
    />
  );
}

/**
 * One "grandes options élégantes" question — the brief is explicit that
 * these must read as sober text choices, not SaaS selection cards. A plain
 * button whose border and text colour flip on selection is the whole
 * treatment: no icon badge, no shadow, no checkmark overlay.
 */
function PillGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  getLabel,
}: {
  legend: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-body text-xs font-semibold uppercase tracking-luxe text-studio-violet/60">
        {legend}
      </span>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={cn(
                "rounded-full border px-4 py-2 font-body text-sm transition-colors",
                selected
                  ? "border-studio-violet bg-studio-violet text-white"
                  : "border-studio-violet/20 text-studio-violet/70 hover:border-studio-violet/50",
              )}
            >
              {getLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

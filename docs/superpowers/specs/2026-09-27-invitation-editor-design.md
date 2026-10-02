---
date: 2026-09-27
status: approved-by-delegation
category: feature
---

# Invitation editor — one screen to change every word of the invitation

## What was asked

> « il faut pouvoir modifier les parties variables des thèmes, le meilleur exemple
> est ciao_amore […] bien travailler le header pour pouvoir modifier tous les
> composants de façon dynamique. Actuellement c'est fait d'une certaine façon, je
> n'aime pas du tout. Peut-être une page avec des onglets ou un nav entre les
> modules disponibles, mais en tout cas il faut pouvoir tout modifier. Tu as carte
> blanche. »
>
> « […] tous les modules qui sont dans la partie checkout, on en vend un certain
> nombre qui ne sont pas forcément dans ciao_amore, il faut pouvoir les configurer
> aussi. »

The user delegated every design decision ("carte blanche") and is away, so this
spec records the decisions instead of asking for them.

## What is wrong today

A couple's invitation is edited across **nine screens** that do not know about
each other: `/modules/[id]` (one form per module, 2 000 lines, with a generic
mock-up as "preview"), `/invitation/nos-mots`, `/invitation/evenements`,
`/invitation/programme`, `/invitation/lieu`, `/invitation/faq`. None of them
shows the couple's actual theme. Several facts have two writers (the venue, the
programme, the FAQ, the hotels exist both as tables and as module configs), and a
large part of what the theme prints has **no writer at all**:

| Printed by ciao-amore | Where it comes from today |
|---|---|
| "La dolce vita commence dans", "Deux jours d'exception", "Dress code · Jour 2", "La musique de notre week-end" | the theme's translation catalogue — identical on every wedding, and false for most (a one-day wedding is told "deux jours", a dress code with no day 2 says "Jour 2") |
| "Amore ✦ Limoni ✦ Dolce Vita", the "ITALIA" stamp, "CAMERA 01" | hard-coded JSX — printed on a wedding in Provence |
| programme intro, footer note, monogram, day-2 note | no column, never rendered for a real wedding |
| dietary options in the RSVP form | not mapped — real guests cannot state a diet |
| moment icons and photos in the programme | no column — icons guessed from the title, photos impossible |
| hotel address, "more options" hotels | no column |

## Decisions

### D1 — One editor, full screen, at `/invitation`

A single page replaces the nine. It is a **builder**: the dashboard sidebar steps
aside (like Shopify's or Squarespace's editor) because a form column, a phone
preview and a 16-tab strip do not fit beside a 256px sidebar on a laptop. The
header carries a clear way back.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Tableau de bord   Mon faire-part · Ciao Amore      [FR▾] [📱|🖥]  ● 3 modif. │
│                                                    [Annuler] [Enregistrer]   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ‹ Accueil  Compte à rebours  Programme  Dress code  Lieu  Hébergements …  + › │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ Section form                  │            ┌──────────┐                      │
│  (every variable part of the  │            │  live    │  the real theme,     │
│   selected section)           │            │ preview  │  scrolled to the     │
│                               │            │ (iframe) │  section being edited│
│                               │            └──────────┘                      │
└───────────────────────────────┴──────────────────────────────────────────────┘
```

- **Tabs = the invitation's sections, in the order the theme draws them.** The
  preview reports the order it rendered; tabs follow it, so walking the tabs left
  to right walks the invitation top to bottom.
- A tab exists for every section the wedding **owns**: the hero and the footer
  always, and one per module in `sites.modules` — **all fifteen sold modules**,
  including the ones the current theme does not draw (see D8).
- Each tab shows its state: unsaved changes (dot), an error after a failed save
  (red dot), not visible on the invitation (eye-off, with the reason in the form).
- The last item of the strip is **"+ Ajouter un module"**, which opens the
  existing purchase flow for modules not owned yet.
- The selected tab is in the URL (`/invitation?section=faq`), updated without a
  server round trip, so a deep link opens on the right section.
- Mobile: same header, tabs as a scrollable chip row, the form full width, and a
  floating "Aperçu" button that opens the preview full screen.

### D2 — Live preview of the real theme, through an iframe

The preview is **the couple's actual theme**, not a mock-up, and it changes as
they type.

The theme components live in `landing/` and the editor in `dashboard/` — two apps,
two origins. The preview is therefore an iframe on a landing route,
`/[locale]/invitation/apercu`, which is a pure renderer: it holds no data and
reads no database. The editor posts the couple's **draft rows** to it with
`postMessage`, and it renders them.

The rows are posted in the **database shape** (`InvitationRows`, a shared type),
and the preview turns them into a page with the exact functions the public route
uses — `assembleInvitationPage()` then `toInvitationData()`. The preview cannot
drift from what guests will see, because it is the same code on the same input.

Protocol (every message carries `source: "studio-editor"`):

| Direction | Message | Purpose |
|---|---|---|
| preview → editor | `preview:ready` | the iframe is listening |
| editor → preview | `editor:render { themeId, rows }` | render this draft (throttled) |
| preview → editor | `preview:rendered { sections[], slots[] }` | which sections are on the page, in order; the theme's editable slots with their default text |
| editor → preview | `editor:focus { section }` | scroll to the section being edited, and flash it |
| preview → editor | `preview:select { section }` | the couple clicked a section in the preview: open its tab |

Guest forms (RSVP, playlist) run in demo mode inside the preview: `weddingId` is
stripped, so nothing is ever written from it.

To render client-side, theme sections must not be `async` Server Components.
The twelve that are (`getTranslations`, `getLocale`) become plain components using
`useTranslations` / `useLocale`, which work in both a Server Component (the public
page, still server-rendered) and a client tree (the preview). Each section's root
element gets `data-editor-section="<sectionId>"` so the preview can scroll to it,
outline it on hover and report it.

### D3 — Theme text slots: the theme's own words become the couple's

Every word a theme prints from its catalogue or its markup becomes a **slot** the
couple can rewrite. A slot is keyed `<sectionId>.<role>` — `countdown.eyebrow`,
`faq.title`, `timeline.ribbon` — so a key means the same thing in every theme.

- Each theme declares its slots in its own folder (`<theme>/editor.ts`, referenced
  from the manifest as `editorSlots`), with the catalogue key that supplies the
  default. Adding a theme still edits no existing file.
- The preview resolves the defaults in the invitation's language and sends them
  to the editor, which shows them as placeholders: the couple sees what is
  printed today and rewrites only what they want. An empty field means "the
  theme's default".
- Themes read `data.texts?.["faq.title"] ?? t("…")`. A multi-line title is one
  value with a line break.
- Hard-coded decorative words (ciao-amore's ribbon, stamp and hotel key) move to
  the catalogue first, so they have a default to fall back to.

Overrides are single-language, like every other word the couple writes (their
FAQ, their programme): an override applies whatever locale the invitation is read
in. Per-locale overrides can be layered later without changing the key scheme.

### D4 — Storage: one new jsonb, three columns, and module configs

| Field | Stored in |
|---|---|
| Theme slots, and contract copy with no home (`copy.dateLabel`, `copy.dateSpelled`, `copy.scheduleIntro`, `copy.rsvpIntro`, `copy.rsvpNote`, `copy.footerNote`, `couple.monogram`, `dayTwo.dateLabel`, `dayTwo.timeLabel`, `dayTwo.note`) | **new** `settings.invitation_texts jsonb` — a flat `{ key: text }` map |
| Moment icon and photo | **new** `schedule_entries.icon`, `schedule_entries.image_url` |
| Hotel address, "more options" flag | **new** `accommodations.address`, `accommodations.secondary` |
| RSVP options (partner, message, dietary list), gift-list title, guestbook texts | existing `site_modules.config` (jsonb, no migration) |
| Everything else | where it already lives — `profiles` (names), `settings` (hero, closing, portrait, adults only), `events`, `schedule_entries`, `venues`, `accommodations`, `faq_entries`, `site_modules.config` |

A flat string map rather than columns because the slot set is open — it differs
per theme — while every value has the same rules (a string, trimmed, bounded).
Contract fields are namespaced (`copy.*`, `couple.*`, `dayTwo.*`) and the mapper
lifts them into their contract fields; every other key is a slot and reaches the
theme as `data.texts`.

The migration also recreates `resolve_public_slug` to return `invitation_texts`.
It **restores `languages`**, which `20260912140000_invitation_hero_copy.sql`
dropped by accident when it recreated the function (the landing still reads
`site.languages`, so the language guard on the invitation page has been silently
off since).

**One writer per fact.** The editor writes the tables for the venue, programme,
hotels and FAQ; the overlapping module-config fields stay readable as fallbacks
for rows written before, and are no longer written.

### D5 — Save model: one draft, one "Enregistrer"

The invitation is live the moment it is bought, so autosave would publish
half-typed sentences to guests. Instead:

- The editor keeps a **draft** of the whole invitation in memory. The preview
  shows the draft instantly; nothing is public until saved.
- **One "Enregistrer" button in the header** saves every changed part at once
  (⌘/Ctrl+S too). "Annuler" discards the draft. Leaving with unsaved changes asks
  first (`beforeunload`, and the back button).
- The server action (`saveInvitationDraft`) receives only the changed parts,
  validates every field server-side, writes them, and returns the fresh saved
  state — new rows come back with their real ids. Lists (events, moments, hotels,
  FAQ) are saved by diff: insert, update, delete, reorder.
- A failed part is reported on its tab; the parts that succeeded stay saved.

### D6 — Security

- The preview accepts messages only from the dashboard origins it knows
  (`NEXT_PUBLIC_DASHBOARD_URL`, localhost in dev), and the editor posts only to
  the landing origin — draft content never goes to another window.
- The preview route sends `Content-Security-Policy: frame-ancestors` limited to
  those origins, and `noindex`. The dashboard's CSP gains the landing origin in
  `frame-src`.
- Every link a couple can type is rendered as an `href` on a public page, so the
  save action accepts only `http(s)` URLs, and the landing mapper re-checks them
  (a `javascript:` URL in a venue's maps link would be script run by every
  guest).
- Module configs are written only for modules the wedding owns. Today
  `updateModuleConfig` inserts a row for any module id it is sent.
- Text values are trimmed and length-capped; colours match the existing CSS
  colour allowlist; icons match the closed `SCHEDULE_ICONS` set.

### D7 — The old screens go

`/invitation/nos-mots`, `/invitation/evenements`, `/invitation/programme`,
`/invitation/lieu`, `/invitation/faq` and `/modules/[moduleId]` redirect to the
matching editor tab, so bookmarks and the links in emails keep working. Their
components are deleted once nothing imports them. `/modules` stays as the
catalogue (buy a module), and its cards open the editor. `/playlist` stays: it
moderates guests' suggestions, which is not editing the invitation.

### D8 — Modules the theme does not draw

All fifteen sold modules get a tab and a form. For a module the current theme
does not render, the tab says so plainly, and the form still saves.
ciao-amore, "la base", then gains sections for the sold modules with
guest-facing content it lacks — intro video, gift list, menu, gallery — so a
couple on ciao-amore sees everything they paid for. The guestbooks have no
guest-facing feature in the product yet; their tab edits the words that will
introduce them and says the feature is not live.

## Section inventory

Store abbreviations: **T** = `settings.invitation_texts`, **S** = `settings`,
**P** = `profiles`, **M** = `site_modules.config` of that module.

| Tab | Fields | Store |
|---|---|---|
| Accueil (`hero`) | prénoms · sur-titre · annonce · date & heure · libellé de date · monogramme · nom du lieu & ville · texte du bouton | P · S · S · `events` (wedding-day) · T · T · `venues` · slot |
| Compte à rebours | date & heure · date en toutes lettres · sur-titre · titre | `events` · T · slots |
| Vidéo d'intro | titre · sous-titre · texte · vidéo (lien ou fichier) | M |
| Programme (`timeline`) | intro · bandeau · tampon · sur-titres & titres · événements (nom, date, heure, adresse, texte, tenue, activé) · moments (heure, titre, texte, icône, photo) · lendemain (libellé, horaire, consigne) | T · slots · `events` · `schedule_entries` · T |
| Dress code | sur-titre · titre · consignes (une ou par public) · palette · photo · note | slot · M |
| RSVP | date limite · intro · titre · accompagnant · message · régimes proposés · enfants acceptés | M · T · slot · M · M · M · S |
| Lieu (`map`) | nom & ville · adresse · liens Maps & Waze · photo · présentation · transports / stationnement / accès · sur-titre | `venues` · M · slot |
| Hébergements | intro · titre · étiquette · hôtels (nom, ville, distance, adresse, lien, offre, téléphone, photo, « autres options ») | M · slots · `accommodations` |
| Transports | modes (type, titre, texte) · covoiturage (lien, libellé, texte) | M |
| Menu | plats par section · note régimes · mentions | M |
| Galerie | photos (ajout, ordre, suppression) | M |
| Liste de cadeaux | titre · texte · lien · libellé du lien | M |
| Playlist | intro · sur-titre · titre | M · slots |
| Livre d'or / vidéo | titre · texte d'accueil | M |
| FAQ | sur-titre · titre · questions (ordre, publiée) · question « enfants » (dérivée, avec lien vers RSVP) | slots · `faq_entries` |
| Pied de page | mot de la fin · note · photo du couple | S · T · S |

## Scope of theme work

- **ciao-amore** (the reference): sections made isomorphic, anchored, every slot
  wired, decorative words to the catalogue, new sections for the modules it
  lacked (D8).
- **belle-rive, blanc-couture**: sections made isomorphic and anchored so the
  preview works for their couples. Their slots follow the same mechanism later;
  until then their catalogue text shows, and the editor lists no slot for them —
  honest, not broken.

## Testing

- Unit (node `--test`, the repo's existing style): `assembleInvitationPage`,
  the texts lifting in `toInvitationData`, URL sanitising, the save action's
  validators and list diffing.
- `tsc --noEmit` on both apps; `themes:check`; production builds of both apps.
- End to end on a local Supabase: open the editor, edit a field in every tab,
  watch the preview change, save, reload the editor (state persisted), open the
  public invitation (what was previewed is what is published).
- Screenshots of the editor at 390 / 1024 / 1440 and of ciao-amore's new
  sections, reviewed by eye.

## Out of scope

- Draft/publish versioning with rollback (belle_rive's integration note asks for
  it). D5's explicit save is the step that makes it possible later.
- Per-locale overrides (D3).
- Switching theme after purchase.
- Building the guestbooks themselves.

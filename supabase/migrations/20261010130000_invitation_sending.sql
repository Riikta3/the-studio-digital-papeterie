-- Sending the invitation to the guest list, from the couple's own phone.
--
-- The dashboard's "Envoi" screen opens WhatsApp or the SMS app with the
-- message already written for each household (a `wa.me` / `sms:` link): the
-- message leaves from the couple's number, nothing is sent by us and nothing
-- is paid. What is stored here is only what the screen needs to follow up:
-- who has been sent the invitation, by which channel, and who was reminded.
--
-- `households.last_relance_at` has existed since the first migration and was
-- never written; it becomes the date of the last reminder.

alter table public.households
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists invitation_channel text
    check (invitation_channel in ('whatsapp', 'sms')),
  add column if not exists reminder_count int not null default 0;

comment on column public.households.invitation_sent_at is
  'When the couple sent this household the invitation from the dashboard''s '
  'sending screen. Null = not sent yet.';
comment on column public.households.invitation_channel is
  'How the invitation was last sent: whatsapp or sms.';
comment on column public.households.reminder_count is
  'How many reminders the couple sent this household; the last one is '
  'last_relance_at.';

-- The couple's own wording, with {prenoms}, {foyer}, {lien} and {couple}
-- placeholders. Null = the screen's default text.
alter table public.settings
  add column if not exists invitation_message text,
  add column if not exists reminder_message text;

comment on column public.settings.invitation_message is
  'Message sent with the invitation from the sending screen. Placeholders: '
  '{prenoms}, {foyer}, {lien}, {couple}. Null = the default text.';
comment on column public.settings.reminder_message is
  'Reminder sent to households that have not answered. Same placeholders.';

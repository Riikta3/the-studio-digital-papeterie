-- Split respondent name into first_name + last_name for nominal list
alter table public.rsvp_responses
  add column if not exists respondent_first_name text,
  add column if not exists respondent_last_name text;

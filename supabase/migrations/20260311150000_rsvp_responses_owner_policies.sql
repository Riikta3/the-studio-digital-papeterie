-- Allow wedding owner to update and delete their own rsvp responses
create policy "Owner can update own rsvp responses"
  on public.rsvp_responses for update
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

create policy "Owner can delete own rsvp responses"
  on public.rsvp_responses for delete
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

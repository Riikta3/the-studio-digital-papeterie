create policy "Owner can delete playlist suggestions" on public.playlist_suggestions
  for delete using (
    exists (
      select 1 from public.weddings w
      where w.id = wedding_id and w.user_id = auth.uid()
    )
  );

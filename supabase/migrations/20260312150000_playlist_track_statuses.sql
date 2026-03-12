-- Add per-track status map to playlist_suggestions
-- track_statuses: { [trackId]: 'accepted' | 'rejected' }
alter table public.playlist_suggestions
  add column if not exists track_statuses jsonb not null default '{}'::jsonb;

-- Allow wedding owner to update their playlist suggestions
create policy "Owner can update playlist suggestions" on public.playlist_suggestions
  for update using (
    exists (
      select 1 from public.weddings w
      where w.id = wedding_id and w.user_id = auth.uid()
    )
  );

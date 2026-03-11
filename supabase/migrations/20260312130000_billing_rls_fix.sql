-- Allow authenticated users to insert their own billing records
create policy "Users can insert own billing" on public.billing
  for insert with check (auth.uid() = user_id);

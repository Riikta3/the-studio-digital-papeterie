-- Migration: Module Registry and Ordering
-- Description: Creates a registry for all available modules and a join table for per-site module configuration.

-- 1. MODULES REGISTRY
create table if not exists public.modules (
  id text primary key,
  name text not null,
  description text,
  default_order integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.modules enable row level security;
create policy "Anyone can view modules" on public.modules for select using (true);

-- 2. POPULATE REGISTRY
insert into public.modules (id, name, default_order, description)
values
  ('countdown', 'Compte à Rebours', 1, 'Le décompte avant le jour J'),
  ('intro-video', 'Vidéo d''Intro', 2, 'Message vidéo personnalisé'),
  ('timeline', 'Programme', 3, 'Déroulé de la journée'),
  ('dress-code', 'Dress Code', 4, 'Tenue recommandée'),
  ('rsvp', 'Gestion RSVP', 5, 'Confirmations de présence'),
  ('map', 'Plan & Accès', 6, 'Localisation des lieux'),
  ('accommodation', 'Hébergement', 7, 'Suggestions d''hôtels à proximité'),
  ('transport', 'Transport', 8, 'Navettes & transport des invités'),
  ('menu', 'Menu', 9, 'Détails du repas'),
  ('gallery', 'Galerie Photo', 10, 'Partagez vos souvenirs'),
  ('gift-list', 'Liste de Mariage', 11, 'Cadeaux & participations'),
  ('playlist', 'Playlist', 12, 'Suggestions musicales'),
  ('guestbook', 'Livre d''Or', 13, 'Messages des invités'),
  ('video-guestbook', 'Livre d''Or Vidéo', 14, 'Messages vidéo des invités'),
  ('faq', 'FAQ / Pratique', 15, 'Infos pratiques pour les invités')
on conflict (id) do update set 
  name = excluded.name,
  default_order = excluded.default_order,
  description = excluded.description;

-- 3. SITE MODULES (Join Table)
create table if not exists public.site_modules (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references public.sites(id) on delete cascade not null,
  module_id text references public.modules(id) on delete cascade not null,
  position integer not null,
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(site_id, module_id)
);

alter table public.site_modules enable row level security;
create policy "Users can view own site modules" on public.site_modules for select using (
  exists (
    select 1 from public.sites s
    join public.weddings w on w.id = s.wedding_id
    where s.id = site_id and w.user_id = auth.uid()
  )
);
create policy "Users can manage own site modules" on public.site_modules for all using (
  exists (
    select 1 from public.sites s
    join public.weddings w on w.id = s.wedding_id
    where s.id = site_id and w.user_id = auth.uid()
  )
);

-- 4. INDEXES
create index if not exists idx_site_modules_site_id on public.site_modules(site_id);
create index if not exists idx_site_modules_module_id on public.site_modules(module_id);

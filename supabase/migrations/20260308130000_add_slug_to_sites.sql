-- Migration: Add slug to sites
-- Description: Adds a unique slug column to the sites table for friendly URLs.

alter table public.sites add column if not exists slug text unique;

-- Index for performance
create index if not exists idx_sites_slug on public.sites(slug);

-- Fix cascade delete: when an auth.users row is deleted, all related data must be removed.

-- 1. profiles.id → auth.users
alter table public.profiles
  drop constraint profiles_id_fkey,
  add constraint profiles_id_fkey
    foreign key (id) references auth.users(id) on delete cascade;

-- 2. weddings.user_id → profiles(id)
alter table public.weddings
  drop constraint weddings_user_id_fkey,
  add constraint weddings_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

-- 3. billing.user_id → auth.users
alter table public.billing
  drop constraint billing_user_id_fkey,
  add constraint billing_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

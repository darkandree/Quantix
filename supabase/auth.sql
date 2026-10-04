-- Run after schema.sql (and seed.sql). Adds login support:
--   * public.profiles  (full_name, status, avatar_url) linked to auth.users
--   * data tables become readable/writable only by signed-in, Active users
--   * an `avatars` storage bucket for profile pictures

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text not null default '',
  status     text not null default 'Active' check (status in ('Active', 'Inactive')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Create a profile automatically whenever a user is added in Supabase Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that already exist.
insert into public.profiles (id, email, full_name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- True only for a signed-in user whose profile status is Active.
create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'Active');
$$;

alter table public.profiles enable row level security;

drop policy if exists "read profiles"       on public.profiles;
drop policy if exists "update own profile"  on public.profiles;
create policy "read profiles"      on public.profiles for select to authenticated using (true);
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Users may only change their own name and picture; status is managed in the dashboard.
revoke update on public.profiles from authenticated;
grant  update (full_name, avatar_url) on public.profiles to authenticated;

-- ---------- Lock the data tables to signed-in Active users ----------
drop policy if exists "anon read categories" on public.expense_details;
drop policy if exists "anon read expenses"   on public.expenses;
drop policy if exists "anon insert expenses" on public.expenses;
drop policy if exists "anon delete expenses" on public.expenses;
drop policy if exists "anon read products"   on public.products;
drop policy if exists "anon insert products" on public.products;
drop policy if exists "anon delete products" on public.products;

drop policy if exists "active read categories" on public.expense_details;
drop policy if exists "active read expenses"   on public.expenses;
drop policy if exists "active insert expenses" on public.expenses;
drop policy if exists "active update expenses" on public.expenses;
drop policy if exists "active delete expenses" on public.expenses;
drop policy if exists "active read products"   on public.products;
drop policy if exists "active insert products" on public.products;
drop policy if exists "active delete products" on public.products;

create policy "active read categories" on public.expense_details for select to authenticated using (public.is_active_user());
create policy "active read expenses"   on public.expenses        for select to authenticated using (public.is_active_user());
create policy "active insert expenses" on public.expenses        for insert to authenticated with check (public.is_active_user());
create policy "active update expenses" on public.expenses        for update to authenticated using (public.is_active_user()) with check (public.is_active_user());
create policy "active delete expenses" on public.expenses        for delete to authenticated using (public.is_active_user());
create policy "active read products"   on public.products        for select to authenticated using (public.is_active_user());
create policy "active insert products" on public.products        for insert to authenticated with check (public.is_active_user());
create policy "active delete products" on public.products        for delete to authenticated using (public.is_active_user());

-- ---------- Avatar storage ----------
-- Files live at avatars/<user id>/<file>; the bucket is public so <img> tags work.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

drop policy if exists "avatars public read"   on storage.objects;
drop policy if exists "avatars own insert"    on storage.objects;
drop policy if exists "avatars own update"    on storage.objects;
drop policy if exists "avatars own delete"    on storage.objects;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars own insert"  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own update"  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own delete"  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
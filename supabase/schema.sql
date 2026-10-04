-- Run this first in the Supabase SQL editor, then run seed.sql.

create table if not exists public.expense_details (
  id               bigint generated always as identity primary key,
  expense_type     text not null check (expense_type in ('Variable Expenses', 'Fixed Expenses')),
  expense_category text not null
);

create table if not exists public.expenses (
  id               bigint generated always as identity primary key,
  expense_type     text not null check (expense_type in ('Variable Expenses', 'Fixed Expenses')),
  expense_category text not null,
  product_name     text,
  amount           numeric(12,2) not null check (amount >= 0),
  remarks          text,
  date             date not null default current_date
);
create index if not exists expenses_date_idx on public.expenses (date desc);

create table if not exists public.products (
  id           bigint generated always as identity primary key,
  barcode      text,
  product_name text not null,
  price        numeric(12,2) not null check (price >= 0),
  status       text not null default 'Active'
);
create index if not exists products_barcode_idx on public.products (barcode);

-- Row Level Security.
-- The app has no login screen, so these policies let anyone holding the anon key
-- read and write. Tighten them (e.g. `to authenticated`) if you add Supabase Auth.
alter table public.expense_details enable row level security;
alter table public.expenses        enable row level security;
alter table public.products        enable row level security;

create policy "anon read categories"  on public.expense_details for select to anon using (true);
create policy "anon read expenses"    on public.expenses        for select to anon using (true);
create policy "anon insert expenses"  on public.expenses        for insert to anon with check (true);
create policy "anon delete expenses"  on public.expenses        for delete to anon using (true);
create policy "anon read products"    on public.products        for select to anon using (true);
create policy "anon insert products"  on public.products        for insert to anon with check (true);
create policy "anon delete products"  on public.products        for delete to anon using (true);

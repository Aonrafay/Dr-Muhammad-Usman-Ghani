-- SmileCare Supabase schema for customer + admin flows
create extension if not exists pgcrypto;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  confirmation_code text,
  full_name text not null,
  phone text not null,
  email text not null,
  service text not null,
  appointment_date date not null,
  appointment_time text not null,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  topic text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text default 'admin',
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_appointments_date on public.appointments (appointment_date);
create index if not exists idx_appointments_status on public.appointments (status);
create index if not exists idx_contacts_created_at on public.contacts (created_at desc);

alter table public.appointments enable row level security;
alter table public.contacts enable row level security;
alter table public.admin_users enable row level security;

-- Public website can create appointment and contact requests.
drop policy if exists "Public can insert appointments" on public.appointments;
create policy "Public can insert appointments"
on public.appointments
for insert
to anon
with check (true);

drop policy if exists "Public can insert contacts" on public.contacts;
create policy "Public can insert contacts"
on public.contacts
for insert
to anon
with check (true);

-- Admin (authenticated users) can manage records.
drop policy if exists "Admin read appointments" on public.appointments;
create policy "Admin read appointments"
on public.appointments
for select
to authenticated
using (true);

drop policy if exists "Admin update appointments" on public.appointments;
create policy "Admin update appointments"
on public.appointments
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Admin read contacts" on public.contacts;
create policy "Admin read contacts"
on public.contacts
for select
to authenticated
using (true);

drop policy if exists "Admin update contacts" on public.contacts;
create policy "Admin update contacts"
on public.contacts
for update
to authenticated
using (true)
with check (true);

-- Public (anon) users can read and update records for admin panel access.
-- The admin panel uses local authentication with the anon key, so anon
-- read/update policies are required for the dashboard to fetch data.
drop policy if exists "Public read appointments" on public.appointments;
create policy "Public read appointments"
on public.appointments
for select
to anon
using (true);

drop policy if exists "Public update appointments" on public.appointments;
create policy "Public update appointments"
on public.appointments
for update
to anon
using (true)
with check (true);

drop policy if exists "Public read contacts" on public.contacts;
create policy "Public read contacts"
on public.contacts
for select
to anon
using (true);

drop policy if exists "Public update contacts" on public.contacts;
create policy "Public update contacts"
on public.contacts
for update
to anon
using (true)
with check (true);

drop policy if exists "Anyone can view admin users" on public.admin_users;
create policy "Anyone can view admin users"
on public.admin_users
for select
using (true);

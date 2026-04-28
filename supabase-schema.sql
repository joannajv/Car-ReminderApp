-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  date_text text not null,
  time_text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.services_done (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  date_text text not null,
  time_text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reminders add column if not exists completed boolean not null default false;
alter table public.services_done add column if not exists completed boolean not null default false;

alter table public.reminders enable row level security;
alter table public.services_done enable row level security;

drop policy if exists "reminders_select_own" on public.reminders;
drop policy if exists "reminders_insert_own" on public.reminders;
drop policy if exists "reminders_update_own" on public.reminders;
drop policy if exists "reminders_delete_own" on public.reminders;

create policy "reminders_select_own"
on public.reminders for select
using (auth.uid() = user_id);

create policy "reminders_insert_own"
on public.reminders for insert
with check (auth.uid() = user_id);

create policy "reminders_update_own"
on public.reminders for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "reminders_delete_own"
on public.reminders for delete
using (auth.uid() = user_id);

drop policy if exists "services_select_own" on public.services_done;
drop policy if exists "services_insert_own" on public.services_done;
drop policy if exists "services_update_own" on public.services_done;
drop policy if exists "services_delete_own" on public.services_done;

create policy "services_select_own"
on public.services_done for select
using (auth.uid() = user_id);

create policy "services_insert_own"
on public.services_done for insert
with check (auth.uid() = user_id);

create policy "services_update_own"
on public.services_done for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "services_delete_own"
on public.services_done for delete
using (auth.uid() = user_id);

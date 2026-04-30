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

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  enabled boolean not null default true,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_dispatch_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_id uuid references public.reminders(id) on delete set null,
  channel text not null default 'web_push',
  title text not null,
  body text not null,
  dispatched_at timestamptz not null default now()
);

alter table public.reminders add column if not exists completed boolean not null default false;
alter table public.services_done add column if not exists completed boolean not null default false;
alter table public.reminders add column if not exists notify_at timestamptz;
alter table public.reminders add column if not exists notified_at timestamptz;
create index if not exists reminders_due_idx on public.reminders (notify_at) where notified_at is null and completed = false;

alter table public.reminders enable row level security;
alter table public.services_done enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_dispatch_log enable row level security;

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

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;

create policy "push_subscriptions_select_own"
on public.push_subscriptions for select
using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
on public.push_subscriptions for insert
with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own"
on public.push_subscriptions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
on public.push_subscriptions for delete
using (auth.uid() = user_id);

drop policy if exists "dispatch_log_select_own" on public.notification_dispatch_log;

create policy "dispatch_log_select_own"
on public.notification_dispatch_log for select
using (auth.uid() = user_id);

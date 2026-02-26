create extension if not exists pgcrypto;
create extension if not exists pg_cron;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  jurisdiction text not null default 'scotland',
  onboarding_done boolean not null default false,
  paid boolean not null default false,
  stripe_session text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_position (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  properties jsonb not null default '[]'::jsonb,
  pensions jsonb not null default '[]'::jsonb,
  savings jsonb not null default '[]'::jsonb,
  debts jsonb not null default '[]'::jsonb,
  income jsonb not null default '{}'::jsonb,
  dependants jsonb not null default '[]'::jsonb,
  expenditure jsonb not null default '{}'::jsonb,
  date_of_marriage date,
  date_of_separation date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default 'Scenario A',
  config jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scenarios_user_id_idx on public.scenarios(user_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  scenario_ids uuid[] not null default '{}'::uuid[],
  storage_path text not null,
  generated_at timestamptz not null default now(),
  pdf_url text,
  expires_at timestamptz not null
);

create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists reports_expires_at_idx on public.reports(expires_at);

create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_financial_position_updated_at on public.financial_position;
create trigger set_financial_position_updated_at
before update on public.financial_position
for each row
execute function public.set_updated_at();

drop trigger if exists set_scenarios_updated_at on public.scenarios;
create trigger set_scenarios_updated_at
before update on public.scenarios
for each row
execute function public.set_updated_at();

create or replace function public.enforce_scenario_limit()
returns trigger
language plpgsql
as $$
declare
  scenario_count int;
begin
  select count(*) into scenario_count
  from public.scenarios
  where user_id = new.user_id;

  if scenario_count >= 5 then
    raise exception 'Scenario limit reached (max 5)';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_scenario_limit_before_insert on public.scenarios;
create trigger enforce_scenario_limit_before_insert
before insert on public.scenarios
for each row
execute function public.enforce_scenario_limit();

alter table public.users enable row level security;
alter table public.financial_position enable row level security;
alter table public.scenarios enable row level security;
alter table public.reports enable row level security;
alter table public.stripe_webhook_events enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.users;
create policy "Users can delete own profile"
on public.users
for delete
using (auth.uid() = id);

drop policy if exists "Users can view own financial position" on public.financial_position;
create policy "Users can view own financial position"
on public.financial_position
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own financial position" on public.financial_position;
create policy "Users can insert own financial position"
on public.financial_position
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own financial position" on public.financial_position;
create policy "Users can update own financial position"
on public.financial_position
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own financial position" on public.financial_position;
create policy "Users can delete own financial position"
on public.financial_position
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own scenarios" on public.scenarios;
create policy "Users can view own scenarios"
on public.scenarios
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own scenarios" on public.scenarios;
create policy "Users can insert own scenarios"
on public.scenarios
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own scenarios" on public.scenarios;
create policy "Users can update own scenarios"
on public.scenarios
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own scenarios" on public.scenarios;
create policy "Users can delete own scenarios"
on public.scenarios
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports"
on public.reports
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
on public.reports
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own reports" on public.reports;
create policy "Users can update own reports"
on public.reports
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reports" on public.reports;
create policy "Users can delete own reports"
on public.reports
for delete
using (auth.uid() = user_id);

insert into public.users (id, email)
select au.id, coalesce(au.email, '')
from auth.users au
on conflict (id) do update
set email = excluded.email;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_created();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create or replace function public.cleanup_expired_reports()
returns integer
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  deleted_count integer := 0;
begin
  delete from storage.objects
  where bucket_id = 'reports'
    and name in (
      select storage_path
      from public.reports
      where expires_at <= now()
    );

  delete from public.reports
  where expires_at <= now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'cleanup-expired-reports-hourly'
  ) then
    perform cron.schedule(
      'cleanup-expired-reports-hourly',
      '0 * * * *',
      $job$select public.cleanup_expired_reports();$job$
    );
  end if;
exception
  when undefined_table then
    null;
end
$$;

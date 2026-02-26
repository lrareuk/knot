create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_scenario_limit()
returns trigger
language plpgsql
set search_path = public
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

drop policy if exists "Service role can manage webhook events" on public.stripe_webhook_events;
create policy "Service role can manage webhook events"
on public.stripe_webhook_events
for all
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

-- Existing tables

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can view own billing" on public.user_billing;
create policy "Users can view own billing"
on public.user_billing
for select
using ((select auth.uid()) = user_id);

-- New tables

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users
for select
using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
on public.users
for insert
with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can delete own profile" on public.users;
create policy "Users can delete own profile"
on public.users
for delete
using ((select auth.uid()) = id);

drop policy if exists "Users can view own financial position" on public.financial_position;
create policy "Users can view own financial position"
on public.financial_position
for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own financial position" on public.financial_position;
create policy "Users can insert own financial position"
on public.financial_position
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own financial position" on public.financial_position;
create policy "Users can update own financial position"
on public.financial_position
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own financial position" on public.financial_position;
create policy "Users can delete own financial position"
on public.financial_position
for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own scenarios" on public.scenarios;
create policy "Users can view own scenarios"
on public.scenarios
for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own scenarios" on public.scenarios;
create policy "Users can insert own scenarios"
on public.scenarios
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own scenarios" on public.scenarios;
create policy "Users can update own scenarios"
on public.scenarios
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own scenarios" on public.scenarios;
create policy "Users can delete own scenarios"
on public.scenarios
for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports"
on public.reports
for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
on public.reports
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own reports" on public.reports;
create policy "Users can update own reports"
on public.reports
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own reports" on public.reports;
create policy "Users can delete own reports"
on public.reports
for delete
using ((select auth.uid()) = user_id);

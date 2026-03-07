do $$
begin
  if to_regprocedure('public.enforce_scenario_limit()') is not null then
    alter function public.enforce_scenario_limit() set search_path = public;
  end if;
end
$$;

create index if not exists account_recovery_audit_user_id_idx
on private.account_recovery_audit(user_id);

create index if not exists legal_agreement_terms_source_document_id_idx
on public.legal_agreement_terms(source_document_id);

create index if not exists marketplace_inquiry_events_actor_user_id_idx
on public.marketplace_inquiry_events(actor_user_id);

create index if not exists marketplace_messages_sender_user_id_idx
on public.marketplace_messages(sender_user_id);

create index if not exists marketplace_message_attachments_uploader_user_id_idx
on public.marketplace_message_attachments(uploader_user_id);

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

create schema if not exists private;

alter table if exists public.users
add column if not exists account_state text not null default 'active';

alter table if exists public.users
add column if not exists panic_triggered_at timestamptz;

alter table if exists public.users
add column if not exists recovery_key_required boolean not null default true;

alter table if exists public.users
add column if not exists recovery_key_generated_at timestamptz;

alter table if exists public.users
add column if not exists recovery_key_version integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_account_state_check'
  ) then
    alter table public.users
    add constraint users_account_state_check
    check (account_state in ('active', 'panic_hidden'));
  end if;
end
$$;

create table if not exists private.account_recovery_secrets (
  user_id uuid primary key references public.users(id) on delete cascade,
  key_hash text not null,
  key_salt text not null,
  key_version integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.account_recovery_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  restored_at timestamptz
);

create index if not exists account_recovery_snapshots_user_id_created_at_idx
on private.account_recovery_snapshots(user_id, created_at desc);

create table if not exists private.account_recovery_audit (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  outcome text not null,
  reason text,
  actor_email text,
  request_ip inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists set_account_recovery_secrets_updated_at on private.account_recovery_secrets;
create trigger set_account_recovery_secrets_updated_at
before update on private.account_recovery_secrets
for each row
execute function public.set_updated_at();

create or replace function private.activate_panic_mode(
  p_user_id uuid,
  p_expires_at timestamptz
)
returns table(snapshot_id uuid, report_paths text[])
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user public.users%rowtype;
  v_financial jsonb;
  v_scenarios jsonb;
  v_report_paths text[];
  v_snapshot jsonb;
  v_snapshot_id uuid;
begin
  select *
  into v_user
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Recovery user not found';
  end if;

  select to_jsonb(fp)
  into v_financial
  from public.financial_position fp
  where fp.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at), '[]'::jsonb)
  into v_scenarios
  from public.scenarios s
  where s.user_id = p_user_id;

  select coalesce(array_agg(r.storage_path), '{}'::text[])
  into v_report_paths
  from public.reports r
  where r.user_id = p_user_id
    and r.storage_path is not null;

  v_snapshot := jsonb_build_object(
    'profile',
    jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'first_name', v_user.first_name,
      'jurisdiction', v_user.jurisdiction,
      'onboarding_done', v_user.onboarding_done,
      'paid', v_user.paid,
      'stripe_session', v_user.stripe_session,
      'created_at', v_user.created_at,
      'updated_at', v_user.updated_at
    ),
    'financial_position', v_financial,
    'scenarios', v_scenarios
  );

  insert into private.account_recovery_snapshots (user_id, snapshot, expires_at)
  values (p_user_id, v_snapshot, p_expires_at)
  returning id into v_snapshot_id;

  delete from public.reports where user_id = p_user_id;
  delete from public.scenarios where user_id = p_user_id;
  delete from public.financial_position where user_id = p_user_id;

  update public.users
  set first_name = null,
      jurisdiction = 'scotland',
      onboarding_done = false,
      stripe_session = null,
      account_state = 'panic_hidden',
      panic_triggered_at = now()
  where id = p_user_id;

  snapshot_id := v_snapshot_id;
  report_paths := v_report_paths;
  return next;
end;
$$;

create or replace function private.restore_panic_account(
  p_user_id uuid,
  p_snapshot_id uuid,
  p_restore_empty boolean
)
returns table(restored_empty boolean, restored_snapshot_id uuid)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user public.users%rowtype;
  v_snapshot_row private.account_recovery_snapshots%rowtype;
  v_snapshot jsonb;
  v_profile jsonb;
  v_financial jsonb;
  v_scenarios jsonb;
  v_scenario jsonb;
begin
  select *
  into v_user
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Recovery user not found';
  end if;

  delete from public.reports where user_id = p_user_id;
  delete from public.scenarios where user_id = p_user_id;
  delete from public.financial_position where user_id = p_user_id;

  if p_restore_empty then
    update public.users
    set first_name = null,
        jurisdiction = 'scotland',
        onboarding_done = false,
        stripe_session = null,
        account_state = 'active',
        panic_triggered_at = null,
        recovery_key_required = true,
        recovery_key_generated_at = null
    where id = p_user_id;

    restored_empty := true;
    restored_snapshot_id := null;
    return next;
    return;
  end if;

  select *
  into v_snapshot_row
  from private.account_recovery_snapshots
  where id = p_snapshot_id
    and user_id = p_user_id
    and restored_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Recovery snapshot unavailable';
  end if;

  v_snapshot := v_snapshot_row.snapshot;
  v_profile := coalesce(v_snapshot->'profile', '{}'::jsonb);
  v_financial := v_snapshot->'financial_position';
  v_scenarios := coalesce(v_snapshot->'scenarios', '[]'::jsonb);

  update public.users
  set first_name = nullif(v_profile->>'first_name', ''),
      jurisdiction = coalesce(nullif(v_profile->>'jurisdiction', ''), 'scotland'),
      onboarding_done = coalesce((v_profile->>'onboarding_done')::boolean, false),
      paid = coalesce((v_profile->>'paid')::boolean, public.users.paid),
      stripe_session = nullif(v_profile->>'stripe_session', ''),
      account_state = 'active',
      panic_triggered_at = null,
      recovery_key_required = true,
      recovery_key_generated_at = null
  where id = p_user_id;

  if v_financial is not null and jsonb_typeof(v_financial) = 'object' then
    insert into public.financial_position (
      id,
      user_id,
      properties,
      pensions,
      savings,
      debts,
      income,
      dependants,
      expenditure,
      date_of_marriage,
      date_of_separation,
      created_at,
      updated_at
    )
    values (
      coalesce((v_financial->>'id')::uuid, gen_random_uuid()),
      p_user_id,
      coalesce(v_financial->'properties', '[]'::jsonb),
      coalesce(v_financial->'pensions', '[]'::jsonb),
      coalesce(v_financial->'savings', '[]'::jsonb),
      coalesce(v_financial->'debts', '[]'::jsonb),
      coalesce(v_financial->'income', '{}'::jsonb),
      coalesce(v_financial->'dependants', '[]'::jsonb),
      coalesce(v_financial->'expenditure', '{}'::jsonb),
      nullif(v_financial->>'date_of_marriage', '')::date,
      nullif(v_financial->>'date_of_separation', '')::date,
      coalesce((v_financial->>'created_at')::timestamptz, now()),
      coalesce((v_financial->>'updated_at')::timestamptz, now())
    )
    on conflict (user_id)
    do update set
      properties = excluded.properties,
      pensions = excluded.pensions,
      savings = excluded.savings,
      debts = excluded.debts,
      income = excluded.income,
      dependants = excluded.dependants,
      expenditure = excluded.expenditure,
      date_of_marriage = excluded.date_of_marriage,
      date_of_separation = excluded.date_of_separation,
      updated_at = now();
  end if;

  if jsonb_typeof(v_scenarios) = 'array' then
    for v_scenario in
      select value
      from jsonb_array_elements(v_scenarios)
    loop
      insert into public.scenarios (
        id,
        user_id,
        name,
        config,
        results,
        created_at,
        updated_at
      )
      values (
        coalesce((v_scenario->>'id')::uuid, gen_random_uuid()),
        p_user_id,
        coalesce(nullif(v_scenario->>'name', ''), 'Scenario A'),
        coalesce(v_scenario->'config', '{}'::jsonb),
        coalesce(v_scenario->'results', '{}'::jsonb),
        coalesce((v_scenario->>'created_at')::timestamptz, now()),
        coalesce((v_scenario->>'updated_at')::timestamptz, now())
      )
      on conflict (id)
      do update set
        user_id = excluded.user_id,
        name = excluded.name,
        config = excluded.config,
        results = excluded.results,
        updated_at = now();
    end loop;
  end if;

  update private.account_recovery_snapshots
  set restored_at = now()
  where id = v_snapshot_row.id;

  restored_empty := false;
  restored_snapshot_id := v_snapshot_row.id;
  return next;
end;
$$;

create or replace function private.cleanup_expired_recovery_snapshots()
returns integer
language plpgsql
security definer
set search_path = private
as $$
declare
  deleted_count integer := 0;
begin
  delete from private.account_recovery_snapshots
  where expires_at <= now()
    and restored_at is null;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

create or replace function public.activate_panic_mode(
  p_user_id uuid,
  p_expires_at timestamptz
)
returns table(snapshot_id uuid, report_paths text[])
language sql
security definer
set search_path = public, private
as $$
  select * from private.activate_panic_mode(p_user_id, p_expires_at);
$$;

create or replace function public.restore_panic_account(
  p_user_id uuid,
  p_snapshot_id uuid,
  p_restore_empty boolean
)
returns table(restored_empty boolean, restored_snapshot_id uuid)
language sql
security definer
set search_path = public, private
as $$
  select * from private.restore_panic_account(p_user_id, p_snapshot_id, p_restore_empty);
$$;

create or replace function public.set_recovery_secret(
  p_user_id uuid,
  p_key_hash text,
  p_key_salt text,
  p_key_version integer
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into private.account_recovery_secrets (user_id, key_hash, key_salt, key_version)
  values (p_user_id, p_key_hash, p_key_salt, p_key_version)
  on conflict (user_id)
  do update set
    key_hash = excluded.key_hash,
    key_salt = excluded.key_salt,
    key_version = excluded.key_version,
    updated_at = now();
end;
$$;

create or replace function public.get_recovery_secret(
  p_user_id uuid
)
returns table(key_hash text, key_salt text, key_version integer)
language sql
security definer
set search_path = public, private
as $$
  select s.key_hash, s.key_salt, s.key_version
  from private.account_recovery_secrets s
  where s.user_id = p_user_id;
$$;

create or replace function public.get_latest_recovery_snapshot(
  p_user_id uuid
)
returns table(snapshot_id uuid, expires_at timestamptz, restored_at timestamptz)
language sql
security definer
set search_path = public, private
as $$
  select ars.id as snapshot_id, ars.expires_at, ars.restored_at
  from private.account_recovery_snapshots ars
  where ars.user_id = p_user_id
  order by ars.created_at desc
  limit 1;
$$;

create or replace function public.insert_recovery_audit(
  p_user_id uuid,
  p_action text,
  p_outcome text,
  p_reason text default null,
  p_actor_email text default null,
  p_request_ip inet default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into private.account_recovery_audit (
    user_id,
    action,
    outcome,
    reason,
    actor_email,
    request_ip,
    metadata
  )
  values (
    p_user_id,
    p_action,
    p_outcome,
    p_reason,
    p_actor_email,
    p_request_ip,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to service_role;

revoke all on all tables in schema private from public;
revoke all on all tables in schema private from anon;
revoke all on all tables in schema private from authenticated;
grant select, insert, update, delete on all tables in schema private to service_role;

grant usage, select on sequence private.account_recovery_audit_id_seq to service_role;

revoke all on function public.activate_panic_mode(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.restore_panic_account(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.set_recovery_secret(uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.get_recovery_secret(uuid) from public, anon, authenticated;
revoke all on function public.get_latest_recovery_snapshot(uuid) from public, anon, authenticated;
revoke all on function public.insert_recovery_audit(uuid, text, text, text, text, inet, jsonb) from public, anon, authenticated;

grant execute on function public.activate_panic_mode(uuid, timestamptz) to service_role;
grant execute on function public.restore_panic_account(uuid, uuid, boolean) to service_role;
grant execute on function public.set_recovery_secret(uuid, text, text, integer) to service_role;
grant execute on function public.get_recovery_secret(uuid) to service_role;
grant execute on function public.get_latest_recovery_snapshot(uuid) to service_role;
grant execute on function public.insert_recovery_audit(uuid, text, text, text, text, inet, jsonb) to service_role;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'cleanup-expired-recovery-snapshots-daily'
  ) then
    perform cron.schedule(
      'cleanup-expired-recovery-snapshots-daily',
      '23 3 * * *',
      $job$select private.cleanup_expired_recovery_snapshots();$job$
    );
  end if;
exception
  when undefined_table then
    null;
end
$$;

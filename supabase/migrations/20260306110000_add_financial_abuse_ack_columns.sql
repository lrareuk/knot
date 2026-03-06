do $$
begin
  if to_regclass('public.users') is null then
    raise exception 'Missing prerequisite migration: public.users does not exist.';
  end if;
end
$$;

alter table if exists public.users
add column if not exists financial_abuse_acknowledged_at timestamptz;

alter table if exists public.users
add column if not exists financial_abuse_ack_version text;


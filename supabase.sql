create extension if not exists pgcrypto;

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  stage text null,
  region text null,
  source text null
);

alter table if exists public.waitlist_signups enable row level security;

-- Intentionally no anon/client insert policies.
-- Inserts should happen server-side using service role credentials.

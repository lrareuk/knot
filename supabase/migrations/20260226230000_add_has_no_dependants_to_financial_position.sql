alter table if exists public.financial_position
add column if not exists has_no_dependants boolean not null default false;

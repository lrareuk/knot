do $$
begin
  if to_regclass('public.users') is null then
    raise exception 'Missing prerequisite migration: public.users does not exist. Apply base schema migrations first (starting with 20260226161000_untie_core_engine.sql).';
  end if;
end
$$;

create table if not exists public.marketplace_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  professional_type text not null,
  display_name text not null,
  firm_name text,
  headline text,
  bio text,
  jurisdiction_codes text[] not null default '{}'::text[],
  specialisms text[] not null default '{}'::text[],
  service_modes text[] not null default array['remote']::text[],
  languages text[] not null default array['en']::text[],
  years_experience integer,
  hourly_rate_min integer,
  hourly_rate_max integer,
  currency_code text not null default 'GBP',
  contact_email text,
  contact_url text,
  verification_status text not null default 'pending',
  is_visible boolean not null default false,
  is_accepting_new_clients boolean not null default true,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_profiles_professional_type_check
    check (professional_type in ('solicitor', 'financial_adviser')),
  constraint marketplace_profiles_display_name_length_check
    check (char_length(trim(display_name)) between 2 and 120),
  constraint marketplace_profiles_firm_name_length_check
    check (firm_name is null or char_length(trim(firm_name)) <= 160),
  constraint marketplace_profiles_headline_length_check
    check (headline is null or char_length(trim(headline)) <= 200),
  constraint marketplace_profiles_bio_length_check
    check (bio is null or char_length(trim(bio)) <= 4000),
  constraint marketplace_profiles_jurisdiction_codes_check
    check (jurisdiction_codes <@ array['GB-EAW', 'GB-SCT', 'GB-NIR', 'US', 'CA']::text[]),
  constraint marketplace_profiles_specialisms_count_check
    check (coalesce(array_length(specialisms, 1), 0) <= 20),
  constraint marketplace_profiles_service_modes_check
    check (
      service_modes <@ array['remote', 'in_person', 'hybrid']::text[]
      and coalesce(array_length(service_modes, 1), 0) > 0
    ),
  constraint marketplace_profiles_languages_count_check
    check (
      coalesce(array_length(languages, 1), 0) > 0
      and coalesce(array_length(languages, 1), 0) <= 8
    ),
  constraint marketplace_profiles_experience_check
    check (years_experience is null or years_experience between 0 and 70),
  constraint marketplace_profiles_rate_check
    check (
      (hourly_rate_min is null and hourly_rate_max is null)
      or (
        hourly_rate_min is not null
        and hourly_rate_max is not null
        and hourly_rate_min >= 0
        and hourly_rate_max >= hourly_rate_min
      )
    ),
  constraint marketplace_profiles_currency_code_check
    check (currency_code in ('GBP', 'USD', 'CAD')),
  constraint marketplace_profiles_contact_email_length_check
    check (contact_email is null or char_length(trim(contact_email)) <= 320),
  constraint marketplace_profiles_contact_url_length_check
    check (contact_url is null or char_length(trim(contact_url)) <= 2048),
  constraint marketplace_profiles_verification_status_check
    check (verification_status in ('pending', 'verified', 'suspended'))
);

create or replace function public.sync_marketplace_profile_search_text()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_text := lower(
    concat_ws(
      ' ',
      coalesce(new.display_name, ''),
      coalesce(new.firm_name, ''),
      coalesce(new.headline, ''),
      coalesce(new.bio, ''),
      array_to_string(coalesce(new.jurisdiction_codes, '{}'::text[]), ' '),
      array_to_string(coalesce(new.specialisms, '{}'::text[]), ' ')
    )
  );
  return new;
end;
$$;

drop trigger if exists set_marketplace_profiles_search_text on public.marketplace_profiles;
create trigger set_marketplace_profiles_search_text
before insert or update on public.marketplace_profiles
for each row
execute function public.sync_marketplace_profile_search_text();

update public.marketplace_profiles
set search_text = lower(
  concat_ws(
    ' ',
    coalesce(display_name, ''),
    coalesce(firm_name, ''),
    coalesce(headline, ''),
    coalesce(bio, ''),
    array_to_string(coalesce(jurisdiction_codes, '{}'::text[]), ' '),
    array_to_string(coalesce(specialisms, '{}'::text[]), ' ')
  )
)
where true;

create table if not exists public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public.users(id) on delete cascade,
  profile_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  message text not null,
  context_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_inquiries_message_length_check
    check (char_length(trim(message)) between 20 and 2000),
  constraint marketplace_inquiries_context_snapshot_type_check
    check (jsonb_typeof(context_snapshot) = 'object'),
  constraint marketplace_inquiries_status_check
    check (status in ('pending', 'contacted', 'closed'))
);

create index if not exists marketplace_profiles_user_id_idx
on public.marketplace_profiles(user_id);

create index if not exists marketplace_profiles_public_listing_idx
on public.marketplace_profiles(is_visible, verification_status, professional_type, is_accepting_new_clients);

create index if not exists marketplace_profiles_jurisdiction_codes_gin_idx
on public.marketplace_profiles using gin (jurisdiction_codes);

create index if not exists marketplace_inquiries_requester_user_id_idx
on public.marketplace_inquiries(requester_user_id);

create index if not exists marketplace_inquiries_profile_id_idx
on public.marketplace_inquiries(profile_id);

create index if not exists marketplace_inquiries_status_idx
on public.marketplace_inquiries(status);

create unique index if not exists marketplace_inquiries_unique_pending_idx
on public.marketplace_inquiries(requester_user_id, profile_id)
where status = 'pending';

alter table public.marketplace_profiles enable row level security;
alter table public.marketplace_inquiries enable row level security;

drop policy if exists "Public can view visible verified marketplace profiles" on public.marketplace_profiles;
drop policy if exists "Paid users can view visible verified marketplace profiles" on public.marketplace_profiles;
create policy "Paid users can view visible verified marketplace profiles"
on public.marketplace_profiles
for select
using (
  is_visible = true
  and verification_status = 'verified'
  and exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.paid = true
      and u.account_state = 'active'
  )
);

drop policy if exists "Users can view own marketplace profile" on public.marketplace_profiles;
create policy "Users can view own marketplace profile"
on public.marketplace_profiles
for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own marketplace profile" on public.marketplace_profiles;
create policy "Users can insert own marketplace profile"
on public.marketplace_profiles
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own marketplace profile" on public.marketplace_profiles;
create policy "Users can update own marketplace profile"
on public.marketplace_profiles
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own marketplace profile" on public.marketplace_profiles;
create policy "Users can delete own marketplace profile"
on public.marketplace_profiles
for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own requested marketplace inquiries" on public.marketplace_inquiries;
create policy "Users can view own requested marketplace inquiries"
on public.marketplace_inquiries
for select
using ((select auth.uid()) = requester_user_id);

drop policy if exists "Profile owners can view inbound marketplace inquiries" on public.marketplace_inquiries;
create policy "Profile owners can view inbound marketplace inquiries"
on public.marketplace_inquiries
for select
using (
  exists (
    select 1
    from public.marketplace_profiles mp
    where mp.id = profile_id
      and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can insert marketplace inquiries for visible verified profiles" on public.marketplace_inquiries;
create policy "Users can insert marketplace inquiries for visible verified profiles"
on public.marketplace_inquiries
for insert
with check (
  (select auth.uid()) = requester_user_id
  and exists (
    select 1
    from public.marketplace_profiles mp
    where mp.id = profile_id
      and mp.user_id <> (select auth.uid())
      and mp.is_visible = true
      and mp.verification_status = 'verified'
  )
);

drop policy if exists "Profile owners can update inbound marketplace inquiries" on public.marketplace_inquiries;
create policy "Profile owners can update inbound marketplace inquiries"
on public.marketplace_inquiries
for update
using (
  exists (
    select 1
    from public.marketplace_profiles mp
    where mp.id = profile_id
      and mp.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.marketplace_profiles mp
    where mp.id = profile_id
      and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete own pending marketplace inquiries" on public.marketplace_inquiries;
create policy "Users can delete own pending marketplace inquiries"
on public.marketplace_inquiries
for delete
using (
  (select auth.uid()) = requester_user_id
  and status = 'pending'
);

drop trigger if exists set_marketplace_profiles_updated_at on public.marketplace_profiles;
create trigger set_marketplace_profiles_updated_at
before update on public.marketplace_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_marketplace_inquiries_updated_at on public.marketplace_inquiries;
create trigger set_marketplace_inquiries_updated_at
before update on public.marketplace_inquiries
for each row
execute function public.set_updated_at();

create table if not exists public.marketplace_inquiry_participants (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.marketplace_inquiries(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_inquiry_participants_role_check
    check (role in ('requester', 'advisor')),
  constraint marketplace_inquiry_participants_unique_user_per_inquiry
    unique (inquiry_id, user_id)
);

create table if not exists public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.marketplace_inquiries(id) on delete cascade,
  sender_user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_messages_body_length_check
    check (char_length(trim(body)) between 1 and 5000)
);

create table if not exists public.marketplace_message_attachments (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.marketplace_inquiries(id) on delete cascade,
  message_id uuid not null references public.marketplace_messages(id) on delete cascade,
  uploader_user_id uuid not null references public.users(id) on delete cascade,
  storage_bucket text not null default 'marketplace-chat',
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_message_attachments_file_size_check
    check (size_bytes >= 0 and size_bytes <= 26214400),
  constraint marketplace_message_attachments_unique_path
    unique (storage_bucket, storage_path)
);

create table if not exists public.marketplace_inquiry_events (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.marketplace_inquiries(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint marketplace_inquiry_events_event_type_check
    check (event_type in ('inquiry_created', 'status_changed', 'message_sent', 'attachment_added')),
  constraint marketplace_inquiry_events_payload_type_check
    check (jsonb_typeof(event_payload) = 'object')
);

create index if not exists marketplace_inquiry_participants_user_id_idx
on public.marketplace_inquiry_participants(user_id);

create index if not exists marketplace_inquiry_participants_inquiry_id_idx
on public.marketplace_inquiry_participants(inquiry_id);

create index if not exists marketplace_messages_inquiry_id_created_at_idx
on public.marketplace_messages(inquiry_id, created_at);

create index if not exists marketplace_message_attachments_inquiry_id_idx
on public.marketplace_message_attachments(inquiry_id);

create index if not exists marketplace_message_attachments_message_id_idx
on public.marketplace_message_attachments(message_id);

create index if not exists marketplace_inquiry_events_inquiry_id_created_at_idx
on public.marketplace_inquiry_events(inquiry_id, created_at);

alter table public.marketplace_inquiry_participants enable row level security;
alter table public.marketplace_messages enable row level security;
alter table public.marketplace_message_attachments enable row level security;
alter table public.marketplace_inquiry_events enable row level security;

drop policy if exists "Users can view own marketplace inquiry participant records" on public.marketplace_inquiry_participants;
create policy "Users can view own marketplace inquiry participant records"
on public.marketplace_inquiry_participants
for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own marketplace inquiry participant records" on public.marketplace_inquiry_participants;
create policy "Users can insert own marketplace inquiry participant records"
on public.marketplace_inquiry_participants
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view marketplace messages in joined inquiries" on public.marketplace_messages;
create policy "Users can view marketplace messages in joined inquiries"
on public.marketplace_messages
for select
using (
  exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id = marketplace_messages.inquiry_id
      and mip.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can insert marketplace messages in joined inquiries" on public.marketplace_messages;
create policy "Users can insert marketplace messages in joined inquiries"
on public.marketplace_messages
for insert
with check (
  sender_user_id = (select auth.uid())
  and exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id = marketplace_messages.inquiry_id
      and mip.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can view marketplace attachments in joined inquiries" on public.marketplace_message_attachments;
create policy "Users can view marketplace attachments in joined inquiries"
on public.marketplace_message_attachments
for select
using (
  exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id = marketplace_message_attachments.inquiry_id
      and mip.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can insert own marketplace attachments in joined inquiries" on public.marketplace_message_attachments;
create policy "Users can insert own marketplace attachments in joined inquiries"
on public.marketplace_message_attachments
for insert
with check (
  uploader_user_id = (select auth.uid())
  and exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id = marketplace_message_attachments.inquiry_id
      and mip.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can view marketplace inquiry events in joined inquiries" on public.marketplace_inquiry_events;
create policy "Users can view marketplace inquiry events in joined inquiries"
on public.marketplace_inquiry_events
for select
using (
  exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id = marketplace_inquiry_events.inquiry_id
      and mip.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can insert marketplace inquiry events in joined inquiries" on public.marketplace_inquiry_events;
create policy "Users can insert marketplace inquiry events in joined inquiries"
on public.marketplace_inquiry_events
for insert
with check (
  (actor_user_id is null or actor_user_id = (select auth.uid()))
  and exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id = marketplace_inquiry_events.inquiry_id
      and mip.user_id = (select auth.uid())
  )
);

drop trigger if exists set_marketplace_inquiry_participants_updated_at on public.marketplace_inquiry_participants;
create trigger set_marketplace_inquiry_participants_updated_at
before update on public.marketplace_inquiry_participants
for each row
execute function public.set_updated_at();

drop trigger if exists set_marketplace_messages_updated_at on public.marketplace_messages;
create trigger set_marketplace_messages_updated_at
before update on public.marketplace_messages
for each row
execute function public.set_updated_at();

drop trigger if exists set_marketplace_message_attachments_updated_at on public.marketplace_message_attachments;
create trigger set_marketplace_message_attachments_updated_at
before update on public.marketplace_message_attachments
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit)
values ('marketplace-chat', 'marketplace-chat', false, 26214400)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Users can view marketplace chat objects by inquiry participation" on storage.objects;
create policy "Users can view marketplace chat objects by inquiry participation"
on storage.objects
for select
using (
  bucket_id = 'marketplace-chat'
  and exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id::text = (storage.foldername(name))[1]
      and mip.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can upload marketplace chat objects by inquiry participation" on storage.objects;
create policy "Users can upload marketplace chat objects by inquiry participation"
on storage.objects
for insert
with check (
  bucket_id = 'marketplace-chat'
  and exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id::text = (storage.foldername(name))[1]
      and mip.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update marketplace chat objects by inquiry participation" on storage.objects;
create policy "Users can update marketplace chat objects by inquiry participation"
on storage.objects
for update
using (
  bucket_id = 'marketplace-chat'
  and exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id::text = (storage.foldername(name))[1]
      and mip.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'marketplace-chat'
  and exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id::text = (storage.foldername(name))[1]
      and mip.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete marketplace chat objects by inquiry participation" on storage.objects;
create policy "Users can delete marketplace chat objects by inquiry participation"
on storage.objects
for delete
using (
  bucket_id = 'marketplace-chat'
  and exists (
    select 1
    from public.marketplace_inquiry_participants mip
    where mip.inquiry_id::text = (storage.foldername(name))[1]
      and mip.user_id = (select auth.uid())
  )
);

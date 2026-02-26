create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_name text;
begin
  v_first_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), '');

  insert into public.users (id, email, first_name)
  values (new.id, coalesce(new.email, ''), v_first_name)
  on conflict (id) do update
  set email = excluded.email,
      first_name = coalesce(public.users.first_name, excluded.first_name);

  return new;
end;
$$;

update public.users as u
set first_name = nullif(trim(coalesce(au.raw_user_meta_data ->> 'first_name', '')), '')
from auth.users as au
where u.id = au.id
  and u.first_name is null;

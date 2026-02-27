do $$
declare
  function_signature text;
begin
  for function_signature in
    select format(
      '%I.%I(%s)',
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid)
    )
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'set_updated_at',
        'prevent_document_integrity_change',
        'touch_updated_at',
        'is_workspace_member',
        'is_workspace_admin',
        'workspace_plan_rank'
      )
  loop
    execute format('alter function %s set search_path = public', function_signature);
  end loop;
end;
$$;

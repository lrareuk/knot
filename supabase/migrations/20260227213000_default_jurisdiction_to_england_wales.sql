-- Default new/unspecified jurisdictions to England and Wales (GB-EAW).
alter table if exists public.users
alter column jurisdiction set default 'GB-EAW';

update public.users
set jurisdiction = 'GB-EAW'
where coalesce(jurisdiction, '') = '';

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
  v_legal_agreements jsonb;
  v_legal_documents jsonb;
  v_legal_terms jsonb;
  v_report_paths text[];
  v_agreement_paths text[];
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

  select coalesce(jsonb_agg(to_jsonb(la) order by la.created_at), '[]'::jsonb)
  into v_legal_agreements
  from public.legal_agreements la
  where la.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(ld) order by ld.created_at), '[]'::jsonb)
  into v_legal_documents
  from public.legal_agreement_documents ld
  where ld.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(lt) order by lt.created_at), '[]'::jsonb)
  into v_legal_terms
  from public.legal_agreement_terms lt
  where lt.user_id = p_user_id;

  select coalesce(array_agg(r.storage_path), '{}'::text[])
  into v_report_paths
  from public.reports r
  where r.user_id = p_user_id
    and r.storage_path is not null;

  select coalesce(array_agg(d.storage_path), '{}'::text[])
  into v_agreement_paths
  from public.legal_agreement_documents d
  where d.user_id = p_user_id
    and d.storage_path is not null;

  v_snapshot := jsonb_build_object(
    'profile',
    jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'first_name', v_user.first_name,
      'jurisdiction', v_user.jurisdiction,
      'currency_code', v_user.currency_code,
      'currency_overridden', v_user.currency_overridden,
      'has_relevant_agreements', v_user.has_relevant_agreements,
      'onboarding_done', v_user.onboarding_done,
      'paid', v_user.paid,
      'stripe_session', v_user.stripe_session,
      'created_at', v_user.created_at,
      'updated_at', v_user.updated_at
    ),
    'financial_position', v_financial,
    'scenarios', v_scenarios,
    'legal_agreements', v_legal_agreements,
    'legal_documents', v_legal_documents,
    'legal_terms', v_legal_terms
  );

  insert into private.account_recovery_snapshots (user_id, snapshot, expires_at)
  values (p_user_id, v_snapshot, p_expires_at)
  returning id into v_snapshot_id;

  delete from public.reports where user_id = p_user_id;
  delete from public.legal_agreement_terms where user_id = p_user_id;
  delete from public.legal_agreement_documents where user_id = p_user_id;
  delete from public.legal_agreements where user_id = p_user_id;
  delete from public.scenarios where user_id = p_user_id;
  delete from public.financial_position where user_id = p_user_id;

  update public.users
  set first_name = null,
      jurisdiction = 'GB-EAW',
      currency_code = 'GBP',
      currency_overridden = false,
      has_relevant_agreements = null,
      onboarding_done = false,
      stripe_session = null,
      account_state = 'panic_hidden',
      panic_triggered_at = now()
  where id = p_user_id;

  snapshot_id := v_snapshot_id;
  report_paths := coalesce(v_report_paths, '{}'::text[]) || coalesce(v_agreement_paths, '{}'::text[]);
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
  v_legal_agreements jsonb;
  v_legal_documents jsonb;
  v_legal_terms jsonb;
  v_scenario jsonb;
  v_legal_agreement jsonb;
  v_legal_document jsonb;
  v_legal_term jsonb;
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
  delete from public.legal_agreement_terms where user_id = p_user_id;
  delete from public.legal_agreement_documents where user_id = p_user_id;
  delete from public.legal_agreements where user_id = p_user_id;
  delete from public.scenarios where user_id = p_user_id;
  delete from public.financial_position where user_id = p_user_id;

  if p_restore_empty then
    update public.users
    set first_name = null,
        jurisdiction = 'GB-EAW',
        currency_code = 'GBP',
        currency_overridden = false,
        has_relevant_agreements = null,
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
  v_legal_agreements := coalesce(v_snapshot->'legal_agreements', '[]'::jsonb);
  v_legal_documents := coalesce(v_snapshot->'legal_documents', '[]'::jsonb);
  v_legal_terms := coalesce(v_snapshot->'legal_terms', '[]'::jsonb);

  update public.users
  set first_name = nullif(v_profile->>'first_name', ''),
      jurisdiction = coalesce(nullif(v_profile->>'jurisdiction', ''), 'GB-EAW'),
      currency_code = coalesce(nullif(v_profile->>'currency_code', ''), 'GBP'),
      currency_overridden = coalesce((v_profile->>'currency_overridden')::boolean, false),
      has_relevant_agreements = (v_profile->>'has_relevant_agreements')::boolean,
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
      has_no_dependants,
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
      coalesce((v_financial->>'has_no_dependants')::boolean, false),
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
      has_no_dependants = excluded.has_no_dependants,
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

  if jsonb_typeof(v_legal_agreements) = 'array' then
    for v_legal_agreement in
      select value
      from jsonb_array_elements(v_legal_agreements)
    loop
      insert into public.legal_agreements (
        id,
        user_id,
        agreement_type,
        title,
        governing_jurisdiction,
        effective_date,
        user_summary,
        source_status,
        created_at,
        updated_at
      )
      values (
        coalesce((v_legal_agreement->>'id')::uuid, gen_random_uuid()),
        p_user_id,
        coalesce(nullif(v_legal_agreement->>'agreement_type', ''), 'prenup'),
        nullif(v_legal_agreement->>'title', ''),
        nullif(v_legal_agreement->>'governing_jurisdiction', ''),
        nullif(v_legal_agreement->>'effective_date', '')::date,
        nullif(v_legal_agreement->>'user_summary', ''),
        coalesce(nullif(v_legal_agreement->>'source_status', ''), 'manual_only'),
        coalesce((v_legal_agreement->>'created_at')::timestamptz, now()),
        coalesce((v_legal_agreement->>'updated_at')::timestamptz, now())
      )
      on conflict (id)
      do update set
        user_id = excluded.user_id,
        agreement_type = excluded.agreement_type,
        title = excluded.title,
        governing_jurisdiction = excluded.governing_jurisdiction,
        effective_date = excluded.effective_date,
        user_summary = excluded.user_summary,
        source_status = excluded.source_status,
        updated_at = now();
    end loop;
  end if;

  if jsonb_typeof(v_legal_documents) = 'array' then
    for v_legal_document in
      select value
      from jsonb_array_elements(v_legal_documents)
    loop
      insert into public.legal_agreement_documents (
        id,
        agreement_id,
        user_id,
        file_name,
        mime_type,
        size_bytes,
        storage_path,
        extraction_status,
        extraction_error,
        processed_at,
        created_at,
        updated_at
      )
      values (
        coalesce((v_legal_document->>'id')::uuid, gen_random_uuid()),
        (v_legal_document->>'agreement_id')::uuid,
        p_user_id,
        coalesce(nullif(v_legal_document->>'file_name', ''), 'agreement'),
        coalesce(nullif(v_legal_document->>'mime_type', ''), 'application/pdf'),
        coalesce((v_legal_document->>'size_bytes')::bigint, 0),
        coalesce(nullif(v_legal_document->>'storage_path', ''), ''),
        coalesce(nullif(v_legal_document->>'extraction_status', ''), 'pending'),
        nullif(v_legal_document->>'extraction_error', ''),
        nullif(v_legal_document->>'processed_at', '')::timestamptz,
        coalesce((v_legal_document->>'created_at')::timestamptz, now()),
        coalesce((v_legal_document->>'updated_at')::timestamptz, now())
      )
      on conflict (id)
      do update set
        agreement_id = excluded.agreement_id,
        user_id = excluded.user_id,
        file_name = excluded.file_name,
        mime_type = excluded.mime_type,
        size_bytes = excluded.size_bytes,
        storage_path = excluded.storage_path,
        extraction_status = excluded.extraction_status,
        extraction_error = excluded.extraction_error,
        processed_at = excluded.processed_at,
        updated_at = now();
    end loop;
  end if;

  if jsonb_typeof(v_legal_terms) = 'array' then
    for v_legal_term in
      select value
      from jsonb_array_elements(v_legal_terms)
    loop
      insert into public.legal_agreement_terms (
        id,
        agreement_id,
        user_id,
        term_type,
        term_payload,
        impact_direction,
        confidence,
        citation,
        source_document_id,
        created_at,
        updated_at
      )
      values (
        coalesce((v_legal_term->>'id')::uuid, gen_random_uuid()),
        (v_legal_term->>'agreement_id')::uuid,
        p_user_id,
        coalesce(nullif(v_legal_term->>'term_type', ''), 'other_material_term'),
        coalesce(v_legal_term->'term_payload', '{}'::jsonb),
        coalesce(nullif(v_legal_term->>'impact_direction', ''), 'unknown'),
        coalesce((v_legal_term->>'confidence')::numeric, 0),
        coalesce(v_legal_term->'citation', jsonb_build_object('quote', '')),
        (v_legal_term->>'source_document_id')::uuid,
        coalesce((v_legal_term->>'created_at')::timestamptz, now()),
        coalesce((v_legal_term->>'updated_at')::timestamptz, now())
      )
      on conflict (id)
      do update set
        agreement_id = excluded.agreement_id,
        user_id = excluded.user_id,
        term_type = excluded.term_type,
        term_payload = excluded.term_payload,
        impact_direction = excluded.impact_direction,
        confidence = excluded.confidence,
        citation = excluded.citation,
        source_document_id = excluded.source_document_id,
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

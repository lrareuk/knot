create or replace function public.untie_md5_uuid(seed text)
returns text
language sql
immutable
as $$
  select lower(
    substr(md5(seed), 1, 8) || '-' ||
    substr(md5(seed), 9, 4) || '-' ||
    substr(md5(seed), 13, 4) || '-' ||
    substr(md5(seed), 17, 4) || '-' ||
    substr(md5(seed), 21, 12)
  );
$$;

with repaired as (
  select
    fp.id,
    coalesce(
      (
        select jsonb_agg(
          case
            when jsonb_typeof(item) = 'object' and coalesce(nullif(trim(item->>'id'), ''), '') <> '' then item
            when jsonb_typeof(item) = 'object' then jsonb_set(
              item,
              '{id}',
              to_jsonb(public.untie_md5_uuid(fp.id::text || ':properties:' || ordinality::text)),
              true
            )
            else item
          end
          order by ordinality
        )
        from jsonb_array_elements(fp.properties) with ordinality as entries(item, ordinality)
      ),
      '[]'::jsonb
    ) as properties,
    coalesce(
      (
        select jsonb_agg(
          case
            when jsonb_typeof(item) = 'object' and coalesce(nullif(trim(item->>'id'), ''), '') <> '' then item
            when jsonb_typeof(item) = 'object' then jsonb_set(
              item,
              '{id}',
              to_jsonb(public.untie_md5_uuid(fp.id::text || ':pensions:' || ordinality::text)),
              true
            )
            else item
          end
          order by ordinality
        )
        from jsonb_array_elements(fp.pensions) with ordinality as entries(item, ordinality)
      ),
      '[]'::jsonb
    ) as pensions,
    coalesce(
      (
        select jsonb_agg(
          case
            when jsonb_typeof(item) = 'object' and coalesce(nullif(trim(item->>'id'), ''), '') <> '' then item
            when jsonb_typeof(item) = 'object' then jsonb_set(
              item,
              '{id}',
              to_jsonb(public.untie_md5_uuid(fp.id::text || ':savings:' || ordinality::text)),
              true
            )
            else item
          end
          order by ordinality
        )
        from jsonb_array_elements(fp.savings) with ordinality as entries(item, ordinality)
      ),
      '[]'::jsonb
    ) as savings,
    coalesce(
      (
        select jsonb_agg(
          case
            when jsonb_typeof(item) = 'object' and coalesce(nullif(trim(item->>'id'), ''), '') <> '' then item
            when jsonb_typeof(item) = 'object' then jsonb_set(
              item,
              '{id}',
              to_jsonb(public.untie_md5_uuid(fp.id::text || ':debts:' || ordinality::text)),
              true
            )
            else item
          end
          order by ordinality
        )
        from jsonb_array_elements(fp.debts) with ordinality as entries(item, ordinality)
      ),
      '[]'::jsonb
    ) as debts,
    coalesce(
      (
        select jsonb_agg(
          case
            when jsonb_typeof(item) = 'object' and coalesce(nullif(trim(item->>'id'), ''), '') <> '' then item
            when jsonb_typeof(item) = 'object' then jsonb_set(
              item,
              '{id}',
              to_jsonb(public.untie_md5_uuid(fp.id::text || ':dependants:' || ordinality::text)),
              true
            )
            else item
          end
          order by ordinality
        )
        from jsonb_array_elements(fp.dependants) with ordinality as entries(item, ordinality)
      ),
      '[]'::jsonb
    ) as dependants
  from public.financial_position fp
)
update public.financial_position fp
set
  properties = repaired.properties,
  pensions = repaired.pensions,
  savings = repaired.savings,
  debts = repaired.debts,
  dependants = repaired.dependants
from repaired
where fp.id = repaired.id
  and (
    fp.properties is distinct from repaired.properties
    or fp.pensions is distinct from repaired.pensions
    or fp.savings is distinct from repaired.savings
    or fp.debts is distinct from repaired.debts
    or fp.dependants is distinct from repaired.dependants
  );

drop function if exists public.untie_md5_uuid(text);

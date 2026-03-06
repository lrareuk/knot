import type { SupabaseClient } from "@supabase/supabase-js";
import { createDefaultFinancialPosition, createEmptyDebt, createEmptyDependant, createEmptyPension, createEmptyProperty, createEmptySavings } from "@/lib/domain/defaults";
import type { FinancialPosition } from "@/lib/domain/types";

export function normalizeFinancialPosition(raw: Partial<FinancialPosition> | null | undefined): FinancialPosition {
  const fallback = createDefaultFinancialPosition();
  const pensions = (raw?.pensions ?? fallback.pensions).map((pension) => ({
    ...pension,
    projected_annual_income: pension.projected_annual_income ?? null,
    scottish_relevant_date_value: pension.scottish_relevant_date_value ?? null,
  }));

  return {
    properties: raw?.properties ?? fallback.properties,
    pensions,
    savings: raw?.savings ?? fallback.savings,
    debts: raw?.debts ?? fallback.debts,
    income: raw?.income ?? fallback.income,
    dependants: raw?.dependants ?? fallback.dependants,
    expenditure: raw?.expenditure ?? fallback.expenditure,
    has_no_dependants: raw?.has_no_dependants ?? fallback.has_no_dependants,
    date_of_marriage: raw?.date_of_marriage ?? null,
    date_of_separation: raw?.date_of_separation ?? null,
  };
}

export async function getOrCreateFinancialPosition(
  supabase: SupabaseClient,
  userId: string
): Promise<FinancialPosition> {
  const { data } = await supabase
    .from("financial_position")
    .select(
      "id,user_id,properties,pensions,savings,debts,income,dependants,expenditure,has_no_dependants,date_of_marriage,date_of_separation,updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle<FinancialPosition>();

  if (data) {
    const normalized = ensureStableItemIds(normalizeFinancialPosition(data));
    await supabase.from("financial_position").upsert(
      {
        user_id: userId,
        ...normalized,
      },
      { onConflict: "user_id", ignoreDuplicates: false }
    );
    return normalized;
  }

  const defaultPosition = createDefaultFinancialPosition();

  await supabase.from("financial_position").insert({
    user_id: userId,
    ...defaultPosition,
  });

  return defaultPosition;
}

export function ensureStableItemIds(position: FinancialPosition): FinancialPosition {
  return {
    ...position,
    properties: position.properties.map((item) => ({ ...item, id: item.id || createEmptyProperty().id })),
    pensions: position.pensions.map((item) => ({ ...item, id: item.id || createEmptyPension().id })),
    savings: position.savings.map((item) => ({ ...item, id: item.id || createEmptySavings().id })),
    debts: position.debts.map((item) => ({ ...item, id: item.id || createEmptyDebt().id })),
    dependants: position.dependants.map((item) => ({ ...item, id: item.id || createEmptyDependant().id })),
  };
}

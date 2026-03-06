import type { SupabaseClient } from "@supabase/supabase-js";
import { computeScenario } from "@/lib/domain/compute-scenario";
import { createDefaultScenarioConfig } from "@/lib/domain/defaults";
import { SCENARIO_MODEL_VERSION } from "@/lib/domain/types";
import type { FinancialPosition, ScenarioRecord } from "@/lib/domain/types";

type ListScenariosOptions = {
  position?: FinancialPosition;
  jurisdictionCode?: string;
};

function isScenarioCurrent(scenario: ScenarioRecord) {
  return scenario.results?.model_version === SCENARIO_MODEL_VERSION;
}

export async function listScenarios(
  supabase: SupabaseClient,
  userId: string,
  options: ListScenariosOptions = {}
) {
  const { data } = await supabase
    .from("scenarios")
    .select("id,user_id,name,config,results,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<ScenarioRecord[]>();

  const scenarios = data ?? [];
  if (!options.position || !options.jurisdictionCode) {
    return scenarios;
  }

  const normalizedJurisdictionCode = options.jurisdictionCode.trim().toUpperCase();
  const staleScenarios = scenarios.filter((scenario) => !isScenarioCurrent(scenario));
  if (staleScenarios.length === 0) {
    return scenarios;
  }

  const refreshedById = new Map<string, ScenarioRecord>();
  for (const scenario of staleScenarios) {
    const recomputedResults = computeScenario(options.position, scenario.config, normalizedJurisdictionCode);
    const { data: updated } = await supabase
      .from("scenarios")
      .update({ results: recomputedResults })
      .eq("id", scenario.id)
      .eq("user_id", userId)
      .select("id,user_id,name,config,results,created_at,updated_at")
      .single<ScenarioRecord>();

    if (updated) {
      refreshedById.set(updated.id, updated);
    } else {
      refreshedById.set(scenario.id, { ...scenario, results: recomputedResults });
    }
  }

  return scenarios.map((scenario) => refreshedById.get(scenario.id) ?? scenario);
}

export async function ensureFirstScenario(
  supabase: SupabaseClient,
  userId: string,
  position: FinancialPosition,
  jurisdictionCode = "GB-EAW"
): Promise<ScenarioRecord | null> {
  const existing = await listScenarios(supabase, userId);
  if (existing.length > 0) {
    return existing[0] ?? null;
  }

  const config = createDefaultScenarioConfig(position);
  const results = computeScenario(position, config, jurisdictionCode);

  const { data } = await supabase
    .from("scenarios")
    .insert({
      user_id: userId,
      name: "Scenario A",
      config,
      results,
    })
    .select("id,user_id,name,config,results,created_at,updated_at")
    .single<ScenarioRecord>();

  return data ?? null;
}

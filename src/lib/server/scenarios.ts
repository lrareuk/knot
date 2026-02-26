import type { SupabaseClient } from "@supabase/supabase-js";
import { computeScenario } from "@/lib/domain/compute-scenario";
import { createDefaultScenarioConfig } from "@/lib/domain/defaults";
import type { FinancialPosition, ScenarioRecord } from "@/lib/domain/types";

export async function listScenarios(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("scenarios")
    .select("id,user_id,name,config,results,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<ScenarioRecord[]>();

  return data ?? [];
}

export async function ensureFirstScenario(
  supabase: SupabaseClient,
  userId: string,
  position: FinancialPosition
): Promise<ScenarioRecord | null> {
  const existing = await listScenarios(supabase, userId);
  if (existing.length > 0) {
    return existing[0] ?? null;
  }

  const config = createDefaultScenarioConfig(position);
  const results = computeScenario(position, config);

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

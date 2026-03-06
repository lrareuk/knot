import { notFound } from "next/navigation";
import ScenarioEditor from "@/app/components/dashboard/ScenarioEditor";
import { computeBaseline, computeScenario } from "@/lib/domain/compute-scenario";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";

export default async function ScenarioEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile, supabase } = await requireDashboardAccess();
  const position = await getOrCreateFinancialPosition(supabase, user.id);
  const baseline = computeBaseline(position, profile?.jurisdiction ?? "GB-EAW");

  const { data: scenarioRecord } = await supabase
    .from("scenarios")
    .select("id,user_id,name,config,results,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!scenarioRecord) {
    notFound();
  }

  const scenario =
    scenarioRecord.results?.model_version === "v2_jurisdiction_pensions"
      ? scenarioRecord
      : {
          ...scenarioRecord,
          results: computeScenario(position, scenarioRecord.config, profile?.jurisdiction ?? "GB-EAW"),
        };

  if (scenario !== scenarioRecord) {
    await supabase
      .from("scenarios")
      .update({ results: scenario.results })
      .eq("id", scenario.id)
      .eq("user_id", user.id);
  }

  const { data: agreementTerms } = await supabase
    .from("legal_agreement_terms")
    .select("id,agreement_id,user_id,term_type,term_payload,impact_direction,confidence,citation,source_document_id,created_at,updated_at")
    .eq("user_id", user.id);

  return (
    <ScenarioEditor
      scenario={scenario}
      position={position}
      baseline={baseline}
      jurisdictionCode={profile?.jurisdiction ?? "GB-EAW"}
      currencyCode={profile?.currency_code ?? "GBP"}
      agreementTerms={agreementTerms ?? []}
    />
  );
}

import ScenarioListView from "@/app/components/dashboard/ScenarioListView";
import type { LegalAgreementTerm } from "@/lib/legal/types";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { listScenarios } from "@/lib/server/scenarios";

export default async function ScenariosPage() {
  const { user, profile, supabase } = await requireDashboardAccess();
  const position = await getOrCreateFinancialPosition(supabase, user.id);
  const scenarios = await listScenarios(supabase, user.id, {
    position,
    jurisdictionCode: profile.jurisdiction,
  });
  const { data: terms } = await supabase
    .from("legal_agreement_terms")
    .select("id,agreement_id,user_id,term_type,term_payload,impact_direction,confidence,citation,source_document_id,created_at,updated_at")
    .eq("user_id", user.id);

  return (
    <ScenarioListView
      initialScenarios={scenarios}
      currencyCode={profile.currency_code}
      jurisdictionCode={profile.jurisdiction}
      agreementTerms={(terms ?? []) as LegalAgreementTerm[]}
    />
  );
}

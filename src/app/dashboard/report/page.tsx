import ReportGenerator from "@/app/components/report/ReportGenerator";
import { getJurisdictionProfile } from "@/lib/legal/jurisdictions";
import type { LegalAgreementTerm } from "@/lib/legal/types";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { listScenarios } from "@/lib/server/scenarios";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
  const params = await searchParams;
  const rawPreselected = params.scenarios;
  const preselected =
    typeof rawPreselected === "string"
      ? rawPreselected
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

  return (
    <ReportGenerator
      scenarios={scenarios}
      initialReports={[]}
      preselectedScenarioIds={preselected}
      currencyCode={profile.currency_code}
      jurisdictionProfile={getJurisdictionProfile(profile.jurisdiction)}
      agreementTerms={(terms ?? []) as LegalAgreementTerm[]}
    />
  );
}

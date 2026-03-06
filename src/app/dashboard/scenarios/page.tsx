import ScenarioListView from "@/app/components/dashboard/ScenarioListView";
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

  return <ScenarioListView initialScenarios={scenarios} currencyCode={profile.currency_code} />;
}

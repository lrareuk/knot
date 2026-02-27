import ScenarioListView from "@/app/components/dashboard/ScenarioListView";
import { requireDashboardAccess } from "@/lib/server/auth";
import { listScenarios } from "@/lib/server/scenarios";

export default async function ScenariosPage() {
  const { user, profile, supabase } = await requireDashboardAccess();
  const scenarios = await listScenarios(supabase, user.id);

  return <ScenarioListView initialScenarios={scenarios} currencyCode={profile.currency_code} />;
}

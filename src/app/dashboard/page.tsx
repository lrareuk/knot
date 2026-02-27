import OverviewView from "@/app/components/dashboard/OverviewView";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { listScenarios } from "@/lib/server/scenarios";

export default async function DashboardPage() {
  const { user, profile, supabase } = await requireDashboardAccess();

  const position = await getOrCreateFinancialPosition(supabase, user.id);
  const scenarios = await listScenarios(supabase, user.id);

  return <OverviewView position={position} scenarios={scenarios} currencyCode={profile.currency_code} />;
}

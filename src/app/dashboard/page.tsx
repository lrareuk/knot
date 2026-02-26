import OverviewView from "@/app/components/dashboard/OverviewView";
import { computeBaseline } from "@/lib/domain/compute-scenario";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { listScenarios } from "@/lib/server/scenarios";

export default async function DashboardPage() {
  const { user, supabase } = await requireDashboardAccess();

  const position = await getOrCreateFinancialPosition(supabase, user.id);
  const baseline = computeBaseline(position);
  const scenarios = await listScenarios(supabase, user.id);

  return <OverviewView baseline={baseline} position={position} scenarios={scenarios} updatedAt={position.updated_at ?? null} />;
}

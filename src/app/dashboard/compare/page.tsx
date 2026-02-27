import { computeBaseline } from "@/lib/domain/compute-scenario";
import CompareView from "@/app/components/dashboard/CompareView";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { listScenarios } from "@/lib/server/scenarios";

export default async function ComparePage() {
  const { user, profile, supabase } = await requireDashboardAccess();
  const position = await getOrCreateFinancialPosition(supabase, user.id);
  const baseline = computeBaseline(position);
  const scenarios = await listScenarios(supabase, user.id);

  return <CompareView baseline={baseline} scenarios={scenarios} currencyCode={profile.currency_code} />;
}

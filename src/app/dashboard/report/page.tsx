import ReportGenerator from "@/app/components/report/ReportGenerator";
import { requireDashboardAccess } from "@/lib/server/auth";
import { listScenarios } from "@/lib/server/scenarios";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, supabase } = await requireDashboardAccess();
  const scenarios = await listScenarios(supabase, user.id);
  const params = await searchParams;
  const rawPreselected = params.scenarios;
  const preselected =
    typeof rawPreselected === "string"
      ? rawPreselected
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

  return <ReportGenerator scenarios={scenarios} initialReports={[]} preselectedScenarioIds={preselected} />;
}

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

  const { data: reports } = await supabase
    .from("reports")
    .select("id,scenario_ids,pdf_url,generated_at,expires_at")
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false });

  return <ReportGenerator scenarios={scenarios} initialReports={reports ?? []} preselectedScenarioIds={preselected} />;
}

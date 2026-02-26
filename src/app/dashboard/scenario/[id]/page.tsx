import { notFound } from "next/navigation";
import ScenarioEditor from "@/app/components/dashboard/ScenarioEditor";
import { computeBaseline } from "@/lib/domain/compute-scenario";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase } = await requireDashboardAccess();

  const position = await getOrCreateFinancialPosition(supabase, user.id);
  const baseline = computeBaseline(position);

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id,user_id,name,config,results,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!scenario) {
    notFound();
  }

  return <ScenarioEditor scenario={scenario} position={position} baseline={baseline} />;
}

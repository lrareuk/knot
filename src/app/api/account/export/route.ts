import { NextResponse } from "next/server";
import { requireApiUser, serverError } from "@/lib/server/api";

export async function GET() {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const [profileRes, financialRes, scenariosRes, reportsRes] = await Promise.all([
    context.supabase
      .from("users")
      .select("id,email,first_name,jurisdiction,onboarding_done,paid,created_at,updated_at")
      .eq("id", context.user.id)
      .single(),
    context.supabase
      .from("financial_position")
      .select(
        "id,user_id,properties,pensions,savings,debts,income,dependants,expenditure,date_of_marriage,date_of_separation,created_at,updated_at"
      )
      .eq("user_id", context.user.id)
      .maybeSingle(),
    context.supabase
      .from("scenarios")
      .select("id,user_id,name,config,results,created_at,updated_at")
      .eq("user_id", context.user.id)
      .order("created_at", { ascending: true }),
    context.supabase
      .from("reports")
      .select("id,user_id,scenario_ids,storage_path,pdf_url,generated_at,expires_at")
      .eq("user_id", context.user.id)
      .order("generated_at", { ascending: false }),
  ]);

  if (profileRes.error || financialRes.error || scenariosRes.error || reportsRes.error) {
    return serverError("Unable to export account data");
  }

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    profile: profileRes.data,
    financial_position: financialRes.data,
    scenarios: scenariosRes.data ?? [],
    reports: reportsRes.data ?? [],
  });
}

import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server/api";

export async function GET() {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { data, error } = await context.supabase
    .from("reports")
    .select("id,scenario_ids,pdf_url,generated_at,expires_at")
    .eq("user_id", context.user.id)
    .order("generated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load reports" }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [] });
}

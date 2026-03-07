import { NextResponse } from "next/server";
import { computeScenario } from "@/lib/domain/compute-scenario";
import type { ScenarioConfig, ScenarioRecord } from "@/lib/domain/types";
import { badRequest, requirePaidApiUser, serverError } from "@/lib/server/api";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { listScenarios } from "@/lib/server/scenarios";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requirePaidApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;
  const current = await listScenarios(context.supabase, context.user.id);
  if (current.length >= 5) {
    return badRequest("Maximum 5 scenarios");
  }

  const { data: source, error: sourceError } = await context.supabase
    .from("scenarios")
    .select("id,user_id,name,config,results,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .single<ScenarioRecord>();

  if (sourceError || !source) {
    return badRequest("Scenario not found");
  }

  const position = await getOrCreateFinancialPosition(context.supabase, context.user.id);
  const sourceConfig = source.config as ScenarioConfig;
  const results = computeScenario(position, sourceConfig, context.profile?.jurisdiction ?? "GB-EAW");
  const nextName = `Scenario ${String.fromCharCode(65 + current.length)}`.slice(0, 40);

  const { data: created, error: createError } = await context.supabase
    .from("scenarios")
    .insert({
      user_id: context.user.id,
      name: nextName,
      config: sourceConfig,
      results,
    })
    .select("id,user_id,name,config,results,created_at,updated_at")
    .single<ScenarioRecord>();

  if (createError || !created) {
    return serverError("Unable to duplicate scenario");
  }

  return NextResponse.json({ scenario: created }, { status: 201 });
}

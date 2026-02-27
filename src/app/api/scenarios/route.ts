import { NextResponse } from "next/server";
import { z } from "zod";
import { computeScenario } from "@/lib/domain/compute-scenario";
import { buildScenarioConfigFromTemplate, SCENARIO_TEMPLATE_KEYS } from "@/lib/domain/scenario-templates";
import { scenarioConfigSchema } from "@/lib/domain/schemas";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { listScenarios } from "@/lib/server/scenarios";

const createSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  template: z.enum(SCENARIO_TEMPLATE_KEYS).optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(40).optional(),
  config: scenarioConfigSchema.optional(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET() {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const scenarios = await listScenarios(context.supabase, context.user.id);
  return NextResponse.json({ scenarios });
}

export async function POST(req: Request) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  let payload: unknown = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid scenario payload");
  }

  const current = await listScenarios(context.supabase, context.user.id);
  if (current.length >= 5) {
    return NextResponse.json({ error: "Maximum 5 scenarios" }, { status: 400 });
  }

  const position = await getOrCreateFinancialPosition(context.supabase, context.user.id);
  const config = buildScenarioConfigFromTemplate(position, parsed.data.template ?? "clean_break_sale");
  const results = computeScenario(position, config);

  const nextName = (parsed.data.name?.trim() || `Scenario ${String.fromCharCode(65 + current.length)}`).slice(0, 40);

  const { data, error } = await context.supabase
    .from("scenarios")
    .insert({
      user_id: context.user.id,
      name: nextName,
      config,
      results,
    })
    .select("id,user_id,name,config,results,created_at,updated_at")
    .single();

  if (error) {
    return serverError("Unable to create scenario");
  }

  return NextResponse.json({ scenario: data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid scenario patch");
  }

  const position = await getOrCreateFinancialPosition(context.supabase, context.user.id);

  const updateData: {
    name?: string;
    config?: unknown;
    results?: unknown;
  } = {};

  if (parsed.data.name) {
    updateData.name = parsed.data.name.trim().slice(0, 40);
  }

  if (parsed.data.config) {
    updateData.config = parsed.data.config;
    updateData.results = computeScenario(position, parsed.data.config);
  }

  const { data, error } = await context.supabase
    .from("scenarios")
    .update(updateData)
    .eq("id", parsed.data.id)
    .eq("user_id", context.user.id)
    .select("id,user_id,name,config,results,created_at,updated_at")
    .single();

  if (error) {
    return serverError("Unable to update scenario");
  }

  return NextResponse.json({ scenario: data });
}

export async function DELETE(req: Request) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid scenario identifier");
  }

  const { error } = await context.supabase
    .from("scenarios")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", context.user.id);

  if (error) {
    return serverError("Unable to delete scenario");
  }

  return NextResponse.json({ ok: true });
}

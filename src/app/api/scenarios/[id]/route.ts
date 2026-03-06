import { NextResponse } from "next/server";
import { z } from "zod";
import { computeScenario } from "@/lib/domain/compute-scenario";
import { scenarioConfigSchema } from "@/lib/domain/schemas";
import { requireApiUser, serverError } from "@/lib/server/api";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";

const patchSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  config: scenarioConfigSchema.optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;

  const { data, error } = await context.supabase
    .from("scenarios")
    .select("id,user_id,name,config,results,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (data.results?.model_version === "v2_jurisdiction_pensions") {
    return NextResponse.json({ scenario: data });
  }

  const position = await getOrCreateFinancialPosition(context.supabase, context.user.id);
  const recomputedResults = computeScenario(position, data.config, context.profile?.jurisdiction ?? "GB-EAW");
  await context.supabase
    .from("scenarios")
    .update({ results: recomputedResults })
    .eq("id", id)
    .eq("user_id", context.user.id);

  return NextResponse.json({ scenario: { ...data, results: recomputedResults } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;
  const payload = await req.json();
  const parsed = patchSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updateData: {
    name?: string;
    config?: unknown;
    results?: unknown;
  } = {};

  if (parsed.data.name) {
    updateData.name = parsed.data.name.trim().slice(0, 40);
  }

  if (parsed.data.config) {
    const position = await getOrCreateFinancialPosition(context.supabase, context.user.id);
    updateData.config = parsed.data.config;
    updateData.results = computeScenario(position, parsed.data.config, context.profile?.jurisdiction ?? "GB-EAW");
  }

  const { data, error } = await context.supabase
    .from("scenarios")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id,user_id,name,config,results,created_at,updated_at")
    .single();

  if (error) {
    return serverError("Unable to update scenario");
  }

  return NextResponse.json({ scenario: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;

  const { error } = await context.supabase
    .from("scenarios")
    .delete()
    .eq("id", id)
    .eq("user_id", context.user.id);

  if (error) {
    return serverError("Unable to delete scenario");
  }

  return NextResponse.json({ ok: true });
}

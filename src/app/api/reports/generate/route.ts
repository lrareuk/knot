import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";
import { computeBaseline } from "@/lib/domain/compute-scenario";
import { generateScenarioObservations } from "@/lib/domain/observations";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { ClarityReportDocument } from "@/lib/report/ClarityReportDocument";
import { supabaseAdmin } from "@/lib/supabase/admin";

const payloadSchema = z.object({
  scenario_ids: z.array(z.string().uuid()).min(1).max(3),
});

export async function POST(req: Request) {
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

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Select between 1 and 3 scenarios");
  }

  const { data: scenarios, error: scenariosError } = await context.supabase
    .from("scenarios")
    .select("id,user_id,name,config,results,created_at,updated_at")
    .eq("user_id", context.user.id)
    .in("id", parsed.data.scenario_ids);

  if (scenariosError || !scenarios || scenarios.length === 0) {
    return badRequest("No valid scenarios selected");
  }

  const position = await getOrCreateFinancialPosition(context.supabase, context.user.id);
  const baseline = computeBaseline(position);
  const generatedAt = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const observations: Record<string, string[]> = {};
  for (const scenario of scenarios) {
    observations[scenario.id] = generateScenarioObservations(scenario.name, scenario.results);
  }

  const buffer = await renderToBuffer(
    ClarityReportDocument({
      generatedAt,
      baseline,
      scenarios,
      observations,
    })
  );

  const admin = supabaseAdmin();
  const storagePath = `${context.user.id}/${crypto.randomUUID()}.pdf`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const upload = await admin.storage.from("reports").upload(storagePath, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (upload.error) {
    return serverError("Failed to upload report");
  }

  const signed = await admin.storage.from("reports").createSignedUrl(storagePath, 24 * 60 * 60);

  if (signed.error) {
    return serverError("Failed to create signed URL");
  }

  const { data: report, error: reportError } = await admin
    .from("reports")
    .insert({
      user_id: context.user.id,
      scenario_ids: scenarios.map((scenario) => scenario.id),
      storage_path: storagePath,
      pdf_url: signed.data.signedUrl,
      expires_at: expiresAt.toISOString(),
    })
    .select("id,scenario_ids,pdf_url,generated_at,expires_at")
    .single();

  if (reportError) {
    return serverError("Failed to store report metadata");
  }

  return NextResponse.json({ report });
}

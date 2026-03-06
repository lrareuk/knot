import { NextResponse } from "next/server";
import { computeBaseline, computeScenario } from "@/lib/domain/compute-scenario";
import { badRequest, requirePaidApiUser, serverError } from "@/lib/server/api";
import { marketplaceInquiryCreateSchema } from "@/lib/marketplace/schemas";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { createInquiry, listRequesterInquiries } from "@/lib/server/marketplace-inquiries";
import { getMarketplaceProfileById } from "@/lib/server/marketplace-profiles";
import { createMarketplaceMessage } from "@/lib/server/marketplace-messages";
import { listScenarios } from "@/lib/server/scenarios";

function isDuplicatePendingInquiryError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  const message = "message" in error ? String(error.message ?? "").toLowerCase() : "";
  return code === "23505" || message.includes("marketplace_inquiries_unique_pending_idx");
}

export async function GET() {
  const context = await requirePaidApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { inquiries, error } = await listRequesterInquiries(context.supabase, context.user.id);
  if (error) {
    return serverError("Unable to load inquiries");
  }

  return NextResponse.json({ inquiries });
}

export async function POST(req: Request) {
  const context = await requirePaidApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = marketplaceInquiryCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid inquiry payload");
  }

  const { profile, error: profileError } = await getMarketplaceProfileById(context.supabase, parsed.data.profile_id);
  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!profile.is_visible || profile.verification_status !== "verified") {
    return NextResponse.json({ error: "Profile unavailable" }, { status: 400 });
  }

  if (!profile.is_accepting_new_clients) {
    return NextResponse.json({ error: "Profile is not accepting new inquiries" }, { status: 400 });
  }

  if (profile.user_id === context.user.id) {
    return NextResponse.json({ error: "You cannot inquire on your own profile" }, { status: 400 });
  }

  const position = await getOrCreateFinancialPosition(context.supabase, context.user.id);
  const jurisdictionCode = context.profile?.jurisdiction ?? "GB-EAW";
  const normalizedJurisdictionCode = jurisdictionCode.trim().toUpperCase();
  const scenarios = await listScenarios(context.supabase, context.user.id, {
    position,
    jurisdictionCode,
  });
  const selectedScenarioIds = Array.from(new Set(parsed.data.selected_scenario_ids));
  const selectedScenarios = scenarios.filter((scenario) => selectedScenarioIds.includes(scenario.id));
  if (selectedScenarios.length !== selectedScenarioIds.length) {
    return badRequest("One or more selected scenarios are invalid");
  }

  const baseline = computeBaseline(position, jurisdictionCode);
  const selectedScenariosAtSendTime = selectedScenarios.map((scenario) => {
    const recomputedResults = computeScenario(position, scenario.config, jurisdictionCode);
    return {
      ...scenario,
      results: recomputedResults,
    };
  });
  const offsettingRiskSummary = selectedScenariosAtSendTime.map((scenario) => ({
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    retirement_income_gap_annual: scenario.results.retirement_income_gap_annual,
    retirement_income_parity_ratio: scenario.results.retirement_income_parity_ratio,
    offsetting_tradeoff_detected: scenario.results.offsetting_tradeoff_detected,
    offsetting_tradeoff_strength: scenario.results.offsetting_tradeoff_strength,
    specialist_advice_recommended: scenario.results.specialist_advice_recommended,
    specialist_advice_reasons: scenario.results.specialist_advice_reasons,
  }));

  const hasOffsettingRisk =
    normalizedJurisdictionCode === "GB-EAW" &&
    offsettingRiskSummary.some((summary) => summary.offsetting_tradeoff_detected || summary.specialist_advice_recommended);
  if (hasOffsettingRisk && !parsed.data.offsetting_risk_acknowledged) {
    return badRequest("Offsetting risk acknowledgement is required before sharing this inquiry");
  }

  const contextSnapshot = {
    snapshot_version: "marketplace_inquiry_v1",
    created_at: new Date().toISOString(),
    jurisdiction: context.profile?.jurisdiction ?? "GB-EAW",
    currency_code: context.profile?.currency_code ?? "GBP",
    has_relevant_agreements: context.profile?.has_relevant_agreements ?? null,
    financial_abuse_acknowledged_at: context.profile?.financial_abuse_acknowledged_at ?? null,
    financial_abuse_ack_version: context.profile?.financial_abuse_ack_version ?? null,
    finished_modelling_confirmed: parsed.data.finished_modelling_confirmed,
    offsetting_risk_acknowledged: parsed.data.offsetting_risk_acknowledged,
    offsetting_risk_summary: offsettingRiskSummary,
    baseline_results: baseline,
    selected_scenario_ids: selectedScenarioIds,
    financial_position: position,
    scenarios: selectedScenariosAtSendTime.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      config: scenario.config,
      results: scenario.results,
      updated_at: scenario.updated_at,
    })),
  };

  const { inquiry, error: inquiryError } = await createInquiry(context.supabase, {
    requesterUserId: context.user.id,
    advisorUserId: profile.user_id,
    profileId: profile.id,
    message: parsed.data.message,
    contextSnapshot,
  });

  if (inquiryError) {
    if (isDuplicatePendingInquiryError(inquiryError)) {
      return NextResponse.json(
        {
          error: "An open inquiry already exists for this advisor",
        },
        { status: 409 }
      );
    }

    return serverError("Unable to create inquiry");
  }

  if (!inquiry) {
    return serverError("Unable to create inquiry");
  }

  await createMarketplaceMessage(context.supabase, {
    inquiryId: inquiry.id,
    senderUserId: context.user.id,
    body: parsed.data.message,
  });

  return NextResponse.json({ inquiry }, { status: 201 });
}

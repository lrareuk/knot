import { NextResponse } from "next/server";
import { z } from "zod";
import { FINANCIAL_ABUSE_ACK_VERSION } from "@/lib/onboarding/safety";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";

const payloadSchema = z.object({
  accepted: z.literal(true),
});

export async function GET() {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  return NextResponse.json({
    acknowledged: Boolean(context.profile?.financial_abuse_acknowledged_at),
    acknowledged_at: context.profile?.financial_abuse_acknowledged_at ?? null,
    ack_version: context.profile?.financial_abuse_ack_version ?? null,
    required_version: FINANCIAL_ABUSE_ACK_VERSION,
  });
}

export async function PUT(req: Request) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid acknowledgement payload");
  }

  const acknowledgedAt = new Date().toISOString();
  const { data, error } = await context.supabase
    .from("users")
    .update({
      financial_abuse_acknowledged_at: acknowledgedAt,
      financial_abuse_ack_version: FINANCIAL_ABUSE_ACK_VERSION,
    })
    .eq("id", context.user.id)
    .select("financial_abuse_acknowledged_at,financial_abuse_ack_version")
    .single();

  if (error || !data) {
    return serverError("Unable to save financial abuse acknowledgement");
  }

  return NextResponse.json({
    ok: true,
    acknowledged: true,
    acknowledged_at: data.financial_abuse_acknowledged_at,
    ack_version: data.financial_abuse_ack_version,
  });
}


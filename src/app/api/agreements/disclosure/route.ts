import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";

const payloadSchema = z.object({
  has_relevant_agreements: z.boolean(),
});

export async function PUT(req: Request) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid disclosure payload");
  }

  const { data, error } = await context.supabase
    .from("users")
    .update({ has_relevant_agreements: parsed.data.has_relevant_agreements })
    .eq("id", context.user.id)
    .select("has_relevant_agreements")
    .single();

  if (error || !data) {
    return serverError("Unable to save agreement disclosure");
  }

  return NextResponse.json({ ok: true, has_relevant_agreements: data.has_relevant_agreements });
}

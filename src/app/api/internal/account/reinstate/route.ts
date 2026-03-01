import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, serverError } from "@/lib/server/api";
import { extractClientIp, reinstatePanicAccount } from "@/lib/server/panic-reinstatement";

const payloadSchema = z.object({
  account_email: z.string().email(),
  sender_email: z.string().email(),
  recovery_key: z.string().min(3),
});

export async function POST(req: Request) {
  const supportToken = process.env.SUPPORT_RECOVERY_API_KEY;
  if (!supportToken) {
    return serverError("Missing support recovery configuration");
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${supportToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid payload");
  }

  const result = await reinstatePanicAccount({
    accountEmail: parsed.data.account_email,
    senderEmail: parsed.data.sender_email,
    recoveryKey: parsed.data.recovery_key,
    requestIp: extractClientIp(req),
    requireSenderMatch: true,
  });

  if (!result.ok) {
    return result.status === 400 ? badRequest(result.error) : serverError(result.error);
  }

  return NextResponse.json({ ok: true, restored_empty: result.restoredEmpty });
}

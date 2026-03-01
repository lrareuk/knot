import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { badRequest, serverError } from "@/lib/server/api";
import { isRecoveryAdminEmail, RECOVERY_MASTER_KEY_COOKIE, verifyRecoveryMasterKey } from "@/lib/server/admin-recovery";
import { extractClientIp, reinstatePanicAccount } from "@/lib/server/panic-reinstatement";
import { supabaseServer } from "@/lib/supabase/server";

const payloadSchema = z.object({
  master_key: z.string().trim().min(6),
  account_email: z.string().email(),
  recovery_key: z.string().min(3),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email?.trim().toLowerCase();
  if (!userEmail || !isRecoveryAdminEmail(userEmail)) {
    return unauthorized();
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

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(RECOVERY_MASTER_KEY_COOKIE)?.value;
  const isMasterKeyValid = verifyRecoveryMasterKey({
    cookieValue,
    adminEmail: userEmail,
    masterKey: parsed.data.master_key,
  });

  if (!isMasterKeyValid) {
    return unauthorized();
  }

  const result = await reinstatePanicAccount({
    accountEmail: parsed.data.account_email,
    senderEmail: userEmail,
    recoveryKey: parsed.data.recovery_key,
    requestIp: extractClientIp(req),
    requireSenderMatch: false,
  });

  if (!result.ok) {
    return result.status === 400 ? badRequest(result.error) : serverError(result.error);
  }

  cookieStore.set(RECOVERY_MASTER_KEY_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/recovery",
    maxAge: 0,
  });

  return NextResponse.json({
    ok: true,
    restored_empty: result.restoredEmpty,
  });
}

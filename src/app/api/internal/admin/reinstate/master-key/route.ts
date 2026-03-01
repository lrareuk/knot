import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverError } from "@/lib/server/api";
import {
  createRecoveryMasterKey,
  createRecoveryMasterKeyCookie,
  isRecoveryAdminEmail,
  RECOVERY_MASTER_KEY_COOKIE,
  sendRecoveryMasterKeyEmail,
} from "@/lib/server/admin-recovery";
import { supabaseServer } from "@/lib/supabase/server";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email?.trim().toLowerCase();
  if (!userEmail || !isRecoveryAdminEmail(userEmail)) {
    return unauthorized();
  }

  const masterKey = createRecoveryMasterKey();
  let cookiePayload: ReturnType<typeof createRecoveryMasterKeyCookie>;

  try {
    cookiePayload = createRecoveryMasterKeyCookie({
      adminEmail: userEmail,
      masterKey,
    });
  } catch {
    return serverError("Missing panic recovery master key configuration");
  }

  try {
    await sendRecoveryMasterKeyEmail({
      adminEmail: userEmail,
      masterKey,
      ttlMinutes: cookiePayload.ttlMinutes,
    });
  } catch {
    return serverError("Unable to send master key email");
  }

  const cookieStore = await cookies();
  cookieStore.set(RECOVERY_MASTER_KEY_COOKIE, cookiePayload.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/recovery",
    maxAge: cookiePayload.ttlMinutes * 60,
  });

  return NextResponse.json({
    ok: true,
    sent_to: userEmail,
    expires_in_minutes: cookiePayload.ttlMinutes,
  });
}

import { NextResponse } from "next/server";
import { requireApiUser, serverError } from "@/lib/server/api";
import { generateRecoveryKey, generateRecoverySalt, hashRecoveryKey } from "@/lib/security/recovery-key";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const context = await requireApiUser();
  if (context.response || !context.user || !context.profile) {
    return context.response;
  }

  const pepper = process.env.RECOVERY_KEY_PEPPER;
  if (!pepper) {
    return serverError("Missing recovery key configuration");
  }

  const recoveryKey = generateRecoveryKey();
  const salt = generateRecoverySalt();
  const keyVersion = (context.profile.recovery_key_version ?? 0) + 1;
  const keyHash = hashRecoveryKey({
    recoveryKey,
    salt,
    pepper,
  });

  const admin = supabaseAdmin();

  const { error: secretError } = await admin.rpc("set_recovery_secret", {
    p_user_id: context.user.id,
    p_key_hash: keyHash,
    p_key_salt: salt,
    p_key_version: keyVersion,
  });

  if (secretError) {
    return serverError("Unable to generate recovery key");
  }

  const { error: profileError } = await admin
    .from("users")
    .update({
      recovery_key_required: false,
      recovery_key_generated_at: new Date().toISOString(),
      recovery_key_version: keyVersion,
    })
    .eq("id", context.user.id);

  if (profileError) {
    return serverError("Unable to save recovery key");
  }

  return NextResponse.json({
    recovery_key: recoveryKey,
    key_version: keyVersion,
  });
}

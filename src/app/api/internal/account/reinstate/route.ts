import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, serverError } from "@/lib/server/api";
import { verifyRecoveryKey } from "@/lib/security/recovery-key";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RecoverySecretRow = {
  key_hash: string;
  key_salt: string;
  key_version: number;
};

type SnapshotRow = {
  snapshot_id: string;
  expires_at: string;
  restored_at: string | null;
};

const payloadSchema = z.object({
  account_email: z.string().email(),
  sender_email: z.string().email(),
  recovery_key: z.string().min(3),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function randomResetPassword() {
  return `${randomBytes(24).toString("base64url")}A1!`;
}

function extractClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) {
    return null;
  }

  const firstIp = forwarded.split(",")[0]?.trim();
  return firstIp || null;
}

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) {
    const row = data[0];
    if (row && typeof row === "object") {
      return row as T;
    }
    return null;
  }

  if (data && typeof data === "object") {
    return data as T;
  }

  return null;
}

async function logAudit(input: {
  admin: ReturnType<typeof supabaseAdmin>;
  userId: string | null;
  action: string;
  outcome: string;
  reason: string | null;
  actorEmail: string | null;
  requestIp: string | null;
  metadata: Record<string, unknown>;
}) {
  await input.admin.rpc("insert_recovery_audit", {
    p_user_id: input.userId,
    p_action: input.action,
    p_outcome: input.outcome,
    p_reason: input.reason,
    p_actor_email: input.actorEmail,
    p_request_ip: input.requestIp,
    p_metadata: input.metadata,
  });
}

export async function POST(req: Request) {
  const supportToken = process.env.SUPPORT_RECOVERY_API_KEY;
  if (!supportToken) {
    return serverError("Missing support recovery configuration");
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${supportToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recoveryPepper = process.env.RECOVERY_KEY_PEPPER;
  if (!recoveryPepper) {
    return serverError("Missing recovery key configuration");
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

  const accountEmail = normalizeEmail(parsed.data.account_email);
  const senderEmail = normalizeEmail(parsed.data.sender_email);

  if (accountEmail !== senderEmail) {
    return badRequest("Email sender must match account email");
  }

  const admin = supabaseAdmin();
  const requestIp = extractClientIp(req);

  const { data: userProfile, error: userError } = await admin
    .from("users")
    .select("id,email,account_state")
    .ilike("email", accountEmail)
    .limit(1)
    .maybeSingle<{ id: string; email: string; account_state: "active" | "panic_hidden" }>();

  if (userError || !userProfile) {
    await logAudit({
      admin,
      userId: null,
      action: "reinstate",
      outcome: "failed",
      reason: "account_not_found",
      actorEmail: senderEmail,
      requestIp,
      metadata: { account_email: accountEmail },
    });
    return badRequest("Account could not be verified");
  }

  if (userProfile.account_state !== "panic_hidden") {
    await logAudit({
      admin,
      userId: userProfile.id,
      action: "reinstate",
      outcome: "failed",
      reason: "not_in_panic_mode",
      actorEmail: senderEmail,
      requestIp,
      metadata: { account_email: accountEmail },
    });
    return badRequest("Account could not be verified");
  }

  const { data: secretData, error: secretError } = await admin.rpc("get_recovery_secret", {
    p_user_id: userProfile.id,
  });

  const secretRow = firstRow<RecoverySecretRow>(secretData);
  if (secretError || !secretRow) {
    await logAudit({
      admin,
      userId: userProfile.id,
      action: "reinstate",
      outcome: "failed",
      reason: "missing_recovery_secret",
      actorEmail: senderEmail,
      requestIp,
      metadata: { account_email: accountEmail },
    });
    return badRequest("Account could not be verified");
  }

  const validRecoveryKey = verifyRecoveryKey({
    providedKey: parsed.data.recovery_key,
    salt: secretRow.key_salt,
    pepper: recoveryPepper,
    expectedHash: secretRow.key_hash,
  });

  if (!validRecoveryKey) {
    await logAudit({
      admin,
      userId: userProfile.id,
      action: "reinstate",
      outcome: "failed",
      reason: "invalid_recovery_key",
      actorEmail: senderEmail,
      requestIp,
      metadata: { account_email: accountEmail },
    });
    return badRequest("Account could not be verified");
  }

  const { data: snapshotData } = await admin.rpc("get_latest_recovery_snapshot", {
    p_user_id: userProfile.id,
  });

  const snapshotRow = firstRow<SnapshotRow>(snapshotData);
  const snapshotExpiry = snapshotRow?.expires_at ? new Date(snapshotRow.expires_at).getTime() : null;
  const hasValidSnapshot =
    Boolean(snapshotRow?.snapshot_id) &&
    snapshotExpiry !== null &&
    !snapshotRow?.restored_at &&
    snapshotExpiry > Date.now();

  const restoreEmpty = !hasValidSnapshot;

  const { error: restoreError } = await admin.rpc("restore_panic_account", {
    p_user_id: userProfile.id,
    p_snapshot_id: hasValidSnapshot ? snapshotRow?.snapshot_id : null,
    p_restore_empty: restoreEmpty,
  });

  if (restoreError) {
    await logAudit({
      admin,
      userId: userProfile.id,
      action: "reinstate",
      outcome: "failed",
      reason: "restore_failed",
      actorEmail: senderEmail,
      requestIp,
      metadata: { account_email: accountEmail, restore_empty: restoreEmpty },
    });
    return serverError("Unable to reinstate account");
  }

  const tempPassword = randomResetPassword();
  const { error: unbanError } = await admin.auth.admin.updateUserById(userProfile.id, {
    ban_duration: "none",
    password: tempPassword,
  });

  if (unbanError) {
    await logAudit({
      admin,
      userId: userProfile.id,
      action: "reinstate",
      outcome: "failed",
      reason: "auth_update_failed",
      actorEmail: senderEmail,
      requestIp,
      metadata: { account_email: accountEmail, restore_empty: restoreEmpty },
    });
    return serverError("Unable to reinstate account");
  }

  const { error: resetError } = await admin.auth.resetPasswordForEmail(accountEmail);
  if (resetError) {
    await logAudit({
      admin,
      userId: userProfile.id,
      action: "reinstate",
      outcome: "failed",
      reason: "reset_email_failed",
      actorEmail: senderEmail,
      requestIp,
      metadata: { account_email: accountEmail, restore_empty: restoreEmpty },
    });
    return serverError("Unable to reinstate account");
  }

  await logAudit({
    admin,
    userId: userProfile.id,
    action: "reinstate",
    outcome: "success",
    reason: restoreEmpty ? "restored_empty" : "restored_snapshot",
    actorEmail: senderEmail,
    requestIp,
    metadata: { account_email: accountEmail, restore_empty: restoreEmpty },
  });

  return NextResponse.json({ ok: true, restored_empty: restoreEmpty });
}

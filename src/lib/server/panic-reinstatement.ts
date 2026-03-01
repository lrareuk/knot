import { randomBytes } from "node:crypto";
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

type ReinstatementInput = {
  accountEmail: string;
  senderEmail: string;
  recoveryKey: string;
  requestIp: string | null;
  requireSenderMatch: boolean;
};

type ReinstatementSuccess = {
  ok: true;
  restoredEmpty: boolean;
};

type ReinstatementFailure = {
  ok: false;
  status: 400 | 500;
  error: string;
};

export type ReinstatementResult = ReinstatementSuccess | ReinstatementFailure;

function randomResetPassword() {
  return `${randomBytes(24).toString("base64url")}A1!`;
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

export function extractClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) {
    return null;
  }

  const firstIp = forwarded.split(",")[0]?.trim();
  return firstIp || null;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

export async function reinstatePanicAccount(input: ReinstatementInput): Promise<ReinstatementResult> {
  const recoveryPepper = process.env.RECOVERY_KEY_PEPPER;
  if (!recoveryPepper) {
    return { ok: false, status: 500, error: "Missing recovery key configuration" };
  }

  const accountEmail = normalizeEmail(input.accountEmail);
  const senderEmail = normalizeEmail(input.senderEmail);

  if (input.requireSenderMatch && accountEmail !== senderEmail) {
    return { ok: false, status: 400, error: "Email sender must match account email" };
  }

  const admin = supabaseAdmin();

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
      requestIp: input.requestIp,
      metadata: { account_email: accountEmail },
    });
    return { ok: false, status: 400, error: "Account could not be verified" };
  }

  if (userProfile.account_state !== "panic_hidden") {
    await logAudit({
      admin,
      userId: userProfile.id,
      action: "reinstate",
      outcome: "failed",
      reason: "not_in_panic_mode",
      actorEmail: senderEmail,
      requestIp: input.requestIp,
      metadata: { account_email: accountEmail },
    });
    return { ok: false, status: 400, error: "Account could not be verified" };
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
      requestIp: input.requestIp,
      metadata: { account_email: accountEmail },
    });
    return { ok: false, status: 400, error: "Account could not be verified" };
  }

  const validRecoveryKey = verifyRecoveryKey({
    providedKey: input.recoveryKey,
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
      requestIp: input.requestIp,
      metadata: { account_email: accountEmail },
    });
    return { ok: false, status: 400, error: "Account could not be verified" };
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
      requestIp: input.requestIp,
      metadata: { account_email: accountEmail, restore_empty: restoreEmpty },
    });
    return { ok: false, status: 500, error: "Unable to reinstate account" };
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
      requestIp: input.requestIp,
      metadata: { account_email: accountEmail, restore_empty: restoreEmpty },
    });
    return { ok: false, status: 500, error: "Unable to reinstate account" };
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
      requestIp: input.requestIp,
      metadata: { account_email: accountEmail, restore_empty: restoreEmpty },
    });
    return { ok: false, status: 500, error: "Unable to reinstate account" };
  }

  await logAudit({
    admin,
    userId: userProfile.id,
    action: "reinstate",
    outcome: "success",
    reason: restoreEmpty ? "restored_empty" : "restored_snapshot",
    actorEmail: senderEmail,
    requestIp: input.requestIp,
    metadata: { account_email: accountEmail, restore_empty: restoreEmpty },
  });

  return { ok: true, restoredEmpty: restoreEmpty };
}

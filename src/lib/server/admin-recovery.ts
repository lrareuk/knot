import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

const DEFAULT_RECOVERY_ADMIN_EMAIL = "alex@lrare.co.uk";
const DEFAULT_MASTER_KEY_TTL_MINUTES = 10;

export const RECOVERY_MASTER_KEY_COOKIE = "panic_recovery_master_key";
export const RECOVERY_MASTER_KEY_COOKIE_PATH = "/api/internal/admin/reinstate";

type MasterKeyCookiePayload = {
  admin_email: string;
  key_hash: string;
  expires_at: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseAdminEmailAllowlist() {
  const raw = process.env.PANIC_RECOVERY_ADMIN_EMAILS ?? DEFAULT_RECOVERY_ADMIN_EMAIL;
  return raw
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

function hashMasterKey(masterKey: string, secret: string) {
  return createHash("sha256").update(`${secret}:${masterKey}`).digest("hex");
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getMasterKeySecret() {
  return process.env.PANIC_RECOVERY_MASTER_KEY_SECRET ?? process.env.SUPPORT_RECOVERY_API_KEY ?? "";
}

export function isRecoveryAdminEmail(email: string) {
  const normalized = normalizeEmail(email);
  return parseAdminEmailAllowlist().includes(normalized);
}

export function createRecoveryMasterKey() {
  const min = 100000;
  const max = 999999;
  return String(randomInt(min, max + 1));
}

export function createRecoveryMasterKeyCookie(input: { adminEmail: string; masterKey: string; now?: number; ttlMinutes?: number }) {
  const secret = getMasterKeySecret();
  if (!secret) {
    throw new Error("Missing panic recovery master key secret");
  }

  const ttlMinutes = input.ttlMinutes ?? DEFAULT_MASTER_KEY_TTL_MINUTES;
  const now = input.now ?? Date.now();
  const expiresAt = now + ttlMinutes * 60 * 1000;
  const payload: MasterKeyCookiePayload = {
    admin_email: normalizeEmail(input.adminEmail),
    key_hash: hashMasterKey(input.masterKey, secret),
    expires_at: expiresAt,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return {
    value: `${encodedPayload}.${signature}`,
    expiresAt,
    ttlMinutes,
  };
}

export function verifyRecoveryMasterKey(input: {
  cookieValue: string | null | undefined;
  adminEmail: string;
  masterKey: string;
  now?: number;
}) {
  const secret = getMasterKeySecret();
  if (!secret || !input.cookieValue) {
    return false;
  }

  const [encodedPayload, signature] = input.cookieValue.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  if (!secureEquals(signature, expectedSignature)) {
    return false;
  }

  let payload: MasterKeyCookiePayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as MasterKeyCookiePayload;
  } catch {
    return false;
  }

  const now = input.now ?? Date.now();
  if (!payload.expires_at || payload.expires_at <= now) {
    return false;
  }

  if (!payload.admin_email || normalizeEmail(payload.admin_email) !== normalizeEmail(input.adminEmail)) {
    return false;
  }

  const expectedHash = hashMasterKey(input.masterKey, secret);
  return secureEquals(payload.key_hash, expectedHash);
}

export async function sendRecoveryMasterKeyEmail(input: { adminEmail: string; masterKey: string; ttlMinutes?: number }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const sender = process.env.SUPPORT_FROM_EMAIL ?? "support@untie.lrare.co.uk";
  const ttlMinutes = input.ttlMinutes ?? DEFAULT_MASTER_KEY_TTL_MINUTES;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [input.adminEmail],
      subject: "Untie panic recovery master key",
      text: `Your one-time panic recovery master key is ${input.masterKey}. It expires in ${ttlMinutes} minutes.`,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send panic recovery master key email");
  }
}

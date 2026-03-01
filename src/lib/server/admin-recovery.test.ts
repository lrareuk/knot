import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createRecoveryMasterKeyCookie,
  isRecoveryAdminEmail,
  verifyRecoveryMasterKey,
} from "@/lib/server/admin-recovery";

const originalAdminEmails = process.env.PANIC_RECOVERY_ADMIN_EMAILS;
const originalMasterKeySecret = process.env.PANIC_RECOVERY_MASTER_KEY_SECRET;
const originalSupportToken = process.env.SUPPORT_RECOVERY_API_KEY;

describe("admin recovery helpers", () => {
  beforeEach(() => {
    process.env.PANIC_RECOVERY_MASTER_KEY_SECRET = "master-secret";
    process.env.PANIC_RECOVERY_ADMIN_EMAILS = "alex@lrare.co.uk,ops@example.com";
    process.env.SUPPORT_RECOVERY_API_KEY = "support-token";
  });

  afterEach(() => {
    process.env.PANIC_RECOVERY_ADMIN_EMAILS = originalAdminEmails;
    process.env.PANIC_RECOVERY_MASTER_KEY_SECRET = originalMasterKeySecret;
    process.env.SUPPORT_RECOVERY_API_KEY = originalSupportToken;
  });

  it("matches admin emails from allowlist", () => {
    expect(isRecoveryAdminEmail("alex@lrare.co.uk")).toBe(true);
    expect(isRecoveryAdminEmail("OPS@example.com")).toBe(true);
    expect(isRecoveryAdminEmail("user@example.com")).toBe(false);
  });

  it("verifies a valid cookie and master key pair", () => {
    const now = Date.now();
    const { value } = createRecoveryMasterKeyCookie({
      adminEmail: "alex@lrare.co.uk",
      masterKey: "123456",
      now,
      ttlMinutes: 10,
    });

    expect(
      verifyRecoveryMasterKey({
        cookieValue: value,
        adminEmail: "alex@lrare.co.uk",
        masterKey: "123456",
        now: now + 30_000,
      })
    ).toBe(true);
  });

  it("rejects invalid master keys and expired cookies", () => {
    const now = Date.now();
    const { value } = createRecoveryMasterKeyCookie({
      adminEmail: "alex@lrare.co.uk",
      masterKey: "123456",
      now,
      ttlMinutes: 10,
    });

    expect(
      verifyRecoveryMasterKey({
        cookieValue: value,
        adminEmail: "alex@lrare.co.uk",
        masterKey: "654321",
        now: now + 10_000,
      })
    ).toBe(false);

    expect(
      verifyRecoveryMasterKey({
        cookieValue: value,
        adminEmail: "alex@lrare.co.uk",
        masterKey: "123456",
        now: now + 15 * 60_000,
      })
    ).toBe(false);
  });
});

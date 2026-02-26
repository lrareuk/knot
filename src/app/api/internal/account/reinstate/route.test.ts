import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashRecoveryKey } from "@/lib/security/recovery-key";

const { mockSupabaseAdmin } = vi.hoisted(() => ({
  mockSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

import { POST } from "@/app/api/internal/account/reinstate/route";

describe("POST /api/internal/account/reinstate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPPORT_RECOVERY_API_KEY = "support-token";
    process.env.RECOVERY_KEY_PEPPER = "pepper-value";
  });

  it("reinstates a hidden account when recovery key and sender email match", async () => {
    const salt = "salt-value";
    const recoveryKey = "cedar wave stone";
    const keyHash = hashRecoveryKey({
      recoveryKey,
      salt,
      pepper: "pepper-value",
    });

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "user-1",
        email: "user@example.com",
        account_state: "panic_hidden",
      },
      error: null,
    });
    const limit = vi.fn().mockReturnValue({ maybeSingle });
    const ilike = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ ilike });
    const from = vi.fn().mockReturnValue({ select });

    const rpc = vi.fn(async (fn: string) => {
      if (fn === "get_recovery_secret") {
        return {
          data: [{ key_hash: keyHash, key_salt: salt, key_version: 1 }],
          error: null,
        };
      }

      if (fn === "get_latest_recovery_snapshot") {
        return {
          data: [
            {
              snapshot_id: "snapshot-1",
              expires_at: new Date(Date.now() + 60_000).toISOString(),
              restored_at: null,
            },
          ],
          error: null,
        };
      }

      return { data: null, error: null };
    });

    const updateUserById = vi.fn().mockResolvedValue({ error: null });
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });

    mockSupabaseAdmin.mockReturnValue({
      from,
      rpc,
      auth: {
        admin: {
          updateUserById,
        },
        resetPasswordForEmail,
      },
    });

    const response = await POST(
      new Request("http://localhost/api/internal/account/reinstate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer support-token",
        },
        body: JSON.stringify({
          account_email: "user@example.com",
          sender_email: "user@example.com",
          recovery_key: recoveryKey,
        }),
      })
    );

    const payload = (await response.json()) as { ok?: boolean; restored_empty?: boolean };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.restored_empty).toBe(false);

    expect(updateUserById).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        ban_duration: "none",
      })
    );
    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com");
  });

  it("rejects mismatched sender and account emails", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/account/reinstate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer support-token",
        },
        body: JSON.stringify({
          account_email: "user@example.com",
          sender_email: "someone-else@example.com",
          recovery_key: "cedar wave stone",
        }),
      })
    );

    expect(response.status).toBe(400);
  });
});

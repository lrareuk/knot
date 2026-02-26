import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser, mockSupabaseAdmin, mockGenerateRecoveryKey, mockGenerateRecoverySalt, mockHashRecoveryKey } = vi.hoisted(
  () => ({
    mockRequireApiUser: vi.fn(),
    mockSupabaseAdmin: vi.fn(),
    mockGenerateRecoveryKey: vi.fn(),
    mockGenerateRecoverySalt: vi.fn(),
    mockHashRecoveryKey: vi.fn(),
  })
);

vi.mock("@/lib/server/api", () => ({
  requireApiUser: mockRequireApiUser,
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

vi.mock("@/lib/security/recovery-key", () => ({
  generateRecoveryKey: mockGenerateRecoveryKey,
  generateRecoverySalt: mockGenerateRecoverySalt,
  hashRecoveryKey: mockHashRecoveryKey,
}));

import { POST } from "@/app/api/account/recovery-key/route";

describe("POST /api/account/recovery-key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RECOVERY_KEY_PEPPER = "pepper-value";
  });

  it("generates and stores a rotated recovery key", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });

    mockSupabaseAdmin.mockReturnValue({ rpc, from });
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: {
        account_state: "active",
        recovery_key_version: 2,
      },
    });

    mockGenerateRecoveryKey.mockReturnValue("cedar wave stone");
    mockGenerateRecoverySalt.mockReturnValue("salt-value");
    mockHashRecoveryKey.mockReturnValue("hashed-value");

    const response = await POST();
    const payload = (await response.json()) as { recovery_key?: string; key_version?: number };

    expect(response.status).toBe(200);
    expect(payload.recovery_key).toBe("cedar wave stone");
    expect(payload.key_version).toBe(3);

    expect(rpc).toHaveBeenCalledWith("set_recovery_secret", {
      p_user_id: "user-1",
      p_key_hash: "hashed-value",
      p_key_salt: "salt-value",
      p_key_version: 3,
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        recovery_key_required: false,
        recovery_key_version: 3,
      })
    );
  });
});

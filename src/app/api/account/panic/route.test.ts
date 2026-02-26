import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser, mockSupabaseAdmin } = vi.hoisted(() => ({
  mockRequireApiUser: vi.fn(),
  mockSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requireApiUser: mockRequireApiUser,
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

import { POST } from "@/app/api/account/panic/route";

describe("POST /api/account/panic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RECOVERY_SNAPSHOT_RETENTION_DAYS = "30";
  });

  it("activates panic mode, removes reports, and bans the user", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ snapshot_id: "snapshot-1", report_paths: ["reports/user-1/a.pdf", "reports/user-1/b.pdf"] }],
      error: null,
    });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const storageFrom = vi.fn().mockReturnValue({ remove });
    const updateUserById = vi.fn().mockResolvedValue({ error: null });

    mockSupabaseAdmin.mockReturnValue({
      rpc,
      storage: {
        from: storageFrom,
      },
      auth: {
        admin: {
          updateUserById,
        },
      },
    });

    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: { account_state: "active" },
    });

    const response = await POST();
    const payload = (await response.json()) as { ok?: boolean };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);

    expect(rpc).toHaveBeenCalledWith(
      "activate_panic_mode",
      expect.objectContaining({
        p_user_id: "user-1",
      })
    );
    expect(storageFrom).toHaveBeenCalledWith("reports");
    expect(remove).toHaveBeenCalledWith(["reports/user-1/a.pdf", "reports/user-1/b.pdf"]);
    expect(updateUserById).toHaveBeenCalledWith("user-1", {
      ban_duration: "876000h",
    });
  });

  it("returns unauthorized when account is not active", async () => {
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: { account_state: "panic_hidden" },
    });

    const response = await POST();
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });
});

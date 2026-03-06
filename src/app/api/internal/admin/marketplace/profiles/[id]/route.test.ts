import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockSupabaseServer,
  mockIsMarketplaceAdminEmail,
  mockAdminPatchMarketplaceProfile,
  mockSupabaseAdmin,
} = vi.hoisted(() => ({
  mockSupabaseServer: vi.fn(),
  mockIsMarketplaceAdminEmail: vi.fn(),
  mockAdminPatchMarketplaceProfile: vi.fn(),
  mockSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  badRequest: (message: string) => new Response(JSON.stringify({ error: message }), { status: 400 }),
  unauthorized: (message?: string) => new Response(JSON.stringify({ error: message ?? "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: mockSupabaseServer,
}));

vi.mock("@/lib/server/marketplace-admin", () => ({
  isMarketplaceAdminEmail: mockIsMarketplaceAdminEmail,
}));

vi.mock("@/lib/server/marketplace-profiles", () => ({
  adminPatchMarketplaceProfile: mockAdminPatchMarketplaceProfile,
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

import { PATCH } from "@/app/api/internal/admin/marketplace/profiles/[id]/route";

describe("PATCH /api/internal/admin/marketplace/profiles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseServer.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "admin@example.com",
            },
          },
        }),
      },
    });
    mockSupabaseAdmin.mockReturnValue({});
    mockIsMarketplaceAdminEmail.mockReturnValue(true);
  });

  it("updates profile moderation state", async () => {
    mockAdminPatchMarketplaceProfile.mockResolvedValue({ profile: { id: "profile-1", is_visible: true }, error: null });

    const response = await PATCH(
      new Request("http://localhost/api/internal/admin/marketplace/profiles/profile-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: "verified", is_visible: true }),
      }),
      { params: Promise.resolve({ id: "profile-1" }) }
    );

    expect(response.status).toBe(200);
  });

  it("rejects non-admin", async () => {
    mockIsMarketplaceAdminEmail.mockReturnValue(false);

    const response = await PATCH(
      new Request("http://localhost/api/internal/admin/marketplace/profiles/profile-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: "verified" }),
      }),
      { params: Promise.resolve({ id: "profile-1" }) }
    );

    expect(response.status).toBe(401);
  });
});

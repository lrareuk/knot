import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireActiveApiUser,
  mockGetOwnMarketplaceProfile,
  mockCreateOwnMarketplaceProfile,
  mockPatchOwnMarketplaceProfile,
} = vi.hoisted(() => ({
  mockRequireActiveApiUser: vi.fn(),
  mockGetOwnMarketplaceProfile: vi.fn(),
  mockCreateOwnMarketplaceProfile: vi.fn(),
  mockPatchOwnMarketplaceProfile: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requireActiveApiUser: mockRequireActiveApiUser,
  badRequest: (message: string) => new Response(JSON.stringify({ error: message }), { status: 400 }),
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

vi.mock("@/lib/server/marketplace-profiles", () => ({
  getOwnMarketplaceProfile: mockGetOwnMarketplaceProfile,
  createOwnMarketplaceProfile: mockCreateOwnMarketplaceProfile,
  patchOwnMarketplaceProfile: mockPatchOwnMarketplaceProfile,
}));

import { GET, PATCH, POST } from "@/app/api/marketplace/advisor/profile/route";

describe("/api/marketplace/advisor/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireActiveApiUser.mockResolvedValue({ response: null, user: { id: "advisor-1" }, supabase: {} });
  });

  it("gets own profile", async () => {
    mockGetOwnMarketplaceProfile.mockResolvedValue({
      profile: { id: "profile-1" },
      error: null,
    });

    const response = await GET();
    const payload = (await response.json()) as { profile?: { id: string } };

    expect(response.status).toBe(200);
    expect(payload.profile?.id).toBe("profile-1");
  });

  it("creates profile", async () => {
    mockGetOwnMarketplaceProfile.mockResolvedValue({ profile: null, error: null });
    mockCreateOwnMarketplaceProfile.mockResolvedValue({ profile: { id: "profile-1" }, error: null });

    const response = await POST(
      new Request("http://localhost/api/marketplace/advisor/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional_type: "solicitor",
          display_name: "Ada Smith",
          jurisdiction_codes: ["GB-EAW"],
          specialisms: ["family law"],
          service_modes: ["remote"],
          languages: ["en"],
          currency_code: "GBP",
          is_accepting_new_clients: true,
        }),
      })
    );

    expect(response.status).toBe(201);
  });

  it("patches profile", async () => {
    mockPatchOwnMarketplaceProfile.mockResolvedValue({ profile: { id: "profile-1", headline: "Updated" }, error: null });

    const response = await PATCH(
      new Request("http://localhost/api/marketplace/advisor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline: "Updated" }),
      })
    );

    expect(response.status).toBe(200);
  });
});

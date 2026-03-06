import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequirePaidApiUser,
  mockListRequesterInquiries,
  mockGetMarketplaceProfileById,
  mockCreateInquiry,
  mockCreateMarketplaceMessage,
  mockGetOrCreateFinancialPosition,
  mockListScenarios,
} = vi.hoisted(() => ({
  mockRequirePaidApiUser: vi.fn(),
  mockListRequesterInquiries: vi.fn(),
  mockGetMarketplaceProfileById: vi.fn(),
  mockCreateInquiry: vi.fn(),
  mockCreateMarketplaceMessage: vi.fn(),
  mockGetOrCreateFinancialPosition: vi.fn(),
  mockListScenarios: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requirePaidApiUser: mockRequirePaidApiUser,
  badRequest: (message: string) => new Response(JSON.stringify({ error: message }), { status: 400 }),
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

vi.mock("@/lib/server/marketplace-inquiries", () => ({
  listRequesterInquiries: mockListRequesterInquiries,
  createInquiry: mockCreateInquiry,
}));

vi.mock("@/lib/server/marketplace-profiles", () => ({
  getMarketplaceProfileById: mockGetMarketplaceProfileById,
}));

vi.mock("@/lib/server/marketplace-messages", () => ({
  createMarketplaceMessage: mockCreateMarketplaceMessage,
}));

vi.mock("@/lib/server/financial-position", () => ({
  getOrCreateFinancialPosition: mockGetOrCreateFinancialPosition,
}));

vi.mock("@/lib/server/scenarios", () => ({
  listScenarios: mockListScenarios,
}));

import { GET, POST } from "@/app/api/marketplace/inquiries/route";

describe("/api/marketplace/inquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePaidApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: {
        jurisdiction: "GB-EAW",
        currency_code: "GBP",
        has_relevant_agreements: true,
        financial_abuse_acknowledged_at: "2026-03-06T00:00:00.000Z",
        financial_abuse_ack_version: "2026-03-06",
      },
      supabase: {},
    });
    mockGetOrCreateFinancialPosition.mockResolvedValue({ properties: [], pensions: [] });
    mockListScenarios.mockResolvedValue([
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Scenario A",
        config: {},
        results: { model_version: "v2_jurisdiction_pensions" },
        updated_at: "2026-03-06T00:00:00.000Z",
      },
    ]);
  });

  it("lists requester inquiries", async () => {
    mockListRequesterInquiries.mockResolvedValue({
      inquiries: [{ id: "inq-1", status: "pending" }],
      error: null,
    });

    const response = await GET();
    const payload = (await response.json()) as { inquiries?: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(payload.inquiries?.[0]?.id).toBe("inq-1");
  });

  it("creates inquiry and first message", async () => {
    mockGetMarketplaceProfileById.mockResolvedValue({
      profile: {
        id: "profile-1",
        user_id: "advisor-1",
        is_visible: true,
        verification_status: "verified",
        is_accepting_new_clients: true,
      },
      error: null,
    });

    mockCreateInquiry.mockResolvedValue({
      inquiry: { id: "inq-1" },
      error: null,
    });

    mockCreateMarketplaceMessage.mockResolvedValue({ message: { id: "msg-1" }, error: null });

    const response = await POST(
      new Request("http://localhost/api/marketplace/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: "11111111-1111-4111-8111-111111111111",
          message: "This is a valid inquiry message with enough detail.",
          selected_scenario_ids: ["11111111-1111-4111-8111-111111111111"],
          finished_modelling_confirmed: true,
        }),
      })
    );

    const payload = (await response.json()) as { inquiry?: { id: string } };

    expect(response.status).toBe(201);
    expect(payload.inquiry?.id).toBe("inq-1");
    expect(mockCreateMarketplaceMessage).toHaveBeenCalled();
    expect(mockCreateInquiry).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        contextSnapshot: expect.objectContaining({
          snapshot_version: "marketplace_inquiry_v1",
          selected_scenario_ids: ["11111111-1111-4111-8111-111111111111"],
        }),
      })
    );
  });

  it("returns 400 for invalid inquiry payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/marketplace/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: "bad-id",
          message: "short",
        }),
      })
    );

    const payload = (await response.json()) as { error?: string };
    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid inquiry payload");
  });

  it("returns 400 for unknown scenario ids", async () => {
    const response = await POST(
      new Request("http://localhost/api/marketplace/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: "11111111-1111-4111-8111-111111111111",
          message: "This is a valid inquiry message with enough detail.",
          selected_scenario_ids: ["22222222-2222-4222-8222-222222222222"],
          finished_modelling_confirmed: true,
        }),
      })
    );

    const payload = (await response.json()) as { error?: string };
    expect(response.status).toBe(400);
    expect(payload.error).toBe("One or more selected scenarios are invalid");
  });
});

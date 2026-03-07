import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequirePaidApiUser } = vi.hoisted(() => ({
  mockRequirePaidApiUser: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requirePaidApiUser: mockRequirePaidApiUser,
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

import { PATCH } from "@/app/api/scenarios/[id]/route";

describe("PATCH /api/scenarios/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid JSON payloads", async () => {
    mockRequirePaidApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: { jurisdiction: "GB-EAW" },
      supabase: {},
    });

    const response = await PATCH(
      new Request("http://localhost/api/scenarios/scenario-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: "not-json",
      }),
      { params: Promise.resolve({ id: "scenario-1" }) }
    );

    const payload = (await response.json()) as { error?: string };
    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid payload");
  });

  it("returns guard response when payment is required", async () => {
    const guardResponse = new Response(JSON.stringify({ error: "Payment required" }), { status: 402 });
    mockRequirePaidApiUser.mockResolvedValue({
      response: guardResponse,
      user: null,
      profile: null,
      supabase: null,
    });

    const response = await PATCH(
      new Request("http://localhost/api/scenarios/scenario-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Scenario X" }),
      }),
      { params: Promise.resolve({ id: "scenario-1" }) }
    );

    expect(response.status).toBe(402);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser } = vi.hoisted(() => ({
  mockRequireApiUser: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requireApiUser: mockRequireApiUser,
  badRequest: (message: string) => new Response(JSON.stringify({ error: message }), { status: 400 }),
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

import { GET, PUT } from "@/app/api/onboarding/safety/acknowledgement/route";
import { FINANCIAL_ABUSE_ACK_VERSION } from "@/lib/onboarding/safety";

function createSupabaseMock() {
  const single = vi.fn().mockResolvedValue({
    data: {
      financial_abuse_acknowledged_at: "2026-03-06T11:00:00.000Z",
      financial_abuse_ack_version: FINANCIAL_ABUSE_ACK_VERSION,
    },
    error: null,
  });
  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });

  return { supabase: { from }, update };
}

describe("PUT /api/onboarding/safety/acknowledgement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns acknowledgement state from profile", async () => {
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: {
        financial_abuse_acknowledged_at: "2026-03-06T11:00:00.000Z",
        financial_abuse_ack_version: FINANCIAL_ABUSE_ACK_VERSION,
      },
      supabase: {},
    });

    const response = await GET();
    const payload = (await response.json()) as { acknowledged?: boolean; required_version?: string };

    expect(response.status).toBe(200);
    expect(payload.acknowledged).toBe(true);
    expect(payload.required_version).toBe(FINANCIAL_ABUSE_ACK_VERSION);
  });

  it("saves acknowledgement state", async () => {
    const { supabase, update } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: {},
      supabase,
    });

    const response = await PUT(
      new Request("http://localhost/api/onboarding/safety/acknowledgement", {
        method: "PUT",
        body: JSON.stringify({ accepted: true }),
      })
    );
    const payload = (await response.json()) as { ok?: boolean; acknowledged?: boolean; ack_version?: string };

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        financial_abuse_ack_version: FINANCIAL_ABUSE_ACK_VERSION,
      })
    );
    expect(payload.ok).toBe(true);
    expect(payload.acknowledged).toBe(true);
    expect(payload.ack_version).toBe(FINANCIAL_ABUSE_ACK_VERSION);
  });

  it("rejects invalid payload", async () => {
    const { supabase } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: {},
      supabase,
    });

    const response = await PUT(
      new Request("http://localhost/api/onboarding/safety/acknowledgement", {
        method: "PUT",
        body: JSON.stringify({ accepted: false }),
      })
    );

    expect(response.status).toBe(400);
  });
});


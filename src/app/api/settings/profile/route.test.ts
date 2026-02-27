import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser } = vi.hoisted(() => ({
  mockRequireApiUser: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requireApiUser: mockRequireApiUser,
  badRequest: (message: string) => new Response(JSON.stringify({ error: message }), { status: 400 }),
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

import { PATCH } from "@/app/api/settings/profile/route";

function createSupabaseMock() {
  const single = vi.fn().mockResolvedValue({
    data: {
      id: "user-1",
      email: "alex@example.com",
      first_name: "Alex",
      jurisdiction: "GB-SCT",
      currency_code: "GBP",
      currency_overridden: false,
      has_relevant_agreements: null,
    },
    error: null,
  });
  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });

  return { supabase: { from }, update };
}

describe("PATCH /api/settings/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates first name and returns profile", async () => {
    const { supabase, update } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: {
        id: "user-1",
        jurisdiction: "GB-SCT",
        currency_code: "GBP",
        currency_overridden: false,
      },
      supabase,
    });

    const response = await PATCH(
      new Request("http://localhost/api/settings/profile", {
        method: "PATCH",
        body: JSON.stringify({ first_name: "  Alex  " }),
      })
    );
    const payload = (await response.json()) as { profile?: { first_name: string } };

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      first_name: "Alex",
      jurisdiction: "GB-SCT",
      currency_overridden: false,
      currency_code: "GBP",
    });
    expect(payload.profile?.first_name).toBe("Alex");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser } = vi.hoisted(() => ({
  mockRequireApiUser: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requireApiUser: mockRequireApiUser,
  badRequest: (message: string) => new Response(JSON.stringify({ error: message }), { status: 400 }),
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

import { PUT } from "@/app/api/agreements/disclosure/route";

function createSupabaseMock(disclosure: boolean) {
  const single = vi.fn().mockResolvedValue({
    data: { has_relevant_agreements: disclosure },
    error: null,
  });
  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });

  return { supabase: { from }, update };
}

describe("PUT /api/agreements/disclosure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves disclosure status", async () => {
    const { supabase, update } = createSupabaseMock(true);
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      supabase,
    });

    const response = await PUT(
      new Request("http://localhost/api/agreements/disclosure", {
        method: "PUT",
        body: JSON.stringify({ has_relevant_agreements: true }),
      })
    );
    const payload = (await response.json()) as { ok?: boolean; has_relevant_agreements?: boolean };

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ has_relevant_agreements: true });
    expect(payload.ok).toBe(true);
    expect(payload.has_relevant_agreements).toBe(true);
  });

  it("rejects invalid payload", async () => {
    const { supabase } = createSupabaseMock(false);
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      supabase,
    });

    const response = await PUT(
      new Request("http://localhost/api/agreements/disclosure", {
        method: "PUT",
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
  });
});

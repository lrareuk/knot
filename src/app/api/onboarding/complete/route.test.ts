import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser } = vi.hoisted(() => ({
  mockRequireApiUser: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requireApiUser: mockRequireApiUser,
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

import { POST } from "@/app/api/onboarding/complete/route";

function createSupabaseMock() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { supabase: { from }, update };
}

describe("POST /api/onboarding/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires agreement disclosure", async () => {
    const { supabase } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: { has_relevant_agreements: null, financial_abuse_acknowledged_at: "2026-03-06T00:00:00.000Z" },
      supabase,
    });

    const response = await POST();
    expect(response.status).toBe(400);
  });

  it("requires financial abuse acknowledgement", async () => {
    const { supabase } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: { has_relevant_agreements: false, financial_abuse_acknowledged_at: null },
      supabase,
    });

    const response = await POST();
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Financial abuse acknowledgement");
  });

  it("marks onboarding complete when prerequisites are satisfied", async () => {
    const { supabase, update } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: { has_relevant_agreements: true, financial_abuse_acknowledged_at: "2026-03-06T00:00:00.000Z" },
      supabase,
    });

    const response = await POST();
    const payload = (await response.json()) as { ok?: boolean };

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ onboarding_done: true });
    expect(payload.ok).toBe(true);
  });
});


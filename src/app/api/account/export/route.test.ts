import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser } = vi.hoisted(() => ({
  mockRequireApiUser: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requireApiUser: mockRequireApiUser,
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

import { GET } from "@/app/api/account/export/route";

function createSupabaseMock() {
  const usersSingle = vi.fn().mockResolvedValue({ data: { id: "user-1", email: "alex@example.com" }, error: null });
  const usersEq = vi.fn().mockReturnValue({ single: usersSingle });
  const usersSelect = vi.fn().mockReturnValue({ eq: usersEq });

  const financialSingle = vi.fn().mockResolvedValue({ data: { user_id: "user-1", properties: [] }, error: null });
  const financialEq = vi.fn().mockReturnValue({ maybeSingle: financialSingle });
  const financialSelect = vi.fn().mockReturnValue({ eq: financialEq });

  const scenariosOrder = vi.fn().mockResolvedValue({ data: [{ id: "scenario-1" }], error: null });
  const scenariosEq = vi.fn().mockReturnValue({ order: scenariosOrder });
  const scenariosSelect = vi.fn().mockReturnValue({ eq: scenariosEq });

  const reportsOrder = vi.fn().mockResolvedValue({ data: [{ id: "report-1" }], error: null });
  const reportsEq = vi.fn().mockReturnValue({ order: reportsOrder });
  const reportsSelect = vi.fn().mockReturnValue({ eq: reportsEq });

  const from = vi.fn((table: string) => {
    if (table === "users") return { select: usersSelect };
    if (table === "financial_position") return { select: financialSelect };
    if (table === "scenarios") return { select: scenariosSelect };
    if (table === "reports") return { select: reportsSelect };
    throw new Error(`Unexpected table: ${table}`);
  });

  return { supabase: { from } };
}

describe("GET /api/account/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user export payload", async () => {
    const { supabase } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      supabase,
    });

    const response = await GET();
    const payload = (await response.json()) as {
      profile?: { id: string };
      scenarios?: Array<{ id: string }>;
      reports?: Array<{ id: string }>;
      exported_at?: string;
    };

    expect(response.status).toBe(200);
    expect(payload.profile?.id).toBe("user-1");
    expect(payload.scenarios?.[0]?.id).toBe("scenario-1");
    expect(payload.reports?.[0]?.id).toBe("report-1");
    expect(typeof payload.exported_at).toBe("string");
  });
});

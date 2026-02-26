import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireApiUser, mockListScenarios, mockGetOrCreateFinancialPosition, mockComputeScenario } = vi.hoisted(() => ({
  mockRequireApiUser: vi.fn(),
  mockListScenarios: vi.fn(),
  mockGetOrCreateFinancialPosition: vi.fn(),
  mockComputeScenario: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requireApiUser: mockRequireApiUser,
  badRequest: (message: string) => new Response(JSON.stringify({ error: message }), { status: 400 }),
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

vi.mock("@/lib/server/scenarios", () => ({
  listScenarios: mockListScenarios,
}));

vi.mock("@/lib/server/financial-position", () => ({
  getOrCreateFinancialPosition: mockGetOrCreateFinancialPosition,
}));

vi.mock("@/lib/domain/compute-scenario", () => ({
  computeScenario: mockComputeScenario,
}));

import { POST } from "@/app/api/scenarios/[id]/duplicate/route";

function createSupabaseMock() {
  const sourceScenario = {
    id: "scenario-1",
    user_id: "user-1",
    name: "Scenario A",
    config: { property_decisions: [] },
    results: { user_net_position: 10 },
    created_at: "2026-02-26T10:00:00.000Z",
    updated_at: "2026-02-26T10:00:00.000Z",
  };
  const createdScenario = {
    ...sourceScenario,
    id: "scenario-2",
    name: "Scenario B",
  };

  const sourceSingle = vi.fn().mockResolvedValue({ data: sourceScenario, error: null });
  const selectEqUser = vi.fn().mockReturnValue({ single: sourceSingle });
  const selectEqId = vi.fn().mockReturnValue({ eq: selectEqUser });
  const select = vi.fn().mockReturnValue({ eq: selectEqId });

  const insertSingle = vi.fn().mockResolvedValue({ data: createdScenario, error: null });
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
  const insert = vi.fn().mockReturnValue({ select: insertSelect });

  const from = vi.fn().mockReturnValue({ select, insert });

  return { supabase: { from }, insert, createdScenario };
}

describe("POST /api/scenarios/[id]/duplicate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateFinancialPosition.mockResolvedValue({ properties: [] });
    mockComputeScenario.mockReturnValue({ label: "modelled_outcome", user_net_position: 11 });
  });

  it("duplicates a scenario and returns a new record", async () => {
    const { supabase, insert, createdScenario } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      supabase,
    });
    mockListScenarios.mockResolvedValue([{ id: "existing-1" }]);

    const response = await POST(new Request("http://localhost/api/scenarios/1/duplicate", { method: "POST" }), {
      params: Promise.resolve({ id: "scenario-1" }),
    });
    const payload = (await response.json()) as { scenario?: { id: string; name: string } };

    expect(response.status).toBe(201);
    expect(payload.scenario).toEqual(expect.objectContaining({ id: createdScenario.id, name: "Scenario B" }));
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        name: "Scenario B",
      })
    );
  });

  it("returns 400 when the user already has 5 scenarios", async () => {
    const { supabase } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      supabase,
    });
    mockListScenarios.mockResolvedValue([{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }]);

    const response = await POST(new Request("http://localhost/api/scenarios/1/duplicate", { method: "POST" }), {
      params: Promise.resolve({ id: "scenario-1" }),
    });
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Maximum 5 scenarios");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireApiUser,
  mockListScenarios,
  mockGetOrCreateFinancialPosition,
  mockBuildScenarioConfigFromTemplate,
  mockComputeScenario,
} = vi.hoisted(() => ({
  mockRequireApiUser: vi.fn(),
  mockListScenarios: vi.fn(),
  mockGetOrCreateFinancialPosition: vi.fn(),
  mockBuildScenarioConfigFromTemplate: vi.fn(),
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

vi.mock("@/lib/domain/scenario-templates", () => ({
  SCENARIO_TEMPLATE_KEYS: ["balanced", "user_keeps_home", "partner_keeps_home", "clean_break_sale"],
  buildScenarioConfigFromTemplate: mockBuildScenarioConfigFromTemplate,
}));

vi.mock("@/lib/domain/compute-scenario", () => ({
  computeScenario: mockComputeScenario,
}));

import { POST } from "@/app/api/scenarios/route";

function createSupabaseMock() {
  const createdScenario = {
    id: "scenario-1",
    user_id: "user-1",
    name: "Scenario A",
    config: { property_decisions: [] },
    results: { label: "modelled_outcome" },
    created_at: "2026-02-27T10:00:00.000Z",
    updated_at: "2026-02-27T10:00:00.000Z",
  };

  const insertSingle = vi.fn().mockResolvedValue({ data: createdScenario, error: null });
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
  const insert = vi.fn().mockReturnValue({ select: insertSelect });
  const from = vi.fn().mockReturnValue({ insert });

  return { supabase: { from }, insert, createdScenario };
}

describe("POST /api/scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateFinancialPosition.mockResolvedValue({
      properties: [],
      pensions: [],
      savings: [],
      debts: [],
      income: {
        user_gross_annual: 0,
        user_net_monthly: 0,
        partner_gross_annual: 0,
        partner_net_monthly: 0,
        other_income: 0,
        other_income_holder: "joint",
      },
      dependants: [],
      expenditure: {
        housing: 0,
        utilities: 0,
        council_tax: 0,
        food: 0,
        transport: 0,
        childcare: 0,
        insurance: 0,
        personal: 0,
        other: 0,
      },
      date_of_marriage: null,
      date_of_separation: null,
    });
    mockBuildScenarioConfigFromTemplate.mockReturnValue({ property_decisions: [] });
    mockComputeScenario.mockReturnValue({ label: "modelled_outcome" });
  });

  it("creates a scenario with balanced template by default", async () => {
    const { supabase, insert, createdScenario } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({ response: null, user: { id: "user-1" }, supabase });
    mockListScenarios.mockResolvedValue([]);

    const response = await POST(
      new Request("http://localhost/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    const payload = (await response.json()) as { scenario?: { id: string; name: string } };

    expect(response.status).toBe(201);
    expect(payload.scenario).toEqual(expect.objectContaining({ id: createdScenario.id }));
    expect(mockBuildScenarioConfigFromTemplate).toHaveBeenCalledWith(expect.any(Object), "balanced");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        name: "Scenario A",
      })
    );
  });

  it("creates a scenario with an explicit template and name", async () => {
    const { supabase, insert } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({ response: null, user: { id: "user-1" }, supabase });
    mockListScenarios.mockResolvedValue([{ id: "existing-1" }]);

    const response = await POST(
      new Request("http://localhost/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Plan", template: "clean_break_sale" }),
      })
    );

    expect(response.status).toBe(201);
    expect(mockBuildScenarioConfigFromTemplate).toHaveBeenCalledWith(expect.any(Object), "clean_break_sale");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My Plan",
      })
    );
  });

  it("returns 400 for invalid template", async () => {
    const { supabase } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({ response: null, user: { id: "user-1" }, supabase });

    const response = await POST(
      new Request("http://localhost/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: "not-a-template" }),
      })
    );
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid scenario payload");
    expect(mockListScenarios).not.toHaveBeenCalled();
  });

  it("returns 400 when user already has 5 scenarios", async () => {
    const { supabase } = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({ response: null, user: { id: "user-1" }, supabase });
    mockListScenarios.mockResolvedValue([{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }]);

    const response = await POST(
      new Request("http://localhost/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Maximum 5 scenarios");
  });
});

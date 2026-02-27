import { describe, expect, it, vi } from "vitest";

const { mockNotFound, mockRequireDashboardAccess, mockGetOrCreateFinancialPosition, mockComputeBaseline } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("notFound");
  }),
  mockRequireDashboardAccess: vi.fn(),
  mockGetOrCreateFinancialPosition: vi.fn(),
  mockComputeBaseline: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/lib/server/auth", () => ({
  requireDashboardAccess: mockRequireDashboardAccess,
}));

vi.mock("@/lib/server/financial-position", () => ({
  getOrCreateFinancialPosition: mockGetOrCreateFinancialPosition,
}));

vi.mock("@/lib/domain/compute-scenario", () => ({
  computeBaseline: mockComputeBaseline,
}));

import ScenarioEditorPage from "@/app/dashboard/scenario/[id]/page";

function createSupabaseMock(scenario: unknown) {
  const single = vi.fn().mockResolvedValue({ data: scenario, error: scenario ? null : { message: "missing" } });
  const eqUser = vi.fn().mockReturnValue({ single });
  const eqId = vi.fn().mockReturnValue({ eq: eqUser });
  const select = vi.fn().mockReturnValue({ eq: eqId });
  const from = vi.fn().mockReturnValue({ select });

  return { supabase: { from } };
}

describe("Scenario editor route", () => {
  it("renders the canonical singular scenario route", async () => {
    const scenario = { id: "scenario-1", name: "Scenario A" };
    const { supabase } = createSupabaseMock(scenario);

    mockRequireDashboardAccess.mockResolvedValue({ user: { id: "user-1" }, supabase });
    mockGetOrCreateFinancialPosition.mockResolvedValue({ id: "position-1" });
    mockComputeBaseline.mockReturnValue({ id: "baseline-1" });

    const result = (await ScenarioEditorPage({ params: Promise.resolve({ id: "scenario-1" }) })) as {
      props: { scenario: { id: string } };
    };

    expect(result.props.scenario.id).toBe("scenario-1");
  });

  it("calls notFound when scenario cannot be loaded", async () => {
    const { supabase } = createSupabaseMock(null);

    mockRequireDashboardAccess.mockResolvedValue({ user: { id: "user-1" }, supabase });
    mockGetOrCreateFinancialPosition.mockResolvedValue({ id: "position-1" });
    mockComputeBaseline.mockReturnValue({ id: "baseline-1" });

    await expect(ScenarioEditorPage({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow("notFound");
    expect(mockNotFound).toHaveBeenCalled();
  });
});

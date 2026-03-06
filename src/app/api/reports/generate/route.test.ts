import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireApiUser,
  mockGetOrCreateFinancialPosition,
  mockComputeBaseline,
  mockComputeScenario,
  mockGenerateScenarioObservations,
  mockRenderToBuffer,
  mockSupabaseAdmin,
} = vi.hoisted(() => ({
  mockRequireApiUser: vi.fn(),
  mockGetOrCreateFinancialPosition: vi.fn(),
  mockComputeBaseline: vi.fn(),
  mockComputeScenario: vi.fn(),
  mockGenerateScenarioObservations: vi.fn(),
  mockRenderToBuffer: vi.fn(),
  mockSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  requireApiUser: mockRequireApiUser,
  badRequest: (message: string) => new Response(JSON.stringify({ error: message }), { status: 400 }),
  serverError: (message: string) => new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

vi.mock("@/lib/server/financial-position", () => ({
  getOrCreateFinancialPosition: mockGetOrCreateFinancialPosition,
}));

vi.mock("@/lib/domain/compute-scenario", () => ({
  computeBaseline: mockComputeBaseline,
  computeScenario: mockComputeScenario,
}));

vi.mock("@/lib/domain/observations", () => ({
  generateScenarioObservations: mockGenerateScenarioObservations,
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: mockRenderToBuffer,
}));

vi.mock("@/lib/report/ClarityReportDocument", () => ({
  ClarityReportDocument: vi.fn(() => null),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

import { POST } from "@/app/api/reports/generate/route";

const scenarioId = "11111111-1111-4111-8111-111111111111";

function createUserSupabaseMock() {
  const scenariosIn = vi.fn().mockResolvedValue({
    data: [
      {
        id: scenarioId,
        user_id: "user-1",
        name: "Scenario A",
        config: {},
        results: { model_version: "v2_jurisdiction_pensions", user_net_position: 1000 },
        created_at: "2026-02-27T10:00:00.000Z",
        updated_at: "2026-02-27T10:00:00.000Z",
      },
    ],
    error: null,
  });
  const scenariosEq = vi.fn().mockReturnValue({ in: scenariosIn });
  const scenariosSelect = vi.fn().mockReturnValue({ eq: scenariosEq });

  const scenariosUpdateFinalEq = vi.fn().mockResolvedValue({ error: null });
  const scenariosUpdateEq = vi.fn().mockReturnValue({ eq: scenariosUpdateFinalEq });
  const scenariosUpdate = vi.fn().mockReturnValue({ eq: scenariosUpdateEq });

  const agreementsEq = vi.fn().mockResolvedValue({ data: [], error: null });
  const agreementsSelect = vi.fn().mockReturnValue({ eq: agreementsEq });

  const from = vi.fn((table: string) => {
    if (table === "scenarios") {
      return {
        select: scenariosSelect,
        update: scenariosUpdate,
      };
    }

    if (table === "legal_agreement_terms") {
      return {
        select: agreementsSelect,
      };
    }

    return {
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
    };
  });

  return { from };
}

function createAdminSupabaseMock() {
  const upload = vi.fn().mockResolvedValue({ error: null });
  const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://cdn.test/report.pdf" }, error: null });

  const single = vi.fn().mockResolvedValue({
    data: {
      id: "report-1",
      scenario_ids: [scenarioId],
      pdf_url: "https://cdn.test/report.pdf",
      generated_at: "2026-02-27T10:01:00.000Z",
      expires_at: "2026-02-28T10:01:00.000Z",
    },
    error: null,
  });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });

  return {
    storage: {
      from: vi.fn().mockReturnValue({ upload, createSignedUrl }),
    },
    from,
  };
}

describe("POST /api/reports/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreateFinancialPosition.mockResolvedValue({});
    mockComputeBaseline.mockReturnValue({});
    mockComputeScenario.mockReturnValue({ model_version: "v2_jurisdiction_pensions" });
    mockGenerateScenarioObservations.mockReturnValue([]);
    mockRenderToBuffer.mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  it("returns report_id and download_url while preserving report payload", async () => {
    const supabase = createUserSupabaseMock();
    const admin = createAdminSupabaseMock();

    mockRequireApiUser.mockResolvedValue({
      response: null,
      user: { id: "user-1" },
      profile: { jurisdiction: "GB-EAW", currency_code: "GBP" },
      supabase,
    });
    mockSupabaseAdmin.mockReturnValue(admin);

    const response = await POST(
      new Request("http://localhost/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_ids: [scenarioId] }),
      })
    );

    const payload = (await response.json()) as {
      report?: { id?: string; pdf_url?: string };
      report_id?: string;
      download_url?: string;
    };

    expect(response.status).toBe(200);
    expect(payload.report?.id).toBe("report-1");
    expect(payload.report_id).toBe("report-1");
    expect(payload.download_url).toBe("https://cdn.test/report.pdf");
  });
});

import { describe, expect, it } from "vitest";
import { summarizeScenarioAgreementWarningsByScenario, summarizeScenarioAgreementWarningsForConfig } from "@/lib/domain/scenario-agreement-summary";
import type { ScenarioConfig } from "@/lib/domain/types";
import type { LegalAgreementTerm } from "@/lib/legal/types";

const baseConfig: ScenarioConfig = {
  property_decisions: [{ property_id: "property-1", action: "sell", equity_split_user: 50 }],
  pension_splits: [{ pension_id: "pension-1", split_user: 50 }],
  savings_splits: [{ savings_id: "savings-1", split_user: 50 }],
  debt_splits: [{ debt_id: "debt-1", split_user: 50 }],
  spousal_maintenance: {
    monthly_amount: 0,
    direction: "none",
    duration_months: 24,
  },
  child_maintenance: {
    monthly_amount: 0,
    direction: "none",
  },
  housing_change: {
    user_new_rent: null,
    partner_new_rent: null,
  },
  income_changes: {
    user_new_net_monthly: null,
    partner_new_net_monthly: null,
  },
};

function term(overrides: Partial<LegalAgreementTerm>): LegalAgreementTerm {
  return {
    id: "term-1",
    agreement_id: "agreement-1",
    user_id: "user-1",
    term_type: "pension_exclusion",
    term_payload: {},
    impact_direction: "weakens_user",
    confidence: 0.9,
    citation: { quote: "pension sharing is excluded" },
    source_document_id: "document-1",
    created_at: "2026-02-27T00:00:00.000Z",
    updated_at: "2026-02-27T00:00:00.000Z",
    ...overrides,
  };
}

describe("scenario agreement warning summary", () => {
  it("summarizes warning totals and highest severity for a scenario", () => {
    const summary = summarizeScenarioAgreementWarningsForConfig(baseConfig, "GB-EAW", [term({})]);

    expect(summary.total).toBeGreaterThan(0);
    expect(summary.warning).toBeGreaterThan(0);
    expect(summary.highest).toBe("warning");
  });

  it("creates a per-scenario summary map", () => {
    const summaryMap = summarizeScenarioAgreementWarningsByScenario(
      [
        { id: "scenario-1", config: baseConfig },
        {
          id: "scenario-2",
          config: {
            ...baseConfig,
            pension_splits: [{ pension_id: "pension-1", split_user: 100 }],
          },
        },
      ],
      "GB-EAW",
      [term({})]
    );

    expect(summaryMap["scenario-1"]).toBeDefined();
    expect(summaryMap["scenario-2"]).toBeDefined();
  });
});

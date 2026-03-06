import { describe, expect, it } from "vitest";
import { interpretScenarioAgreements } from "@/lib/domain/interpret-scenario-agreements";
import type { ScenarioConfig } from "@/lib/domain/types";
import type { LegalAgreementTerm } from "@/lib/legal/types";

const baseConfig: ScenarioConfig = {
  property_decisions: [
    { property_id: "property-1", action: "sell", equity_split_user: 50 },
  ],
  pension_splits: [{ pension_id: "pension-1", split_user: 50 }],
  savings_splits: [{ savings_id: "savings-1", split_user: 50 }],
  debt_splits: [{ debt_id: "debt-1", split_user: 50 }],
  spousal_maintenance: {
    monthly_amount: 2500,
    direction: "user_pays",
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
    term_type: "spousal_support_waiver",
    term_payload: {},
    impact_direction: "weakens_user",
    confidence: 0.9,
    citation: { quote: "spousal support is waived" },
    source_document_id: "document-1",
    created_at: "2026-02-27T00:00:00.000Z",
    updated_at: "2026-02-27T00:00:00.000Z",
    ...overrides,
  };
}

describe("interpretScenarioAgreements", () => {
  it("flags maintenance conflicts for support waivers", () => {
    const warnings = interpretScenarioAgreements({
      jurisdictionCode: "US-CA",
      config: baseConfig,
      terms: [term({ term_type: "spousal_support_waiver" })],
    });

    expect(warnings.some((warning) => warning.affected_section === "maintenance")).toBe(true);
    expect(warnings[0]?.severity).toBe("high");
  });

  it("flags choice-of-law mismatch", () => {
    const warnings = interpretScenarioAgreements({
      jurisdictionCode: "CA-ON",
      config: { ...baseConfig, spousal_maintenance: { ...baseConfig.spousal_maintenance, direction: "none", monthly_amount: 0 } },
      terms: [term({ term_type: "choice_of_law", term_payload: { jurisdiction_code: "US-NY" }, impact_direction: "neutral" })],
    });

    expect(warnings.some((warning) => warning.key.startsWith("choice-of-law"))).toBe(true);
  });

  it("still prompts review for pension exclusion even when pensions are not split between parties", () => {
    const warnings = interpretScenarioAgreements({
      jurisdictionCode: "GB-EAW",
      config: {
        ...baseConfig,
        pension_splits: [{ pension_id: "pension-1", split_user: 100 }],
        spousal_maintenance: { ...baseConfig.spousal_maintenance, direction: "none", monthly_amount: 0 },
      },
      terms: [term({ term_type: "pension_exclusion" })],
    });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.affected_section).toBe("pension");
    expect(warnings[0]?.severity).toBe("info");
  });

  it("flags property minimum-ratio breaches", () => {
    const warnings = interpretScenarioAgreements({
      jurisdictionCode: "GB-EAW",
      config: {
        ...baseConfig,
        property_decisions: [{ property_id: "property-1", action: "sell", equity_split_user: 20 }],
        spousal_maintenance: { ...baseConfig.spousal_maintenance, direction: "none", monthly_amount: 0 },
      },
      terms: [term({ term_type: "asset_split_ratio", term_payload: { min_user_percent: 30 }, impact_direction: "neutral" })],
    });

    expect(warnings.some((warning) => warning.key.startsWith("asset-ratio-min"))).toBe(true);
  });

  it("infers pension relevance for other material terms when citations mention pensions", () => {
    const warnings = interpretScenarioAgreements({
      jurisdictionCode: "GB-EAW",
      config: {
        ...baseConfig,
        spousal_maintenance: { ...baseConfig.spousal_maintenance, direction: "none", monthly_amount: 0 },
      },
      terms: [term({ term_type: "other_material_term", citation: { quote: "pension sharing order applies to pension X" } })],
    });

    expect(warnings[0]?.affected_section).toBe("pension");
  });
});

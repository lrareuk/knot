import { describe, expect, it } from "vitest";
import { comparisonMetricGroups } from "@/lib/domain/comparison";
import type { ScenarioRecord, ScenarioResults } from "@/lib/domain/types";

const baseline: ScenarioResults = {
  label: "modelled_outcome",
  model_version: "v3_pension_fairness_guardrails",
  user_total_assets: 100000,
  user_total_liabilities: 20000,
  user_net_position: 80000,
  user_property_equity: 45000,
  user_total_pensions: 20000,
  user_total_savings: 35000,
  user_total_debts: 10000,
  user_monthly_income: 3500,
  user_monthly_expenditure: 2800,
  user_monthly_surplus_deficit: 700,
  user_pension_income_annual: 0,
  user_pension_income_monthly_equivalent: 0,
  user_maintenance_paid: 0,
  user_maintenance_received: 0,
  partner_total_assets: 0,
  partner_total_liabilities: 0,
  partner_net_position: 0,
  partner_property_equity: 0,
  partner_total_pensions: 0,
  partner_total_savings: 0,
  partner_total_debts: 0,
  partner_monthly_income: 0,
  partner_monthly_expenditure: 0,
  partner_monthly_surplus_deficit: 0,
  partner_pension_income_annual: 0,
  partner_pension_income_monthly_equivalent: 0,
  partner_maintenance_paid: 0,
  partner_maintenance_received: 0,
  delta_user_assets: 0,
  delta_user_monthly: 0,
  delta_user_net_position: 0,
  retirement_income_gap_annual: 0,
  retirement_income_gap_monthly: 0,
  retirement_income_parity_ratio: null,
  offsetting_tradeoff_detected: false,
  offsetting_tradeoff_strength: "none",
  specialist_advice_recommended: false,
  specialist_advice_reasons: [],
};

function scenario(id: string, name: string, overrides: Partial<ScenarioResults>): ScenarioRecord {
  return {
    id,
    user_id: "user-1",
    name,
    config: {
      property_decisions: [],
      pension_splits: [],
      savings_splits: [],
      debt_splits: [],
      spousal_maintenance: { monthly_amount: 0, direction: "none", duration_months: 0 },
      child_maintenance: { monthly_amount: 0, direction: "none" },
      housing_change: { user_new_rent: null, partner_new_rent: null },
      income_changes: { user_new_net_monthly: null, partner_new_net_monthly: null },
    },
    results: { ...baseline, ...overrides },
    created_at: "2026-02-26T10:00:00.000Z",
    updated_at: "2026-02-26T10:00:00.000Z",
  };
}

describe("comparisonMetricGroups", () => {
  it("builds grouped rows and computes best scenario flags", () => {
    const groups = comparisonMetricGroups(baseline, [
      scenario("1", "Scenario A", {
        user_net_position: 70000,
        user_total_debts: 9000,
        user_monthly_surplus_deficit: 650,
        retirement_income_gap_annual: 9000,
        retirement_income_parity_ratio: 0.55,
      }),
      scenario("2", "Scenario B", {
        user_net_position: 85000,
        user_total_debts: 12000,
        user_monthly_surplus_deficit: 900,
        retirement_income_gap_annual: 3000,
        retirement_income_parity_ratio: 0.9,
      }),
    ], "GB-EAW");

    expect(groups.map((group) => group.key)).toEqual(["assets", "liabilities", "monthly"]);

    const netRow = groups.flatMap((group) => group.rows).find((row) => row.key === "net");
    expect(netRow?.scenarios.find((item) => item.id === "2")?.isBest).toBe(true);

    const debtRow = groups.flatMap((group) => group.rows).find((row) => row.key === "debts");
    expect(debtRow?.better).toBe("lower");
    expect(debtRow?.scenarios.find((item) => item.id === "1")?.isBest).toBe(true);

    const gapRow = groups.flatMap((group) => group.rows).find((row) => row.key === "retirement_income_gap_annual");
    expect(gapRow?.better).toBe("lower");
    expect(gapRow?.scenarios.find((item) => item.id === "2")?.isBest).toBe(true);

    const parityRow = groups.flatMap((group) => group.rows).find((row) => row.key === "retirement_income_parity");
    expect(parityRow?.better).toBe("higher");
    expect(parityRow?.scenarios.find((item) => item.id === "2")?.isBest).toBe(true);
  });
});

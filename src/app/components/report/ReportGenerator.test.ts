import { describe, expect, it } from "vitest";
import { requiresReportOffsettingRiskAcknowledgement } from "@/app/components/report/ReportGenerator";
import type { ScenarioRecord } from "@/lib/domain/types";

function createScenario(id: string, risk: { offsetting: boolean; specialist: boolean }): ScenarioRecord {
  return {
    id,
    user_id: "user-1",
    name: `Scenario ${id}`,
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
    results: {
      label: "modelled_outcome",
      model_version: "v3_pension_fairness_guardrails",
      user_total_assets: 0,
      user_total_liabilities: 0,
      user_net_position: 0,
      user_property_equity: 0,
      user_total_pensions: 0,
      user_total_savings: 0,
      user_total_debts: 0,
      user_monthly_income: 0,
      user_monthly_expenditure: 0,
      user_monthly_surplus_deficit: 0,
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
      offsetting_tradeoff_detected: risk.offsetting,
      offsetting_tradeoff_strength: "none",
      specialist_advice_recommended: risk.specialist,
      specialist_advice_reasons: [],
    },
    created_at: "2026-03-06T00:00:00.000Z",
    updated_at: "2026-03-06T00:00:00.000Z",
  };
}

describe("requiresReportOffsettingRiskAcknowledgement", () => {
  it("returns true for flagged E&W selected scenarios", () => {
    const scenarios = [createScenario("a", { offsetting: true, specialist: false })];
    expect(requiresReportOffsettingRiskAcknowledgement(scenarios, ["a"], "GB-EAW")).toBe(true);
  });

  it("returns false outside E&W", () => {
    const scenarios = [createScenario("a", { offsetting: true, specialist: true })];
    expect(requiresReportOffsettingRiskAcknowledgement(scenarios, ["a"], "GB-SCT")).toBe(false);
  });
});

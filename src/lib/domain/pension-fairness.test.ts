import { describe, expect, it } from "vitest";
import { analyzePensionFairness } from "@/lib/domain/pension-fairness";
import type { FinancialPosition, ScenarioResults } from "@/lib/domain/types";

const basePosition: FinancialPosition = {
  properties: [],
  pensions: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      label: "User DC",
      holder: "user",
      current_value: 120000,
      is_matrimonial: true,
      pension_type: "defined_contribution",
      annual_amount: null,
      projected_annual_income: 12000,
      scottish_relevant_date_value: null,
    },
  ],
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
};

const baseline: ScenarioResults = {
  label: "modelled_outcome",
  model_version: "v3_pension_fairness_guardrails",
  user_total_assets: 220000,
  user_total_liabilities: 20000,
  user_net_position: 200000,
  user_property_equity: 200000,
  user_total_pensions: 0,
  user_total_savings: 20000,
  user_total_debts: 0,
  user_monthly_income: 0,
  user_monthly_expenditure: 0,
  user_monthly_surplus_deficit: 0,
  user_pension_income_annual: 12000,
  user_pension_income_monthly_equivalent: 1000,
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
  retirement_income_gap_annual: 12000,
  retirement_income_gap_monthly: 1000,
  retirement_income_parity_ratio: 0,
  offsetting_tradeoff_detected: false,
  offsetting_tradeoff_strength: "none",
  specialist_advice_recommended: false,
  specialist_advice_reasons: [],
};

describe("analyzePensionFairness", () => {
  it("detects E&W offsetting pattern when property and pension-income move in opposite directions", () => {
    const analysis = analyzePensionFairness({
      position: basePosition,
      baseline: {
        ...baseline,
        user_property_equity: 400000,
      },
      scenario: {
        ...baseline,
        user_property_equity: 460000,
        user_pension_income_annual: 7000,
        partner_pension_income_annual: 5000,
      },
      jurisdictionCode: "GB-EAW",
    });

    expect(analysis.enabled).toBe(true);
    expect(analysis.offsetting_tradeoff_detected).toBe(true);
    expect(analysis.offsetting_tradeoff_strength).toBe("moderate");
  });

  it("returns neutral flags outside England and Wales", () => {
    const analysis = analyzePensionFairness({
      position: basePosition,
      baseline,
      scenario: {
        ...baseline,
        user_property_equity: 320000,
        user_pension_income_annual: 2000,
      },
      jurisdictionCode: "GB-SCT",
    });

    expect(analysis.enabled).toBe(false);
    expect(analysis.offsetting_tradeoff_detected).toBe(false);
    expect(analysis.specialist_advice_recommended).toBe(false);
    expect(analysis.complex_case_reasons).toEqual([]);
  });

  it("flags conservative complex-case reasons and specialist advice recommendation", () => {
    const complexPosition: FinancialPosition = {
      ...basePosition,
      pensions: [
        {
          ...basePosition.pensions[0],
          pension_type: "defined_benefit",
          projected_annual_income: null,
        },
      ],
    };

    const analysis = analyzePensionFairness({
      position: complexPosition,
      baseline,
      scenario: {
        ...baseline,
        user_property_equity: 320000,
        user_pension_income_annual: 2000,
        partner_pension_income_annual: 13000,
      },
      jurisdictionCode: "GB-EAW",
    });

    expect(analysis.offsetting_tradeoff_strength).toBe("strong");
    expect(analysis.complex_case_reasons).toEqual(
      expect.arrayContaining([
        "defined_benefit_present",
        "missing_income_projection",
        "large_offsetting_tradeoff",
        "large_retirement_income_gap",
      ])
    );
    expect(analysis.specialist_advice_recommended).toBe(true);
  });
});

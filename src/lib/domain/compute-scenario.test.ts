import { describe, expect, it } from "vitest";
import { computeBaseline, computeScenario } from "@/lib/domain/compute-scenario";
import { createDefaultScenarioConfig } from "@/lib/domain/defaults";
import type { FinancialPosition } from "@/lib/domain/types";

const position: FinancialPosition = {
  properties: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      label: "Family home",
      current_value: 400000,
      mortgage_outstanding: 100000,
      equity: 300000,
      ownership: "joint",
      is_matrimonial: true,
      monthly_cost: 1200,
    },
  ],
  pensions: [
    {
      id: "22222222-2222-2222-2222-222222222222",
      label: "Work pension",
      holder: "user",
      current_value: 100000,
      is_matrimonial: true,
      pension_type: "defined_contribution",
      annual_amount: null,
    },
  ],
  savings: [
    {
      id: "33333333-3333-3333-3333-333333333333",
      label: "Joint savings",
      holder: "joint",
      current_value: 20000,
      is_matrimonial: true,
      type: "cash",
    },
  ],
  debts: [
    {
      id: "44444444-4444-4444-4444-444444444444",
      label: "Loan",
      holder: "joint",
      outstanding: 10000,
      monthly_payment: 250,
      is_matrimonial: true,
    },
  ],
  income: {
    user_gross_annual: 70000,
    user_net_monthly: 3500,
    partner_gross_annual: 50000,
    partner_net_monthly: 2600,
    other_income: 400,
    other_income_holder: "joint",
  },
  dependants: [],
  expenditure: {
    housing: 1200,
    utilities: 300,
    council_tax: 200,
    food: 500,
    transport: 300,
    childcare: 0,
    insurance: 120,
    personal: 200,
    other: 180,
  },
  date_of_marriage: "2014-06-12",
  date_of_separation: "2026-02-01",
};

describe("computeBaseline", () => {
  it("allocates ownership-based baseline totals", () => {
    const baseline = computeBaseline(position);

    expect(baseline.user_property_equity).toBe(150000);
    expect(baseline.partner_property_equity).toBe(150000);
    expect(baseline.user_total_pensions).toBe(100000);
    expect(baseline.user_total_savings).toBe(10000);
    expect(baseline.partner_total_savings).toBe(10000);
    expect(baseline.user_total_debts).toBe(5000);
    expect(baseline.partner_total_debts).toBe(5000);
  });
});

describe("computeScenario", () => {
  it("applies sell split and maintenance adjustments", () => {
    const config = createDefaultScenarioConfig(position);

    config.property_decisions[0] = {
      property_id: position.properties[0].id,
      action: "sell",
      equity_split_user: 60,
    };

    config.spousal_maintenance = {
      monthly_amount: 500,
      direction: "partner_pays",
      duration_months: 12,
    };

    config.income_changes.user_new_net_monthly = 3200;

    const scenario = computeScenario(position, config);

    expect(scenario.user_total_savings).toBeGreaterThan(10000);
    expect(scenario.user_maintenance_received).toBe(500);
    expect(scenario.partner_maintenance_paid).toBe(500);
    expect(scenario.user_monthly_income).toBe(3400);
    expect(scenario.delta_user_net_position).not.toBe(0);
  });

  it("applies keep-property and housing override", () => {
    const config = createDefaultScenarioConfig(position);

    config.property_decisions[0] = {
      property_id: position.properties[0].id,
      action: "user_keeps",
      equity_split_user: 100,
    };

    config.housing_change.user_new_rent = 900;

    const scenario = computeScenario(position, config);

    expect(scenario.user_property_equity).toBe(300000);
    expect(scenario.partner_property_equity).toBe(0);
    expect(scenario.user_monthly_expenditure).toBeGreaterThan(0);
  });
});

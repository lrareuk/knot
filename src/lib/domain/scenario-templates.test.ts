import { describe, expect, it } from "vitest";
import { buildScenarioConfigFromTemplate } from "@/lib/domain/scenario-templates";
import type { FinancialPosition } from "@/lib/domain/types";

const POSITION: FinancialPosition = {
  properties: [
    {
      id: "property-joint",
      label: "Joint home",
      current_value: 600000,
      mortgage_outstanding: 300000,
      equity: 300000,
      ownership: "joint",
      is_matrimonial: true,
      monthly_cost: 1200,
    },
    {
      id: "property-user",
      label: "User flat",
      current_value: 300000,
      mortgage_outstanding: 100000,
      equity: 200000,
      ownership: "sole_user",
      is_matrimonial: true,
      monthly_cost: 900,
    },
    {
      id: "property-partner",
      label: "Partner flat",
      current_value: 700000,
      mortgage_outstanding: 300000,
      equity: 400000,
      ownership: "sole_partner",
      is_matrimonial: true,
      monthly_cost: 1500,
    },
  ],
  pensions: [
    {
      id: "pension-user",
      label: "User pension",
      holder: "user",
      current_value: 120000,
      is_matrimonial: true,
      pension_type: "defined_contribution",
      annual_amount: null,
      projected_annual_income: null,
      scottish_relevant_date_value: null,
    },
    {
      id: "pension-partner",
      label: "Partner pension",
      holder: "partner",
      current_value: 90000,
      is_matrimonial: true,
      pension_type: "defined_contribution",
      annual_amount: null,
      projected_annual_income: null,
      scottish_relevant_date_value: null,
    },
  ],
  savings: [
    {
      id: "savings-user",
      label: "User ISA",
      holder: "user",
      current_value: 35000,
      is_matrimonial: true,
      type: "isa",
    },
    {
      id: "savings-joint",
      label: "Joint cash",
      holder: "joint",
      current_value: 20000,
      is_matrimonial: true,
      type: "cash",
    },
  ],
  debts: [
    {
      id: "debt-partner",
      label: "Partner loan",
      holder: "partner",
      outstanding: 10000,
      monthly_payment: 300,
      is_matrimonial: true,
    },
    {
      id: "debt-joint",
      label: "Joint credit",
      holder: "joint",
      outstanding: 6000,
      monthly_payment: 200,
      is_matrimonial: true,
    },
  ],
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
  has_no_dependants: false,
  date_of_marriage: null,
  date_of_separation: null,
};

describe("buildScenarioConfigFromTemplate", () => {
  it("builds balanced decisions from ownership and holder", () => {
    const config = buildScenarioConfigFromTemplate(POSITION, "balanced");

    expect(config.property_decisions).toEqual([
      { property_id: "property-joint", action: "sell", equity_split_user: 50 },
      { property_id: "property-user", action: "user_keeps", equity_split_user: 100 },
      { property_id: "property-partner", action: "partner_keeps", equity_split_user: 0 },
    ]);
    expect(config.pension_splits).toEqual([
      { pension_id: "pension-user", split_user: 100 },
      { pension_id: "pension-partner", split_user: 0 },
    ]);
    expect(config.savings_splits).toEqual([
      { savings_id: "savings-user", split_user: 100 },
      { savings_id: "savings-joint", split_user: 50 },
    ]);
    expect(config.debt_splits).toEqual([
      { debt_id: "debt-partner", split_user: 0 },
      { debt_id: "debt-joint", split_user: 50 },
    ]);
    expect(config.spousal_maintenance).toEqual({ monthly_amount: 0, direction: "none", duration_months: 0 });
    expect(config.child_maintenance).toEqual({ monthly_amount: 0, direction: "none" });
    expect(config.housing_change).toEqual({ user_new_rent: null, partner_new_rent: null });
    expect(config.income_changes).toEqual({ user_new_net_monthly: null, partner_new_net_monthly: null });
  });

  it("forces the highest equity property to user_keeps for user_keeps_home", () => {
    const config = buildScenarioConfigFromTemplate(POSITION, "user_keeps_home");

    const highest = config.property_decisions.find((decision) => decision.property_id === "property-partner");
    expect(highest).toEqual({ property_id: "property-partner", action: "user_keeps", equity_split_user: 100 });
  });

  it("forces the highest equity property to partner_keeps for partner_keeps_home", () => {
    const config = buildScenarioConfigFromTemplate(POSITION, "partner_keeps_home");

    const highest = config.property_decisions.find((decision) => decision.property_id === "property-partner");
    expect(highest).toEqual({ property_id: "property-partner", action: "partner_keeps", equity_split_user: 0 });
  });

  it("applies clean_break_sale template with 50/50 split everywhere", () => {
    const config = buildScenarioConfigFromTemplate(POSITION, "clean_break_sale");

    expect(config.property_decisions.every((decision) => decision.action === "sell" && decision.equity_split_user === 50)).toBe(true);
    expect(config.pension_splits.every((decision) => decision.split_user === 50)).toBe(true);
    expect(config.savings_splits.every((decision) => decision.split_user === 50)).toBe(true);
    expect(config.debt_splits.every((decision) => decision.split_user === 50)).toBe(true);
    expect(config.spousal_maintenance.direction).toBe("none");
    expect(config.child_maintenance.direction).toBe("none");
    expect(config.housing_change).toEqual({ user_new_rent: null, partner_new_rent: null });
    expect(config.income_changes).toEqual({ user_new_net_monthly: null, partner_new_net_monthly: null });
  });
});

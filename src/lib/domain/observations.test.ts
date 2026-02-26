import { describe, expect, it } from "vitest";
import { generateScenarioObservations } from "@/lib/domain/observations";
import type { ScenarioResults } from "@/lib/domain/types";

const baseResult: ScenarioResults = {
  label: "modelled_outcome",
  user_total_assets: 100000,
  user_total_liabilities: 30000,
  user_net_position: 70000,
  user_property_equity: 50000,
  user_total_pensions: 20000,
  user_total_savings: 30000,
  user_total_debts: 10000,
  user_monthly_income: 3000,
  user_monthly_expenditure: 3200,
  user_monthly_surplus_deficit: -200,
  user_maintenance_paid: 0,
  user_maintenance_received: 0,
  partner_total_assets: 100000,
  partner_total_liabilities: 30000,
  partner_net_position: 70000,
  partner_property_equity: 50000,
  partner_total_pensions: 20000,
  partner_total_savings: 30000,
  partner_total_debts: 10000,
  partner_monthly_income: 3000,
  partner_monthly_expenditure: 3000,
  partner_monthly_surplus_deficit: 0,
  partner_maintenance_paid: 0,
  partner_maintenance_received: 0,
  delta_user_assets: -1000,
  delta_user_monthly: -200,
  delta_user_net_position: -15000,
};

describe("generateScenarioObservations", () => {
  it("returns deterministic lines for deficit and net decline", () => {
    const observations = generateScenarioObservations("Scenario B", baseResult);

    expect(observations.length).toBeGreaterThan(1);
    expect(observations[0]).toContain("Scenario B");
    expect(observations.join(" ")).toContain("monthly expenditure exceeds income");
  });

  it("adds maintenance note when configured", () => {
    const observations = generateScenarioObservations("Scenario C", {
      ...baseResult,
      user_maintenance_paid: 450,
      user_monthly_surplus_deficit: 150,
      delta_user_net_position: 5000,
    });

    expect(observations.join(" ")).toContain("maintenance paid by you");
  });
});

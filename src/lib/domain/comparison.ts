import type { ComparisonMetric, ScenarioRecord, ScenarioResults } from "@/lib/domain/types";

export function comparisonMetrics(
  baseline: ScenarioResults,
  scenarios: ScenarioRecord[]
): ComparisonMetric[] {
  const toMetric = (
    key: string,
    label: string,
    baselineValue: number,
    getter: (scenario: ScenarioRecord) => number
  ): ComparisonMetric => ({
    key,
    label,
    baseline: baselineValue,
    scenarios: scenarios.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      value: getter(scenario),
    })),
  });

  return [
    toMetric("net", "Net asset position", baseline.user_net_position, (s) => s.results.user_net_position),
    toMetric("property", "Total property equity", baseline.user_property_equity, (s) => s.results.user_property_equity),
    toMetric("pension", "Total pension value", baseline.user_total_pensions, (s) => s.results.user_total_pensions),
    toMetric("savings", "Total savings", baseline.user_total_savings, (s) => s.results.user_total_savings),
    toMetric("debts", "Total debts", baseline.user_total_debts, (s) => s.results.user_total_debts),
    toMetric("income", "Monthly income", baseline.user_monthly_income, (s) => s.results.user_monthly_income),
    toMetric("expenditure", "Monthly expenditure", baseline.user_monthly_expenditure, (s) => s.results.user_monthly_expenditure),
    toMetric("surplus", "Monthly surplus/deficit", baseline.user_monthly_surplus_deficit, (s) => s.results.user_monthly_surplus_deficit),
    toMetric("maintenance", "Maintenance (paid - received)", baseline.user_maintenance_paid - baseline.user_maintenance_received, (s) => s.results.user_maintenance_paid - s.results.user_maintenance_received),
  ];
}

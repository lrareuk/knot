import type {
  ComparisonMetricGroup,
  ComparisonMetricRow,
  ScenarioRecord,
  ScenarioResults,
} from "@/lib/domain/types";

type RowSpec = {
  key: string;
  label: string;
  group: ComparisonMetricRow["group"];
  better: ComparisonMetricRow["better"];
  baselineValue: (baseline: ScenarioResults) => number;
  scenarioValue: (scenario: ScenarioRecord) => number;
};

const GROUP_LABELS: Record<ComparisonMetricRow["group"], string> = {
  assets: "Assets",
  liabilities: "Liabilities",
  monthly: "Monthly",
};

const ROWS: RowSpec[] = [
  {
    key: "net",
    label: "Net position",
    group: "assets",
    better: "higher",
    baselineValue: (baseline) => baseline.user_net_position,
    scenarioValue: (scenario) => scenario.results.user_net_position,
  },
  {
    key: "property",
    label: "Property equity",
    group: "assets",
    better: "higher",
    baselineValue: (baseline) => baseline.user_property_equity,
    scenarioValue: (scenario) => scenario.results.user_property_equity,
  },
  {
    key: "pensions",
    label: "Pensions",
    group: "assets",
    better: "higher",
    baselineValue: (baseline) => baseline.user_total_pensions,
    scenarioValue: (scenario) => scenario.results.user_total_pensions,
  },
  {
    key: "savings",
    label: "Savings",
    group: "assets",
    better: "higher",
    baselineValue: (baseline) => baseline.user_total_savings,
    scenarioValue: (scenario) => scenario.results.user_total_savings,
  },
  {
    key: "debts",
    label: "Total debts",
    group: "liabilities",
    better: "lower",
    baselineValue: (baseline) => baseline.user_total_debts,
    scenarioValue: (scenario) => scenario.results.user_total_debts,
  },
  {
    key: "income",
    label: "Income",
    group: "monthly",
    better: "higher",
    baselineValue: (baseline) => baseline.user_monthly_income,
    scenarioValue: (scenario) => scenario.results.user_monthly_income,
  },
  {
    key: "expenditure",
    label: "Expenditure",
    group: "monthly",
    better: "lower",
    baselineValue: (baseline) => baseline.user_monthly_expenditure,
    scenarioValue: (scenario) => scenario.results.user_monthly_expenditure,
  },
  {
    key: "maintenance",
    label: "Maintenance (net)",
    group: "monthly",
    better: "higher",
    baselineValue: (baseline) => baseline.user_maintenance_received - baseline.user_maintenance_paid,
    scenarioValue: (scenario) => scenario.results.user_maintenance_received - scenario.results.user_maintenance_paid,
  },
  {
    key: "surplus",
    label: "Surplus / deficit",
    group: "monthly",
    better: "higher",
    baselineValue: (baseline) => baseline.user_monthly_surplus_deficit,
    scenarioValue: (scenario) => scenario.results.user_monthly_surplus_deficit,
  },
];

function findBestValue(row: RowSpec, values: number[]) {
  if (values.length === 0) {
    return null;
  }

  if (row.better === "higher") {
    return Math.max(...values);
  }
  return Math.min(...values);
}

export function comparisonMetricGroups(
  baseline: ScenarioResults,
  scenarios: ScenarioRecord[]
): ComparisonMetricGroup[] {
  const rows: ComparisonMetricRow[] = ROWS.map((row) => {
    const baselineValue = row.baselineValue(baseline);
    const values = scenarios.map((scenario) => row.scenarioValue(scenario));
    const bestValue = findBestValue(row, values);

    return {
      key: row.key,
      label: row.label,
      group: row.group,
      better: row.better,
      baseline: baselineValue,
      scenarios: scenarios.map((scenario) => {
        const value = row.scenarioValue(scenario);
        return {
          id: scenario.id,
          name: scenario.name,
          value,
          delta: value - baselineValue,
          isBest: bestValue !== null && value === bestValue,
        };
      }),
    };
  });

  return (Object.keys(GROUP_LABELS) as Array<ComparisonMetricRow["group"]>).map((groupKey) => ({
    key: groupKey,
    label: GROUP_LABELS[groupKey],
    rows: rows.filter((row) => row.group === groupKey),
  }));
}

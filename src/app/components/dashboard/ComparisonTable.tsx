"use client";

import { formatCurrency } from "@/lib/domain/currency";
import type { ScenarioRecord, ScenarioResults } from "@/lib/domain/types";

type Props = {
  baseline: ScenarioResults;
  scenarios: ScenarioRecord[];
  currencyCode: "GBP" | "USD" | "CAD";
  jurisdictionCode: string;
};

type BetterDirection = "higher" | "lower";

type MetricRow = {
  key: string;
  label: string;
  better: BetterDirection;
  baselineValue: number;
  valueForScenario: (scenario: ScenarioRecord) => number;
  formatValue?: (value: number, currencyCode: "GBP" | "USD" | "CAD") => string;
  valueClassName?: (value: number) => string;
};

function maintenanceLabel(value: number, currencyCode: "GBP" | "USD" | "CAD") {
  if (value === 0) {
    return "No maintenance";
  }

  if (value > 0) {
    return `You receive ${formatCurrency(value, currencyCode)}/mo`;
  }

  return `You pay ${formatCurrency(Math.abs(value), currencyCode)}/mo`;
}

function metricRows(baseline: ScenarioResults, jurisdictionCode: string): MetricRow[] {
  const normalizedJurisdiction = jurisdictionCode.trim().toUpperCase();
  const pensionRow: MetricRow =
    normalizedJurisdiction === "GB-EAW"
      ? {
          key: "pension_income_annual",
          label: "Projected pension income (annual)",
          better: "higher",
          baselineValue: baseline.user_pension_income_annual,
          valueForScenario: (scenario) => scenario.results.user_pension_income_annual,
        }
      : {
          key: "pensions",
          label: "Pension value (yours)",
          better: "higher",
          baselineValue: baseline.user_total_pensions,
          valueForScenario: (scenario) => scenario.results.user_total_pensions,
        };

  return [
    {
      key: "net",
      label: "Net asset position",
      better: "higher",
      baselineValue: baseline.user_net_position,
      valueForScenario: (scenario) => scenario.results.user_net_position,
    },
    {
      key: "property",
      label: "Property equity (yours)",
      better: "higher",
      baselineValue: baseline.user_property_equity,
      valueForScenario: (scenario) => scenario.results.user_property_equity,
    },
    pensionRow,
    {
      key: "savings",
      label: "Savings (yours)",
      better: "higher",
      baselineValue: baseline.user_total_savings,
      valueForScenario: (scenario) => scenario.results.user_total_savings,
    },
    {
      key: "debts",
      label: "Debts (yours)",
      better: "lower",
      baselineValue: baseline.user_total_debts,
      valueForScenario: (scenario) => scenario.results.user_total_debts,
      valueClassName: () => " is-negative",
    },
    {
      key: "income",
      label: "Monthly income",
      better: "higher",
      baselineValue: baseline.user_monthly_income,
      valueForScenario: (scenario) => scenario.results.user_monthly_income,
    },
    {
      key: "expenditure",
      label: "Monthly expenditure",
      better: "lower",
      baselineValue: baseline.user_monthly_expenditure,
      valueForScenario: (scenario) => scenario.results.user_monthly_expenditure,
    },
    {
      key: "surplus",
      label: "Monthly surplus / deficit",
      better: "higher",
      baselineValue: baseline.user_monthly_surplus_deficit,
      valueForScenario: (scenario) => scenario.results.user_monthly_surplus_deficit,
      valueClassName: (value) => (value < 0 ? " is-negative" : ""),
    },
    {
      key: "maintenance",
      label: "Maintenance (paid / received)",
      better: "higher",
      baselineValue: baseline.user_maintenance_received - baseline.user_maintenance_paid,
      valueForScenario: (scenario) => scenario.results.user_maintenance_received - scenario.results.user_maintenance_paid,
      formatValue: maintenanceLabel,
      valueClassName: (value) => (value < 0 ? " is-negative" : ""),
    },
  ];
}

function deltaTone(delta: number, better: BetterDirection) {
  if (delta === 0) {
    return "";
  }

  if (better === "higher") {
    return delta > 0 ? " is-positive" : " is-negative";
  }

  return delta < 0 ? " is-positive" : " is-negative";
}

function deltaText(delta: number, better: BetterDirection, currencyCode: "GBP" | "USD" | "CAD") {
  if (delta === 0) {
    return "No change";
  }

  const improved = better === "higher" ? delta > 0 : delta < 0;
  return `${improved ? "↑" : "↓"} ${formatCurrency(Math.abs(delta), currencyCode)}`;
}

export default function ComparisonTable({ baseline, scenarios, currencyCode, jurisdictionCode }: Props) {
  const rows = metricRows(baseline, jurisdictionCode);

  return (
    <div className="dashboard-compare-table-wrap">
      <table className="dashboard-compare-table">
        <thead>
          <tr>
            <th className="dashboard-compare-sticky-col">Metric</th>
            <th className="dashboard-compare-baseline">Baseline</th>
            {scenarios.map((scenario) => (
              <th key={scenario.id} className="dashboard-compare-scenario-head">
                {scenario.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="dashboard-compare-metric dashboard-compare-sticky-col">{row.label}</td>
              <td>
                <div className={`dashboard-compare-value${row.valueClassName ? row.valueClassName(row.baselineValue) : ""}`}>
                  {row.formatValue ? row.formatValue(row.baselineValue, currencyCode) : formatCurrency(row.baselineValue, currencyCode)}
                </div>
              </td>
              {scenarios.map((scenario) => {
                const value = row.valueForScenario(scenario);
                const delta = value - row.baselineValue;

                return (
                  <td key={scenario.id}>
                    <div className={`dashboard-compare-value${row.valueClassName ? row.valueClassName(value) : ""}`}>
                      {row.formatValue ? row.formatValue(value, currencyCode) : formatCurrency(value, currencyCode)}
                    </div>
                    <p className={`dashboard-delta dashboard-delta-sm${deltaTone(delta, row.better)}`}>
                      {deltaText(delta, row.better, currencyCode)}
                    </p>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

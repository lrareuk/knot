"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { comparisonMetricGroups } from "@/lib/domain/comparison";
import { formatCurrency } from "@/lib/domain/currency";
import type { ScenarioRecord, ScenarioResults } from "@/lib/domain/types";

type Props = {
  baseline: ScenarioResults;
  scenarios: ScenarioRecord[];
};

function deltaClass(value: number) {
  if (value > 0) return "is-positive";
  if (value < 0) return "is-negative";
  return "";
}

export default function CompareView({ baseline, scenarios }: Props) {
  const initialSelection = scenarios.slice(0, Math.min(2, scenarios.length)).map((scenario) => scenario.id);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>(initialSelection);

  const selectedScenarios = useMemo(
    () => scenarios.filter((scenario) => selectedScenarioIds.includes(scenario.id)),
    [scenarios, selectedScenarioIds]
  );

  const groups = useMemo(() => comparisonMetricGroups(baseline, selectedScenarios), [baseline, selectedScenarios]);

  const toggleScenario = (id: string) => {
    setSelectedScenarioIds((current) => {
      if (current.includes(id)) {
        if (current.length <= 1) {
          return current;
        }
        return current.filter((value) => value !== id);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, id];
    });
  };

  if (scenarios.length < 2) {
    return (
      <div className="dashboard-page">
        <header className="dashboard-page-header">
          <div>
            <h1 className="dashboard-page-title">Compare scenarios</h1>
            <p className="dashboard-page-subtitle">Select scenarios to view side by side against your current position.</p>
          </div>
        </header>

        <section className="dashboard-empty-state">
          <p>You need at least two scenarios to compare. Create another scenario to get started.</p>
          <Link href="/dashboard/scenarios" className="dashboard-btn">
            Go to scenarios
          </Link>
        </section>
      </div>
    );
  }

  const reportHref = `/dashboard/report?scenarios=${encodeURIComponent(selectedScenarioIds.join(","))}`;

  return (
    <div className="dashboard-page dashboard-compare-page">
      <header className="dashboard-page-header dashboard-compare-header">
        <div>
          <h1 className="dashboard-page-title">Compare scenarios</h1>
          <p className="dashboard-page-subtitle">Select scenarios to view side by side against your current position.</p>
        </div>
      </header>

      <section className="dashboard-chip-row dashboard-compare-chip-row" aria-label="Scenario selection">
        <span className="dashboard-chip is-baseline">Current position</span>
        {scenarios.map((scenario) => {
          const selected = selectedScenarioIds.includes(scenario.id);
          return (
            <button
              key={scenario.id}
              type="button"
              className={`dashboard-chip${selected ? " is-selected" : ""}`}
              onClick={() => toggleScenario(scenario.id)}
              aria-pressed={selected}
            >
              {scenario.name}
            </button>
          );
        })}
      </section>

      <section className="dashboard-compare-table-wrap dashboard-compare-table-wrap-v2">
        <table className="dashboard-compare-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Current position</th>
              {selectedScenarios.map((scenario) => (
                <th key={scenario.id}>{scenario.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.key}>
                <tr className="dashboard-compare-group">
                  <td colSpan={2 + selectedScenarios.length}>{group.label}</td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.key}>
                    <td className="dashboard-compare-metric">{row.label}</td>
                    <td>
                      <div className="dashboard-compare-value">{formatCurrency(row.baseline)}</div>
                    </td>
                    {row.scenarios.map((scenarioCell) => (
                      <td key={scenarioCell.id} className={scenarioCell.isBest ? "dashboard-compare-best" : undefined}>
                        <div className="dashboard-compare-value">{formatCurrency(scenarioCell.value)}</div>
                        <div className={`dashboard-delta ${deltaClass(scenarioCell.delta)}`}>
                          {scenarioCell.delta === 0
                            ? "—"
                            : `${scenarioCell.delta > 0 ? "↑ +" : "↓ −"}${formatCurrency(Math.abs(scenarioCell.delta))}`}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </section>

      <div className="dashboard-compare-actions dashboard-compare-actions-v2">
        <Link href={reportHref} className="dashboard-btn">
          Include in report
        </Link>
        <button type="button" className="dashboard-print-link" onClick={() => window.print()}>
          Print comparison
        </button>
      </div>
    </div>
  );
}

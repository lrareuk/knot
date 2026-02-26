"use client";

import { useMemo, useState } from "react";
import { comparisonMetrics } from "@/lib/domain/comparison";
import { formatCurrency } from "@/lib/domain/currency";
import type { ScenarioRecord, ScenarioResults } from "@/lib/domain/types";

type Props = {
  baseline: ScenarioResults;
  scenarios: ScenarioRecord[];
};

export default function CompareView({ baseline, scenarios }: Props) {
  const initialSelection = scenarios.slice(0, 2).map((scenario) => scenario.id);
  const [selected, setSelected] = useState<string[]>(initialSelection);

  const selectedScenarios = useMemo(
    () => scenarios.filter((scenario) => selected.includes(scenario.id)),
    [scenarios, selected]
  );

  const metrics = comparisonMetrics(baseline, selectedScenarios);

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, id];
    });
  };

  return (
    <main className="page-shell stack-lg">
      <section className="panel stack-md">
        <h1>Compare scenarios</h1>
        <p className="muted">Select 2-3 scenarios. Baseline is always included for reference.</p>
        <div className="row-wrap">
          {scenarios.map((scenario) => (
            <label key={scenario.id} className="inline-control">
              <input
                type="checkbox"
                checked={selected.includes(scenario.id)}
                onChange={() => toggle(scenario.id)}
              />
              {scenario.name}
            </label>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Baseline</th>
                {selectedScenarios.map((scenario) => (
                  <th key={scenario.id}>{scenario.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.key}>
                  <td>{metric.label}</td>
                  <td>{formatCurrency(metric.baseline)}</td>
                  {metric.scenarios.map((scenario) => (
                    <td key={scenario.id}>{formatCurrency(scenario.value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

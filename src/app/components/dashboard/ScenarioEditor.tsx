"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeScenario } from "@/lib/domain/compute-scenario";
import { formatCurrency } from "@/lib/domain/currency";
import type { FinancialPosition, ScenarioConfig, ScenarioRecord, ScenarioResults } from "@/lib/domain/types";

type Props = {
  scenario: ScenarioRecord;
  position: FinancialPosition;
  baseline: ScenarioResults;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function NumberInput({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  return (
    <input
      type="number"
      value={typeof value === "number" ? value : ""}
      onChange={(event) => {
        const nextValue = event.target.value;
        if (nextValue === "") {
          onChange(null);
          return;
        }
        const parsed = Number(nextValue);
        onChange(Number.isFinite(parsed) ? parsed : null);
      }}
    />
  );
}

export default function ScenarioEditor({ scenario, position, baseline }: Props) {
  const [name, setName] = useState(scenario.name);
  const [config, setConfig] = useState<ScenarioConfig>(scenario.config);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const dirtyRef = useRef(false);

  const results = useMemo(() => computeScenario(position, config), [config, position]);

  const applyConfig = (nextConfig: ScenarioConfig) => {
    dirtyRef.current = true;
    setConfig(nextConfig);
  };

  useEffect(() => {
    if (!dirtyRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      setSaveState("saving");
      const response = await fetch(`/api/scenarios/${scenario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          config,
        }),
      });

      if (response.ok) {
        dirtyRef.current = false;
        setSaveState("saved");
      } else {
        setSaveState("error");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [config, name, scenario.id]);

  const propertyById = useMemo(() => new Map(position.properties.map((item) => [item.id, item])), [position.properties]);
  const pensionById = useMemo(() => new Map(position.pensions.map((item) => [item.id, item])), [position.pensions]);
  const savingsById = useMemo(() => new Map(position.savings.map((item) => [item.id, item])), [position.savings]);
  const debtById = useMemo(() => new Map(position.debts.map((item) => [item.id, item])), [position.debts]);

  const saveLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : "Auto-save enabled";

  return (
    <main className="page-shell">
      <div className="layout-two-col">
        <section className="panel stack-md">
          <label>
            Scenario name
            <input
              value={name}
              onChange={(event) => {
                dirtyRef.current = true;
                setName(event.target.value);
              }}
            />
          </label>

          <p className="muted">{saveLabel}</p>

          <h2>Property decisions</h2>
          {config.property_decisions.map((decision, index) => {
            const property = propertyById.get(decision.property_id);
            if (!property) return null;

            return (
              <article key={decision.property_id} className="nested-panel stack-sm">
                <h3>{property.label || "Property"}</h3>
                <label>
                  Action
                  <select
                    value={decision.action}
                    onChange={(event) => {
                      const property_decisions = [...config.property_decisions];
                      property_decisions[index] = {
                        ...decision,
                        action: event.target.value as ScenarioConfig["property_decisions"][number]["action"],
                      };
                      applyConfig({ ...config, property_decisions });
                    }}
                  >
                    <option value="sell">Sell</option>
                    <option value="user_keeps">User keeps</option>
                    <option value="partner_keeps">Partner keeps</option>
                  </select>
                </label>
                <label>
                  User equity split (%)
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={decision.equity_split_user}
                    onChange={(event) => {
                      const property_decisions = [...config.property_decisions];
                      property_decisions[index] = {
                        ...decision,
                        equity_split_user: Number(event.target.value),
                      };
                      applyConfig({ ...config, property_decisions });
                    }}
                  />
                </label>
                <p className="muted">{decision.equity_split_user}% user / {100 - decision.equity_split_user}% partner</p>
              </article>
            );
          })}

          <h2>Pension splits</h2>
          {config.pension_splits.map((split, index) => {
            const pension = pensionById.get(split.pension_id);
            if (!pension) return null;
            return (
              <article key={split.pension_id} className="nested-panel stack-sm">
                <h3>{pension.label || "Pension"}</h3>
                <label>
                  User split (%)
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={split.split_user}
                    onChange={(event) => {
                      const pension_splits = [...config.pension_splits];
                      pension_splits[index] = { ...split, split_user: Number(event.target.value) };
                      applyConfig({ ...config, pension_splits });
                    }}
                  />
                </label>
                <p className="muted">{split.split_user}% user / {100 - split.split_user}% partner</p>
              </article>
            );
          })}

          <h2>Savings splits</h2>
          {config.savings_splits.map((split, index) => {
            const savings = savingsById.get(split.savings_id);
            if (!savings) return null;
            return (
              <article key={split.savings_id} className="nested-panel stack-sm">
                <h3>{savings.label || "Savings"}</h3>
                <label>
                  User split (%)
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={split.split_user}
                    onChange={(event) => {
                      const savings_splits = [...config.savings_splits];
                      savings_splits[index] = { ...split, split_user: Number(event.target.value) };
                      applyConfig({ ...config, savings_splits });
                    }}
                  />
                </label>
                <p className="muted">{split.split_user}% user / {100 - split.split_user}% partner</p>
              </article>
            );
          })}

          <h2>Debt splits</h2>
          {config.debt_splits.map((split, index) => {
            const debt = debtById.get(split.debt_id);
            if (!debt) return null;
            return (
              <article key={split.debt_id} className="nested-panel stack-sm">
                <h3>{debt.label || "Debt"}</h3>
                <label>
                  User split (%)
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={split.split_user}
                    onChange={(event) => {
                      const debt_splits = [...config.debt_splits];
                      debt_splits[index] = { ...split, split_user: Number(event.target.value) };
                      applyConfig({ ...config, debt_splits });
                    }}
                  />
                </label>
                <p className="muted">{split.split_user}% user / {100 - split.split_user}% partner</p>
              </article>
            );
          })}

          <h2>Maintenance</h2>
          <article className="nested-panel stack-sm">
            <label>
              Spousal maintenance direction
              <select
                value={config.spousal_maintenance.direction}
                onChange={(event) =>
                  applyConfig({
                    ...config,
                    spousal_maintenance: {
                      ...config.spousal_maintenance,
                      direction: event.target.value as ScenarioConfig["spousal_maintenance"]["direction"],
                    },
                  })
                }
              >
                <option value="none">None</option>
                <option value="user_pays">User pays</option>
                <option value="partner_pays">Partner pays</option>
              </select>
            </label>
            <label>
              Spousal maintenance monthly amount
              <NumberInput
                value={config.spousal_maintenance.monthly_amount}
                onChange={(value) =>
                  applyConfig({
                    ...config,
                    spousal_maintenance: {
                      ...config.spousal_maintenance,
                      monthly_amount: value ?? 0,
                    },
                  })
                }
              />
            </label>
            <label>
              Duration (months)
              <NumberInput
                value={config.spousal_maintenance.duration_months}
                onChange={(value) =>
                  applyConfig({
                    ...config,
                    spousal_maintenance: {
                      ...config.spousal_maintenance,
                      duration_months: value ?? 0,
                    },
                  })
                }
              />
            </label>

            <label>
              Child maintenance direction
              <select
                value={config.child_maintenance.direction}
                onChange={(event) =>
                  applyConfig({
                    ...config,
                    child_maintenance: {
                      ...config.child_maintenance,
                      direction: event.target.value as ScenarioConfig["child_maintenance"]["direction"],
                    },
                  })
                }
              >
                <option value="none">None</option>
                <option value="user_pays">User pays</option>
                <option value="partner_pays">Partner pays</option>
              </select>
            </label>
            <label>
              Child maintenance monthly amount
              <NumberInput
                value={config.child_maintenance.monthly_amount}
                onChange={(value) =>
                  applyConfig({
                    ...config,
                    child_maintenance: {
                      ...config.child_maintenance,
                      monthly_amount: value ?? 0,
                    },
                  })
                }
              />
            </label>
          </article>

          <h2>Housing changes</h2>
          <article className="nested-panel stack-sm">
            <label>
              User new housing cost
              <NumberInput
                value={config.housing_change.user_new_rent}
                onChange={(value) =>
                  applyConfig({ ...config, housing_change: { ...config.housing_change, user_new_rent: value } })
                }
              />
            </label>
            <label>
              Partner new housing cost
              <NumberInput
                value={config.housing_change.partner_new_rent}
                onChange={(value) =>
                  applyConfig({
                    ...config,
                    housing_change: {
                      ...config.housing_change,
                      partner_new_rent: value,
                    },
                  })
                }
              />
            </label>
          </article>

          <h2>Income changes</h2>
          <article className="nested-panel stack-sm">
            <label>
              User new net monthly income
              <NumberInput
                value={config.income_changes.user_new_net_monthly}
                onChange={(value) =>
                  applyConfig({
                    ...config,
                    income_changes: {
                      ...config.income_changes,
                      user_new_net_monthly: value,
                    },
                  })
                }
              />
            </label>
            <label>
              Partner new net monthly income
              <NumberInput
                value={config.income_changes.partner_new_net_monthly}
                onChange={(value) =>
                  applyConfig({
                    ...config,
                    income_changes: {
                      ...config.income_changes,
                      partner_new_net_monthly: value,
                    },
                  })
                }
              />
            </label>
          </article>
        </section>

        <section className="panel stack-md">
          <h2>Scenario result (modelled outcome)</h2>
          <p className="muted">
            Child maintenance is an illustrative estimate. Spousal maintenance (aliment) is illustrative only. This model does not include tax implications.
          </p>

          <ResultRow label="User net position" value={results.user_net_position} delta={results.delta_user_net_position} />
          <ResultRow label="User monthly surplus/deficit" value={results.user_monthly_surplus_deficit} delta={results.delta_user_monthly} />
          <ResultRow label="User property equity" value={results.user_property_equity} delta={results.user_property_equity - baseline.user_property_equity} />
          <ResultRow label="User pensions" value={results.user_total_pensions} delta={results.user_total_pensions - baseline.user_total_pensions} />
          <ResultRow label="User savings" value={results.user_total_savings} delta={results.user_total_savings - baseline.user_total_savings} />
          <ResultRow label="User debts" value={results.user_total_debts} delta={results.user_total_debts - baseline.user_total_debts} invert />

          <div className="panel nested-panel stack-xs">
            <p className="muted">Partner monthly surplus/deficit</p>
            <p>{formatCurrency(results.partner_monthly_surplus_deficit)}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ResultRow({
  label,
  value,
  delta,
  invert,
}: {
  label: string;
  value: number;
  delta: number;
  invert?: boolean;
}) {
  const isPositive = invert ? delta <= 0 : delta >= 0;

  return (
    <div className="result-row">
      <div>
        <p className="muted">{label}</p>
        <p>{formatCurrency(value)}</p>
      </div>
      <p className={isPositive ? "delta-positive" : "delta-negative"}>
        {delta >= 0 ? "+" : ""}
        {formatCurrency(delta)}
      </p>
    </div>
  );
}

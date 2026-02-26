"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CountUp from "@/app/components/dashboard/CountUp";
import { formatCurrency } from "@/lib/domain/currency";
import { computeScenario } from "@/lib/domain/compute-scenario";
import type { FinancialPosition, ScenarioConfig, ScenarioRecord, ScenarioResults } from "@/lib/domain/types";

type Props = {
  scenario: ScenarioRecord;
  position: FinancialPosition;
  baseline: ScenarioResults;
};

type SaveState = "idle" | "saving" | "saved" | "error";

type SectionKey =
  | "property"
  | "pension"
  | "savings"
  | "debts"
  | "maintenance"
  | "housing"
  | "income";

const SECTION_ORDER: SectionKey[] = ["property", "pension", "savings", "debts", "maintenance", "housing", "income"];

function parseNumber(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

function parseNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function deltaClass(value: number, invert = false) {
  if (value === 0) return "";
  const positive = invert ? value < 0 : value > 0;
  return positive ? "is-positive" : "is-negative";
}

function DeltaValue({ value, suffix, invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  const text = value === 0 ? "—" : `${value > 0 ? "↑ +" : "↓ −"}${formatCurrency(Math.abs(value))}${suffix ? ` ${suffix}` : ""}`;
  return (
    <p key={value} className={`dashboard-delta ${deltaClass(value, invert)} is-pulse`}>
      {text}
    </p>
  );
}

function OutcomeRow({
  label,
  value,
  delta,
  invert,
}: {
  label: string;
  value: number;
  delta?: number;
  invert?: boolean;
}) {
  return (
    <div className="dashboard-outcome-row">
      <p className="dashboard-outcome-row-label">{label}</p>
      <div className="dashboard-outcome-row-right">
        <p className="dashboard-outcome-row-value">{formatCurrency(value)}</p>
        {typeof delta === "number" ? <DeltaValue value={delta} invert={invert} /> : null}
      </div>
    </div>
  );
}

export default function ScenarioEditor({ scenario, position, baseline }: Props) {
  const router = useRouter();
  const [name, setName] = useState(scenario.name);
  const [config, setConfig] = useState<ScenarioConfig>(scenario.config);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    property: true,
    pension: true,
    savings: true,
    debts: true,
    maintenance: true,
    housing: true,
    income: true,
  });
  const dirtyRef = useRef(false);

  const results = useMemo(() => computeScenario(position, config), [config, position]);
  const propertyById = useMemo(() => new Map(position.properties.map((item) => [item.id, item])), [position.properties]);
  const pensionById = useMemo(() => new Map(position.pensions.map((item) => [item.id, item])), [position.pensions]);
  const savingsById = useMemo(() => new Map(position.savings.map((item) => [item.id, item])), [position.savings]);
  const debtById = useMemo(() => new Map(position.debts.map((item) => [item.id, item])), [position.debts]);

  const userKeepsProperty = config.property_decisions.some((decision) => decision.action === "user_keeps");
  const partnerKeepsProperty = config.property_decisions.some((decision) => decision.action === "partner_keeps");

  const setConfigDirty = (next: ScenarioConfig) => {
    dirtyRef.current = true;
    setConfig(next);
  };

  useEffect(() => {
    if (!dirtyRef.current) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      const response = await fetch(`/api/scenarios/${scenario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim().slice(0, 40) || "Scenario",
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

    return () => window.clearTimeout(timer);
  }, [config, name, scenario.id]);

  const saveStatusLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : "Auto-save enabled";

  const duplicateScenario = async () => {
    const response = await fetch(`/api/scenarios/${scenario.id}/duplicate`, { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as { scenario?: ScenarioRecord };
    if (!response.ok || !payload.scenario?.id) {
      return;
    }
    router.push(`/dashboard/scenarios/${payload.scenario.id}`);
  };

  const deleteScenario = async () => {
    const response = await fetch(`/api/scenarios/${scenario.id}`, { method: "DELETE" });
    if (!response.ok) {
      return;
    }
    router.push("/dashboard/scenarios");
    router.refresh();
  };

  const maintenanceNet = results.user_maintenance_received - results.user_maintenance_paid;

  return (
    <div className="dashboard-page">
      <div className="dashboard-editor-header">
        <button type="button" className="dashboard-editor-back" onClick={() => router.push("/dashboard/scenarios")} aria-label="Back">
          ←
        </button>
        <input
          className="dashboard-editable-name-input"
          value={name}
          maxLength={40}
          aria-label="Scenario name"
          onChange={(event) => {
            dirtyRef.current = true;
            setName(event.target.value);
          }}
        />
        <button type="button" className="dashboard-btn-text" onClick={duplicateScenario}>
          Duplicate
        </button>
        <button type="button" className="dashboard-btn-text dashboard-sidebar-danger" onClick={() => setConfirmDelete((current) => !current)}>
          Delete
        </button>
        <p className="dashboard-save-status">{saveStatusLabel}</p>
      </div>

      {confirmDelete ? (
        <div className="dashboard-delete-inline">
          <p>Delete this scenario? This cannot be undone.</p>
          <div className="dashboard-inline-actions">
            <button type="button" className="dashboard-btn-text" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button type="button" className="dashboard-btn-danger" onClick={deleteScenario}>
              Delete
            </button>
          </div>
        </div>
      ) : null}

      <div className="dashboard-editor">
        <section className="dashboard-editor-left">
          {SECTION_ORDER.map((sectionKey) => {
            const expanded = expandedSections[sectionKey];
            const setExpanded = () =>
              setExpandedSections((current) => ({
                ...current,
                [sectionKey]: !current[sectionKey],
              }));

            if (sectionKey === "property") {
              return (
                <div className="dashboard-section" key={sectionKey}>
                  <button type="button" className="dashboard-section-header" onClick={setExpanded} aria-expanded={expanded}>
                    <span className="dashboard-section-title">Property decisions</span>
                    <span className="dashboard-section-chevron">▾</span>
                  </button>
                  <div className="dashboard-section-body" data-open={expanded}>
                    {config.property_decisions.map((decision, index) => {
                      const property = propertyById.get(decision.property_id);
                      if (!property) return null;
                      const equity = property.current_value - property.mortgage_outstanding;
                      const userShare = Math.round((equity * decision.equity_split_user) / 100);
                      const partnerShare = equity - userShare;

                      return (
                        <div key={decision.property_id} className="dashboard-control-row">
                          <div className="dashboard-control-top">
                            <p className="dashboard-control-label">{property.label || "Property"}</p>
                            <p className="dashboard-control-sub">Equity: {formatCurrency(equity)}</p>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <select
                              className="dashboard-select"
                              value={decision.action}
                              onChange={(event) => {
                                const propertyDecisions = [...config.property_decisions];
                                propertyDecisions[index] = {
                                  ...decision,
                                  action: event.target.value as ScenarioConfig["property_decisions"][number]["action"],
                                };
                                setConfigDirty({ ...config, property_decisions: propertyDecisions });
                              }}
                            >
                              <option value="sell">Sell</option>
                              <option value="user_keeps">You keep</option>
                              <option value="partner_keeps">Partner keeps</option>
                            </select>
                          </div>

                          {decision.action === "sell" ? (
                            <>
                              <div className="dashboard-slider-wrap">
                                <input
                                  className="dashboard-slider"
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={decision.equity_split_user}
                                  onChange={(event) => {
                                    const propertyDecisions = [...config.property_decisions];
                                    propertyDecisions[index] = {
                                      ...decision,
                                      equity_split_user: Number(event.target.value),
                                    };
                                    setConfigDirty({ ...config, property_decisions: propertyDecisions });
                                  }}
                                />
                                <span className="dashboard-slider-pct">{decision.equity_split_user}%</span>
                              </div>
                              <p className="dashboard-slider-split">
                                You: {formatCurrency(userShare)} · Partner: {formatCurrency(partnerShare)}
                              </p>
                            </>
                          ) : (
                            <p className="dashboard-slider-split">
                              {decision.action === "user_keeps"
                                ? `You keep full equity: ${formatCurrency(equity)}`
                                : `Partner keeps full equity: ${formatCurrency(equity)}`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (sectionKey === "pension") {
              return (
                <div className="dashboard-section" key={sectionKey}>
                  <button type="button" className="dashboard-section-header" onClick={setExpanded} aria-expanded={expanded}>
                    <span className="dashboard-section-title">Pension splits</span>
                    <span className="dashboard-section-chevron">▾</span>
                  </button>
                  <div className="dashboard-section-body" data-open={expanded}>
                    {config.pension_splits.map((split, index) => {
                      const pension = pensionById.get(split.pension_id);
                      if (!pension) return null;
                      const userShare = Math.round((pension.current_value * split.split_user) / 100);
                      const partnerShare = pension.current_value - userShare;

                      return (
                        <div key={split.pension_id} className="dashboard-control-row">
                          <div className="dashboard-control-top">
                            <p className="dashboard-control-label">{pension.label || "Pension"}</p>
                            <p className="dashboard-control-sub">Value: {formatCurrency(pension.current_value)}</p>
                          </div>
                          <div className="dashboard-slider-wrap">
                            <input
                              className="dashboard-slider"
                              type="range"
                              min={0}
                              max={100}
                              value={split.split_user}
                              onChange={(event) => {
                                const pensionSplits = [...config.pension_splits];
                                pensionSplits[index] = { ...split, split_user: Number(event.target.value) };
                                setConfigDirty({ ...config, pension_splits: pensionSplits });
                              }}
                            />
                            <span className="dashboard-slider-pct">{split.split_user}%</span>
                          </div>
                          <p className="dashboard-slider-split">
                            You: {formatCurrency(userShare)} · Partner: {formatCurrency(partnerShare)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (sectionKey === "savings") {
              return (
                <div className="dashboard-section" key={sectionKey}>
                  <button type="button" className="dashboard-section-header" onClick={setExpanded} aria-expanded={expanded}>
                    <span className="dashboard-section-title">Savings splits</span>
                    <span className="dashboard-section-chevron">▾</span>
                  </button>
                  <div className="dashboard-section-body" data-open={expanded}>
                    {config.savings_splits.map((split, index) => {
                      const savings = savingsById.get(split.savings_id);
                      if (!savings) return null;
                      const userShare = Math.round((savings.current_value * split.split_user) / 100);
                      const partnerShare = savings.current_value - userShare;

                      return (
                        <div key={split.savings_id} className="dashboard-control-row">
                          <div className="dashboard-control-top">
                            <p className="dashboard-control-label">{savings.label || "Savings"}</p>
                            <p className="dashboard-control-sub">Value: {formatCurrency(savings.current_value)}</p>
                          </div>
                          <div className="dashboard-slider-wrap">
                            <input
                              className="dashboard-slider"
                              type="range"
                              min={0}
                              max={100}
                              value={split.split_user}
                              onChange={(event) => {
                                const savingsSplits = [...config.savings_splits];
                                savingsSplits[index] = { ...split, split_user: Number(event.target.value) };
                                setConfigDirty({ ...config, savings_splits: savingsSplits });
                              }}
                            />
                            <span className="dashboard-slider-pct">{split.split_user}%</span>
                          </div>
                          <p className="dashboard-slider-split">
                            You: {formatCurrency(userShare)} · Partner: {formatCurrency(partnerShare)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (sectionKey === "debts") {
              return (
                <div className="dashboard-section" key={sectionKey}>
                  <button type="button" className="dashboard-section-header" onClick={setExpanded} aria-expanded={expanded}>
                    <span className="dashboard-section-title">Debt splits</span>
                    <span className="dashboard-section-chevron">▾</span>
                  </button>
                  <div className="dashboard-section-body" data-open={expanded}>
                    {config.debt_splits.map((split, index) => {
                      const debt = debtById.get(split.debt_id);
                      if (!debt) return null;
                      const userShare = Math.round((debt.outstanding * split.split_user) / 100);
                      const partnerShare = debt.outstanding - userShare;

                      return (
                        <div key={split.debt_id} className="dashboard-control-row">
                          <div className="dashboard-control-top">
                            <p className="dashboard-control-label">{debt.label || "Debt"}</p>
                            <p className="dashboard-control-sub">Outstanding: {formatCurrency(debt.outstanding)}</p>
                          </div>
                          <div className="dashboard-slider-wrap">
                            <input
                              className="dashboard-slider"
                              type="range"
                              min={0}
                              max={100}
                              value={split.split_user}
                              onChange={(event) => {
                                const debtSplits = [...config.debt_splits];
                                debtSplits[index] = { ...split, split_user: Number(event.target.value) };
                                setConfigDirty({ ...config, debt_splits: debtSplits });
                              }}
                            />
                            <span className="dashboard-slider-pct">{split.split_user}%</span>
                          </div>
                          <p className="dashboard-slider-split">
                            You: {formatCurrency(userShare)} · Partner: {formatCurrency(partnerShare)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (sectionKey === "maintenance") {
              return (
                <div className="dashboard-section" key={sectionKey}>
                  <button type="button" className="dashboard-section-header" onClick={setExpanded} aria-expanded={expanded}>
                    <span className="dashboard-section-title">Maintenance</span>
                    <span className="dashboard-section-chevron">▾</span>
                  </button>
                  <div className="dashboard-section-body" data-open={expanded}>
                    <div className="dashboard-control-row">
                      <p className="dashboard-control-label">Spousal maintenance (aliment)</p>
                      <div className="dashboard-inline-actions" style={{ marginTop: 8 }}>
                        <select
                          className="dashboard-select"
                          value={config.spousal_maintenance.direction}
                          onChange={(event) =>
                            setConfigDirty({
                              ...config,
                              spousal_maintenance: {
                                ...config.spousal_maintenance,
                                direction: event.target.value as ScenarioConfig["spousal_maintenance"]["direction"],
                              },
                            })
                          }
                        >
                          <option value="none">None</option>
                          <option value="user_pays">You pay</option>
                          <option value="partner_pays">Partner pays</option>
                        </select>
                        <div className="dashboard-currency-wrap">
                          <span>£</span>
                          <input
                            className="dashboard-currency-input"
                            inputMode="decimal"
                            value={config.spousal_maintenance.monthly_amount}
                            onChange={(event) =>
                              setConfigDirty({
                                ...config,
                                spousal_maintenance: {
                                  ...config.spousal_maintenance,
                                  monthly_amount: parseNumber(event.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <input
                          className="dashboard-input"
                          type="number"
                          min={0}
                          style={{ width: 120 }}
                          value={config.spousal_maintenance.duration_months}
                          onChange={(event) =>
                            setConfigDirty({
                              ...config,
                              spousal_maintenance: {
                                ...config.spousal_maintenance,
                                duration_months: parseNumber(event.target.value),
                              },
                            })
                          }
                        />
                      </div>
                      <p className="dashboard-help" style={{ fontStyle: "italic", marginTop: 8 }}>
                        Illustrative only — there is no fixed formula for spousal maintenance.
                      </p>
                    </div>

                    <div className="dashboard-control-row">
                      <p className="dashboard-control-label">Child maintenance</p>
                      <div className="dashboard-inline-actions" style={{ marginTop: 8 }}>
                        <select
                          className="dashboard-select"
                          value={config.child_maintenance.direction}
                          onChange={(event) =>
                            setConfigDirty({
                              ...config,
                              child_maintenance: {
                                ...config.child_maintenance,
                                direction: event.target.value as ScenarioConfig["child_maintenance"]["direction"],
                              },
                            })
                          }
                        >
                          <option value="none">None</option>
                          <option value="user_pays">You pay</option>
                          <option value="partner_pays">Partner pays</option>
                        </select>
                        <div className="dashboard-currency-wrap">
                          <span>£</span>
                          <input
                            className="dashboard-currency-input"
                            inputMode="decimal"
                            value={config.child_maintenance.monthly_amount}
                            onChange={(event) =>
                              setConfigDirty({
                                ...config,
                                child_maintenance: {
                                  ...config.child_maintenance,
                                  monthly_amount: parseNumber(event.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <p className="dashboard-help" style={{ marginTop: 8 }}>
                        For an official estimate, use the CMS calculator at{" "}
                        <a
                          href="https://www.gov.uk/calculate-child-maintenance"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-link"
                        >
                          gov.uk/calculate-child-maintenance
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            if (sectionKey === "housing") {
              return (
                <div className="dashboard-section" key={sectionKey}>
                  <button type="button" className="dashboard-section-header" onClick={setExpanded} aria-expanded={expanded}>
                    <span className="dashboard-section-title">Post-separation housing</span>
                    <span className="dashboard-section-chevron">▾</span>
                  </button>
                  <div className="dashboard-section-body" data-open={expanded}>
                    {!userKeepsProperty ? (
                      <div className="dashboard-control-row">
                        <p className="dashboard-control-label">New monthly rent for you</p>
                        <div className="dashboard-currency-wrap" style={{ marginTop: 10 }}>
                          <span>£</span>
                          <input
                            className="dashboard-currency-input"
                            value={config.housing_change.user_new_rent ?? ""}
                            onChange={(event) =>
                              setConfigDirty({
                                ...config,
                                housing_change: {
                                  ...config.housing_change,
                                  user_new_rent: parseNullableNumber(event.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    ) : null}

                    {!partnerKeepsProperty ? (
                      <div className="dashboard-control-row">
                        <p className="dashboard-control-label">New monthly rent for partner</p>
                        <div className="dashboard-currency-wrap" style={{ marginTop: 10 }}>
                          <span>£</span>
                          <input
                            className="dashboard-currency-input"
                            value={config.housing_change.partner_new_rent ?? ""}
                            onChange={(event) =>
                              setConfigDirty({
                                ...config,
                                housing_change: {
                                  ...config.housing_change,
                                  partner_new_rent: parseNullableNumber(event.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    ) : null}

                    {userKeepsProperty && partnerKeepsProperty ? (
                      <p className="dashboard-help" style={{ padding: "14px 0" }}>
                        Housing overrides appear when one party does not keep a property.
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            }

            return (
              <div className="dashboard-section" key={sectionKey}>
                <button type="button" className="dashboard-section-header" onClick={setExpanded} aria-expanded={expanded}>
                  <span className="dashboard-section-title">Income changes</span>
                  <span className="dashboard-section-chevron">▾</span>
                </button>
                <div className="dashboard-section-body" data-open={expanded}>
                  <div className="dashboard-control-row">
                    <p className="dashboard-control-label">Your new net monthly income</p>
                    <div className="dashboard-currency-wrap" style={{ marginTop: 10 }}>
                      <span>£</span>
                      <input
                        className="dashboard-currency-input"
                        value={config.income_changes.user_new_net_monthly ?? ""}
                        onChange={(event) =>
                          setConfigDirty({
                            ...config,
                            income_changes: {
                              ...config.income_changes,
                              user_new_net_monthly: parseNullableNumber(event.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="dashboard-control-row">
                    <p className="dashboard-control-label">Partner’s new net monthly income</p>
                    <div className="dashboard-currency-wrap" style={{ marginTop: 10 }}>
                      <span>£</span>
                      <input
                        className="dashboard-currency-input"
                        value={config.income_changes.partner_new_net_monthly ?? ""}
                        onChange={(event) =>
                          setConfigDirty({
                            ...config,
                            income_changes: {
                              ...config.income_changes,
                              partner_new_net_monthly: parseNullableNumber(event.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <p className="dashboard-help" style={{ paddingTop: 10 }}>
                    Adjust if either party’s income will change after separation (for example returning to full-time work).
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <aside className="dashboard-editor-right">
          <p className="dashboard-outcome-header">Scenario outcome</p>

          <div className="dashboard-outcome-primary">
            <p className="dashboard-outcome-label">Your net position</p>
            <CountUp
              value={results.user_net_position}
              durationMs={400}
              render={(value) => formatCurrency(Math.round(value))}
              className="dashboard-outcome-value"
            />
            <DeltaValue value={results.delta_user_net_position} suffix="from current" />
          </div>

          <div className="dashboard-outcome-primary">
            <p className="dashboard-outcome-label">Monthly surplus / deficit</p>
            <CountUp
              value={results.user_monthly_surplus_deficit}
              durationMs={400}
              render={(value) => formatCurrency(Math.round(value))}
              className="dashboard-outcome-value secondary"
            />
            <DeltaValue value={results.delta_user_monthly} suffix="from current" />
          </div>

          <OutcomeRow
            label="Property equity retained"
            value={results.user_property_equity}
            delta={results.user_property_equity - baseline.user_property_equity}
          />
          <OutcomeRow
            label="Pension value retained"
            value={results.user_total_pensions}
            delta={results.user_total_pensions - baseline.user_total_pensions}
          />
          <OutcomeRow
            label="Savings retained"
            value={results.user_total_savings}
            delta={results.user_total_savings - baseline.user_total_savings}
          />
          <OutcomeRow
            label="Debts assumed"
            value={results.user_total_debts}
            delta={results.user_total_debts - baseline.user_total_debts}
            invert
          />
          <OutcomeRow label="Maintenance (net)" value={maintenanceNet} />
          <OutcomeRow
            label="Monthly income (post-change)"
            value={results.user_monthly_income}
            delta={results.user_monthly_income - baseline.user_monthly_income}
          />
          <OutcomeRow
            label="Monthly expenditure (post-change)"
            value={results.user_monthly_expenditure}
            delta={results.user_monthly_expenditure - baseline.user_monthly_expenditure}
            invert
          />

          <p className="dashboard-disclaimer">
            These figures are modelled outcomes, not legal entitlements or predictions. Consult a solicitor for advice specific to
            your circumstances.
          </p>
          <p className="dashboard-help" style={{ marginTop: 12 }}>
            <Link href="/dashboard/scenarios" className="inline-link">
              Back to scenarios
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}

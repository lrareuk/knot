"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/domain/currency";
import { computeScenario } from "@/lib/domain/compute-scenario";
import { interpretScenarioAgreements } from "@/lib/domain/interpret-scenario-agreements";
import { getJurisdictionProfile } from "@/lib/legal/jurisdictions";
import type { FinancialPosition, ScenarioConfig, ScenarioRecord, ScenarioResults } from "@/lib/domain/types";
import type { LegalAgreementTerm } from "@/lib/legal/types";

type Props = {
  scenario: ScenarioRecord;
  position: FinancialPosition;
  baseline: ScenarioResults;
  jurisdictionCode: string;
  currencyCode: "GBP" | "USD" | "CAD";
  agreementTerms: LegalAgreementTerm[];
};

type SaveState = "idle" | "saving" | "saved" | "error";
type SectionKey = "property" | "pension" | "savings" | "debts" | "maintenance" | "housing" | "income";

type SplitSliderProps = {
  label: string;
  total: number;
  percent: number;
  currencyCode: "GBP" | "USD" | "CAD";
  onChange: (value: number) => void;
};

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

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function symbolForCurrency(currencyCode: "GBP" | "USD" | "CAD") {
  return (
    new Intl.NumberFormat(currencyCode === "USD" ? "en-US" : currencyCode === "CAD" ? "en-CA" : "en-GB", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? "$"
  );
}

function formatCompactCurrency(value: number, currencyCode: "GBP" | "USD" | "CAD") {
  if (!Number.isFinite(value) || value === 0) {
    return "—";
  }

  const symbol = symbolForCurrency(currencyCode);
  const sign = value < 0 ? `-${symbol}` : symbol;
  const absolute = Math.abs(Math.round(value));
  if (absolute >= 1000) {
    const compact = (absolute / 1000).toFixed(absolute % 1000 === 0 ? 0 : 1);
    return `${sign}${compact}k`;
  }

  return `${sign}${absolute.toLocaleString("en-US")}`;
}

function DeltaPill({ value, currencyCode }: { value: number; currencyCode: "GBP" | "USD" | "CAD" }) {
  if (value === 0) {
    return null;
  }

  const positive = value > 0;
  return (
    <span className={`dashboard-scenario-delta-pill ${positive ? "is-positive" : "is-negative"}`}>
      {positive ? "↑" : "↓"} {formatCurrency(Math.abs(value), currencyCode)}
    </span>
  );
}

function Section({
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="dashboard-scenario-section">
      <button type="button" className="dashboard-scenario-section-header" onClick={onToggle} aria-expanded={expanded}>
        <div className="dashboard-scenario-section-heading">
          <span className="dashboard-scenario-section-title">{title}</span>
          {count ? <span className="dashboard-scenario-section-count">{count}</span> : null}
        </div>
        <span className="dashboard-scenario-section-chevron">▾</span>
      </button>

      <div className="dashboard-scenario-section-body" data-open={expanded}>
        <div className="dashboard-scenario-section-inner">{children}</div>
      </div>
    </section>
  );
}

function SplitSlider({ label, total, percent, currencyCode, onChange }: SplitSliderProps) {
  const safePercent = clampPercent(percent);
  const userShare = Math.round((total * safePercent) / 100);
  const partnerShare = total - userShare;
  const sliderStyle = { "--slider-fill": `${safePercent}%` } as CSSProperties;

  return (
    <div className="dashboard-scenario-split-row">
      <div className="dashboard-scenario-row-head">
        <p className="dashboard-scenario-row-label">{label}</p>
        <p className="dashboard-scenario-row-value">{formatCurrency(total, currencyCode)}</p>
      </div>

      <div className="dashboard-scenario-slider-wrap">
        <input
          type="range"
          min={0}
          max={100}
          value={safePercent}
          className="dashboard-scenario-slider"
          style={sliderStyle}
          onChange={(event) => onChange(clampPercent(Number(event.target.value)))}
          aria-label={`${label} split percentage`}
        />
      </div>

      <div className="dashboard-scenario-slider-axis">
        <span>You</span>
        <span>Partner</span>
      </div>

      <div className="dashboard-scenario-slider-values">
        <span>
          {formatCurrency(userShare, currencyCode)} ({safePercent}%)
        </span>
        <span>
          {formatCurrency(partnerShare, currencyCode)} ({100 - safePercent}%)
        </span>
      </div>
    </div>
  );
}

export default function ScenarioEditor({ scenario, position, jurisdictionCode, currencyCode, agreementTerms }: Props) {
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
    maintenance: false,
    housing: false,
    income: false,
  });

  const dirtyRef = useRef(false);
  const isMountedRef = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedSaveRef = useRef<{ name: string; config: ScenarioConfig } | null>(null);
  const saveInFlightRef = useRef(false);

  const results = useMemo(() => computeScenario(position, config), [config, position]);
  const agreementWarnings = useMemo(
    () =>
      interpretScenarioAgreements({
        jurisdictionCode,
        config,
        terms: agreementTerms,
      }),
    [agreementTerms, config, jurisdictionCode]
  );
  const jurisdictionProfile = useMemo(() => getJurisdictionProfile(jurisdictionCode), [jurisdictionCode]);
  const propertyById = useMemo(() => new Map(position.properties.map((item) => [item.id, item])), [position.properties]);
  const pensionById = useMemo(() => new Map(position.pensions.map((item) => [item.id, item])), [position.pensions]);
  const savingsById = useMemo(() => new Map(position.savings.map((item) => [item.id, item])), [position.savings]);
  const debtById = useMemo(() => new Map(position.debts.map((item) => [item.id, item])), [position.debts]);

  const flushQueuedSave = useCallback(async () => {
    if (saveInFlightRef.current) {
      return;
    }

    const snapshot = queuedSaveRef.current;
    if (!snapshot) {
      return;
    }

    saveInFlightRef.current = true;
    queuedSaveRef.current = null;

    if (isMountedRef.current) {
      setSaveState("saving");
    }

    try {
      const response = await fetch(`/api/scenarios/${scenario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: snapshot.name.trim().slice(0, 40) || "Scenario",
          config: snapshot.config,
        }),
      });

      if (!response.ok) {
        throw new Error("save_failed");
      }

      if (isMountedRef.current) {
        dirtyRef.current = false;
        setSaveState("saved");
      }
    } catch {
      queuedSaveRef.current = snapshot;
      if (isMountedRef.current) {
        setSaveState("error");
      }
    } finally {
      saveInFlightRef.current = false;

      if (queuedSaveRef.current) {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(() => {
          void flushQueuedSave();
        }, 300);
      }
    }
  }, [scenario.id]);

  useEffect(() => {
    if (!dirtyRef.current) {
      return;
    }

    queuedSaveRef.current = { name, config };
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      void flushQueuedSave();
    }, 500);
  }, [config, flushQueuedSave, name]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const saveStatusLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : "Auto-saved";

  const setConfigDirty = (next: ScenarioConfig) => {
    dirtyRef.current = true;
    setConfig(next);
  };

  const duplicateScenario = async () => {
    const response = await fetch(`/api/scenarios/${scenario.id}/duplicate`, { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as { scenario?: ScenarioRecord };

    if (!response.ok || !payload.scenario?.id) {
      return;
    }

    router.push(`/dashboard/scenario/${payload.scenario.id}`);
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

  const breakdownItems = [
    { label: "Property", value: results.user_property_equity },
    { label: "Pensions", value: results.user_total_pensions },
    { label: "Savings", value: results.user_total_savings },
    { label: "Debts", value: -results.user_total_debts },
    { label: "Maintenance", value: maintenanceNet },
  ];

  return (
    <div className="dashboard-scenario-editor">
      <header className="dashboard-scenario-editor-header">
        <div className="dashboard-scenario-content dashboard-scenario-editor-header-inner">
          <button type="button" className="dashboard-editor-back" onClick={() => router.push("/dashboard/scenarios")} aria-label="Back">
            ←
          </button>

          <input
            className="dashboard-scenario-editor-name"
            value={name}
            maxLength={40}
            aria-label="Scenario name"
            onChange={(event) => {
              dirtyRef.current = true;
              setName(event.target.value);
            }}
          />

          <div className="dashboard-scenario-editor-header-actions">
            <button type="button" className="dashboard-scenario-header-action" onClick={duplicateScenario}>
              Duplicate
            </button>
            <button
              type="button"
              className="dashboard-scenario-header-action dashboard-scenario-header-action-danger"
              onClick={() => setConfirmDelete((current) => !current)}
            >
              Delete
            </button>
            <p className="dashboard-scenario-save-status">{saveStatusLabel}</p>
          </div>
        </div>
      </header>

      {confirmDelete ? (
        <div className="dashboard-scenario-delete-row">
          <div className="dashboard-scenario-content">
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
          </div>
        </div>
      ) : null}

      <section className="dashboard-scenario-outcome">
        <div className="dashboard-scenario-content dashboard-scenario-outcome-inner">
          <div className="dashboard-scenario-primary-grid">
            <div className="dashboard-scenario-primary-card">
              <p className="dashboard-scenario-primary-label">Net position</p>
              <div className="dashboard-scenario-primary-value-row">
                <p className="dashboard-scenario-primary-value">{formatCurrency(results.user_net_position, currencyCode)}</p>
                <DeltaPill value={results.delta_user_net_position} currencyCode={currencyCode} />
              </div>
            </div>

            <div className="dashboard-scenario-primary-card dashboard-scenario-primary-card-right">
              <p className="dashboard-scenario-primary-label">Monthly surplus</p>
              <div className="dashboard-scenario-primary-value-row">
                <p className={`dashboard-scenario-primary-value${results.user_monthly_surplus_deficit < 0 ? " is-negative" : ""}`}>
                  {formatCurrency(results.user_monthly_surplus_deficit, currencyCode)}
                </p>
                <DeltaPill value={results.delta_user_monthly} currencyCode={currencyCode} />
              </div>
            </div>
          </div>

          <div className="dashboard-scenario-breakdown-chips" aria-label="Outcome breakdown">
            {breakdownItems.map((item) => (
              <div key={item.label} className="dashboard-scenario-breakdown-chip">
                <span className="dashboard-scenario-breakdown-chip-label">{item.label}</span>
                <span
                  className={`dashboard-scenario-breakdown-chip-value${
                    item.value > 0 ? " is-positive" : item.value < 0 ? " is-negative" : " is-zero"
                  }`}
                >
                  {formatCompactCurrency(item.value, currencyCode)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="dashboard-scenario-body">
        <div className="dashboard-scenario-content">
          {SECTION_ORDER.map((sectionKey) => {
            const expanded = expandedSections[sectionKey];
            const setExpanded = () =>
              setExpandedSections((current) => ({
                ...current,
                [sectionKey]: !current[sectionKey],
              }));

            if (sectionKey === "property") {
              return (
                <Section
                  key={sectionKey}
                  title="Property decisions"
                  count={`${config.property_decisions.length} ${config.property_decisions.length === 1 ? "property" : "properties"}`}
                  expanded={expanded}
                  onToggle={setExpanded}
                >
                  {config.property_decisions.map((decision, index) => {
                    const property = propertyById.get(decision.property_id);
                    if (!property) {
                      return null;
                    }

                    const equity = property.current_value - property.mortgage_outstanding;
                    const userShare = Math.round((equity * decision.equity_split_user) / 100);
                    const partnerShare = equity - userShare;

                    return (
                      <div key={decision.property_id} className="dashboard-scenario-control-row">
                        <div className="dashboard-scenario-row-head">
                          <p className="dashboard-scenario-row-label">{property.label || "Property"}</p>
                          <p className="dashboard-scenario-row-value">{formatCurrency(equity, currencyCode)} equity</p>
                        </div>

                        <label className="dashboard-scenario-field-label" htmlFor={`property-action-${decision.property_id}`}>
                          What happens to this property?
                        </label>
                        <select
                          id={`property-action-${decision.property_id}`}
                          className="dashboard-scenario-select"
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
                          <option value="sell">Sell and split equity</option>
                          <option value="user_keeps">You keep</option>
                          <option value="partner_keeps">Partner keeps</option>
                        </select>

                        <div className={`dashboard-scenario-fade-wrap${decision.action === "sell" ? " is-visible" : ""}`}>
                          <SplitSlider
                            label="Equity split"
                            total={equity}
                            percent={decision.equity_split_user}
                            currencyCode={currencyCode}
                            onChange={(value) => {
                              const propertyDecisions = [...config.property_decisions];
                              propertyDecisions[index] = { ...decision, equity_split_user: value };
                              setConfigDirty({ ...config, property_decisions: propertyDecisions });
                            }}
                          />
                        </div>

                        {decision.action !== "sell" ? (
                          <p className="dashboard-scenario-helper">
                            Full equity allocated to {decision.action === "user_keeps" ? "you" : "your partner"}.
                            <span className="dashboard-scenario-helper-inline-value">
                              You {formatCurrency(userShare, currencyCode)} · Partner {formatCurrency(partnerShare, currencyCode)}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </Section>
              );
            }

            if (sectionKey === "pension") {
              return (
                <Section
                  key={sectionKey}
                  title="Pension splits"
                  count={`${config.pension_splits.length} ${config.pension_splits.length === 1 ? "pension" : "pensions"}`}
                  expanded={expanded}
                  onToggle={setExpanded}
                >
                  {config.pension_splits.map((split, index) => {
                    const pension = pensionById.get(split.pension_id);
                    if (!pension) {
                      return null;
                    }

                    return (
                      <SplitSlider
                        key={split.pension_id}
                        label={pension.label || "Pension"}
                        total={pension.current_value}
                        percent={split.split_user}
                        currencyCode={currencyCode}
                        onChange={(value) => {
                          const pensionSplits = [...config.pension_splits];
                          pensionSplits[index] = { ...split, split_user: value };
                          setConfigDirty({ ...config, pension_splits: pensionSplits });
                        }}
                      />
                    );
                  })}
                </Section>
              );
            }

            if (sectionKey === "savings") {
              return (
                <Section
                  key={sectionKey}
                  title="Savings & investments"
                  count={`${config.savings_splits.length} ${config.savings_splits.length === 1 ? "item" : "items"}`}
                  expanded={expanded}
                  onToggle={setExpanded}
                >
                  {config.savings_splits.map((split, index) => {
                    const savings = savingsById.get(split.savings_id);
                    if (!savings) {
                      return null;
                    }

                    return (
                      <SplitSlider
                        key={split.savings_id}
                        label={savings.label || "Savings"}
                        total={savings.current_value}
                        percent={split.split_user}
                        currencyCode={currencyCode}
                        onChange={(value) => {
                          const savingsSplits = [...config.savings_splits];
                          savingsSplits[index] = { ...split, split_user: value };
                          setConfigDirty({ ...config, savings_splits: savingsSplits });
                        }}
                      />
                    );
                  })}
                </Section>
              );
            }

            if (sectionKey === "debts") {
              return (
                <Section
                  key={sectionKey}
                  title="Debts"
                  count={`${config.debt_splits.length} ${config.debt_splits.length === 1 ? "debt" : "debts"}`}
                  expanded={expanded}
                  onToggle={setExpanded}
                >
                  {config.debt_splits.map((split, index) => {
                    const debt = debtById.get(split.debt_id);
                    if (!debt) {
                      return null;
                    }

                    return (
                      <SplitSlider
                        key={split.debt_id}
                        label={debt.label || "Debt"}
                        total={debt.outstanding}
                        percent={split.split_user}
                        currencyCode={currencyCode}
                        onChange={(value) => {
                          const debtSplits = [...config.debt_splits];
                          debtSplits[index] = { ...split, split_user: value };
                          setConfigDirty({ ...config, debt_splits: debtSplits });
                        }}
                      />
                    );
                  })}
                </Section>
              );
            }

            if (sectionKey === "maintenance") {
              const showSpousalAmount = config.spousal_maintenance.direction !== "none";
              const showChildAmount = config.child_maintenance.direction !== "none";

              return (
                <Section key={sectionKey} title="Maintenance" expanded={expanded} onToggle={setExpanded}>
                  <div className="dashboard-scenario-control-row">
                    <label className="dashboard-scenario-field-label" htmlFor="spousal-maintenance-direction">
                      Spousal maintenance
                    </label>
                    <select
                      id="spousal-maintenance-direction"
                      className="dashboard-scenario-select"
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
                      <option value="partner_pays">Partner pays you</option>
                    </select>

                    <div className={`dashboard-scenario-fade-wrap${showSpousalAmount ? " is-visible" : ""}`}>
                      <label className="dashboard-scenario-field-label" htmlFor="spousal-maintenance-amount">
                        Monthly amount
                      </label>
                      <div className="dashboard-scenario-currency-wrap">
                        <span>{symbolForCurrency(currencyCode)}</span>
                        <input
                          id="spousal-maintenance-amount"
                          className="dashboard-scenario-currency"
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
                    </div>

                    <p className="dashboard-scenario-helper dashboard-scenario-helper-italic">
                      Illustrative only — there is no fixed formula for spousal maintenance.
                    </p>
                  </div>

                  <div className="dashboard-scenario-control-row dashboard-scenario-subdivider">
                    <label className="dashboard-scenario-field-label" htmlFor="child-maintenance-direction">
                      Child maintenance
                    </label>
                    <select
                      id="child-maintenance-direction"
                      className="dashboard-scenario-select"
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
                      <option value="partner_pays">Partner pays you</option>
                    </select>

                    <div className={`dashboard-scenario-fade-wrap${showChildAmount ? " is-visible" : ""}`}>
                      <label className="dashboard-scenario-field-label" htmlFor="child-maintenance-amount">
                        Monthly amount
                      </label>
                      <div className="dashboard-scenario-currency-wrap">
                        <span>{symbolForCurrency(currencyCode)}</span>
                        <input
                          id="child-maintenance-amount"
                          className="dashboard-scenario-currency"
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

                    <p className="dashboard-scenario-helper">
                      For an official estimate, use{" "}
                      <a
                        href={jurisdictionProfile?.child_support_reference.url ?? "https://www.gov.uk/calculate-child-maintenance"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-link"
                      >
                        {jurisdictionProfile?.child_support_reference.label ?? "the local child support calculator"}
                      </a>
                      .
                    </p>
                  </div>
                </Section>
              );
            }

            if (sectionKey === "housing") {
              return (
                <Section key={sectionKey} title="Post-separation housing" expanded={expanded} onToggle={setExpanded}>
                  <div className="dashboard-scenario-control-row">
                    <label className="dashboard-scenario-field-label" htmlFor="housing-rent-user">
                      New monthly rent for you
                    </label>
                    <div className="dashboard-scenario-currency-wrap">
                      <span>{symbolForCurrency(currencyCode)}</span>
                      <input
                        id="housing-rent-user"
                        className="dashboard-scenario-currency"
                        inputMode="decimal"
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

                  <div className="dashboard-scenario-control-row">
                    <label className="dashboard-scenario-field-label" htmlFor="housing-rent-partner">
                      New monthly rent for partner
                    </label>
                    <div className="dashboard-scenario-currency-wrap">
                      <span>{symbolForCurrency(currencyCode)}</span>
                      <input
                        id="housing-rent-partner"
                        className="dashboard-scenario-currency"
                        inputMode="decimal"
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

                    <p className="dashboard-scenario-helper">Only if you won&apos;t be keeping a property.</p>
                  </div>
                </Section>
              );
            }

            return (
              <Section key={sectionKey} title="Income changes" expanded={expanded} onToggle={setExpanded}>
                <div className="dashboard-scenario-control-row">
                  <label className="dashboard-scenario-field-label" htmlFor="income-user">
                    Your new net monthly income
                  </label>
                  <div className="dashboard-scenario-currency-wrap">
                    <span>{symbolForCurrency(currencyCode)}</span>
                    <input
                      id="income-user"
                      className="dashboard-scenario-currency"
                      inputMode="decimal"
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

                <div className="dashboard-scenario-control-row">
                  <label className="dashboard-scenario-field-label" htmlFor="income-partner">
                    Partner&apos;s new net monthly income
                  </label>
                  <div className="dashboard-scenario-currency-wrap">
                    <span>{symbolForCurrency(currencyCode)}</span>
                    <input
                      id="income-partner"
                      className="dashboard-scenario-currency"
                      inputMode="decimal"
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

                  <p className="dashboard-scenario-helper">Adjust if either party’s income will change after separation.</p>
                </div>
              </Section>
            );
          })}

          <section className="dashboard-scenario-section">
            <div className="dashboard-scenario-section-header">
              <div className="dashboard-scenario-section-heading">
                <span className="dashboard-scenario-section-title">Agreement considerations</span>
                <span className="dashboard-scenario-section-count">{agreementWarnings.length}</span>
              </div>
            </div>

            <div className="dashboard-scenario-section-inner">
              {agreementWarnings.length === 0 ? (
                <p className="dashboard-scenario-helper">No agreement conflicts were detected for this scenario.</p>
              ) : (
                agreementWarnings.map((warning) => (
                  <article key={warning.key} className="dashboard-status">
                    <p>
                      <strong>[{warning.severity.toUpperCase()}]</strong> {warning.message}
                    </p>
                    <p>
                      Citation: &quot;{warning.citation.quote}&quot;
                      {warning.citation.page ? ` (page ${warning.citation.page})` : ""}
                      {warning.citation.section ? `, section ${warning.citation.section}` : ""}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>

          <p className="dashboard-scenario-disclaimer">
            These figures are modelled outcomes, not legal entitlements or predictions. Consult a solicitor for advice specific to
            your circumstances.
          </p>
        </div>
      </div>
    </div>
  );
}

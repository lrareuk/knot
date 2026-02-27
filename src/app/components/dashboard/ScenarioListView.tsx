"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CreateScenarioButton from "@/app/components/dashboard/CreateScenarioButton";
import { formatCurrency } from "@/lib/domain/currency";
import type { ScenarioRecord } from "@/lib/domain/types";

type Props = {
  initialScenarios: ScenarioRecord[];
  currencyCode: "GBP" | "USD" | "CAD";
};

type BusyMap = Record<string, boolean>;
const MAX_SCENARIOS = 5;

const updatedDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function deltaClass(value: number) {
  if (value > 0) return " is-positive";
  if (value < 0) return " is-negative";
  return "";
}

function deltaText(value: number, currencyCode: "GBP" | "USD" | "CAD") {
  if (value === 0) {
    return "No change from baseline";
  }

  return `${value > 0 ? "↑" : "↓"} ${formatCurrency(Math.abs(value), currencyCode)} from baseline`;
}

function updatedText(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Updated recently";
  }

  return `Updated ${updatedDateFormatter.format(date)}`;
}

export default function ScenarioListView({ initialScenarios, currencyCode }: Props) {
  const router = useRouter();
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyMap, setBusyMap] = useState<BusyMap>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const canCreate = scenarios.length < MAX_SCENARIOS;
  const slotsRemaining = Math.max(0, MAX_SCENARIOS - scenarios.length);
  const anyBusy = useMemo(() => Object.values(busyMap).some(Boolean), [busyMap]);

  const updateScenario = (id: string, updater: (scenario: ScenarioRecord) => ScenarioRecord) => {
    setScenarios((current) => current.map((scenario) => (scenario.id === id ? updater(scenario) : scenario)));
  };

  const renameScenario = async (id: string, name: string) => {
    const trimmed = name.trim().slice(0, 40);
    if (!trimmed) {
      setRenamingId(null);
      setOpenMenuId(null);
      return;
    }

    setBusyMap((current) => ({ ...current, [id]: true }));

    const response = await fetch(`/api/scenarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    const payload = (await response.json().catch(() => ({}))) as { scenario?: ScenarioRecord };
    setBusyMap((current) => ({ ...current, [id]: false }));

    if (response.ok && payload.scenario) {
      updateScenario(id, () => payload.scenario as ScenarioRecord);
    }

    setRenamingId(null);
    setOpenMenuId(null);
  };

  const duplicateScenario = async (id: string) => {
    setBusyMap((current) => ({ ...current, [id]: true }));

    const response = await fetch(`/api/scenarios/${id}/duplicate`, { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as { scenario?: ScenarioRecord };

    setBusyMap((current) => ({ ...current, [id]: false }));
    setOpenMenuId(null);

    if (response.ok && payload.scenario) {
      setScenarios((current) => [...current, payload.scenario as ScenarioRecord]);
    }
  };

  const deleteScenario = async (id: string) => {
    setBusyMap((current) => ({ ...current, [id]: true }));

    const response = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });

    setBusyMap((current) => ({ ...current, [id]: false }));

    if (response.ok) {
      setScenarios((current) => current.filter((scenario) => scenario.id !== id));
      setConfirmDeleteId(null);
      setOpenMenuId(null);
    }
  };

  return (
    <div className="dashboard-page dashboard-scenarios-page">
      <header className="dashboard-page-header dashboard-page-header-split">
        <div>
          <h1 className="dashboard-page-title">Your scenarios</h1>
          <p className="dashboard-page-subtitle">
            Each scenario models a different way to divide your finances. Build a few options, then compare outcomes side by side.
          </p>
          <div className="dashboard-scenarios-meta">
            <p className="dashboard-scenarios-meta-pill">
              {scenarios.length} of {MAX_SCENARIOS} used
            </p>
            <p className="dashboard-scenarios-meta-pill is-subtle">
              {slotsRemaining} slot{slotsRemaining === 1 ? "" : "s"} left
            </p>
          </div>
        </div>

        <CreateScenarioButton
          className="dashboard-btn dashboard-btn-sm"
          label="+ New scenario"
          disabled={!canCreate}
          title={!canCreate ? "Maximum 5 scenarios. Delete one to create another." : undefined}
        />
      </header>

      {scenarios.length === 0 ? (
        <section className="dashboard-empty-state">
          <p className="dashboard-panel-eyebrow">Scenarios</p>
          <h2 className="dashboard-scenarios-empty-title">No scenarios yet</h2>
          <p className="dashboard-scenarios-empty-copy">Create one to start modelling and compare possible outcomes.</p>
          <CreateScenarioButton className="dashboard-btn" label="Create your first scenario" />
        </section>
      ) : (
        <section className="dashboard-scenarios-grid" aria-label="Scenario cards">
          {scenarios.map((scenario) => {
            const isRenaming = renamingId === scenario.id;
            const isConfirmingDelete = confirmDeleteId === scenario.id;
            const isBusy = busyMap[scenario.id] || false;

            return (
              <article
                key={scenario.id}
                className="dashboard-scenario-card"
                role="button"
                tabIndex={0}
                aria-label={`Open ${scenario.name}`}
                onClick={() => {
                  if (isRenaming || isConfirmingDelete) return;
                  router.push(`/dashboard/scenario/${scenario.id}`);
                }}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && !isRenaming && !isConfirmingDelete) {
                    event.preventDefault();
                    router.push(`/dashboard/scenario/${scenario.id}`);
                  }
                }}
              >
                {isConfirmingDelete ? (
                  <div className="dashboard-delete-inline" onClick={(event) => event.stopPropagation()}>
                    <p>Delete this scenario? This cannot be undone.</p>
                    <div className="dashboard-inline-actions">
                      <button type="button" className="dashboard-btn-text" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </button>
                      <button type="button" className="dashboard-btn-text is-danger" onClick={() => deleteScenario(scenario.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="dashboard-scenario-header">
                      <div className="dashboard-scenario-title-wrap">
                        {isRenaming ? (
                          <input
                            className="dashboard-editable-name-input"
                            value={nameDraft}
                            maxLength={40}
                            autoFocus
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setNameDraft(event.target.value)}
                            onBlur={() => renameScenario(scenario.id, nameDraft)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                void renameScenario(scenario.id, nameDraft);
                              }
                              if (event.key === "Escape") {
                                setRenamingId(null);
                                setOpenMenuId(null);
                              }
                            }}
                          />
                        ) : (
                          <h2 className="dashboard-scenario-name">{scenario.name}</h2>
                        )}
                        <p className="dashboard-scenario-updated">{updatedText(scenario.updated_at)}</p>
                      </div>

                      <div className="dashboard-scenario-menu-wrap" ref={openMenuId === scenario.id ? menuRef : null}>
                        <button
                          type="button"
                          className="dashboard-scenario-menu-button"
                          aria-label={`Open menu for ${scenario.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId((current) => (current === scenario.id ? null : scenario.id));
                          }}
                        >
                          ⋯
                        </button>

                        {openMenuId === scenario.id ? (
                          <div className="dashboard-scenario-menu" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              disabled={isBusy || anyBusy}
                              onClick={() => {
                                setRenamingId(scenario.id);
                                setNameDraft(scenario.name);
                              }}
                            >
                              Rename
                            </button>
                            <button type="button" disabled={isBusy || anyBusy || !canCreate} onClick={() => duplicateScenario(scenario.id)}>
                              Duplicate
                            </button>
                            <button
                              type="button"
                              className="is-danger"
                              disabled={isBusy || anyBusy}
                              onClick={() => {
                                setConfirmDeleteId(scenario.id);
                                setOpenMenuId(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="dashboard-scenario-metrics-row">
                      <div>
                        <p className="dashboard-scenario-metric-label">Net position</p>
                        <p className="dashboard-scenario-metric-value">{formatCurrency(scenario.results.user_net_position, currencyCode)}</p>
                      </div>
                      <div>
                        <p className="dashboard-scenario-metric-label">Monthly</p>
                        <p className={`dashboard-scenario-metric-value${scenario.results.user_monthly_surplus_deficit < 0 ? " is-negative" : ""}`}>
                          {formatCurrency(scenario.results.user_monthly_surplus_deficit, currencyCode)}/mo
                        </p>
                      </div>
                    </div>

                    <div className="dashboard-scenario-delta-row">
                      <p className={`dashboard-scenario-delta${deltaClass(scenario.results.delta_user_net_position)}`}>
                        {deltaText(scenario.results.delta_user_net_position, currencyCode)}
                      </p>
                      <p className="dashboard-scenario-open-hint" aria-hidden>
                        Open scenario →
                      </p>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

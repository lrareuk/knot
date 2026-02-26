"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CreateScenarioButton from "@/app/components/dashboard/CreateScenarioButton";
import { formatCurrency } from "@/lib/domain/currency";
import type { ScenarioRecord } from "@/lib/domain/types";

type Props = {
  initialScenarios: ScenarioRecord[];
};

type BusyMap = Record<string, boolean>;

function deltaClass(value: number) {
  if (value > 0) return "is-positive";
  if (value < 0) return "is-negative";
  return "";
}

function deltaText(value: number, suffix?: string) {
  if (value === 0) {
    return "—";
  }
  const sign = value > 0 ? "↑ +" : "↓ −";
  return `${sign}${formatCurrency(Math.abs(value))}${suffix ? ` ${suffix}` : ""}`;
}

export default function ScenarioListView({ initialScenarios }: Props) {
  const router = useRouter();
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);
  const [busyMap, setBusyMap] = useState<BusyMap>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const canCreate = scenarios.length < 5;
  const busy = useMemo(() => Object.values(busyMap).some(Boolean), [busyMap]);

  const updateScenario = (id: string, updater: (scenario: ScenarioRecord) => ScenarioRecord) => {
    setScenarios((current) => current.map((scenario) => (scenario.id === id ? updater(scenario) : scenario)));
  };

  const renameScenario = async (id: string, name: string) => {
    const trimmed = name.trim().slice(0, 40);
    if (!trimmed) {
      setRenamingId(null);
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
      updateScenario(id, () => payload.scenario!);
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
    if (!response.ok || !payload.scenario) {
      return;
    }
    setScenarios((current) => [...current, payload.scenario!]);
  };

  const deleteScenario = async (id: string) => {
    setBusyMap((current) => ({ ...current, [id]: true }));
    const response = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
    setBusyMap((current) => ({ ...current, [id]: false }));
    if (!response.ok) {
      return;
    }
    setHidingId(id);
    window.setTimeout(() => {
      setScenarios((current) => current.filter((scenario) => scenario.id !== id));
      setConfirmDeleteId(null);
      setOpenMenuId(null);
      setHidingId(null);
    }, 220);
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">Your scenarios</h1>
          <p className="dashboard-page-subtitle">Model different outcomes and compare them side by side.</p>
        </div>
        <CreateScenarioButton
          className="dashboard-btn"
          label="+ Create scenario"
          disabled={!canCreate}
          redirectToEditor
          title={!canCreate ? "Maximum 5 scenarios. Delete one to create another." : undefined}
        />
      </header>

      {!canCreate ? <p className="dashboard-help">Maximum 5 scenarios. Delete one to create another.</p> : null}

      {scenarios.length === 0 ? (
        <section className="dashboard-empty-state">
          <p>No scenarios yet. Create your first to see what changes.</p>
          <CreateScenarioButton className="dashboard-btn" label="Create first scenario" />
        </section>
      ) : (
        <section className="dashboard-scenarios-grid">
          {scenarios.map((scenario) => {
            const isRenaming = renamingId === scenario.id;
            const isConfirmingDelete = confirmDeleteId === scenario.id;
            const isHiding = hidingId === scenario.id;
            const isBusy = busyMap[scenario.id] || false;

            return (
              <article
                key={scenario.id}
                className={`dashboard-scenario-card dashboard-remove${isHiding ? " is-hiding" : ""}`}
                onClick={() => {
                  if (isRenaming || isConfirmingDelete) {
                    return;
                  }
                  router.push(`/dashboard/scenarios/${scenario.id}`);
                }}
                onKeyUp={(event) => {
                  if (event.key === "Enter" && !isRenaming && !isConfirmingDelete) {
                    router.push(`/dashboard/scenarios/${scenario.id}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open ${scenario.name}`}
              >
                <div className="dashboard-scenario-header">
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
                  <div className="dashboard-scenario-menu-wrap" ref={openMenuId === scenario.id ? menuRef : null}>
                    <button
                      type="button"
                      className="dashboard-scenario-menu-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId((current) => (current === scenario.id ? null : scenario.id));
                      }}
                      aria-label={`Open menu for ${scenario.name}`}
                    >
                      ...
                    </button>

                    {openMenuId === scenario.id ? (
                      <div className="dashboard-scenario-menu" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          disabled={isBusy || busy}
                          onClick={() => {
                            setRenamingId(scenario.id);
                            setNameDraft(scenario.name);
                          }}
                        >
                          Rename
                        </button>
                        <button type="button" disabled={isBusy || busy || !canCreate} onClick={() => duplicateScenario(scenario.id)}>
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="is-danger"
                          disabled={isBusy || busy}
                          onClick={() => setConfirmDeleteId(scenario.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="dashboard-scenario-metric-label">Your net position</p>
                  <p className="dashboard-scenario-metric-value">{formatCurrency(scenario.results.user_net_position)}</p>
                  <p className={`dashboard-delta ${deltaClass(scenario.results.delta_user_net_position)}`}>
                    {deltaText(scenario.results.delta_user_net_position, "from current")}
                  </p>
                </div>

                <div>
                  <p className="dashboard-scenario-metric-label">Monthly surplus / deficit</p>
                  <p className="dashboard-scenario-metric-value">{formatCurrency(scenario.results.user_monthly_surplus_deficit)}</p>
                  <p className={`dashboard-delta ${deltaClass(scenario.results.delta_user_monthly)}`}>
                    {deltaText(scenario.results.delta_user_monthly)}
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    className="dashboard-btn-text"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/dashboard/scenarios/${scenario.id}`);
                    }}
                  >
                    Edit scenario
                  </button>
                </div>

                {isConfirmingDelete ? (
                  <div className="dashboard-delete-inline" onClick={(event) => event.stopPropagation()}>
                    <p>Delete this scenario? This cannot be undone.</p>
                    <div className="dashboard-inline-actions">
                      <button type="button" className="dashboard-btn-text" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </button>
                      <button type="button" className="dashboard-btn-danger" onClick={() => deleteScenario(scenario.id)} disabled={isBusy}>
                        Delete
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

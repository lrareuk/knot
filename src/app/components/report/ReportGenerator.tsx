"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/domain/currency";
import type { ScenarioRecord } from "@/lib/domain/types";

type ReportItem = {
  id: string;
  scenario_ids: string[];
  pdf_url: string | null;
  generated_at: string;
  expires_at: string;
};

type Props = {
  scenarios: ScenarioRecord[];
  initialReports: ReportItem[];
  preselectedScenarioIds?: string[];
};

type GeneratedReport = {
  reportId: string;
  downloadUrl: string;
};

export default function ReportGenerator({ scenarios, preselectedScenarioIds = [] }: Props) {
  const initialSelected = useMemo(() => {
    const valid = preselectedScenarioIds.filter((id) => scenarios.some((scenario) => scenario.id === id)).slice(0, 3);
    if (valid.length > 0) {
      return valid;
    }

    return scenarios.slice(0, 1).map((scenario) => scenario.id);
  }, [preselectedScenarioIds, scenarios]);

  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);

  const toggleScenario = (id: string) => {
    setSelected((current) => {
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

  const generate = async () => {
    if (selected.length === 0) {
      setError("Select at least one scenario.");
      return;
    }

    setLoading(true);
    setError(null);
    setGenerated(null);

    const response = await fetch("/api/report/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_ids: selected }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      report_id?: string;
      download_url?: string;
      report?: { id?: string; pdf_url?: string | null };
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Something went wrong. Please try again.");
      return;
    }

    const reportId = payload.report_id ?? payload.report?.id;
    const downloadUrl = payload.download_url ?? payload.report?.pdf_url;

    if (!reportId || !downloadUrl) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setGenerated({ reportId, downloadUrl });
  };

  if (scenarios.length === 0) {
    return (
      <div className="dashboard-page">
        <header className="dashboard-page-intro">
          <h1 className="dashboard-page-title">Generate your clarity report</h1>
          <p className="dashboard-page-subtitle">
            Select which scenarios to include. The report summarises your financial position and the modelled outcomes.
          </p>
        </header>

        <section className="dashboard-empty-state">
          <p>Create at least one scenario before generating a report.</p>
          <Link href="/dashboard/scenarios" className="dashboard-btn">
            Go to scenarios
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-page-intro">
        <h1 className="dashboard-page-title">Generate your clarity report</h1>
        <p className="dashboard-page-subtitle">
          Select which scenarios to include. The report summarises your financial position and the modelled outcomes.
        </p>
      </header>

      <section className="dashboard-report-selection" aria-label="Scenario selection">
        {scenarios.map((scenario) => {
          const checked = selected.includes(scenario.id);

          return (
            <button
              key={scenario.id}
              type="button"
              className={`dashboard-report-option${checked ? " is-selected" : ""}`}
              onClick={() => toggleScenario(scenario.id)}
              aria-pressed={checked}
            >
              <span className={`dashboard-report-checkbox${checked ? " is-selected" : ""}`} aria-hidden>
                {checked ? "✓" : ""}
              </span>
              <span className="dashboard-report-option-content">
                <span className="dashboard-report-option-title">{scenario.name}</span>
                <span className="dashboard-report-option-summary">
                  Net: {formatCurrency(scenario.results.user_net_position)} · Monthly: {formatCurrency(scenario.results.user_monthly_surplus_deficit)}/mo
                </span>
              </span>
            </button>
          );
        })}
      </section>

      <div className="dashboard-report-actions">
        <button
          type="button"
          className={`dashboard-btn dashboard-btn-lg${loading ? " is-loading" : ""}`}
          onClick={generate}
          disabled={loading || selected.length === 0}
        >
          {loading ? "Generating..." : "Generate report"}
        </button>

        {error ? (
          <div className="dashboard-report-error-row">
            <p className="dashboard-status is-error">{error}</p>
            <button type="button" className="dashboard-btn-ghost" onClick={generate} disabled={loading}>
              Retry
            </button>
          </div>
        ) : null}
      </div>

      {generated ? (
        <section className="dashboard-report-result">
          <h2 className="dashboard-report-ready-title">Your report is ready</h2>
          <p className="dashboard-status">Report ID: {generated.reportId}</p>
          <a href={generated.downloadUrl} className="dashboard-btn-ghost" target="_blank" rel="noreferrer">
            Download PDF
          </a>
          <p className="dashboard-status">This download link expires in 24 hours. You can regenerate at any time.</p>
        </section>
      ) : null}
    </div>
  );
}

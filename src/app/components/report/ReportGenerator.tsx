"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default function ReportGenerator({ scenarios, initialReports, preselectedScenarioIds = [] }: Props) {
  const initialSelected = useMemo(() => {
    const valid = preselectedScenarioIds.filter((id) => scenarios.some((scenario) => scenario.id === id)).slice(0, 3);
    if (valid.length > 0) {
      return valid;
    }
    return scenarios.slice(0, 1).map((scenario) => scenario.id);
  }, [preselectedScenarioIds, scenarios]);

  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestGenerated, setLatestGenerated] = useState<ReportItem | null>(null);

  const toggle = (id: string) => {
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
      setError("Create at least one scenario before generating a report.");
      return;
    }

    setLoading(true);
    setError(null);
    setLatestGenerated(null);

    const response = await fetch("/api/reports/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_ids: selected }),
    });

    const payload = (await response.json().catch(() => ({}))) as { report?: ReportItem; error?: string };
    setLoading(false);

    if (!response.ok || !payload.report) {
      setError(payload.error ?? "Unable to generate report.");
      return;
    }

    setLatestGenerated(payload.report);
    setReports((current) => [payload.report!, ...current]);
  };

  if (scenarios.length === 0) {
    return (
      <div className="dashboard-page">
        <header className="dashboard-page-header">
          <div>
            <h1 className="dashboard-page-title">Generate your clarity report</h1>
            <p className="dashboard-page-subtitle">Choose which scenarios to include in your downloadable report.</p>
          </div>
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
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">Generate your clarity report</h1>
          <p className="dashboard-page-subtitle">Choose which scenarios to include in your downloadable report.</p>
        </div>
      </header>

      <section className="dashboard-chip-row" aria-label="Scenario selection">
        {scenarios.map((scenario) => {
          const active = selected.includes(scenario.id);
          return (
            <button
              key={scenario.id}
              type="button"
              className={`dashboard-chip${active ? " is-selected" : ""}`}
              onClick={() => toggle(scenario.id)}
              aria-pressed={active}
            >
              {scenario.name}
            </button>
          );
        })}
      </section>

      <section className="dashboard-report-preview">
        <div className="dashboard-report-preview-wordmark">
          <span aria-hidden />
        </div>
        <p className="dashboard-report-preview-title">Clarity Report Preview</p>
        <p className="dashboard-report-preview-subtitle">
          Includes: Baseline + selected scenarios + comparison + observations
        </p>
      </section>

      <div className="dashboard-report-generate-wrap">
        <button type="button" className="dashboard-btn" onClick={generate} disabled={loading}>
          {loading ? "Generating your report..." : "Generate report"}
        </button>
        {error ? <p className="dashboard-status dashboard-status-with-top-gap">{error}</p> : null}
      </div>

      {latestGenerated ? (
        <section className="dashboard-report-result">
          <h2 className="dashboard-scenario-name">Your report is ready</h2>
          {latestGenerated.pdf_url ? (
            <a href={latestGenerated.pdf_url} className="dashboard-btn" target="_blank" rel="noreferrer">
              Download PDF
            </a>
          ) : (
            <p className="dashboard-status">This report link has expired.</p>
          )}
          <p className="dashboard-status">This link expires in 24 hours. You can regenerate at any time.</p>
        </section>
      ) : null}

      <section>
        <h2 className="dashboard-scenario-name dashboard-report-history-title">Recent reports</h2>
        {reports.length === 0 ? <p className="dashboard-status">No reports generated yet.</p> : null}
        <div className="dashboard-report-history-list">
          {reports.map((report) => (
            <article key={report.id} className="dashboard-scenario-card dashboard-report-history-card">
              <div className="dashboard-inline-actions dashboard-inline-actions-between dashboard-inline-actions-full">
                <div>
                  <p>Generated {formatDate(report.generated_at)}</p>
                  <p className="dashboard-status">Expires {formatDate(report.expires_at)}</p>
                </div>
                {report.pdf_url ? (
                  <a href={report.pdf_url} className="dashboard-btn-ghost" target="_blank" rel="noreferrer">
                    Download PDF
                  </a>
                ) : (
                  <span className="dashboard-status">Expired</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

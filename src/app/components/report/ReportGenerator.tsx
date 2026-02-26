"use client";

import { useState } from "react";
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
};

export default function ReportGenerator({ scenarios, initialReports }: Props) {
  const [selected, setSelected] = useState<string[]>(scenarios.slice(0, 1).map((scenario) => scenario.id));
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) {
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

    const response = await fetch("/api/reports/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_ids: selected }),
    });

    const payload = (await response.json()) as { report?: ReportItem; error?: string };

    setLoading(false);

    if (!response.ok || !payload.report) {
      setError(payload.error ?? "Unable to generate report.");
      return;
    }

    setReports((current) => [payload.report!, ...current]);
  };

  return (
    <main className="page-shell stack-lg">
      <section className="panel stack-md">
        <h1>Generate clarity report</h1>
        <p className="muted">Select 1-3 scenarios for your downloadable PDF.</p>

        <div className="stack-xs">
          {scenarios.map((scenario) => (
            <label key={scenario.id} className="inline-control">
              <input type="checkbox" checked={selected.includes(scenario.id)} onChange={() => toggle(scenario.id)} />
              {scenario.name}
            </label>
          ))}
        </div>

        <button type="button" className="btn-primary" onClick={generate} disabled={loading}>
          {loading ? "Generating..." : "Generate report"}
        </button>

        {error ? <p className="muted">{error}</p> : null}
      </section>

      <section className="panel stack-md">
        <h2>Recent reports</h2>
        {reports.length === 0 ? <p className="muted">No reports generated yet.</p> : null}
        {reports.map((report) => (
          <div key={report.id} className="nested-panel row-between">
            <div>
              <p>Generated {new Date(report.generated_at).toLocaleString("en-GB")}</p>
              <p className="muted">Expires {new Date(report.expires_at).toLocaleString("en-GB")}</p>
            </div>
            {report.pdf_url ? (
              <a href={report.pdf_url} className="btn-secondary" target="_blank" rel="noreferrer">
                Download PDF
              </a>
            ) : (
              <span className="muted">Expired</span>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}

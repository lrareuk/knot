"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ComparisonTable from "@/app/components/dashboard/ComparisonTable";
import { summarizeScenarioAgreementWarningsByScenario } from "@/lib/domain/scenario-agreement-summary";
import type { ScenarioRecord, ScenarioResults } from "@/lib/domain/types";
import type { LegalAgreementTerm } from "@/lib/legal/types";

type Props = {
  baseline: ScenarioResults;
  scenarios: ScenarioRecord[];
  currencyCode: "GBP" | "USD" | "CAD";
  jurisdictionCode: string;
  agreementTerms: LegalAgreementTerm[];
};

export default function CompareView({ baseline, scenarios, currencyCode, jurisdictionCode, agreementTerms }: Props) {
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>(() => scenarios.slice(0, 2).map((scenario) => scenario.id));

  const selectedScenarios = useMemo(
    () => scenarios.filter((scenario) => selectedScenarioIds.includes(scenario.id)),
    [scenarios, selectedScenarioIds]
  );
  const hasAgreementTerms = agreementTerms.length > 0;
  const agreementWarningsByScenarioId = useMemo(
    () => summarizeScenarioAgreementWarningsByScenario(scenarios, jurisdictionCode, agreementTerms),
    [agreementTerms, jurisdictionCode, scenarios]
  );

  const toggleScenario = (id: string) => {
    setSelectedScenarioIds((current) => {
      if (current.includes(id)) {
        if (current.length <= 2) {
          return current;
        }

        return current.filter((value) => value !== id);
      }

      if (current.length >= 3) {
        return [...current.slice(1), id];
      }

      return [...current, id];
    });
  };

  if (scenarios.length < 2) {
    return (
      <div className="dashboard-page">
        <header className="dashboard-page-intro">
          <h1 className="dashboard-page-title">Compare scenarios</h1>
          <p className="dashboard-page-subtitle">Select 2–3 scenarios to compare side by side against your baseline.</p>
        </header>

        <section className="dashboard-empty-state">
          <p>Create at least 2 scenarios to compare them.</p>
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
      <header className="dashboard-page-intro">
        <h1 className="dashboard-page-title">Compare scenarios</h1>
        <p className="dashboard-page-subtitle">Select 2–3 scenarios to compare side by side against your baseline.</p>
        {hasAgreementTerms ? (
          <p className="dashboard-page-meta">Legal agreement warnings are shown on each scenario chip.</p>
        ) : (
          <p className="dashboard-page-meta">No extracted legal agreement terms found for warning checks.</p>
        )}
      </header>

      <section className="dashboard-chip-row" aria-label="Scenario selection">
        {scenarios.map((scenario) => {
          const selected = selectedScenarioIds.includes(scenario.id);
          const agreementSummary = agreementWarningsByScenarioId[scenario.id] ?? {
            total: 0,
            highest: null,
          };
          return (
            <button
              key={scenario.id}
              type="button"
              className={`dashboard-chip${selected ? " is-selected" : ""}`}
              onClick={() => toggleScenario(scenario.id)}
              aria-pressed={selected}
            >
              <span className="dashboard-chip-content">
                <span>{scenario.name}</span>
                {hasAgreementTerms ? (
                  <span
                    className={`dashboard-chip-legal${agreementSummary.highest ? ` is-${agreementSummary.highest}` : " is-clear"}`}
                    title={
                      agreementSummary.total > 0
                        ? `${agreementSummary.total} legal agreement warning(s) in this scenario`
                        : "No legal-agreement conflicts detected for this scenario."
                    }
                  >
                    {agreementSummary.total > 0 ? `${agreementSummary.total} legal` : "checked"}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </section>

      <ComparisonTable
        baseline={baseline}
        scenarios={selectedScenarios}
        currencyCode={currencyCode}
        jurisdictionCode={jurisdictionCode}
      />

      <div className="dashboard-compare-actions">
        <Link href={reportHref} className="dashboard-btn">
          Generate report with these scenarios
        </Link>
      </div>
    </div>
  );
}

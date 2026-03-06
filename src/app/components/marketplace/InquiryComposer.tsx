"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioRecord } from "@/lib/domain/types";

type Props = {
  profileId: string;
  scenarios: Array<Pick<ScenarioRecord, "id" | "name" | "results">>;
  jurisdictionCode: string;
};

export function requiresMarketplaceOffsettingRiskAcknowledgement(
  scenarios: Array<Pick<ScenarioRecord, "id" | "results">>,
  selectedScenarioIds: string[],
  jurisdictionCode: string
) {
  const normalizedJurisdictionCode = jurisdictionCode.trim().toUpperCase();
  if (normalizedJurisdictionCode !== "GB-EAW") {
    return false;
  }

  return scenarios
    .filter((scenario) => selectedScenarioIds.includes(scenario.id))
    .some((scenario) => scenario.results.offsetting_tradeoff_detected || scenario.results.specialist_advice_recommended);
}

export default function InquiryComposer({ profileId, scenarios, jurisdictionCode }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [finishedModellingConfirmed, setFinishedModellingConfirmed] = useState(false);
  const [offsettingRiskAcknowledged, setOffsettingRiskAcknowledged] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const requiresOffsettingRiskAck = requiresMarketplaceOffsettingRiskAcknowledgement(
    scenarios,
    selectedScenarioIds,
    jurisdictionCode
  );

  function toggleScenario(id: string) {
    setSelectedScenarioIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedScenarioIds.length === 0) {
      setStatus("Select at least one scenario to share.");
      return;
    }
    if (!finishedModellingConfirmed) {
      setStatus("Confirm you have finished modelling relevant scenarios before sharing.");
      return;
    }
    if (requiresOffsettingRiskAck && !offsettingRiskAcknowledged) {
      setStatus("Acknowledge pension trade-off risk before sharing this snapshot.");
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/marketplace/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileId,
          message,
          selected_scenario_ids: selectedScenarioIds,
          finished_modelling_confirmed: true,
          offsetting_risk_acknowledged: offsettingRiskAcknowledged,
        }),
      });

      const payload = (await response.json()) as { inquiry?: { id: string }; error?: string };

      if (!response.ok || !payload.inquiry) {
        setStatus(payload.error ?? "Unable to submit inquiry");
        return;
      }

      setMessage("");
      setSelectedScenarioIds([]);
      setFinishedModellingConfirmed(false);
      setOffsettingRiskAcknowledged(false);
      router.push(`/dashboard/marketplace/inquiries/${payload.inquiry.id}`);
      router.refresh();
    } catch {
      setStatus("Unable to submit inquiry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="marketplace-composer">
      <label>
        Your message
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Share your goals and context (minimum 20 characters)."
          minLength={20}
          maxLength={2000}
          required
        />
      </label>

      <fieldset className="marketplace-composer-scenarios">
        <legend>Scenarios to share</legend>
        {scenarios.length === 0 ? <p className="dashboard-status">Create at least one scenario before sending.</p> : null}
        {scenarios.map((scenario) => {
          const selected = selectedScenarioIds.includes(scenario.id);
          return (
          <label key={scenario.id} className={`marketplace-scenario-option${selected ? " is-selected" : ""}`}>
            <input
              type="checkbox"
              className="dashboard-check-input"
              checked={selected}
              onChange={() => toggleScenario(scenario.id)}
              disabled={saving}
            />
            <span>{scenario.name}</span>
          </label>
          );
        })}
      </fieldset>

      <label className="dashboard-checklist-item">
        <input
          type="checkbox"
          className="dashboard-check-input"
          checked={finishedModellingConfirmed}
          onChange={(event) => setFinishedModellingConfirmed(event.target.checked)}
          disabled={saving}
        />
        <span>I have finished modelling the relevant scenarios for this firm.</span>
      </label>

      {requiresOffsettingRiskAck ? (
        <section className="marketplace-risk-gate">
          <p className="dashboard-panel-eyebrow">Required Confirmation</p>
          <p className="dashboard-status">
            Selected scenarios include pension trade-off risk indicators for England and Wales.
          </p>
          <label className="dashboard-checklist-item">
            <input
              type="checkbox"
              className="dashboard-check-input"
              checked={offsettingRiskAcknowledged}
              onChange={(event) => setOffsettingRiskAcknowledged(event.target.checked)}
              disabled={saving}
            />
            <span>I understand this submission includes pension trade-off assumptions and the firm receives a locked snapshot.</span>
          </label>
        </section>
      ) : null}

      <p className="dashboard-status">
        The firm will receive a locked snapshot of the selected scenarios and your current financial context. You can keep modelling
        afterwards, but updates are not auto-sent.
      </p>

      <button type="submit" className="dashboard-btn-ghost" disabled={saving || (requiresOffsettingRiskAck && !offsettingRiskAcknowledged)}>
        {saving ? "Sending..." : "Send inquiry"}
      </button>
      {status ? <p className="dashboard-status is-error">{status}</p> : null}
    </form>
  );
}

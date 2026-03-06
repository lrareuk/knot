"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioRecord } from "@/lib/domain/types";

type Props = {
  profileId: string;
  scenarios: Array<Pick<ScenarioRecord, "id" | "name">>;
};

export default function InquiryComposer({ profileId, scenarios }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [finishedModellingConfirmed, setFinishedModellingConfirmed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        {scenarios.map((scenario) => (
          <label key={scenario.id} className="dashboard-status">
            <input
              type="checkbox"
              checked={selectedScenarioIds.includes(scenario.id)}
              onChange={() => toggleScenario(scenario.id)}
              disabled={saving}
            />{" "}
            {scenario.name}
          </label>
        ))}
      </fieldset>

      <label className="dashboard-status">
        <input
          type="checkbox"
          checked={finishedModellingConfirmed}
          onChange={(event) => setFinishedModellingConfirmed(event.target.checked)}
          disabled={saving}
        />{" "}
        I have finished modelling the relevant scenarios for this firm.
      </label>

      <p className="dashboard-status">
        The firm will receive a locked snapshot of the selected scenarios and your current financial context. You can keep modelling
        afterwards, but updates are not auto-sent.
      </p>

      <button type="submit" className="dashboard-btn-ghost" disabled={saving}>
        {saving ? "Sending..." : "Send inquiry"}
      </button>
      {status ? <p className="dashboard-status">{status}</p> : null}
    </form>
  );
}

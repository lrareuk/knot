"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AckPayload = {
  acknowledged?: boolean;
  error?: string;
};

export default function OnboardingSafetyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [understandAbuse, setUnderstandAbuse] = useState(false);
  const [understandRisk, setUnderstandRisk] = useState(false);
  const [confirmProceed, setConfirmProceed] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/onboarding/safety/acknowledgement", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as AckPayload;
      if (response.ok && payload.acknowledged) {
        router.replace("/onboarding");
        return;
      }
      setLoading(false);
    })();
  }, [router]);

  const canSubmit = useMemo(
    () => understandAbuse && understandRisk && confirmProceed && !saving,
    [confirmProceed, saving, understandAbuse, understandRisk]
  );

  async function submitAcknowledgement() {
    if (!canSubmit) {
      return;
    }

    setSaving(true);
    setError(null);

    const response = await fetch("/api/onboarding/safety/acknowledgement", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted: true }),
    });
    const payload = (await response.json().catch(() => ({}))) as AckPayload;

    if (!response.ok) {
      setSaving(false);
      setError(payload.error ?? "Unable to save acknowledgement right now.");
      return;
    }

    router.push("/onboarding");
  }

  if (loading) {
    return (
      <main className="onboarding-review-page">
        <div className="onboarding-loading" role="status" aria-live="polite">
          <div className="onboarding-loading-line onboarding-loading-line-title" />
          <div className="onboarding-loading-line" />
          <div className="onboarding-loading-block" />
        </div>
      </main>
    );
  }

  return (
    <main className="onboarding-review-page">
      <header className="onboarding-review-header">
        <h1>Safety check before modelling</h1>
        <p>
          Financial abuse and manipulation can affect what information is safe to share and can distort scenario outcomes.
          This stage is required before onboarding.
        </p>
      </header>

      <section className="onboarding-review-card">
        <h2 className="onboarding-review-card-section-title">What financial abuse/manipulation can include</h2>
        <ul className="onboarding-checklist onboarding-stack-md">
          <li>Controlling access to money, bank accounts, cards, or essential spending.</li>
          <li>Pressuring someone to hide, change, or withhold financial information.</li>
          <li>Monitoring accounts, coercing debt, or making financial threats.</li>
        </ul>
      </section>

      <section className="onboarding-review-card onboarding-stack-md">
        <div className="onboarding-checkbox-list">
          <label className="onboarding-checkbox-option">
            <input type="checkbox" checked={understandAbuse} onChange={(event) => setUnderstandAbuse(event.target.checked)} />
            <span>I understand what financial abuse/manipulation can look like.</span>
          </label>
          <label className="onboarding-checkbox-option">
            <input type="checkbox" checked={understandRisk} onChange={(event) => setUnderstandRisk(event.target.checked)} />
            <span>I understand modelling may be inaccurate if information is coerced or manipulated.</span>
          </label>
          <label className="onboarding-checkbox-option">
            <input type="checkbox" checked={confirmProceed} onChange={(event) => setConfirmProceed(event.target.checked)} />
            <span>I accept this risk and want to continue onboarding.</span>
          </label>
        </div>

        <button type="button" className="onboarding-review-submit" disabled={!canSubmit} onClick={() => void submitAcknowledgement()}>
          {saving ? "Saving..." : "Accept and continue"}
        </button>

        {error ? <p className="onboarding-review-error">{error}</p> : null}
      </section>
    </main>
  );
}

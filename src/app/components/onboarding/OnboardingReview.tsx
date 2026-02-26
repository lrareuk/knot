"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FinancialPosition } from "@/lib/domain/types";
import { ONBOARDING_MODULE_META } from "@/lib/ui/paths";

type Props = {
  position: FinancialPosition;
};

export default function OnboardingReview({ position }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeOnboarding = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/onboarding/complete", { method: "POST" });
    if (!response.ok) {
      setLoading(false);
      setError("Unable to complete onboarding. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="page-shell narrow stack-lg">
      <section className="panel stack-md">
        <h1>Review your financial position</h1>
        <p className="muted">Review all modules below before you continue to dashboard modelling.</p>
      </section>

      <section className="panel stack-md">
        <h2>Key dates</h2>
        <p className="muted">Date of marriage: {position.date_of_marriage ?? "Not provided"}</p>
        <p className="muted">Date of separation: {position.date_of_separation ?? "Not provided"}</p>
      </section>

      <section className="panel stack-md">
        <h2>Assets and liabilities summary</h2>
        <p className="muted">Properties: {position.properties.length}</p>
        <p className="muted">Pensions: {position.pensions.length}</p>
        <p className="muted">Savings: {position.savings.length}</p>
        <p className="muted">Debts: {position.debts.length}</p>
        <p className="muted">Dependants: {position.dependants.length}</p>
      </section>

      <section className="panel stack-sm">
        <h2>Need to edit anything?</h2>
        <div className="stack-xs">
          {ONBOARDING_MODULE_META.map((module) => (
            <Link key={module.key} href={module.path} className="module-link">
              {module.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="panel stack-sm">
        <button type="button" className="btn-primary" onClick={completeOnboarding} disabled={loading}>
          {loading ? "Completing..." : "Complete onboarding and continue"}
        </button>
        {error ? <p className="muted">{error}</p> : null}
      </section>
    </main>
  );
}

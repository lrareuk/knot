"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingUI } from "@/components/onboarding/OnboardingUIContext";
import { formatMoney } from "@/lib/onboarding/currency";
import { getFinancialTotals } from "@/lib/onboarding/totals";
import { getModuleStatus } from "@/lib/onboarding/progress";
import { MODULES, type FinancialPosition, type ModuleName } from "@/types/financial";
import { useFinancialStore } from "@/stores/financial-position";

type SummaryCard = {
  moduleName: ModuleName;
  lines: string[];
};

type ModuleStatus = "complete" | "partial" | "empty";

function summaryForModule(position: FinancialPosition, moduleName: ModuleName, currencyCode: "GBP" | "USD" | "CAD"): string[] {
  if (moduleName === "dates") {
    const lines: string[] = [];
    if (position.date_of_marriage) {
      lines.push(`Date of marriage: ${position.date_of_marriage}`);
    }
    if (position.date_of_separation) {
      lines.push(`Date of separation: ${position.date_of_separation}`);
    }
    return lines;
  }

  if (moduleName === "property") {
    return position.properties
      .filter((property) => property.current_value !== null || property.mortgage_outstanding !== null)
      .slice(0, 3)
      .map((property) => {
        const equity = (property.current_value ?? 0) - (property.mortgage_outstanding ?? 0);
        return `${property.label || "Property"}: ${formatMoney(equity, currencyCode)} equity`;
      });
  }

  if (moduleName === "income") {
    const lines: string[] = [];
    if (position.income.user_net_monthly !== null) {
      lines.push(`Your net monthly income: ${formatMoney(position.income.user_net_monthly, currencyCode)}`);
    }
    if (position.income.partner_net_monthly !== null) {
      lines.push(`Partner net monthly income: ${formatMoney(position.income.partner_net_monthly, currencyCode)}`);
    }
    if (position.income.other_income !== null) {
      lines.push(`Other income: ${formatMoney(position.income.other_income, currencyCode)}`);
    }
    return lines;
  }

  if (moduleName === "pensions") {
    return position.pensions
      .filter(
        (pension) =>
          pension.current_value !== null ||
          pension.annual_amount !== null ||
          pension.projected_annual_income !== null ||
          pension.scottish_relevant_date_value !== null
      )
      .slice(0, 3)
      .map((pension) => {
        const value = pension.projected_annual_income ?? pension.current_value ?? pension.annual_amount;
        return `${pension.label || "Pension"}: ${formatMoney(value, currencyCode)}`;
      });
  }

  if (moduleName === "savings") {
    return position.savings
      .filter((savings) => savings.current_value !== null)
      .slice(0, 3)
      .map((savings) => `${savings.label || "Account"}: ${formatMoney(savings.current_value, currencyCode)}`);
  }

  if (moduleName === "debts") {
    return position.debts
      .filter((debt) => debt.outstanding !== null)
      .slice(0, 3)
      .map((debt) => `${debt.label || "Debt"}: ${formatMoney(debt.outstanding, currencyCode)} outstanding`);
  }

  const lines: string[] = [];
  if (position.has_no_dependants) {
    lines.push("No dependant children");
  } else if (position.dependants.length) {
    lines.push(`Dependants: ${position.dependants.length}`);
  }

  const expenditureTotal = Object.values(position.expenditure).reduce((sum, value) => sum + (value ?? 0), 0);
  if (expenditureTotal > 0) {
    lines.push(`Monthly expenditure: ${formatMoney(expenditureTotal, currencyCode)}`);
  }
  return lines;
}

function dotClass(status: ModuleStatus): string {
  if (status === "complete") {
    return "is-complete";
  }
  if (status === "partial") {
    return "is-partial";
  }
  return "is-empty";
}

function statusLabel(status: ModuleStatus): string {
  if (status === "complete") {
    return "Complete";
  }
  if (status === "partial") {
    return "In progress";
  }
  return "Not started";
}

function statusPillClass(status: ModuleStatus): string {
  if (status === "complete") {
    return "is-complete";
  }
  if (status === "partial") {
    return "is-partial";
  }
  return "is-empty";
}

function ReviewLoadingState() {
  return (
    <main className="onboarding-review-page">
      <div className="onboarding-loading" role="status" aria-live="polite" data-testid="onboarding-review-loading">
        <div className="onboarding-loading-line onboarding-loading-line-title" />
        <div className="onboarding-loading-line" />
        <div className="onboarding-loading-line onboarding-loading-line-short" />
        <div className="onboarding-loading-block" />
      </div>
    </main>
  );
}

export default function OnboardingReviewPage() {
  const router = useRouter();
  const { currencyCode, jurisdiction } = useOnboardingUI();
  const position = useFinancialStore((state) => state.position);
  const [isCompleting, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRelevantAgreements, setHasRelevantAgreements] = useState<boolean | null>(null);
  const [disclosureSaving, setDisclosureSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/agreements");
      const payload = (await response.json().catch(() => ({}))) as { has_relevant_agreements?: boolean | null };
      if (response.ok) {
        setHasRelevantAgreements(payload.has_relevant_agreements ?? null);
      }
    })();
  }, []);

  const moduleCards = useMemo((): SummaryCard[] => {
    if (!position) {
      return [];
    }

    return MODULES.map((module) => ({
      moduleName: module.name,
      lines: summaryForModule(position, module.name, currencyCode),
    }));
  }, [currencyCode, position]);

  const moduleStatuses = useMemo(() => {
    if (!position) {
      return [] as ModuleStatus[];
    }
    return MODULES.map((module) => getModuleStatus(module.name, position));
  }, [position]);

  const totals = useMemo(() => {
    if (!position) {
      return null;
    }
    return getFinancialTotals(position, jurisdiction);
  }, [jurisdiction, position]);
  const normalizedJurisdictionCode = jurisdiction.trim().toUpperCase();
  const pensionIncomeAnnual = useMemo(() => {
    if (!position) {
      return 0;
    }

    return position.pensions.reduce(
      (sum, pension) => sum + (pension.projected_annual_income ?? pension.annual_amount ?? 0),
      0
    );
  }, [position]);

  if (!position || !totals) {
    return <ReviewLoadingState />;
  }

  const hasEmptyModule = moduleStatuses.some((status) => status === "empty");
  const allModulesComplete = moduleStatuses.length > 0 && moduleStatuses.every((status) => status === "complete");
  const completedModulesCount = moduleStatuses.filter((status) => status === "complete").length;

  const markOnboardingComplete = async () => {
    if (hasRelevantAgreements === null) {
      setError("Please answer the legal agreement disclosure before continuing.");
      return;
    }

    setCompleting(true);
    setError(null);

    const response = await fetch("/api/onboarding/complete", { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Unable to complete onboarding right now. Please try again.");
      setCompleting(false);
      return;
    }

    router.push("/dashboard");
  };

  const saveDisclosure = async (value: boolean) => {
    setDisclosureSaving(true);
    setError(null);

    const response = await fetch("/api/agreements/disclosure", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ has_relevant_agreements: value }),
    });

    const payload = (await response.json().catch(() => ({}))) as { has_relevant_agreements?: boolean; error?: string };
    setDisclosureSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to save agreement disclosure. Please try again.");
      return;
    }

    setHasRelevantAgreements(payload.has_relevant_agreements ?? value);
  };

  return (
    <main className="onboarding-review-page">
      <header className="onboarding-review-header">
        <h1>Review your financial position</h1>
        <p>Check everything looks right. You can edit any section, and you can always make changes from your dashboard.</p>
      </header>

      {allModulesComplete ? (
        <section className="onboarding-review-complete-banner">
          <p className="onboarding-review-banner-kicker">Onboarding complete</p>
          <h2>Everything looks ready for dashboard modelling.</h2>
          <p>You&apos;ve completed all onboarding sections. You can still edit any module before continuing.</p>
          <div className="onboarding-review-banner-metrics">
            <article>
              <span>Modules complete</span>
              <strong>{completedModulesCount} / {MODULES.length}</strong>
            </article>
            <article>
              <span>Net position</span>
              <strong>{formatMoney(totals.netPosition, currencyCode)}</strong>
            </article>
            <article>
              <span>Monthly surplus/deficit</span>
              <strong>{formatMoney(totals.monthlySurplusDeficit, currencyCode)}</strong>
            </article>
          </div>
        </section>
      ) : (
        <section className="onboarding-review-progress-banner">
          <p>
            Completed sections: <strong>{completedModulesCount}</strong> of <strong>{MODULES.length}</strong>
          </p>
        </section>
      )}

      <section className="onboarding-review-cards">
        {MODULES.map((module, index) => {
          const card = moduleCards[index];
          const status = moduleStatuses[index] ?? "empty";

          return (
            <article key={module.name} className="onboarding-review-card">
              <header className="onboarding-review-card-head">
                <div className="onboarding-review-card-title-wrap">
                  <span className={`onboarding-review-dot ${dotClass(status)}`} />
                  <h2>{module.title}</h2>
                  <span className={`onboarding-review-status-pill ${statusPillClass(status)}`}>{statusLabel(status)}</span>
                </div>
                <Link href={module.route} className="onboarding-review-edit-link">
                  Edit
                </Link>
              </header>

              {card?.lines.length ? (
                <div className="onboarding-review-card-body">
                  {card.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="onboarding-review-empty">No data entered yet</p>
              )}
            </article>
          );
        })}
      </section>

      <section className="onboarding-review-totals">
        <div className="onboarding-review-total-row">
          <span>Total property equity</span>
          <strong>{formatMoney(totals.totalPropertyEquity, currencyCode)}</strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>{normalizedJurisdictionCode === "GB-EAW" ? "Projected annual pension income" : "Total pensions"}</span>
          <strong>
            {formatMoney(
              normalizedJurisdictionCode === "GB-EAW" ? pensionIncomeAnnual : totals.totalPensions,
              currencyCode
            )}
          </strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>Total savings</span>
          <strong>{formatMoney(totals.totalSavings, currencyCode)}</strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>Total debts</span>
          <strong>{formatMoney(totals.totalDebts, currencyCode)}</strong>
        </div>

        <div className="onboarding-review-total-row is-net">
          <span>Net position</span>
          <strong>{formatMoney(totals.netPosition, currencyCode)}</strong>
        </div>

        <div className="onboarding-review-total-row">
          <span>Combined monthly income</span>
          <strong>{formatMoney(totals.combinedMonthlyIncome, currencyCode)}</strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>Combined monthly expenditure</span>
          <strong>{formatMoney(totals.combinedMonthlyExpenditure, currencyCode)}</strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>Monthly surplus/deficit</span>
          <strong>{formatMoney(totals.monthlySurplusDeficit, currencyCode)}</strong>
        </div>
      </section>

      <section className="onboarding-review-cta">
        <article className="onboarding-review-card">
          <header className="onboarding-review-card-head">
            <div className="onboarding-review-card-title-wrap">
              <h2>Legal agreement disclosure</h2>
              <span className={`onboarding-review-status-pill ${hasRelevantAgreements === null ? "is-empty" : "is-complete"}`}>
                {hasRelevantAgreements === null ? "Required" : hasRelevantAgreements ? "Yes" : "No"}
              </span>
            </div>
          </header>

          <p className="onboarding-review-card-copy">
            Have you signed a prenup, postnup, or separation agreement that may affect your financial position?
          </p>
          <div className="onboarding-inline-actions">
            <button
              type="button"
              className={`onboarding-inline-button ${hasRelevantAgreements === true ? "is-active" : ""}`}
              onClick={() => void saveDisclosure(true)}
              disabled={disclosureSaving}
              aria-pressed={hasRelevantAgreements === true}
            >
              Yes
            </button>
            <button
              type="button"
              className={`onboarding-inline-button ${hasRelevantAgreements === false ? "is-active" : ""}`}
              onClick={() => void saveDisclosure(false)}
              disabled={disclosureSaving}
              aria-pressed={hasRelevantAgreements === false}
            >
              No
            </button>
            {hasRelevantAgreements ? (
              <button type="button" className="onboarding-inline-button" onClick={() => router.push("/settings")}>
                Add details in settings
              </button>
            ) : null}
          </div>
        </article>

        {hasEmptyModule ? (
          <p className="onboarding-review-warning">
            Some sections are incomplete. Your scenarios will be more accurate with more data, but you can always add it later.
          </p>
        ) : (
          <p className="onboarding-review-ready-copy">
            Your summary is ready. You can proceed now and continue refining numbers from your dashboard at any time.
          </p>
        )}

        <button
          type="button"
          onClick={markOnboardingComplete}
          disabled={isCompleting}
          className="onboarding-review-submit"
        >
          {isCompleting ? "Saving..." : "Go to your dashboard"}
        </button>

        {error ? <p className="onboarding-review-error">{error}</p> : null}
      </section>
    </main>
  );
}

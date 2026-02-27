"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { formatPounds } from "@/lib/onboarding/currency";
import { getFinancialTotals } from "@/lib/onboarding/totals";
import { getModuleStatus } from "@/lib/onboarding/progress";
import { MODULES, type FinancialPosition, type ModuleName } from "@/types/financial";
import { useFinancialStore } from "@/stores/financial-position";

type SummaryCard = {
  moduleName: ModuleName;
  lines: string[];
};

type ModuleStatus = "complete" | "partial" | "empty";

function summaryForModule(position: FinancialPosition, moduleName: ModuleName): string[] {
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
        return `${property.label || "Property"}: ${formatPounds(equity)} equity`;
      });
  }

  if (moduleName === "income") {
    const lines: string[] = [];
    if (position.income.user_net_monthly !== null) {
      lines.push(`Your net monthly income: ${formatPounds(position.income.user_net_monthly)}`);
    }
    if (position.income.partner_net_monthly !== null) {
      lines.push(`Partner net monthly income: ${formatPounds(position.income.partner_net_monthly)}`);
    }
    if (position.income.other_income !== null) {
      lines.push(`Other income: ${formatPounds(position.income.other_income)}`);
    }
    return lines;
  }

  if (moduleName === "pensions") {
    return position.pensions
      .filter((pension) => pension.current_value !== null || pension.annual_amount !== null)
      .slice(0, 3)
      .map((pension) => {
        const value = pension.current_value ?? pension.annual_amount;
        return `${pension.label || "Pension"}: ${formatPounds(value)}`;
      });
  }

  if (moduleName === "savings") {
    return position.savings
      .filter((savings) => savings.current_value !== null)
      .slice(0, 3)
      .map((savings) => `${savings.label || "Account"}: ${formatPounds(savings.current_value)}`);
  }

  if (moduleName === "debts") {
    return position.debts
      .filter((debt) => debt.outstanding !== null)
      .slice(0, 3)
      .map((debt) => `${debt.label || "Debt"}: ${formatPounds(debt.outstanding)} outstanding`);
  }

  const lines: string[] = [];
  if (position.has_no_dependants) {
    lines.push("No dependant children");
  } else if (position.dependants.length) {
    lines.push(`Dependants: ${position.dependants.length}`);
  }

  const expenditureTotal = Object.values(position.expenditure).reduce((sum, value) => sum + (value ?? 0), 0);
  if (expenditureTotal > 0) {
    lines.push(`Monthly expenditure: ${formatPounds(expenditureTotal)}`);
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

export default function OnboardingReviewPage() {
  const router = useRouter();
  const position = useFinancialStore((state) => state.position);
  const [isCompleting, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moduleCards = useMemo((): SummaryCard[] => {
    if (!position) {
      return [];
    }

    return MODULES.map((module) => ({
      moduleName: module.name,
      lines: summaryForModule(position, module.name),
    }));
  }, [position]);

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
    return getFinancialTotals(position);
  }, [position]);

  if (!position || !totals) {
    return null;
  }

  const hasEmptyModule = moduleStatuses.some((status) => status === "empty");
  const allModulesComplete = moduleStatuses.length > 0 && moduleStatuses.every((status) => status === "complete");
  const completedModulesCount = moduleStatuses.filter((status) => status === "complete").length;

  const markOnboardingComplete = async () => {
    setCompleting(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const targetUserId = user?.id ?? position.user_id;

    const { error: updateError } = await supabase
      .from("users")
      .update({ onboarding_done: true })
      .eq("id", targetUserId);

    if (updateError) {
      setError("Unable to complete onboarding right now. Please try again.");
      setCompleting(false);
      return;
    }

    router.push("/dashboard");
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
              <strong>{formatPounds(totals.netPosition)}</strong>
            </article>
            <article>
              <span>Monthly surplus/deficit</span>
              <strong>{formatPounds(totals.monthlySurplusDeficit)}</strong>
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
          <strong>{formatPounds(totals.totalPropertyEquity)}</strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>Total pensions</span>
          <strong>{formatPounds(totals.totalPensions)}</strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>Total savings</span>
          <strong>{formatPounds(totals.totalSavings)}</strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>Total debts</span>
          <strong>{formatPounds(totals.totalDebts)}</strong>
        </div>

        <div className="onboarding-review-total-row is-net">
          <span>Net position</span>
          <strong>{formatPounds(totals.netPosition)}</strong>
        </div>

        <div className="onboarding-review-total-row">
          <span>Combined monthly income</span>
          <strong>{formatPounds(totals.combinedMonthlyIncome)}</strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>Combined monthly expenditure</span>
          <strong>{formatPounds(totals.combinedMonthlyExpenditure)}</strong>
        </div>
        <div className="onboarding-review-total-row">
          <span>Monthly surplus/deficit</span>
          <strong>{formatPounds(totals.monthlySurplusDeficit)}</strong>
        </div>
      </section>

      <section className="onboarding-review-cta">
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

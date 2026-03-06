"use client";

import CreateScenarioButton from "@/app/components/dashboard/CreateScenarioButton";
import { formatCurrency } from "@/lib/domain/currency";
import type { FinancialPosition, ScenarioRecord } from "@/lib/domain/types";

type Props = {
  position: FinancialPosition;
  scenarios: ScenarioRecord[];
  currencyCode: "GBP" | "USD" | "CAD";
  jurisdictionCode: string;
};

function safeNumber(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value ?? 0;
}

function sumPensionCapital(position: FinancialPosition, jurisdictionCode: string) {
  const normalizedJurisdiction = jurisdictionCode.trim().toUpperCase();
  if (normalizedJurisdiction === "GB-EAW") {
    return 0;
  }

  return position.pensions.reduce((total, pension) => {
    if (normalizedJurisdiction === "GB-SCT") {
      return total + safeNumber(pension.scottish_relevant_date_value ?? pension.current_value);
    }

    return total + safeNumber(pension.current_value);
  }, 0);
}

function sumProjectedPensionIncome(position: FinancialPosition) {
  return position.pensions.reduce(
    (total, pension) => total + safeNumber(pension.projected_annual_income ?? pension.annual_amount),
    0
  );
}

function sumExpenditure(position: FinancialPosition) {
  const spending = Object.entries(position.expenditure).reduce((total, [, value]) => {
    if (typeof value !== "number") {
      return total;
    }

    return total + value;
  }, 0);

  const debtPayments = position.debts.reduce((total, debt) => total + safeNumber(debt.monthly_payment), 0);
  const propertyCosts = position.properties.reduce((total, property) => total + safeNumber(property.monthly_cost), 0);
  return spending + debtPayments + propertyCosts;
}

function MetricCard({
  label,
  value,
  count,
  currencyCode,
  negative = false,
}: {
  label: string;
  value: number;
  count: number;
  currencyCode: "GBP" | "USD" | "CAD";
  negative?: boolean;
}) {
  return (
    <article className="dashboard-metric-card">
      <p className="dashboard-metric-label">{label}</p>
      <p className={`dashboard-metric-value${negative ? " is-negative" : ""}`}>{formatCurrency(value, currencyCode)}</p>
      <p className="dashboard-metric-count">
        {count} item{count === 1 ? "" : "s"}
      </p>
    </article>
  );
}

export default function OverviewView({ position, scenarios, currencyCode, jurisdictionCode }: Props) {
  const propertyEquity = position.properties.reduce(
    (total, property) => total + (safeNumber(property.current_value) - safeNumber(property.mortgage_outstanding)),
    0
  );
  const pensions = sumPensionCapital(position, jurisdictionCode);
  const projectedPensionIncome = sumProjectedPensionIncome(position);
  const savings = position.savings.reduce((total, item) => total + safeNumber(item.current_value), 0);
  const debts = position.debts.reduce((total, debt) => total + safeNumber(debt.outstanding), 0);

  const net = propertyEquity + pensions + savings - debts;
  const income =
    safeNumber(position.income.user_net_monthly) + safeNumber(position.income.partner_net_monthly) + safeNumber(position.income.other_income);
  const expenditure = sumExpenditure(position);
  const surplus = income - expenditure;

  const totalCashFlow = income + expenditure;
  const incomeWidth = totalCashFlow > 0 ? (income / totalCashFlow) * 100 : 50;

  const canCreate = scenarios.length < 5;

  return (
    <div className="dashboard-page">
      <header className="dashboard-page-intro">
        <h1 className="dashboard-page-title">Your financial position</h1>
        <p className="dashboard-page-subtitle">
          This is your current combined position. Create a scenario to see what changes.
        </p>
      </header>

      <section className="dashboard-net-hero" aria-label="Net position">
        <p className="dashboard-panel-eyebrow">Net position</p>
        <p className={`dashboard-net-value${net < 0 ? " is-negative" : ""}`}>{formatCurrency(net, currencyCode)}</p>
        <p className="dashboard-muted-note">Total assets minus total liabilities</p>
      </section>

      <section className="dashboard-metrics-grid" aria-label="Category totals">
        <MetricCard
          label="Property equity"
          value={propertyEquity}
          count={position.properties.length}
          currencyCode={currencyCode}
          negative={propertyEquity < 0}
        />
        <MetricCard
          label={jurisdictionCode.trim().toUpperCase() === "GB-EAW" ? "Pension capital in net assets" : "Pensions"}
          value={pensions}
          count={position.pensions.length}
          currencyCode={currencyCode}
        />
        <MetricCard label="Savings" value={savings} count={position.savings.length} currencyCode={currencyCode} />
        <MetricCard label="Debts" value={debts} count={position.debts.length} currencyCode={currencyCode} negative />
      </section>

      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Projected pension income</h2>
        <p className="dashboard-status">{formatCurrency(projectedPensionIncome, currencyCode)} per year (combined estimate)</p>
      </section>

      <section className="dashboard-cashflow-panel" aria-label="Monthly cash flow">
        <p className="dashboard-panel-eyebrow">Monthly cash flow</p>

        <div className="dashboard-cashflow-metrics">
          <div>
            <p className="dashboard-cashflow-label">Combined income</p>
            <p className="dashboard-cashflow-value">{formatCurrency(income, currencyCode)}</p>
          </div>

          <div>
            <p className="dashboard-cashflow-label">Combined expenditure</p>
            <p className="dashboard-cashflow-value">{formatCurrency(expenditure, currencyCode)}</p>
          </div>

          <div>
            <p className="dashboard-cashflow-label">Surplus / Deficit</p>
            <p className={`dashboard-cashflow-surplus${surplus < 0 ? " is-negative" : ""}`}>{formatCurrency(surplus, currencyCode)}</p>
          </div>
        </div>

        <div className="dashboard-cashflow-ratio" aria-hidden>
          <div className="dashboard-cashflow-ratio-income" style={{ width: `${Math.max(0, Math.min(100, incomeWidth))}%` }} />
          <div className="dashboard-cashflow-ratio-expense" style={{ width: `${Math.max(0, Math.min(100, 100 - incomeWidth))}%` }} />
        </div>
      </section>

      <section className="dashboard-cta-panel">
        <h2 className="dashboard-cta-title">What happens if you separate?</h2>
        <p className="dashboard-cta-subtitle">
          Create a scenario to model different outcomes. Adjust how assets, debts, and income are divided.
        </p>
        <CreateScenarioButton
          className="dashboard-btn"
          label="Create your first scenario"
          disabled={!canCreate}
          title={!canCreate ? "Maximum 5 scenarios. Delete one to create another." : undefined}
        />
      </section>

      <p className="dashboard-disclaimer">
        All figures are based on the information you provided during setup. This is a modelling tool — it does not constitute legal
        or financial advice. Figures labelled as estimates are approximations and should be verified.
      </p>
    </div>
  );
}

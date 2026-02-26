"use client";

import Link from "next/link";
import CountUp from "@/app/components/dashboard/CountUp";
import CreateScenarioButton from "@/app/components/dashboard/CreateScenarioButton";
import { formatCurrency } from "@/lib/domain/currency";
import type { FinancialPosition, ScenarioRecord, ScenarioResults } from "@/lib/domain/types";

type Props = {
  baseline: ScenarioResults;
  position: FinancialPosition;
  scenarios: ScenarioRecord[];
  updatedAt: string | null;
};

function formatRelativeTime(updatedAt: string | null) {
  if (!updatedAt) {
    return "Last updated just now";
  }

  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Last updated recently";
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Last updated ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Last updated ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `Last updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return `Last updated ${parsed.toLocaleDateString("en-GB")}`;
}

function sumExpenditure(position: FinancialPosition) {
  const entries = Object.entries(position.expenditure) as Array<[keyof FinancialPosition["expenditure"], number | boolean | undefined]>;
  return entries.reduce((total, [, value]) => (typeof value === "number" ? total + value : total), 0);
}

function toParts(items: string[]) {
  if (items.length === 0) {
    return "No items";
  }
  return items.join(" · ");
}

function CategoryIcon({ type }: { type: "property" | "pension" | "savings" | "debt" }) {
  if (type === "property") {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M2 7.5 8 2l6 5.5" />
        <path d="M4 6.8V14h8V6.8" />
      </svg>
    );
  }
  if (type === "pension") {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M3 3h10v10H3z" />
        <path d="M5.5 8h5" />
      </svg>
    );
  }
  if (type === "savings") {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M2.5 5.5h11v7h-11z" />
        <path d="M8 2.5v2.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M3 4h10M3 8h10M3 12h6" />
    </svg>
  );
}

export default function OverviewView({ baseline, position, scenarios, updatedAt }: Props) {
  const combinedNet = baseline.user_net_position + baseline.partner_net_position;
  const combinedProperty = baseline.user_property_equity + baseline.partner_property_equity;
  const combinedMonthlyIncome = baseline.user_monthly_income + baseline.partner_monthly_income;
  const combinedMonthlySurplus = baseline.user_monthly_surplus_deficit + baseline.partner_monthly_surplus_deficit;

  const propertyItems = position.properties.map((item) => `${item.label || "Property"}: ${formatCurrency(item.current_value - item.mortgage_outstanding)}`);
  const pensionItems = position.pensions.map((item) => `${item.label || "Pension"}: ${formatCurrency(item.current_value)}`);
  const savingsItems = position.savings.map((item) => `${item.label || "Savings"}: ${formatCurrency(item.current_value)}`);
  const debtItems = position.debts.map((item) => `${item.label || "Debt"}: ${formatCurrency(item.outstanding)}`);

  const totalIncome = position.income.user_net_monthly + position.income.partner_net_monthly + position.income.other_income;
  const totalExpenditure = sumExpenditure(position);
  const expenseWidth = totalIncome <= 0 ? 100 : Math.min(180, (totalExpenditure / totalIncome) * 100);

  const expenditureRows: Array<{ label: string; value: number }> = [
    { label: "Housing", value: position.expenditure.housing },
    { label: "Utilities", value: position.expenditure.utilities },
    { label: "Council tax", value: position.expenditure.council_tax },
    { label: "Food & groceries", value: position.expenditure.food },
    { label: "Transport", value: position.expenditure.transport },
    { label: "Childcare", value: position.expenditure.childcare },
    { label: "Insurance", value: position.expenditure.insurance },
    { label: "Personal", value: position.expenditure.personal },
    { label: "Other", value: position.expenditure.other },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">Your financial position</h1>
          <p className="dashboard-page-subtitle">This is your current combined position before any separation modelling.</p>
        </div>
        <p className="dashboard-page-meta">{formatRelativeTime(updatedAt)}</p>
      </header>

      <section className="dashboard-summary-grid" aria-label="Summary metrics">
        <article className="dashboard-summary-card">
          <p className="dashboard-summary-label">Net position</p>
          <CountUp
            value={combinedNet}
            render={(value) => formatCurrency(Math.round(value))}
            className={`dashboard-summary-value${combinedNet < 0 ? " is-negative" : ""}`}
          />
        </article>
        <article className="dashboard-summary-card">
          <p className="dashboard-summary-label">Property equity</p>
          <CountUp value={combinedProperty} render={(value) => formatCurrency(Math.round(value))} className="dashboard-summary-value" />
        </article>
        <article className="dashboard-summary-card">
          <p className="dashboard-summary-label">Monthly income</p>
          <CountUp
            value={combinedMonthlyIncome}
            render={(value) => formatCurrency(Math.round(value))}
            className="dashboard-summary-value"
          />
        </article>
        <article className="dashboard-summary-card">
          <p className="dashboard-summary-label">Monthly surplus</p>
          <CountUp
            value={combinedMonthlySurplus}
            render={(value) => formatCurrency(Math.round(value))}
            className={`dashboard-summary-value${combinedMonthlySurplus < 0 ? " is-negative" : ""}`}
          />
        </article>
      </section>

      <section className="dashboard-breakdown">
        <div className="dashboard-breakdown-column">
          <h3>Assets & liabilities</h3>

          <div className="dashboard-breakdown-row">
            <div>
              <p className="dashboard-breakdown-label">
                <CategoryIcon type="property" />
                Property equity
              </p>
              <p className="dashboard-breakdown-items">{toParts(propertyItems)}</p>
            </div>
            <p className="dashboard-breakdown-value">{formatCurrency(combinedProperty)}</p>
          </div>

          <div className="dashboard-breakdown-row">
            <div>
              <p className="dashboard-breakdown-label">
                <CategoryIcon type="pension" />
                Pensions
              </p>
              <p className="dashboard-breakdown-items">{toParts(pensionItems)}</p>
            </div>
            <p className="dashboard-breakdown-value">{formatCurrency(baseline.user_total_pensions + baseline.partner_total_pensions)}</p>
          </div>

          <div className="dashboard-breakdown-row">
            <div>
              <p className="dashboard-breakdown-label">
                <CategoryIcon type="savings" />
                Savings & investments
              </p>
              <p className="dashboard-breakdown-items">{toParts(savingsItems)}</p>
            </div>
            <p className="dashboard-breakdown-value">{formatCurrency(baseline.user_total_savings + baseline.partner_total_savings)}</p>
          </div>

          <div className="dashboard-breakdown-row">
            <div>
              <p className="dashboard-breakdown-label">
                <CategoryIcon type="debt" />
                Debts
              </p>
              <p className="dashboard-breakdown-items">{toParts(debtItems)}</p>
            </div>
            <p className="dashboard-breakdown-value is-negative">-{formatCurrency(baseline.user_total_debts + baseline.partner_total_debts)}</p>
          </div>
        </div>

        <div className="dashboard-breakdown-column">
          <h3>Monthly cash flow</h3>
          <div className="dashboard-cashflow-labels">
            <span>Income: {formatCurrency(totalIncome)}</span>
            <span>Expenditure: {formatCurrency(totalExpenditure)}</span>
          </div>
          <div className="dashboard-cashflow-wrap" aria-hidden>
            <div className="dashboard-cashflow-income" />
            <div className="dashboard-cashflow-expense" style={{ width: `${expenseWidth}%` }} />
          </div>
          <p className="dashboard-cashflow-note">
            {totalIncome - totalExpenditure >= 0 ? "Monthly surplus" : "Monthly deficit"}: {formatCurrency(totalIncome - totalExpenditure)}
          </p>

          {expenditureRows.map((row) => (
            <div key={row.label} className="dashboard-breakdown-row">
              <p className="dashboard-breakdown-items">{row.label}</p>
              <p className="dashboard-breakdown-value">{formatCurrency(row.value)}</p>
            </div>
          ))}
        </div>
      </section>

      {scenarios.length === 0 ? (
        <section className="dashboard-cta-panel">
          <h2 className="dashboard-cta-title">Ready to model what changes?</h2>
          <p className="dashboard-cta-subtitle">
            Create your first scenario to see how different separation structures affect your financial position.
          </p>
          <CreateScenarioButton className="dashboard-btn" label="Create first scenario" />
        </section>
      ) : (
        <section style={{ display: "grid", gap: 16 }}>
          <div className="dashboard-inline-actions">
            <CreateScenarioButton
              className="dashboard-btn"
              label="+ Create scenario"
              disabled={scenarios.length >= 5}
              title={scenarios.length >= 5 ? "Maximum 5 scenarios. Delete one to create another." : undefined}
            />
            <Link className="dashboard-btn-ghost" href="/dashboard/scenarios">
              View all scenarios
            </Link>
          </div>

          <div className="dashboard-compact-scenarios">
            {scenarios.slice(0, 3).map((scenario) => (
              <Link key={scenario.id} href={`/dashboard/scenarios/${scenario.id}`} className="dashboard-scenario-card dashboard-scenario-link">
                <div className="dashboard-scenario-header">
                  <h3 className="dashboard-scenario-name">{scenario.name}</h3>
                </div>
                <div>
                  <p className="dashboard-scenario-metric-label">Your net position</p>
                  <p className="dashboard-scenario-metric-value">{formatCurrency(scenario.results.user_net_position)}</p>
                  <p className={`dashboard-delta ${scenario.results.delta_user_net_position >= 0 ? "is-positive" : "is-negative"}`}>
                    {scenario.results.delta_user_net_position >= 0 ? "↑ +" : "↓ −"}
                    {formatCurrency(Math.abs(scenario.results.delta_user_net_position))} from current
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

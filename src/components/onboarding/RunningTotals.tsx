"use client";

import { formatPounds } from "@/lib/onboarding/currency";
import { getFinancialTotals } from "@/lib/onboarding/totals";
import { useFinancialStore } from "@/stores/financial-position";
import type { FinancialPosition } from "@/types/financial";

function hasPropertyData(position: FinancialPosition): boolean {
  return position.properties.some(
    (property) =>
      property.current_value !== null ||
      property.mortgage_outstanding !== null ||
      property.equity !== null ||
      property.monthly_cost !== null
  );
}

function hasPensionData(position: FinancialPosition): boolean {
  return position.pensions.some((pension) => pension.current_value !== null || pension.annual_amount !== null);
}

function hasSavingsData(position: FinancialPosition): boolean {
  return position.savings.some((savings) => savings.current_value !== null);
}

function hasDebtData(position: FinancialPosition): boolean {
  return position.debts.some((debt) => debt.outstanding !== null);
}

export default function RunningTotals() {
  const position = useFinancialStore((state) => state.position);

  if (!position) {
    return null;
  }

  const totals = getFinancialTotals(position);

  const rows = [
    hasPropertyData(position)
      ? { label: "Property equity", value: totals.totalPropertyEquity }
      : null,
    hasPensionData(position)
      ? { label: "Pensions", value: totals.totalPensions }
      : null,
    hasSavingsData(position)
      ? { label: "Savings", value: totals.totalSavings }
      : null,
    hasDebtData(position)
      ? { label: "Debts", value: -totals.totalDebts }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>;

  return (
    <section className="onboarding-totals-section" aria-label="Running totals">
      <h3 className="onboarding-totals-title">Running totals</h3>
      {rows.map((row) => (
        <div key={row.label} className="onboarding-total-row">
          <span className="onboarding-total-label">{row.label}</span>
          <span className="onboarding-total-value">{formatPounds(row.value)}</span>
        </div>
      ))}
      <div className="onboarding-total-row is-net">
        <span className="onboarding-total-label">Net position</span>
        <span className="onboarding-total-value">{formatPounds(totals.netPosition)}</span>
      </div>
    </section>
  );
}

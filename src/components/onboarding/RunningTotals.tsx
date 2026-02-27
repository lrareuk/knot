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
    <section className="mt-10">
      <h3 className="mb-3 font-['Space_Grotesk'] text-xs font-semibold tracking-[2px] text-[#9A9590] uppercase">Running totals</h3>
      {rows.length ? (
        <div className="space-y-0">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-[#2A2A2A]/50 py-2.5 transition-opacity duration-200"
            >
              <span className="text-[13px] text-[#9A9590]">{row.label}</span>
              <span className="font-['Space_Grotesk'] text-[15px] font-semibold text-[#F4F1EA]">{formatPounds(row.value)}</span>
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between border-t border-[#2A2A2A] pt-4 transition-opacity duration-200">
            <span className="text-[13px] font-semibold text-[#F4F1EA]">Net position</span>
            <span className="font-['Space_Grotesk'] text-lg font-semibold text-[#C2185B]">{formatPounds(totals.netPosition)}</span>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-[#555555]">No totals yet.</p>
      )}
    </section>
  );
}

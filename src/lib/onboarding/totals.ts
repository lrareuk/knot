import type { FinancialPosition } from "@/types/financial";
import { EXPENDITURE_FIELDS } from "@/types/financial";
import { toNumber } from "@/lib/onboarding/currency";

export type FinancialTotals = {
  totalPropertyEquity: number;
  totalPensions: number;
  totalSavings: number;
  totalDebts: number;
  netPosition: number;
  combinedMonthlyIncome: number;
  combinedMonthlyExpenditure: number;
  monthlySurplusDeficit: number;
};

export function getFinancialTotals(position: FinancialPosition): FinancialTotals {
  const totalPropertyEquity = position.properties.reduce((sum, property) => {
    const computedEquity = toNumber(property.current_value) - toNumber(property.mortgage_outstanding);
    return sum + (property.equity ?? computedEquity);
  }, 0);

  const totalPensions = position.pensions.reduce(
    (sum, pension) => sum + (toNumber(pension.current_value) || toNumber(pension.annual_amount)),
    0
  );

  const totalSavings = position.savings.reduce((sum, savings) => sum + toNumber(savings.current_value), 0);
  const totalDebts = position.debts.reduce((sum, debt) => sum + toNumber(debt.outstanding), 0);

  const combinedMonthlyIncome =
    toNumber(position.income.user_net_monthly) +
    toNumber(position.income.partner_net_monthly) +
    toNumber(position.income.other_income);

  const combinedMonthlyExpenditure = EXPENDITURE_FIELDS.reduce(
    (sum, field) => sum + toNumber(position.expenditure[field]),
    0
  );

  const netPosition = totalPropertyEquity + totalPensions + totalSavings - totalDebts;
  const monthlySurplusDeficit = combinedMonthlyIncome - combinedMonthlyExpenditure;

  return {
    totalPropertyEquity,
    totalPensions,
    totalSavings,
    totalDebts,
    netPosition,
    combinedMonthlyIncome,
    combinedMonthlyExpenditure,
    monthlySurplusDeficit,
  };
}

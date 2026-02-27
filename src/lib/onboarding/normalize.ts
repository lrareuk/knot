import type { FinancialPosition, IncomeData, ExpenditureData } from "@/types/financial";
import { defaultExpenditure, defaultIncome } from "@/lib/onboarding/defaults";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeFinancialPosition(raw: unknown, userId: string): FinancialPosition {
  const record = isRecord(raw) ? raw : {};
  const rawIncome = isRecord(record.income) ? record.income : {};
  const rawExpenditure = isRecord(record.expenditure) ? record.expenditure : {};

  return {
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    user_id: typeof record.user_id === "string" ? record.user_id : userId,
    date_of_marriage: typeof record.date_of_marriage === "string" ? record.date_of_marriage : null,
    date_of_separation: typeof record.date_of_separation === "string" ? record.date_of_separation : null,
    properties: Array.isArray(record.properties) ? (record.properties as FinancialPosition["properties"]) : [],
    pensions: Array.isArray(record.pensions) ? (record.pensions as FinancialPosition["pensions"]) : [],
    savings: Array.isArray(record.savings) ? (record.savings as FinancialPosition["savings"]) : [],
    debts: Array.isArray(record.debts) ? (record.debts as FinancialPosition["debts"]) : [],
    income: {
      ...defaultIncome,
      ...(rawIncome as Partial<IncomeData>),
      is_estimated: isRecord(rawIncome.is_estimated)
        ? (rawIncome.is_estimated as FinancialPosition["income"]["is_estimated"])
        : defaultIncome.is_estimated,
    },
    dependants: Array.isArray(record.dependants) ? (record.dependants as FinancialPosition["dependants"]) : [],
    expenditure: {
      ...defaultExpenditure,
      ...(rawExpenditure as Partial<ExpenditureData>),
    },
    has_no_dependants: Boolean(record.has_no_dependants),
    updated_at: typeof record.updated_at === "string" ? record.updated_at : new Date().toISOString(),
  };
}

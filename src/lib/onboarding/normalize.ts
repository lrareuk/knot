import type {
  DebtItem,
  DependantItem,
  ExpenditureData,
  FinancialPosition,
  IncomeData,
  PensionItem,
  PropertyItem,
  SavingsItem,
} from "@/types/financial";
import { defaultExpenditure, defaultIncome } from "@/lib/onboarding/defaults";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeItemId(record: Record<string, unknown>, prefix: string, index: number): string {
  if (typeof record.id === "string" && record.id.trim()) {
    return record.id;
  }
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}-${index + 1}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizePropertyItem(item: unknown, index: number): PropertyItem {
  const record = isRecord(item) ? item : {};
  const estimated = isRecord(record.is_estimated) ? record.is_estimated : {};

  return {
    id: normalizeItemId(record, "property", index),
    label: typeof record.label === "string" ? record.label : `Property ${index + 1}`,
    current_value: normalizeNumber(record.current_value),
    mortgage_outstanding: normalizeNumber(record.mortgage_outstanding),
    equity: normalizeNumber(record.equity),
    ownership:
      record.ownership === "sole_user" || record.ownership === "sole_partner" || record.ownership === "joint"
        ? record.ownership
        : "joint",
    is_matrimonial: typeof record.is_matrimonial === "boolean" ? record.is_matrimonial : true,
    monthly_cost: normalizeNumber(record.monthly_cost),
    is_estimated: {
      current_value: typeof estimated.current_value === "boolean" ? estimated.current_value : undefined,
      mortgage_outstanding:
        typeof estimated.mortgage_outstanding === "boolean" ? estimated.mortgage_outstanding : undefined,
      monthly_cost: typeof estimated.monthly_cost === "boolean" ? estimated.monthly_cost : undefined,
    },
  };
}

function normalizePensionItem(item: unknown, index: number): PensionItem {
  const record = isRecord(item) ? item : {};
  const estimated = isRecord(record.is_estimated) ? record.is_estimated : {};

  return {
    id: normalizeItemId(record, "pension", index),
    label: typeof record.label === "string" ? record.label : `Pension ${index + 1}`,
    holder: record.holder === "partner" || record.holder === "user" ? record.holder : "user",
    pension_type:
      record.pension_type === "defined_benefit" ||
      record.pension_type === "state" ||
      record.pension_type === "defined_contribution"
        ? record.pension_type
        : "defined_contribution",
    current_value: normalizeNumber(record.current_value),
    annual_amount: normalizeNumber(record.annual_amount),
    is_matrimonial: typeof record.is_matrimonial === "boolean" ? record.is_matrimonial : true,
    is_estimated: {
      current_value: typeof estimated.current_value === "boolean" ? estimated.current_value : undefined,
      annual_amount: typeof estimated.annual_amount === "boolean" ? estimated.annual_amount : undefined,
    },
  };
}

function normalizeSavingsItem(item: unknown, index: number): SavingsItem {
  const record = isRecord(item) ? item : {};
  const estimated = isRecord(record.is_estimated) ? record.is_estimated : {};

  return {
    id: normalizeItemId(record, "savings", index),
    label: typeof record.label === "string" ? record.label : `Account ${index + 1}`,
    type:
      record.type === "cash" ||
      record.type === "isa" ||
      record.type === "investment" ||
      record.type === "crypto" ||
      record.type === "other"
        ? record.type
        : "cash",
    holder: record.holder === "partner" || record.holder === "joint" || record.holder === "user" ? record.holder : "user",
    current_value: normalizeNumber(record.current_value),
    is_matrimonial: typeof record.is_matrimonial === "boolean" ? record.is_matrimonial : true,
    is_estimated: {
      current_value: typeof estimated.current_value === "boolean" ? estimated.current_value : undefined,
    },
  };
}

function normalizeDebtItem(item: unknown, index: number): DebtItem {
  const record = isRecord(item) ? item : {};

  return {
    id: normalizeItemId(record, "debt", index),
    label: typeof record.label === "string" ? record.label : `Debt ${index + 1}`,
    holder: record.holder === "partner" || record.holder === "joint" || record.holder === "user" ? record.holder : "user",
    outstanding: normalizeNumber(record.outstanding),
    monthly_payment: normalizeNumber(record.monthly_payment),
    is_matrimonial: typeof record.is_matrimonial === "boolean" ? record.is_matrimonial : true,
  };
}

function normalizeDependantItem(item: unknown, index: number): DependantItem {
  const record = isRecord(item) ? item : {};

  return {
    id: normalizeItemId(record, "dependant", index),
    age: normalizeNumber(record.age),
    lives_with:
      record.lives_with === "user" || record.lives_with === "partner" || record.lives_with === "shared"
        ? record.lives_with
        : "shared",
  };
}

function normalizeArray<T>(value: unknown, map: (item: unknown, index: number) => T): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: T[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      continue;
    }
    normalized.push(map(item, index));
  }
  return normalized;
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
    properties: normalizeArray(record.properties, normalizePropertyItem),
    pensions: normalizeArray(record.pensions, normalizePensionItem),
    savings: normalizeArray(record.savings, normalizeSavingsItem),
    debts: normalizeArray(record.debts, normalizeDebtItem),
    income: {
      ...defaultIncome,
      ...(rawIncome as Partial<IncomeData>),
      is_estimated: isRecord(rawIncome.is_estimated)
        ? (rawIncome.is_estimated as FinancialPosition["income"]["is_estimated"])
        : defaultIncome.is_estimated,
    },
    dependants: normalizeArray(record.dependants, normalizeDependantItem),
    expenditure: {
      ...defaultExpenditure,
      ...(rawExpenditure as Partial<ExpenditureData>),
    },
    has_no_dependants: Boolean(record.has_no_dependants),
    updated_at: typeof record.updated_at === "string" ? record.updated_at : new Date().toISOString(),
  };
}

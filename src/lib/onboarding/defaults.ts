import type {
  DebtItem,
  DependantItem,
  ExpenditureData,
  IncomeData,
  PensionItem,
  PropertyItem,
  SavingsItem,
} from "@/types/financial";

export const defaultIncome: IncomeData = {
  user_gross_annual: null,
  user_net_monthly: null,
  partner_gross_annual: null,
  partner_net_monthly: null,
  other_income: null,
  other_income_holder: "user",
  is_estimated: {},
};

export const defaultExpenditure: ExpenditureData = {
  housing: null,
  utilities: null,
  council_tax: null,
  food: null,
  transport: null,
  childcare: null,
  insurance: null,
  personal: null,
  other: null,
};

export function createDefaultProperty(index: number): PropertyItem {
  return {
    label: `Property ${index}`,
    current_value: null,
    mortgage_outstanding: null,
    equity: null,
    ownership: "joint",
    is_matrimonial: true,
    monthly_cost: null,
    is_estimated: {},
  };
}

export function createDefaultPension(index: number): PensionItem {
  return {
    label: `Pension ${index}`,
    holder: "user",
    pension_type: "defined_contribution",
    current_value: null,
    annual_amount: null,
    is_matrimonial: true,
    is_estimated: {},
  };
}

export function createDefaultSavings(index: number): SavingsItem {
  return {
    label: `Account ${index}`,
    type: "cash",
    holder: "user",
    current_value: null,
    is_matrimonial: true,
    is_estimated: {},
  };
}

export function createDefaultDebt(index: number): DebtItem {
  return {
    label: `Debt ${index}`,
    holder: "user",
    outstanding: null,
    monthly_payment: null,
    is_matrimonial: true,
  };
}

export function createDefaultDependant(): DependantItem {
  return {
    age: null,
    lives_with: "shared",
  };
}

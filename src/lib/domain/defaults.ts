import type {
  DebtItem,
  DependantItem,
  ExpenditureBlock,
  FinancialPosition,
  IncomeBlock,
  PensionItem,
  PropertyItem,
  SavingsItem,
  ScenarioConfig,
} from "@/lib/domain/types";

function uid() {
  return crypto.randomUUID();
}

export const DEFAULT_INCOME: IncomeBlock = {
  user_gross_annual: 0,
  user_net_monthly: 0,
  partner_gross_annual: 0,
  partner_net_monthly: 0,
  other_income: 0,
  other_income_holder: "joint",
};

export const DEFAULT_EXPENDITURE: ExpenditureBlock = {
  housing: 0,
  utilities: 0,
  council_tax: 0,
  food: 0,
  transport: 0,
  childcare: 0,
  insurance: 0,
  personal: 0,
  other: 0,
};

export function createEmptyProperty(): PropertyItem {
  return {
    id: uid(),
    label: "",
    current_value: 0,
    mortgage_outstanding: 0,
    equity: 0,
    ownership: "joint",
    is_matrimonial: true,
    monthly_cost: 0,
  };
}

export function createEmptyPension(): PensionItem {
  return {
    id: uid(),
    label: "",
    holder: "user",
    current_value: 0,
    is_matrimonial: true,
    pension_type: "defined_contribution",
    annual_amount: null,
  };
}

export function createEmptySavings(): SavingsItem {
  return {
    id: uid(),
    label: "",
    holder: "user",
    current_value: 0,
    is_matrimonial: true,
    type: "cash",
  };
}

export function createEmptyDebt(): DebtItem {
  return {
    id: uid(),
    label: "",
    holder: "user",
    outstanding: 0,
    monthly_payment: 0,
    is_matrimonial: true,
  };
}

export function createEmptyDependant(): DependantItem {
  return {
    id: uid(),
    age: 0,
    lives_with: "shared",
  };
}

export function createDefaultFinancialPosition(): FinancialPosition {
  return {
    properties: [],
    pensions: [],
    savings: [],
    debts: [],
    income: { ...DEFAULT_INCOME },
    dependants: [],
    expenditure: { ...DEFAULT_EXPENDITURE },
    date_of_marriage: null,
    date_of_separation: null,
  };
}

export function createDefaultScenarioConfig(position: FinancialPosition): ScenarioConfig {
  return {
    property_decisions: position.properties.map((property) => ({
      property_id: property.id,
      action: "sell",
      equity_split_user: 50,
    })),
    pension_splits: position.pensions.map((pension) => ({
      pension_id: pension.id,
      split_user: 50,
    })),
    savings_splits: position.savings.map((savings) => ({
      savings_id: savings.id,
      split_user: 50,
    })),
    debt_splits: position.debts.map((debt) => ({
      debt_id: debt.id,
      split_user: 50,
    })),
    spousal_maintenance: {
      monthly_amount: 0,
      direction: "none",
      duration_months: 0,
    },
    child_maintenance: {
      monthly_amount: 0,
      direction: "none",
    },
    housing_change: {
      user_new_rent: null,
      partner_new_rent: null,
    },
    income_changes: {
      user_new_net_monthly: null,
      partner_new_net_monthly: null,
    },
  };
}

export const ONBOARDING_MODULES = [
  "key-dates",
  "property",
  "income",
  "pensions",
  "savings-investments",
  "debts",
  "dependants-expenditure",
] as const;

export type OnboardingModule = (typeof ONBOARDING_MODULES)[number];

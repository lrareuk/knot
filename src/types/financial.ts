export interface PropertyItem {
  id: string;
  label: string;
  current_value: number | null;
  mortgage_outstanding: number | null;
  equity: number | null;
  ownership: "joint" | "sole_user" | "sole_partner";
  is_matrimonial: boolean;
  monthly_cost: number | null;
  is_estimated: {
    current_value?: boolean;
    mortgage_outstanding?: boolean;
    monthly_cost?: boolean;
  };
}

export interface PensionItem {
  id: string;
  label: string;
  holder: "user" | "partner";
  pension_type: "defined_contribution" | "defined_benefit" | "state";
  current_value: number | null;
  annual_amount: number | null;
  is_matrimonial: boolean;
  is_estimated: {
    current_value?: boolean;
    annual_amount?: boolean;
  };
}

export interface SavingsItem {
  id: string;
  label: string;
  type: "cash" | "isa" | "investment" | "crypto" | "other";
  holder: "user" | "partner" | "joint";
  current_value: number | null;
  is_matrimonial: boolean;
  is_estimated: {
    current_value?: boolean;
  };
}

export interface DebtItem {
  id: string;
  label: string;
  holder: "user" | "partner" | "joint";
  outstanding: number | null;
  monthly_payment: number | null;
  is_matrimonial: boolean;
}

export interface IncomeData {
  user_gross_annual: number | null;
  user_net_monthly: number | null;
  partner_gross_annual: number | null;
  partner_net_monthly: number | null;
  other_income: number | null;
  other_income_holder: "user" | "partner" | "joint";
  is_estimated: {
    partner_gross_annual?: boolean;
    partner_net_monthly?: boolean;
  };
}

export interface DependantItem {
  id: string;
  age: number | null;
  lives_with: "user" | "partner" | "shared";
}

export interface ExpenditureData {
  housing: number | null;
  utilities: number | null;
  council_tax: number | null;
  food: number | null;
  transport: number | null;
  childcare: number | null;
  insurance: number | null;
  personal: number | null;
  other: number | null;
}

export interface FinancialPosition {
  id: string;
  user_id: string;
  date_of_marriage: string | null;
  date_of_separation: string | null;
  properties: PropertyItem[];
  pensions: PensionItem[];
  savings: SavingsItem[];
  debts: DebtItem[];
  income: IncomeData;
  dependants: DependantItem[];
  expenditure: ExpenditureData;
  has_no_dependants: boolean;
  updated_at: string;
}

export type ModuleName = "dates" | "property" | "income" | "pensions" | "savings" | "debts" | "dependants";

export interface ModuleConfig {
  name: ModuleName;
  title: string;
  description: string;
  route: string;
  guidance: string;
}

export const MODULES: ModuleConfig[] = [
  {
    name: "dates",
    title: "Key dates",
    description: "When did the marriage begin, and when did you separate? These dates shape which assets are included.",
    route: "/onboarding/dates",
    guidance:
      "The date of separation is the point at which matrimonial property is valued. If you are not yet formally separated, you can use today's date or leave it blank for now.",
  },
  {
    name: "property",
    title: "Property",
    description: "Add properties you or your partner own. Family home, investments, or any real estate.",
    route: "/onboarding/property",
    guidance:
      "Property equity is usually the largest single asset in a separation. The equity is the current value minus any outstanding mortgage.",
  },
  {
    name: "income",
    title: "Income",
    description: "Your take-home pay and your partner's. Include any additional income sources.",
    route: "/onboarding/income",
    guidance: "If you don't know your partner's exact income, an estimate is fine. You can adjust these figures later.",
  },
  {
    name: "pensions",
    title: "Pensions",
    description: "Pension pots for both parties. Workplace, personal, and state pensions.",
    route: "/onboarding/pensions",
    guidance: "You'll find your pension value on your annual statement or by logging into your provider's website.",
  },
  {
    name: "savings",
    title: "Savings & investments",
    description: "Cash savings, ISAs, investment portfolios, and any other liquid assets.",
    route: "/onboarding/savings",
    guidance: "Include all savings and investment accounts for both you and your partner.",
  },
  {
    name: "debts",
    title: "Debts",
    description: "Credit cards, loans, car finance, and other liabilities. Mortgages are covered under Property.",
    route: "/onboarding/debts",
    guidance: "Debts reduce your net position. Including them gives you a more accurate picture.",
  },
  {
    name: "dependants",
    title: "Dependants & spending",
    description: "Children and your current monthly household expenditure.",
    route: "/onboarding/dependants",
    guidance: "Children's ages and living arrangements affect maintenance calculations and housing need.",
  },
];

export const EXPENDITURE_FIELDS: Array<keyof ExpenditureData> = [
  "housing",
  "utilities",
  "council_tax",
  "food",
  "transport",
  "childcare",
  "insurance",
  "personal",
  "other",
];

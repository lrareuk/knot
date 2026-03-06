export type Ownership = "joint" | "sole_user" | "sole_partner";
export type Holder = "user" | "partner" | "joint";

export type EstimatedNumeric = {
  value: number;
  estimated?: boolean;
};

export type PropertyItem = {
  id: string;
  label: string;
  current_value: number;
  current_value_estimated?: boolean;
  mortgage_outstanding: number;
  mortgage_outstanding_estimated?: boolean;
  equity: number;
  equity_estimated?: boolean;
  ownership: Ownership;
  is_matrimonial: boolean;
  monthly_cost: number;
  monthly_cost_estimated?: boolean;
};

export type PensionType = "defined_contribution" | "defined_benefit" | "state";

export type PensionItem = {
  id: string;
  label: string;
  holder: "user" | "partner";
  current_value: number;
  current_value_estimated?: boolean;
  is_matrimonial: boolean;
  pension_type: PensionType;
  annual_amount: number | null;
  annual_amount_estimated?: boolean;
  projected_annual_income: number | null;
  projected_annual_income_estimated?: boolean;
  scottish_relevant_date_value: number | null;
  scottish_relevant_date_value_estimated?: boolean;
};

export type SavingsType = "cash" | "isa" | "investment" | "crypto" | "other";

export type SavingsItem = {
  id: string;
  label: string;
  holder: Holder;
  current_value: number;
  current_value_estimated?: boolean;
  is_matrimonial: boolean;
  type: SavingsType;
};

export type DebtItem = {
  id: string;
  label: string;
  holder: Holder;
  outstanding: number;
  outstanding_estimated?: boolean;
  monthly_payment: number;
  monthly_payment_estimated?: boolean;
  is_matrimonial: boolean;
};

export type IncomeBlock = {
  user_gross_annual: number;
  user_gross_annual_estimated?: boolean;
  user_net_monthly: number;
  user_net_monthly_estimated?: boolean;
  partner_gross_annual: number;
  partner_gross_annual_estimated?: boolean;
  partner_net_monthly: number;
  partner_net_monthly_estimated?: boolean;
  other_income: number;
  other_income_estimated?: boolean;
  other_income_holder: Holder;
};

export type DependantItem = {
  id: string;
  age: number;
  age_estimated?: boolean;
  lives_with: "user" | "partner" | "shared";
};

export type ExpenditureBlock = {
  housing: number;
  housing_estimated?: boolean;
  utilities: number;
  utilities_estimated?: boolean;
  council_tax: number;
  council_tax_estimated?: boolean;
  food: number;
  food_estimated?: boolean;
  transport: number;
  transport_estimated?: boolean;
  childcare: number;
  childcare_estimated?: boolean;
  insurance: number;
  insurance_estimated?: boolean;
  personal: number;
  personal_estimated?: boolean;
  other: number;
  other_estimated?: boolean;
};

export type FinancialPosition = {
  id?: string;
  user_id?: string;
  properties: PropertyItem[];
  pensions: PensionItem[];
  savings: SavingsItem[];
  debts: DebtItem[];
  income: IncomeBlock;
  dependants: DependantItem[];
  expenditure: ExpenditureBlock;
  has_no_dependants?: boolean;
  date_of_marriage: string | null;
  date_of_separation: string | null;
  updated_at?: string;
};

export type PropertyDecision = {
  property_id: string;
  action: "sell" | "user_keeps" | "partner_keeps";
  equity_split_user: number;
};

export type SplitDecision = {
  split_user: number;
};

export type PensionSplit = SplitDecision & {
  pension_id: string;
};

export type SavingsSplit = SplitDecision & {
  savings_id: string;
};

export type DebtSplit = SplitDecision & {
  debt_id: string;
};

export type ScenarioConfig = {
  property_decisions: PropertyDecision[];
  pension_splits: PensionSplit[];
  savings_splits: SavingsSplit[];
  debt_splits: DebtSplit[];
  spousal_maintenance: {
    monthly_amount: number;
    direction: "user_pays" | "partner_pays" | "none";
    duration_months: number;
  };
  child_maintenance: {
    monthly_amount: number;
    direction: "user_pays" | "partner_pays" | "none";
  };
  housing_change: {
    user_new_rent: number | null;
    partner_new_rent: number | null;
  };
  income_changes: {
    user_new_net_monthly: number | null;
    partner_new_net_monthly: number | null;
  };
};

export type ScenarioResults = {
  label: "modelled_outcome";
  model_version: "v2_jurisdiction_pensions";
  user_total_assets: number;
  user_total_liabilities: number;
  user_net_position: number;
  user_property_equity: number;
  user_total_pensions: number;
  user_total_savings: number;
  user_total_debts: number;
  user_monthly_income: number;
  user_monthly_expenditure: number;
  user_monthly_surplus_deficit: number;
  user_pension_income_annual: number;
  user_pension_income_monthly_equivalent: number;
  user_maintenance_paid: number;
  user_maintenance_received: number;

  partner_total_assets: number;
  partner_total_liabilities: number;
  partner_net_position: number;
  partner_property_equity: number;
  partner_total_pensions: number;
  partner_total_savings: number;
  partner_total_debts: number;
  partner_monthly_income: number;
  partner_monthly_expenditure: number;
  partner_monthly_surplus_deficit: number;
  partner_pension_income_annual: number;
  partner_pension_income_monthly_equivalent: number;
  partner_maintenance_paid: number;
  partner_maintenance_received: number;

  delta_user_assets: number;
  delta_user_monthly: number;
  delta_user_net_position: number;
};

export type ScenarioRecord = {
  id: string;
  user_id: string;
  name: string;
  config: ScenarioConfig;
  results: ScenarioResults;
  created_at: string;
  updated_at: string;
};

export type ComparisonMetric = {
  key: string;
  label: string;
  baseline: number;
  scenarios: Array<{
    id: string;
    name: string;
    value: number;
  }>;
};

export type ComparisonGroupKey = "assets" | "liabilities" | "monthly";

export type ComparisonMetricRow = {
  key: string;
  label: string;
  group: ComparisonGroupKey;
  better: "higher" | "lower";
  baseline: number;
  scenarios: Array<{
    id: string;
    name: string;
    value: number;
    delta: number;
    isBest: boolean;
  }>;
};

export type ComparisonMetricGroup = {
  key: ComparisonGroupKey;
  label: string;
  rows: ComparisonMetricRow[];
};

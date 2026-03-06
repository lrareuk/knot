import { z } from "zod";

const ownershipSchema = z.enum(["joint", "sole_user", "sole_partner"]);
const holderSchema = z.enum(["user", "partner", "joint"]);

const idSchema = z.string().uuid();

const propertySchema = z.object({
  id: idSchema,
  label: z.string(),
  current_value: z.number(),
  current_value_estimated: z.boolean().optional(),
  mortgage_outstanding: z.number(),
  mortgage_outstanding_estimated: z.boolean().optional(),
  equity: z.number(),
  equity_estimated: z.boolean().optional(),
  ownership: ownershipSchema,
  is_matrimonial: z.boolean(),
  monthly_cost: z.number(),
  monthly_cost_estimated: z.boolean().optional(),
});

const pensionSchema = z.object({
  id: idSchema,
  label: z.string(),
  holder: z.enum(["user", "partner"]),
  current_value: z.number(),
  current_value_estimated: z.boolean().optional(),
  is_matrimonial: z.boolean(),
  pension_type: z.enum(["defined_contribution", "defined_benefit", "state"]),
  annual_amount: z.number().nullable(),
  annual_amount_estimated: z.boolean().optional(),
  projected_annual_income: z.number().nullable(),
  projected_annual_income_estimated: z.boolean().optional(),
  scottish_relevant_date_value: z.number().nullable(),
  scottish_relevant_date_value_estimated: z.boolean().optional(),
});

const savingsSchema = z.object({
  id: idSchema,
  label: z.string(),
  holder: holderSchema,
  current_value: z.number(),
  current_value_estimated: z.boolean().optional(),
  is_matrimonial: z.boolean(),
  type: z.enum(["cash", "isa", "investment", "crypto", "other"]),
});

const debtSchema = z.object({
  id: idSchema,
  label: z.string(),
  holder: holderSchema,
  outstanding: z.number(),
  outstanding_estimated: z.boolean().optional(),
  monthly_payment: z.number(),
  monthly_payment_estimated: z.boolean().optional(),
  is_matrimonial: z.boolean(),
});

const incomeSchema = z.object({
  user_gross_annual: z.number(),
  user_gross_annual_estimated: z.boolean().optional(),
  user_net_monthly: z.number(),
  user_net_monthly_estimated: z.boolean().optional(),
  partner_gross_annual: z.number(),
  partner_gross_annual_estimated: z.boolean().optional(),
  partner_net_monthly: z.number(),
  partner_net_monthly_estimated: z.boolean().optional(),
  other_income: z.number(),
  other_income_estimated: z.boolean().optional(),
  other_income_holder: holderSchema,
});

const dependantSchema = z.object({
  id: idSchema,
  age: z.number(),
  age_estimated: z.boolean().optional(),
  lives_with: z.enum(["user", "partner", "shared"]),
});

const expenditureSchema = z.object({
  housing: z.number(),
  housing_estimated: z.boolean().optional(),
  utilities: z.number(),
  utilities_estimated: z.boolean().optional(),
  council_tax: z.number(),
  council_tax_estimated: z.boolean().optional(),
  food: z.number(),
  food_estimated: z.boolean().optional(),
  transport: z.number(),
  transport_estimated: z.boolean().optional(),
  childcare: z.number(),
  childcare_estimated: z.boolean().optional(),
  insurance: z.number(),
  insurance_estimated: z.boolean().optional(),
  personal: z.number(),
  personal_estimated: z.boolean().optional(),
  other: z.number(),
  other_estimated: z.boolean().optional(),
});

export const financialPositionSchema = z.object({
  properties: z.array(propertySchema),
  pensions: z.array(pensionSchema),
  savings: z.array(savingsSchema),
  debts: z.array(debtSchema),
  income: incomeSchema,
  dependants: z.array(dependantSchema),
  expenditure: expenditureSchema,
  has_no_dependants: z.boolean().optional(),
  date_of_marriage: z.string().date().nullable(),
  date_of_separation: z.string().date().nullable(),
});

const propertyDecisionSchema = z.object({
  property_id: idSchema,
  action: z.enum(["sell", "user_keeps", "partner_keeps"]),
  equity_split_user: z.number().min(0).max(100),
});

const pensionSplitSchema = z.object({
  pension_id: idSchema,
  split_user: z.number().min(0).max(100),
});

const savingsSplitSchema = z.object({
  savings_id: idSchema,
  split_user: z.number().min(0).max(100),
});

const debtSplitSchema = z.object({
  debt_id: idSchema,
  split_user: z.number().min(0).max(100),
});

export const scenarioConfigSchema = z.object({
  property_decisions: z.array(propertyDecisionSchema),
  pension_splits: z.array(pensionSplitSchema),
  savings_splits: z.array(savingsSplitSchema),
  debt_splits: z.array(debtSplitSchema),
  spousal_maintenance: z.object({
    monthly_amount: z.number(),
    direction: z.enum(["user_pays", "partner_pays", "none"]),
    duration_months: z.number(),
  }),
  child_maintenance: z.object({
    monthly_amount: z.number(),
    direction: z.enum(["user_pays", "partner_pays", "none"]),
  }),
  housing_change: z.object({
    user_new_rent: z.number().nullable(),
    partner_new_rent: z.number().nullable(),
  }),
  income_changes: z.object({
    user_new_net_monthly: z.number().nullable(),
    partner_new_net_monthly: z.number().nullable(),
  }),
});

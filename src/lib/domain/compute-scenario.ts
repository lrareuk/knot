import type {
  DebtItem,
  FinancialPosition,
  Holder,
  Ownership,
  PropertyItem,
  ScenarioConfig,
  ScenarioResults,
} from "@/lib/domain/types";
import { SCENARIO_MODEL_VERSION } from "@/lib/domain/types";
import { analyzePensionFairness } from "@/lib/domain/pension-fairness";

type PartyBreakdown = {
  property_value: number;
  property_mortgage: number;
  pensions: number;
  pension_income_annual: number;
  savings: number;
  debts: number;
  debt_monthly: number;
  income: number;
  expenditure: number;
  housing_expenditure: number;
  maintenance_paid: number;
  maintenance_received: number;
};

type BaselineState = {
  user: PartyBreakdown;
  partner: PartyBreakdown;
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function emptyParty(): PartyBreakdown {
  return {
    property_value: 0,
    property_mortgage: 0,
    pensions: 0,
    pension_income_annual: 0,
    savings: 0,
    debts: 0,
    debt_monthly: 0,
    income: 0,
    expenditure: 0,
    housing_expenditure: 0,
    maintenance_paid: 0,
    maintenance_received: 0,
  };
}

function sharesFromOwnership(ownership: Ownership): { user: number; partner: number } {
  switch (ownership) {
    case "sole_user":
      return { user: 1, partner: 0 };
    case "sole_partner":
      return { user: 0, partner: 1 };
    case "joint":
    default:
      return { user: 0.5, partner: 0.5 };
  }
}

function sharesFromHolder(holder: Holder): { user: number; partner: number } {
  switch (holder) {
    case "user":
      return { user: 1, partner: 0 };
    case "partner":
      return { user: 0, partner: 1 };
    case "joint":
    default:
      return { user: 0.5, partner: 0.5 };
  }
}

function splitByPercent(splitUser: number): { user: number; partner: number } {
  const normalizedUser = Math.max(0, Math.min(100, splitUser)) / 100;
  return {
    user: normalizedUser,
    partner: 1 - normalizedUser,
  };
}

function safeNumber(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value ?? 0;
}

function normalizeJurisdiction(jurisdictionCode: string | null | undefined) {
  if (typeof jurisdictionCode !== "string") {
    return "";
  }
  return jurisdictionCode.trim().toUpperCase();
}

function pensionCapitalValue(
  pension: FinancialPosition["pensions"][number],
  jurisdictionCode: string
) {
  if (jurisdictionCode === "GB-EAW") {
    return 0;
  }

  if (jurisdictionCode === "GB-SCT") {
    return safeNumber(pension.scottish_relevant_date_value ?? pension.current_value);
  }

  return safeNumber(pension.current_value);
}

function pensionAnnualIncomeValue(pension: FinancialPosition["pensions"][number]) {
  return safeNumber(pension.projected_annual_income ?? pension.annual_amount);
}

function applyPropertyToParty(
  party: PartyBreakdown,
  property: { currentValue: number; mortgage: number; monthlyCost?: number },
  share: number
) {
  party.property_value += property.currentValue * share;
  party.property_mortgage += property.mortgage * share;
  if (property.monthlyCost) {
    party.housing_expenditure += property.monthlyCost * share;
  }
}

function applyDebtToParty(party: PartyBreakdown, debt: { outstanding: number; monthlyPayment: number }, share: number) {
  party.debts += debt.outstanding * share;
  party.debt_monthly += debt.monthlyPayment * share;
}

type ScenarioResultsCore = Omit<
  ScenarioResults,
  | "retirement_income_gap_annual"
  | "retirement_income_gap_monthly"
  | "retirement_income_parity_ratio"
  | "offsetting_tradeoff_detected"
  | "offsetting_tradeoff_strength"
  | "specialist_advice_recommended"
  | "specialist_advice_reasons"
>;

function toResultsCore(state: BaselineState, baseline: BaselineState): ScenarioResultsCore {
  const userAssets = state.user.property_value + state.user.pensions + state.user.savings;
  const userLiabilities = state.user.property_mortgage + state.user.debts;
  const userNet = userAssets - userLiabilities;

  const partnerAssets = state.partner.property_value + state.partner.pensions + state.partner.savings;
  const partnerLiabilities = state.partner.property_mortgage + state.partner.debts;
  const partnerNet = partnerAssets - partnerLiabilities;

  const userMonthlyExpenditure = state.user.expenditure + state.user.debt_monthly;
  const partnerMonthlyExpenditure = state.partner.expenditure + state.partner.debt_monthly;

  const userMonthlySurplus =
    state.user.income + state.user.maintenance_received - userMonthlyExpenditure - state.user.maintenance_paid;
  const partnerMonthlySurplus =
    state.partner.income + state.partner.maintenance_received - partnerMonthlyExpenditure - state.partner.maintenance_paid;

  const baselineUserAssets = baseline.user.property_value + baseline.user.pensions + baseline.user.savings;
  const baselineUserLiabilities = baseline.user.property_mortgage + baseline.user.debts;
  const baselineUserNet = baselineUserAssets - baselineUserLiabilities;
  const baselineUserMonthlyExpenditure = baseline.user.expenditure + baseline.user.debt_monthly;
  const baselineUserMonthlySurplus =
    baseline.user.income + baseline.user.maintenance_received - baselineUserMonthlyExpenditure - baseline.user.maintenance_paid;

  return {
    label: "modelled_outcome",
    model_version: SCENARIO_MODEL_VERSION,
    user_total_assets: round(userAssets),
    user_total_liabilities: round(userLiabilities),
    user_net_position: round(userNet),
    user_property_equity: round(state.user.property_value - state.user.property_mortgage),
    user_total_pensions: round(state.user.pensions),
    user_total_savings: round(state.user.savings),
    user_total_debts: round(state.user.debts),
    user_monthly_income: round(state.user.income),
    user_monthly_expenditure: round(userMonthlyExpenditure),
    user_monthly_surplus_deficit: round(userMonthlySurplus),
    user_pension_income_annual: round(state.user.pension_income_annual),
    user_pension_income_monthly_equivalent: round(state.user.pension_income_annual / 12),
    user_maintenance_paid: round(state.user.maintenance_paid),
    user_maintenance_received: round(state.user.maintenance_received),

    partner_total_assets: round(partnerAssets),
    partner_total_liabilities: round(partnerLiabilities),
    partner_net_position: round(partnerNet),
    partner_property_equity: round(state.partner.property_value - state.partner.property_mortgage),
    partner_total_pensions: round(state.partner.pensions),
    partner_total_savings: round(state.partner.savings),
    partner_total_debts: round(state.partner.debts),
    partner_monthly_income: round(state.partner.income),
    partner_monthly_expenditure: round(partnerMonthlyExpenditure),
    partner_monthly_surplus_deficit: round(partnerMonthlySurplus),
    partner_pension_income_annual: round(state.partner.pension_income_annual),
    partner_pension_income_monthly_equivalent: round(state.partner.pension_income_annual / 12),
    partner_maintenance_paid: round(state.partner.maintenance_paid),
    partner_maintenance_received: round(state.partner.maintenance_received),

    delta_user_assets: round(userAssets - baselineUserAssets),
    delta_user_monthly: round(userMonthlySurplus - baselineUserMonthlySurplus),
    delta_user_net_position: round(userNet - baselineUserNet),
  };
}

function applyFairness(
  core: ScenarioResultsCore,
  input: {
    position: FinancialPosition;
    baseline: ScenarioResultsCore;
    jurisdictionCode: string;
  }
): ScenarioResults {
  const fairness = analyzePensionFairness({
    position: input.position,
    baseline: input.baseline,
    scenario: core,
    jurisdictionCode: input.jurisdictionCode,
  });

  return {
    ...core,
    retirement_income_gap_annual: fairness.retirement_income_gap_annual,
    retirement_income_gap_monthly: fairness.retirement_income_gap_monthly,
    retirement_income_parity_ratio: fairness.retirement_income_parity_ratio,
    offsetting_tradeoff_detected: fairness.offsetting_tradeoff_detected,
    offsetting_tradeoff_strength: fairness.offsetting_tradeoff_strength,
    specialist_advice_recommended: fairness.specialist_advice_recommended,
    specialist_advice_reasons: fairness.complex_case_reasons,
  };
}

function computeInitialBaseline(position: FinancialPosition, jurisdictionCode: string): BaselineState {
  const state: BaselineState = {
    user: emptyParty(),
    partner: emptyParty(),
  };

  for (const property of position.properties) {
    const shares = sharesFromOwnership(property.ownership);
    applyPropertyToParty(
      state.user,
      {
        currentValue: safeNumber(property.current_value),
        mortgage: safeNumber(property.mortgage_outstanding),
      },
      shares.user
    );
    applyPropertyToParty(
      state.partner,
      {
        currentValue: safeNumber(property.current_value),
        mortgage: safeNumber(property.mortgage_outstanding),
      },
      shares.partner
    );
  }

  for (const pension of position.pensions) {
    const holderShares = sharesFromHolder(pension.holder === "user" ? "user" : "partner");
    const capitalValue = pensionCapitalValue(pension, jurisdictionCode);
    const annualIncomeValue = pensionAnnualIncomeValue(pension);
    state.user.pensions += capitalValue * holderShares.user;
    state.partner.pensions += capitalValue * holderShares.partner;
    state.user.pension_income_annual += annualIncomeValue * holderShares.user;
    state.partner.pension_income_annual += annualIncomeValue * holderShares.partner;
  }

  for (const savings of position.savings) {
    const shares = sharesFromHolder(savings.holder);
    state.user.savings += safeNumber(savings.current_value) * shares.user;
    state.partner.savings += safeNumber(savings.current_value) * shares.partner;
  }

  for (const debt of position.debts) {
    const shares = sharesFromHolder(debt.holder);
    applyDebtToParty(
      state.user,
      {
        outstanding: safeNumber(debt.outstanding),
        monthlyPayment: safeNumber(debt.monthly_payment),
      },
      shares.user
    );
    applyDebtToParty(
      state.partner,
      {
        outstanding: safeNumber(debt.outstanding),
        monthlyPayment: safeNumber(debt.monthly_payment),
      },
      shares.partner
    );
  }

  state.user.income += safeNumber(position.income.user_net_monthly);
  state.partner.income += safeNumber(position.income.partner_net_monthly);

  const otherIncomeShares = sharesFromHolder(position.income.other_income_holder);
  state.user.income += safeNumber(position.income.other_income) * otherIncomeShares.user;
  state.partner.income += safeNumber(position.income.other_income) * otherIncomeShares.partner;

  const totalHouseholdExpenditure =
    safeNumber(position.expenditure.housing) +
    safeNumber(position.expenditure.utilities) +
    safeNumber(position.expenditure.council_tax) +
    safeNumber(position.expenditure.food) +
    safeNumber(position.expenditure.transport) +
    safeNumber(position.expenditure.childcare) +
    safeNumber(position.expenditure.insurance) +
    safeNumber(position.expenditure.personal) +
    safeNumber(position.expenditure.other);

  state.user.expenditure += totalHouseholdExpenditure / 2;
  state.partner.expenditure += totalHouseholdExpenditure / 2;
  state.user.housing_expenditure = safeNumber(position.expenditure.housing) / 2;
  state.partner.housing_expenditure = safeNumber(position.expenditure.housing) / 2;

  return state;
}

function propertyBaselineContribution(property: PropertyItem): {
  user: { value: number; mortgage: number };
  partner: { value: number; mortgage: number };
} {
  const shares = sharesFromOwnership(property.ownership);
  return {
    user: {
      value: safeNumber(property.current_value) * shares.user,
      mortgage: safeNumber(property.mortgage_outstanding) * shares.user,
    },
    partner: {
      value: safeNumber(property.current_value) * shares.partner,
      mortgage: safeNumber(property.mortgage_outstanding) * shares.partner,
    },
  };
}

function debtBaselineContribution(debt: DebtItem): {
  user: { outstanding: number; monthly: number };
  partner: { outstanding: number; monthly: number };
} {
  const shares = sharesFromHolder(debt.holder);
  return {
    user: {
      outstanding: safeNumber(debt.outstanding) * shares.user,
      monthly: safeNumber(debt.monthly_payment) * shares.user,
    },
    partner: {
      outstanding: safeNumber(debt.outstanding) * shares.partner,
      monthly: safeNumber(debt.monthly_payment) * shares.partner,
    },
  };
}

function pensionBaselineContribution(
  pension: FinancialPosition["pensions"][number],
  jurisdictionCode: string
): {
  user: { capital: number; annualIncome: number };
  partner: { capital: number; annualIncome: number };
} {
  const shares = sharesFromHolder(pension.holder === "user" ? "user" : "partner");
  const capital = pensionCapitalValue(pension, jurisdictionCode);
  const annualIncome = pensionAnnualIncomeValue(pension);
  return {
    user: {
      capital: capital * shares.user,
      annualIncome: annualIncome * shares.user,
    },
    partner: {
      capital: capital * shares.partner,
      annualIncome: annualIncome * shares.partner,
    },
  };
}

export function computeBaseline(position: FinancialPosition, jurisdictionCode: string): ScenarioResults {
  const normalizedJurisdictionCode = normalizeJurisdiction(jurisdictionCode);
  const baseline = computeInitialBaseline(position, normalizedJurisdictionCode);
  const core = toResultsCore(baseline, baseline);
  return applyFairness(core, {
    position,
    baseline: core,
    jurisdictionCode: normalizedJurisdictionCode,
  });
}

export function computeScenario(position: FinancialPosition, config: ScenarioConfig, jurisdictionCode: string): ScenarioResults {
  const normalizedJurisdictionCode = normalizeJurisdiction(jurisdictionCode);
  const baseline = computeInitialBaseline(position, normalizedJurisdictionCode);
  const baselineCore = toResultsCore(baseline, baseline);
  const state: BaselineState = {
    user: { ...baseline.user },
    partner: { ...baseline.partner },
  };

  const propertyById = new Map(position.properties.map((item) => [item.id, item]));
  const pensionById = new Map(position.pensions.map((item) => [item.id, item]));
  const savingsById = new Map(position.savings.map((item) => [item.id, item]));
  const debtById = new Map(position.debts.map((item) => [item.id, item]));

  for (const decision of config.property_decisions) {
    const property = propertyById.get(decision.property_id);
    if (!property) {
      continue;
    }

    const baselineContribution = propertyBaselineContribution(property);
    state.user.property_value -= baselineContribution.user.value;
    state.user.property_mortgage -= baselineContribution.user.mortgage;
    state.partner.property_value -= baselineContribution.partner.value;
    state.partner.property_mortgage -= baselineContribution.partner.mortgage;

    if (decision.action === "sell") {
      const split = splitByPercent(decision.equity_split_user);
      const propertyEquity = safeNumber(property.current_value) - safeNumber(property.mortgage_outstanding);
      state.user.savings += propertyEquity * split.user;
      state.partner.savings += propertyEquity * split.partner;
      continue;
    }

    if (decision.action === "user_keeps") {
      state.user.property_value += safeNumber(property.current_value);
      state.user.property_mortgage += safeNumber(property.mortgage_outstanding);
      continue;
    }

    state.partner.property_value += safeNumber(property.current_value);
    state.partner.property_mortgage += safeNumber(property.mortgage_outstanding);
  }

  if (config.property_decisions.length > 0) {
    const baselineHousing = safeNumber(position.expenditure.housing) / 2;
    state.user.expenditure -= baselineHousing;
    state.partner.expenditure -= baselineHousing;
    state.user.housing_expenditure = 0;
    state.partner.housing_expenditure = 0;

    for (const decision of config.property_decisions) {
      const property = propertyById.get(decision.property_id);
      if (!property) {
        continue;
      }

      if (decision.action === "user_keeps") {
        state.user.housing_expenditure += safeNumber(property.monthly_cost);
      }

      if (decision.action === "partner_keeps") {
        state.partner.housing_expenditure += safeNumber(property.monthly_cost);
      }
    }

    state.user.expenditure += state.user.housing_expenditure;
    state.partner.expenditure += state.partner.housing_expenditure;
  }

  for (const splitDecision of config.pension_splits) {
    const pension = pensionById.get(splitDecision.pension_id);
    if (!pension) {
      continue;
    }

    const baselineContribution = pensionBaselineContribution(pension, normalizedJurisdictionCode);
    state.user.pensions -= baselineContribution.user.capital;
    state.partner.pensions -= baselineContribution.partner.capital;
    state.user.pension_income_annual -= baselineContribution.user.annualIncome;
    state.partner.pension_income_annual -= baselineContribution.partner.annualIncome;

    const split = splitByPercent(splitDecision.split_user);
    const splitCapital = pensionCapitalValue(pension, normalizedJurisdictionCode);
    const splitAnnualIncome = pensionAnnualIncomeValue(pension);
    state.user.pensions += splitCapital * split.user;
    state.partner.pensions += splitCapital * split.partner;
    state.user.pension_income_annual += splitAnnualIncome * split.user;
    state.partner.pension_income_annual += splitAnnualIncome * split.partner;
  }

  for (const splitDecision of config.savings_splits) {
    const savings = savingsById.get(splitDecision.savings_id);
    if (!savings) {
      continue;
    }

    const baselineShares = sharesFromHolder(savings.holder);
    state.user.savings -= safeNumber(savings.current_value) * baselineShares.user;
    state.partner.savings -= safeNumber(savings.current_value) * baselineShares.partner;

    const split = splitByPercent(splitDecision.split_user);
    state.user.savings += safeNumber(savings.current_value) * split.user;
    state.partner.savings += safeNumber(savings.current_value) * split.partner;
  }

  for (const splitDecision of config.debt_splits) {
    const debt = debtById.get(splitDecision.debt_id);
    if (!debt) {
      continue;
    }

    const baselineContribution = debtBaselineContribution(debt);
    state.user.debts -= baselineContribution.user.outstanding;
    state.user.debt_monthly -= baselineContribution.user.monthly;
    state.partner.debts -= baselineContribution.partner.outstanding;
    state.partner.debt_monthly -= baselineContribution.partner.monthly;

    const split = splitByPercent(splitDecision.split_user);
    state.user.debts += safeNumber(debt.outstanding) * split.user;
    state.user.debt_monthly += safeNumber(debt.monthly_payment) * split.user;
    state.partner.debts += safeNumber(debt.outstanding) * split.partner;
    state.partner.debt_monthly += safeNumber(debt.monthly_payment) * split.partner;
  }

  if (typeof config.income_changes.user_new_net_monthly === "number") {
    const baseOtherShare =
      sharesFromHolder(position.income.other_income_holder).user * safeNumber(position.income.other_income);
    state.user.income = safeNumber(config.income_changes.user_new_net_monthly) + baseOtherShare;
  }

  if (typeof config.income_changes.partner_new_net_monthly === "number") {
    const baseOtherShare =
      sharesFromHolder(position.income.other_income_holder).partner * safeNumber(position.income.other_income);
    state.partner.income = safeNumber(config.income_changes.partner_new_net_monthly) + baseOtherShare;
  }

  if (typeof config.housing_change.user_new_rent === "number") {
    state.user.expenditure -= state.user.housing_expenditure;
    state.user.housing_expenditure = safeNumber(config.housing_change.user_new_rent);
    state.user.expenditure += state.user.housing_expenditure;
  }

  if (typeof config.housing_change.partner_new_rent === "number") {
    state.partner.expenditure -= state.partner.housing_expenditure;
    state.partner.housing_expenditure = safeNumber(config.housing_change.partner_new_rent);
    state.partner.expenditure += state.partner.housing_expenditure;
  }

  const spousalMonthly = safeNumber(config.spousal_maintenance.monthly_amount);
  if (config.spousal_maintenance.direction === "user_pays" && spousalMonthly > 0) {
    state.user.maintenance_paid += spousalMonthly;
    state.partner.maintenance_received += spousalMonthly;
  }
  if (config.spousal_maintenance.direction === "partner_pays" && spousalMonthly > 0) {
    state.partner.maintenance_paid += spousalMonthly;
    state.user.maintenance_received += spousalMonthly;
  }

  const childMonthly = safeNumber(config.child_maintenance.monthly_amount);
  if (config.child_maintenance.direction === "user_pays" && childMonthly > 0) {
    state.user.maintenance_paid += childMonthly;
    state.partner.maintenance_received += childMonthly;
  }
  if (config.child_maintenance.direction === "partner_pays" && childMonthly > 0) {
    state.partner.maintenance_paid += childMonthly;
    state.user.maintenance_received += childMonthly;
  }

  const scenarioCore = toResultsCore(state, baseline);
  return applyFairness(scenarioCore, {
    position,
    baseline: baselineCore,
    jurisdictionCode: normalizedJurisdictionCode,
  });
}

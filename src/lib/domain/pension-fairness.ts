import type { FinancialPosition, ScenarioResults } from "@/lib/domain/types";

export type PensionFairnessComplexCaseReason =
  | "defined_benefit_present"
  | "missing_income_projection"
  | "large_offsetting_tradeoff"
  | "large_retirement_income_gap";

export type PensionOffsettingTradeoffStrength = "none" | "moderate" | "strong";

export type PensionFairnessAnalysis = {
  enabled: boolean;
  jurisdiction: string;
  retirement_income_gap_annual: number;
  retirement_income_gap_monthly: number;
  retirement_income_parity_ratio: number | null;
  offsetting_tradeoff_detected: boolean;
  offsetting_tradeoff_strength: PensionOffsettingTradeoffStrength;
  complex_case_reasons: PensionFairnessComplexCaseReason[];
  specialist_advice_recommended: boolean;
};

type AnalyzePensionFairnessInput = {
  position: FinancialPosition;
  baseline: Pick<ScenarioResults, "user_property_equity" | "user_pension_income_annual" | "partner_pension_income_annual">;
  scenario: Pick<ScenarioResults, "user_property_equity" | "user_pension_income_annual" | "partner_pension_income_annual">;
  jurisdictionCode: string;
};

function normalizeJurisdiction(code: string | null | undefined) {
  if (typeof code !== "string") {
    return "";
  }

  return code.trim().toUpperCase();
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function retirementParityRatio(userAnnual: number, partnerAnnual: number) {
  const maxAnnual = Math.max(userAnnual, partnerAnnual);
  if (maxAnnual <= 0) {
    return null;
  }

  const minAnnual = Math.min(userAnnual, partnerAnnual);
  return minAnnual / maxAnnual;
}

export function analyzePensionFairness(input: AnalyzePensionFairnessInput): PensionFairnessAnalysis {
  const jurisdiction = normalizeJurisdiction(input.jurisdictionCode);
  const enabled = jurisdiction === "GB-EAW";

  if (!enabled) {
    return {
      enabled: false,
      jurisdiction,
      retirement_income_gap_annual: 0,
      retirement_income_gap_monthly: 0,
      retirement_income_parity_ratio: null,
      offsetting_tradeoff_detected: false,
      offsetting_tradeoff_strength: "none",
      complex_case_reasons: [],
      specialist_advice_recommended: false,
    };
  }

  const userAnnualIncome = input.scenario.user_pension_income_annual;
  const partnerAnnualIncome = input.scenario.partner_pension_income_annual;
  const retirementIncomeGapAnnual = userAnnualIncome - partnerAnnualIncome;
  const retirementIncomeGapMonthly = retirementIncomeGapAnnual / 12;
  const parityRatio = retirementParityRatio(userAnnualIncome, partnerAnnualIncome);

  const userPropertyEquityDelta = input.scenario.user_property_equity - input.baseline.user_property_equity;
  const userPensionIncomeDelta = input.scenario.user_pension_income_annual - input.baseline.user_pension_income_annual;
  const oppositeDirection =
    (userPropertyEquityDelta > 0 && userPensionIncomeDelta < 0) || (userPropertyEquityDelta < 0 && userPensionIncomeDelta > 0);
  const absPropertyDelta = Math.abs(userPropertyEquityDelta);
  const absPensionIncomeDelta = Math.abs(userPensionIncomeDelta);

  const offsettingTradeoffDetected = absPropertyDelta >= 50000 && absPensionIncomeDelta >= 3000 && oppositeDirection;
  const hasStrongOffsetSignal =
    absPropertyDelta >= 100000 ||
    (input.baseline.user_property_equity > 0 && absPropertyDelta >= input.baseline.user_property_equity * 0.25);
  const offsettingTradeoffStrength: PensionOffsettingTradeoffStrength = !offsettingTradeoffDetected
    ? "none"
    : hasStrongOffsetSignal
      ? "strong"
      : "moderate";

  const complexCaseReasons: PensionFairnessComplexCaseReason[] = [];
  if (input.position.pensions.some((pension) => pension.pension_type === "defined_benefit")) {
    complexCaseReasons.push("defined_benefit_present");
  }

  if (input.position.pensions.some((pension) => pension.pension_type !== "state" && pension.projected_annual_income === null)) {
    complexCaseReasons.push("missing_income_projection");
  }

  if (offsettingTradeoffStrength === "strong") {
    complexCaseReasons.push("large_offsetting_tradeoff");
  }

  if (Math.abs(retirementIncomeGapAnnual) >= 6000 && parityRatio !== null && parityRatio < 0.8) {
    complexCaseReasons.push("large_retirement_income_gap");
  }

  return {
    enabled: true,
    jurisdiction,
    retirement_income_gap_annual: round(retirementIncomeGapAnnual),
    retirement_income_gap_monthly: round(retirementIncomeGapMonthly),
    retirement_income_parity_ratio: parityRatio === null ? null : round(parityRatio),
    offsetting_tradeoff_detected: offsettingTradeoffDetected,
    offsetting_tradeoff_strength: offsettingTradeoffStrength,
    complex_case_reasons: complexCaseReasons,
    specialist_advice_recommended: complexCaseReasons.length > 0,
  };
}

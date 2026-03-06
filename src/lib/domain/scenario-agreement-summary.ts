import { interpretScenarioAgreements } from "@/lib/domain/interpret-scenario-agreements";
import type { ScenarioConfig, ScenarioRecord } from "@/lib/domain/types";
import type { AgreementInterpretationSeverity, LegalAgreementTerm } from "@/lib/legal/types";

export type ScenarioAgreementWarningSummary = {
  total: number;
  high: number;
  warning: number;
  info: number;
  highest: AgreementInterpretationSeverity | null;
};

function highestSeverity(summary: Omit<ScenarioAgreementWarningSummary, "highest">): AgreementInterpretationSeverity | null {
  if (summary.high > 0) {
    return "high";
  }

  if (summary.warning > 0) {
    return "warning";
  }

  if (summary.info > 0) {
    return "info";
  }

  return null;
}

export function summarizeScenarioAgreementWarningsForConfig(
  config: ScenarioConfig,
  jurisdictionCode: string,
  terms: LegalAgreementTerm[]
): ScenarioAgreementWarningSummary {
  const warnings = interpretScenarioAgreements({
    jurisdictionCode,
    config,
    terms,
  });

  const summary = {
    total: warnings.length,
    high: warnings.filter((warning) => warning.severity === "high").length,
    warning: warnings.filter((warning) => warning.severity === "warning").length,
    info: warnings.filter((warning) => warning.severity === "info").length,
  };

  return {
    ...summary,
    highest: highestSeverity(summary),
  };
}

export function summarizeScenarioAgreementWarningsByScenario(
  scenarios: Array<Pick<ScenarioRecord, "id" | "config">>,
  jurisdictionCode: string,
  terms: LegalAgreementTerm[]
): Record<string, ScenarioAgreementWarningSummary> {
  return scenarios.reduce<Record<string, ScenarioAgreementWarningSummary>>((accumulator, scenario) => {
    accumulator[scenario.id] = summarizeScenarioAgreementWarningsForConfig(scenario.config, jurisdictionCode, terms);
    return accumulator;
  }, {});
}

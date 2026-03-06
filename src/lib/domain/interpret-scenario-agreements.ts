import type { AgreementInterpretationWarning, LegalAgreementTerm, ScenarioAgreementInterpretationInput } from "@/lib/legal/types";

function asNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function hasMeaningfulValue(value: unknown): boolean {
  return typeof value === "number" ? value > 0 : Boolean(value);
}

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function inferFallbackSection(term: LegalAgreementTerm): AgreementInterpretationWarning["affected_section"] {
  const quote = normalizeText(term.citation.quote);
  const note = normalizeText(term.citation.note);
  const text = `${quote} ${note}`;

  if (/(pension|retirement|cetv|annuity|attachment order|sharing order)/.test(text)) {
    return "pension";
  }

  if (/(maintenance|spousal support|alimony)/.test(text)) {
    return "maintenance";
  }

  if (/(property|home|equity|real estate|matrimonial home)/.test(text)) {
    return "property";
  }

  if (/(debt|liabilit|loan|credit)/.test(text)) {
    return "debts";
  }

  if (/(saving|investment|cash|isa|account)/.test(text)) {
    return "savings";
  }

  if (/(rent|housing|accommodation)/.test(text)) {
    return "housing";
  }

  if (/(income|salary|earnings)/.test(text)) {
    return "income";
  }

  return "general";
}

function makeWarning(
  term: LegalAgreementTerm,
  key: string,
  severity: AgreementInterpretationWarning["severity"],
  affectedSection: AgreementInterpretationWarning["affected_section"],
  message: string
): AgreementInterpretationWarning {
  return {
    key,
    severity,
    affected_section: affectedSection,
    message,
    term_id: term.id,
    term_type: term.term_type,
    citation: term.citation,
  };
}

export function interpretScenarioAgreements(input: ScenarioAgreementInterpretationInput): AgreementInterpretationWarning[] {
  const warnings: AgreementInterpretationWarning[] = [];

  for (const term of input.terms) {
    if (term.term_type === "spousal_support_waiver") {
      if (input.config.spousal_maintenance.direction !== "none" && input.config.spousal_maintenance.monthly_amount > 0) {
        warnings.push(
          makeWarning(
            term,
            `spousal-waiver-${term.id}`,
            "high",
            "maintenance",
            "This scenario includes spousal maintenance that may conflict with an agreement waiver clause."
          )
        );
      }
      continue;
    }

    if (term.term_type === "spousal_support_cap") {
      const cap = asNumber(term.term_payload.cap_monthly_amount);
      if (cap !== null && input.config.spousal_maintenance.monthly_amount > cap) {
        warnings.push(
          makeWarning(
            term,
            `spousal-cap-${term.id}`,
            "warning",
            "maintenance",
            `Scenario spousal maintenance exceeds an agreement cap (${cap} per month).`
          )
        );
      }
      continue;
    }

    if (term.term_type === "asset_split_ratio") {
      const maxUserShare = asNumber(term.term_payload.max_user_percent);
      const minUserShare = asNumber(term.term_payload.min_user_percent);
      if (maxUserShare !== null) {
        const offendingProperty = input.config.property_decisions.find((decision) => decision.equity_split_user > maxUserShare);
        if (offendingProperty) {
          warnings.push(
            makeWarning(
              term,
              `asset-ratio-${term.id}`,
              "warning",
              "property",
              "At least one property split exceeds a ratio referenced in your agreement terms."
            )
          );
        }
      }

      if (minUserShare !== null) {
        const offendingProperty = input.config.property_decisions.find((decision) => decision.equity_split_user < minUserShare);
        if (offendingProperty) {
          warnings.push(
            makeWarning(
              term,
              `asset-ratio-min-${term.id}`,
              "warning",
              "property",
              "At least one property split is below a minimum ratio referenced in your agreement terms."
            )
          );
        }
      }
      continue;
    }

    if (term.term_type === "pension_exclusion") {
      const anyPensionSplit = input.config.pension_splits.some((split) => split.split_user !== 100 && split.split_user !== 0);
      if (anyPensionSplit) {
        warnings.push(
          makeWarning(
            term,
            `pension-exclusion-${term.id}`,
            "warning",
            "pension",
            "This scenario splits pensions, but your agreement appears to include pension exclusion language."
          )
        );
      } else if (input.config.pension_splits.length > 0) {
        warnings.push(
          makeWarning(
            term,
            `pension-exclusion-review-${term.id}`,
            "info",
            "pension",
            "Your agreement includes pension exclusion wording. Confirm each pension allocation matches that clause."
          )
        );
      }
      continue;
    }

    if (term.term_type === "separate_property_exclusion") {
      const propertyIsSplit = input.config.property_decisions.some((decision) => decision.action === "sell");
      if (propertyIsSplit) {
        warnings.push(
          makeWarning(
            term,
            `separate-property-${term.id}`,
            "info",
            "property",
            "Your agreement includes separate-property language; confirm split assumptions against that clause."
          )
        );
      }
      continue;
    }

    if (term.term_type === "marital_home_allocation") {
      const anySale = input.config.property_decisions.some((decision) => decision.action === "sell");
      if (anySale) {
        warnings.push(
          makeWarning(
            term,
            `marital-home-${term.id}`,
            "warning",
            "property",
            "This scenario sells a property while agreement language references marital-home allocation."
          )
        );
      }
      continue;
    }

    if (term.term_type === "debt_allocation_rule") {
      const anyDebtSplit = input.config.debt_splits.some((split) => split.split_user > 0 && split.split_user < 100);
      if (anyDebtSplit) {
        warnings.push(
          makeWarning(
            term,
            `debt-rule-${term.id}`,
            "info",
            "debts",
            "Debt allocation in this scenario may differ from a rule in your agreement."
          )
        );
      }
      continue;
    }

    if (term.term_type === "choice_of_law" && hasMeaningfulValue(term.term_payload.jurisdiction_code)) {
      const governing = String(term.term_payload.jurisdiction_code).toUpperCase();
      if (governing !== input.jurisdictionCode.toUpperCase()) {
        warnings.push(
          makeWarning(
            term,
            `choice-of-law-${term.id}`,
            "high",
            "general",
            `Agreement choice-of-law (${governing}) differs from your selected jurisdiction (${input.jurisdictionCode}).`
          )
        );
      }
      continue;
    }

    const inferredSection = inferFallbackSection(term);
    const sectionLabel = inferredSection === "general" ? "agreement" : inferredSection;
    warnings.push(
      makeWarning(
        term,
        `material-term-${term.id}`,
        "info",
        inferredSection,
        `A material ${sectionLabel} term is present. Check this scenario against the cited clause.`
      )
    );
  }

  return warnings;
}

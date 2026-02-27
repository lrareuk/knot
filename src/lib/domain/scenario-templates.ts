import { createDefaultScenarioConfig } from "@/lib/domain/defaults";
import type { FinancialPosition, Holder, Ownership, ScenarioConfig } from "@/lib/domain/types";

export const SCENARIO_TEMPLATE_KEYS = ["balanced", "user_keeps_home", "partner_keeps_home", "clean_break_sale"] as const;

export type ScenarioTemplateKey = (typeof SCENARIO_TEMPLATE_KEYS)[number];

type PropertyAction = ScenarioConfig["property_decisions"][number]["action"];

function holderSplitToUserPercent(holder: Holder): number {
  if (holder === "user") {
    return 100;
  }
  if (holder === "partner") {
    return 0;
  }
  return 50;
}

function propertyActionFromOwnership(ownership: Ownership): { action: PropertyAction; equity_split_user: number } {
  if (ownership === "sole_user") {
    return {
      action: "user_keeps",
      equity_split_user: 100,
    };
  }
  if (ownership === "sole_partner") {
    return {
      action: "partner_keeps",
      equity_split_user: 0,
    };
  }

  return {
    action: "sell",
    equity_split_user: 50,
  };
}

function propertyEquity(currentValue: number, mortgageOutstanding: number): number {
  return currentValue - mortgageOutstanding;
}

function getHighestEquityPropertyId(position: FinancialPosition): string | null {
  const [firstProperty, ...remainingProperties] = position.properties;
  if (!firstProperty) {
    return null;
  }

  let highest = firstProperty;
  for (const property of remainingProperties) {
    const currentEquity = propertyEquity(property.current_value, property.mortgage_outstanding);
    const highestEquity = propertyEquity(highest.current_value, highest.mortgage_outstanding);
    if (currentEquity > highestEquity) {
      highest = property;
    }
  }

  return highest.id;
}

function applyBalancedDecisions(position: FinancialPosition, config: ScenarioConfig) {
  config.property_decisions = position.properties.map((property) => ({
    property_id: property.id,
    ...propertyActionFromOwnership(property.ownership),
  }));

  config.pension_splits = position.pensions.map((pension) => ({
    pension_id: pension.id,
    split_user: holderSplitToUserPercent(pension.holder),
  }));

  config.savings_splits = position.savings.map((savings) => ({
    savings_id: savings.id,
    split_user: holderSplitToUserPercent(savings.holder),
  }));

  config.debt_splits = position.debts.map((debt) => ({
    debt_id: debt.id,
    split_user: holderSplitToUserPercent(debt.holder),
  }));
}

function applyCleanBreakDecisions(position: FinancialPosition, config: ScenarioConfig) {
  config.property_decisions = position.properties.map((property) => ({
    property_id: property.id,
    action: "sell",
    equity_split_user: 50,
  }));

  config.pension_splits = position.pensions.map((pension) => ({
    pension_id: pension.id,
    split_user: 50,
  }));

  config.savings_splits = position.savings.map((savings) => ({
    savings_id: savings.id,
    split_user: 50,
  }));

  config.debt_splits = position.debts.map((debt) => ({
    debt_id: debt.id,
    split_user: 50,
  }));
}

export function buildScenarioConfigFromTemplate(
  position: FinancialPosition,
  template: ScenarioTemplateKey = "balanced"
): ScenarioConfig {
  const config = createDefaultScenarioConfig(position);

  if (template === "clean_break_sale") {
    applyCleanBreakDecisions(position, config);
    return config;
  }

  applyBalancedDecisions(position, config);

  if (template === "user_keeps_home" || template === "partner_keeps_home") {
    const highestPropertyId = getHighestEquityPropertyId(position);
    if (highestPropertyId) {
      config.property_decisions = config.property_decisions.map((decision) => {
        if (decision.property_id !== highestPropertyId) {
          return decision;
        }

        return {
          ...decision,
          action: template === "user_keeps_home" ? "user_keeps" : "partner_keeps",
          equity_split_user: template === "user_keeps_home" ? 100 : 0,
        };
      });
    }
  }

  return config;
}

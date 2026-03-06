import type { FinancialPosition, ModuleName } from "@/types/financial";
import { EXPENDITURE_FIELDS, MODULES } from "@/types/financial";

type ModuleStatus = "complete" | "partial" | "empty";

const MODULE_NAMES: ModuleName[] = MODULES.map((moduleConfig) => moduleConfig.name);

function hasValue(value: number | null | undefined): boolean {
  return typeof value === "number";
}

function hasAnyExpenditure(position: FinancialPosition): boolean {
  return EXPENDITURE_FIELDS.some((field) => hasValue(position.expenditure[field]));
}

function hasAnyIncome(position: FinancialPosition): boolean {
  return (
    hasValue(position.income.user_gross_annual) ||
    hasValue(position.income.user_net_monthly) ||
    hasValue(position.income.partner_gross_annual) ||
    hasValue(position.income.partner_net_monthly) ||
    hasValue(position.income.other_income)
  );
}

function hasAnyPropertyData(position: FinancialPosition): boolean {
  return position.properties.some(
    (property) =>
      property.label.trim().length > 0 ||
      hasValue(property.current_value) ||
      hasValue(property.mortgage_outstanding) ||
      hasValue(property.monthly_cost)
  );
}

function hasAnyPensionData(position: FinancialPosition): boolean {
  return position.pensions.some(
    (pension) =>
      pension.label.trim().length > 0 ||
      hasValue(pension.current_value) ||
      hasValue(pension.annual_amount) ||
      hasValue(pension.projected_annual_income) ||
      hasValue(pension.scottish_relevant_date_value)
  );
}

function hasAnySavingsData(position: FinancialPosition): boolean {
  return position.savings.some((savings) => savings.label.trim().length > 0 || hasValue(savings.current_value));
}

function hasAnyDebtData(position: FinancialPosition): boolean {
  return position.debts.some(
    (debt) => debt.label.trim().length > 0 || hasValue(debt.outstanding) || hasValue(debt.monthly_payment)
  );
}

function hasAnyDependantData(position: FinancialPosition): boolean {
  return position.dependants.some((dependant) => hasValue(dependant.age));
}

function anyOtherModuleComplete(position: FinancialPosition, current: ModuleName): boolean {
  return MODULE_NAMES.some((moduleName) => moduleName !== current && isModuleComplete(moduleName, position));
}

export function moduleFromPathname(pathname: string): ModuleName | null {
  const matchedModule = MODULES.find((moduleConfig) => pathname.startsWith(moduleConfig.route));
  return matchedModule?.name ?? null;
}

export function moduleHasData(moduleName: ModuleName, position: FinancialPosition): boolean {
  switch (moduleName) {
    case "dates":
      return Boolean(position.date_of_marriage || position.date_of_separation);
    case "property":
      return hasAnyPropertyData(position);
    case "income":
      return hasAnyIncome(position);
    case "pensions":
      return hasAnyPensionData(position);
    case "savings":
      return hasAnySavingsData(position);
    case "debts":
      return hasAnyDebtData(position);
    case "dependants":
      return position.has_no_dependants || hasAnyDependantData(position) || hasAnyExpenditure(position);
    default:
      return false;
  }
}

export function isModuleComplete(moduleName: ModuleName, position: FinancialPosition): boolean {
  switch (moduleName) {
    case "dates":
      return Boolean(position.date_of_marriage || position.date_of_separation);
    case "property":
      return position.properties.some((property) => hasValue(property.current_value));
    case "income":
      return hasValue(position.income.user_net_monthly);
    case "pensions":
      return position.pensions.some(
        (pension) =>
          hasValue(pension.current_value) ||
          hasValue(pension.annual_amount) ||
          hasValue(pension.projected_annual_income) ||
          hasValue(pension.scottish_relevant_date_value)
      );
    case "savings":
      return position.savings.some((savings) => hasValue(savings.current_value));
    case "debts":
      return position.debts.some((debt) => hasValue(debt.outstanding)) ||
        (position.debts.length === 0 && anyOtherModuleComplete(position, "debts"));
    case "dependants":
      return (
        position.has_no_dependants ||
        position.dependants.some((dependant) => hasValue(dependant.age)) ||
        hasAnyExpenditure(position)
      );
    default:
      return false;
  }
}

export function getModuleStatus(moduleName: ModuleName, position: FinancialPosition): ModuleStatus {
  if (isModuleComplete(moduleName, position)) {
    return "complete";
  }
  return moduleHasData(moduleName, position) ? "partial" : "empty";
}

export function firstIncompleteModuleRoute(position: FinancialPosition): string {
  for (const moduleConfig of MODULES) {
    if (!isModuleComplete(moduleConfig.name, position)) {
      return moduleConfig.route;
    }
  }
  return "/onboarding/review";
}

export function nextIncompleteModuleRoute(position: FinancialPosition, currentModuleName: ModuleName | null): string {
  if (!currentModuleName) {
    return firstIncompleteModuleRoute(position);
  }

  const currentIndex = MODULES.findIndex((moduleConfig) => moduleConfig.name === currentModuleName);
  if (currentIndex === -1) {
    return firstIncompleteModuleRoute(position);
  }

  for (let offset = 1; offset <= MODULES.length; offset += 1) {
    const nextIndex = (currentIndex + offset) % MODULES.length;
    const nextModuleConfig = MODULES[nextIndex];
    if (nextModuleConfig && !isModuleComplete(nextModuleConfig.name, position)) {
      return nextModuleConfig.route;
    }
  }

  return "/onboarding/review";
}

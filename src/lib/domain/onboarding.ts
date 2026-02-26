import type { FinancialPosition } from "@/lib/domain/types";
import type { OnboardingModule } from "@/lib/domain/defaults";

export function isModuleComplete(moduleKey: OnboardingModule, position: FinancialPosition): boolean {
  switch (moduleKey) {
    case "key-dates":
      return Boolean(position.date_of_marriage && position.date_of_separation);
    case "property":
      return position.properties.length > 0;
    case "income":
      return position.income.user_net_monthly > 0 || position.income.partner_net_monthly > 0;
    case "pensions":
      return position.pensions.length > 0;
    case "savings-investments":
      return position.savings.length > 0;
    case "debts":
      return position.debts.length > 0 || position.properties.length > 0;
    case "dependants-expenditure":
      return (
        position.dependants.length > 0 ||
        Object.values(position.expenditure).some((value) => typeof value === "number" && value > 0)
      );
    default:
      return false;
  }
}

export function firstIncompleteModule(position: FinancialPosition, modules: OnboardingModule[]) {
  for (const moduleKey of modules) {
    if (!isModuleComplete(moduleKey, position)) {
      return moduleKey;
    }
  }
  return modules[0];
}

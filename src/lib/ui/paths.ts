import type { OnboardingModule } from "@/lib/domain/defaults";

export const ROUTES = {
  start: "/start",
  login: "/login",
  signup: "/signup",
  payment: "/signup/payment",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
} as const;

export const ONBOARDING_MODULE_META: Array<{
  key: OnboardingModule;
  title: string;
  path: string;
}> = [
  { key: "key-dates", title: "Key dates", path: "/onboarding/key-dates" },
  { key: "property", title: "Property", path: "/onboarding/property" },
  { key: "income", title: "Income", path: "/onboarding/income" },
  { key: "pensions", title: "Pensions", path: "/onboarding/pensions" },
  { key: "savings-investments", title: "Savings & investments", path: "/onboarding/savings-investments" },
  { key: "debts", title: "Debts", path: "/onboarding/debts" },
  {
    key: "dependants-expenditure",
    title: "Dependants & expenditure",
    path: "/onboarding/dependants-expenditure",
  },
];

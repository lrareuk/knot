import { notFound, redirect } from "next/navigation";

const legacyModuleRedirects: Record<string, string> = {
  "key-dates": "/onboarding/dates",
  property: "/onboarding/property",
  income: "/onboarding/income",
  pensions: "/onboarding/pensions",
  "savings-investments": "/onboarding/savings",
  debts: "/onboarding/debts",
  "dependants-expenditure": "/onboarding/dependants",
};

export default async function LegacyOnboardingModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const redirectTo = legacyModuleRedirects[module];

  if (redirectTo) {
    redirect(redirectTo);
  }

  notFound();
}

"use client";

import ContinueButton from "@/components/onboarding/ContinueButton";
import CurrencyInput from "@/components/onboarding/CurrencyInput";
import ModuleHeader from "@/components/onboarding/ModuleHeader";
import SelectInput from "@/components/onboarding/SelectInput";
import { useFinancialStore } from "@/stores/financial-position";
import { MODULES } from "@/types/financial";

const INCOME_MODULE = MODULES.find((module) => module.name === "income")!;

export default function OnboardingIncomePage() {
  const position = useFinancialStore((state) => state.position);
  const setIncome = useFinancialStore((state) => state.setIncome);

  if (!position) {
    return null;
  }

  const income = position.income;

  return (
    <div>
      <ModuleHeader title={INCOME_MODULE.title} description={INCOME_MODULE.description} />

      <div className="relative grid gap-6 md:grid-cols-2">
        <div className="absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 bg-[#2A2A2A] md:block" />

        <section className="space-y-5">
          <h3 className="mb-5 border-b border-[#2A2A2A] pb-3 font-['Space_Grotesk'] text-sm font-semibold tracking-wider text-[#9A9590] uppercase">
            Your income
          </h3>
          <CurrencyInput
            label="Gross annual"
            value={income.user_gross_annual}
            onChange={(value) => setIncome({ ...income, user_gross_annual: value })}
          />
          <CurrencyInput
            label="Net monthly"
            value={income.user_net_monthly}
            onChange={(value) => setIncome({ ...income, user_net_monthly: value })}
          />
        </section>

        <section className="space-y-5">
          <h3 className="mb-5 border-b border-[#2A2A2A] pb-3 font-['Space_Grotesk'] text-sm font-semibold tracking-wider text-[#9A9590] uppercase">
            Your partner&apos;s income
          </h3>
          <CurrencyInput
            label="Gross annual"
            value={income.partner_gross_annual}
            onChange={(value) => setIncome({ ...income, partner_gross_annual: value })}
            showEstimate
            isEstimated={income.is_estimated.partner_gross_annual}
            onEstimateToggle={() =>
              setIncome({
                ...income,
                is_estimated: {
                  ...income.is_estimated,
                  partner_gross_annual: !income.is_estimated.partner_gross_annual,
                },
              })
            }
          />
          <CurrencyInput
            label="Net monthly"
            value={income.partner_net_monthly}
            onChange={(value) => setIncome({ ...income, partner_net_monthly: value })}
          />
        </section>
      </div>

      <div className="mt-8 border-t border-[#2A2A2A] pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <CurrencyInput
            label="Other income"
            value={income.other_income}
            onChange={(value) => setIncome({ ...income, other_income: value })}
          />
          <SelectInput
            label="Who receives this?"
            value={income.other_income_holder}
            onChange={(value) =>
              setIncome({
                ...income,
                other_income_holder: value as typeof income.other_income_holder,
              })
            }
            options={[
              { value: "user", label: "You" },
              { value: "partner", label: "Your partner" },
              { value: "joint", label: "Joint" },
            ]}
          />
        </div>
      </div>

      <ContinueButton />
    </div>
  );
}

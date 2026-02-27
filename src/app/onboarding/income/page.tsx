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
    <div className="onboarding-module-body">
      <ModuleHeader title={INCOME_MODULE.title} description={INCOME_MODULE.description} />

      <div className="onboarding-income-grid">
        <div className="onboarding-income-divider" aria-hidden />

        <section className="onboarding-stack-md">
          <h3 className="onboarding-income-heading">Your income</h3>
          <CurrencyInput
            label="Gross annual salary"
            value={income.user_gross_annual}
            onChange={(value) => setIncome({ ...income, user_gross_annual: value })}
            placeholder="e.g. 65,000"
          />
          <CurrencyInput
            label="Net monthly take-home"
            value={income.user_net_monthly}
            onChange={(value) => setIncome({ ...income, user_net_monthly: value })}
            placeholder="e.g. 3,800"
            help="Your pay after tax and deductions."
          />
        </section>

        <section className="onboarding-stack-md">
          <h3 className="onboarding-income-heading">Your partner&apos;s income</h3>
          <CurrencyInput
            label="Gross annual salary"
            value={income.partner_gross_annual}
            onChange={(value) => setIncome({ ...income, partner_gross_annual: value })}
            placeholder="e.g. 45,000"
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
            label="Net monthly take-home"
            value={income.partner_net_monthly}
            onChange={(value) => setIncome({ ...income, partner_net_monthly: value })}
            placeholder="e.g. 2,800"
          />
        </section>
      </div>

      <div className="onboarding-income-footer">
        <div className="onboarding-two-col-grid">
          <CurrencyInput
            label="Any other income?"
            value={income.other_income}
            onChange={(value) => setIncome({ ...income, other_income: value })}
            placeholder="Rental, freelance, dividends (monthly)"
          />
          <SelectInput
            label="Who receives this income?"
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

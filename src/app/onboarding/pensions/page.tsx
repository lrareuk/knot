"use client";

import { useEffect } from "react";
import ContinueButton from "@/components/onboarding/ContinueButton";
import CurrencyInput from "@/components/onboarding/CurrencyInput";
import ItemCard from "@/components/onboarding/ItemCard";
import ModuleHeader from "@/components/onboarding/ModuleHeader";
import SelectInput from "@/components/onboarding/SelectInput";
import TextInput from "@/components/onboarding/TextInput";
import Toggle from "@/components/onboarding/Toggle";
import { useOnboardingUI } from "@/components/onboarding/OnboardingUIContext";
import { createDefaultPension } from "@/lib/onboarding/defaults";
import { useFinancialStore } from "@/stores/financial-position";
import type { PensionItem } from "@/types/financial";
import { MODULES } from "@/types/financial";

const PENSIONS_MODULE = MODULES.find((module) => module.name === "pensions")!;

export default function OnboardingPensionsPage() {
  const { jurisdiction } = useOnboardingUI();
  const position = useFinancialStore((state) => state.position);
  const setPensions = useFinancialStore((state) => state.setPensions);
  const isUnitedKingdomJurisdiction = jurisdiction.startsWith("GB-");
  const isScottishJurisdiction = jurisdiction === "GB-SCT";

  useEffect(() => {
    if (position && position.pensions.length === 0) {
      setPensions([createDefaultPension(1)]);
    }
  }, [position, setPensions]);

  if (!position) {
    return null;
  }

  const pensions = position.pensions;

  const updatePension = (pensionId: string, updates: Partial<PensionItem>) => {
    setPensions(pensions.map((entry) => (entry.id === pensionId ? { ...entry, ...updates } : entry)));
  };

  return (
    <div className="onboarding-module-body">
      <ModuleHeader title={PENSIONS_MODULE.title} description={PENSIONS_MODULE.description} />

      <div className="onboarding-card-list">
        {pensions.map((pension, index) => {
          const canDelete = pensions.length > 1;
          const showCurrentValue = pension.pension_type === "defined_contribution";
          const showAnnualAmount = pension.pension_type === "defined_benefit" || pension.pension_type === "state";

          return (
            <ItemCard
              key={pension.id}
              title="Pension"
              index={index}
              canDelete={canDelete}
              onDelete={() => {
                if (!canDelete) {
                  return;
                }
                setPensions(pensions.filter((entry) => entry.id !== pension.id));
              }}
            >
              <TextInput
                label="What would you call this pension?"
                value={pension.label}
                onChange={(value) => updatePension(pension.id, { label: value })}
              />

              <div className="onboarding-two-col-grid">
                <SelectInput
                  label="Whose pension?"
                  value={pension.holder}
                  onChange={(value) => updatePension(pension.id, { holder: value as PensionItem["holder"] })}
                  options={[
                    { value: "user", label: "Yours" },
                    { value: "partner", label: "Your partner's" },
                  ]}
                />
                <SelectInput
                  label="Pension type"
                  value={pension.pension_type}
                  onChange={(value) => {
                    const nextType = value as PensionItem["pension_type"];
                    updatePension(pension.id, {
                      pension_type: nextType,
                      current_value: nextType === "defined_contribution" ? pension.current_value : null,
                      annual_amount: nextType === "defined_contribution" ? null : pension.annual_amount,
                    });
                  }}
                  options={[
                    { value: "defined_contribution", label: "Defined contribution" },
                    { value: "defined_benefit", label: "Defined benefit" },
                    { value: "state", label: "State pension" },
                  ]}
                />
              </div>

              <div className={`onboarding-fade-field ${showCurrentValue ? "" : "is-hidden"}`}>
                <CurrencyInput
                  label="Current value"
                  value={pension.current_value}
                  onChange={(value) => updatePension(pension.id, { current_value: value })}
                  showEstimate
                  isEstimated={pension.is_estimated.current_value}
                  onEstimateToggle={() =>
                    updatePension(pension.id, {
                      is_estimated: {
                        ...pension.is_estimated,
                        current_value: !pension.is_estimated.current_value,
                      },
                    })
                  }
                />
              </div>

              <div className={`onboarding-fade-field ${showAnnualAmount ? "" : "is-hidden"}`}>
                <CurrencyInput
                  label="Current annual amount"
                  value={pension.annual_amount}
                  onChange={(value) => updatePension(pension.id, { annual_amount: value })}
                  showEstimate
                  isEstimated={pension.is_estimated.annual_amount}
                  onEstimateToggle={() =>
                    updatePension(pension.id, {
                      is_estimated: {
                        ...pension.is_estimated,
                        annual_amount: !pension.is_estimated.annual_amount,
                      },
                    })
                  }
                />
                {pension.pension_type === "state" && isUnitedKingdomJurisdiction ? (
                  <p className="onboarding-field-help">
                    Full new state pension is currently £221.20/week (£11,502/year). Check yours at{" "}
                    <a href="https://www.gov.uk/check-state-pension" target="_blank" rel="noreferrer" className="onboarding-inline-link">
                      gov.uk/check-state-pension
                    </a>
                    .
                  </p>
                ) : pension.pension_type === "state" ? (
                  <p className="onboarding-field-help">
                    Add your latest annual estimate from your pension statement or government benefits account.
                  </p>
                  ) : null}
              </div>

              <CurrencyInput
                label="Projected annual retirement income"
                value={pension.projected_annual_income}
                onChange={(value) => updatePension(pension.id, { projected_annual_income: value })}
                help="Your best estimate of annual income this pension could provide in retirement."
                showEstimate
                isEstimated={pension.is_estimated.projected_annual_income}
                onEstimateToggle={() =>
                  updatePension(pension.id, {
                    is_estimated: {
                      ...pension.is_estimated,
                      projected_annual_income: !pension.is_estimated.projected_annual_income,
                    },
                  })
                }
              />

              {isScottishJurisdiction ? (
                <CurrencyInput
                  label="Relevant-date matrimonial value (Scotland)"
                  value={pension.scottish_relevant_date_value}
                  onChange={(value) => updatePension(pension.id, { scottish_relevant_date_value: value })}
                  help="If known, enter the pension value attributable to matrimonial property at the relevant date."
                  showEstimate
                  isEstimated={pension.is_estimated.scottish_relevant_date_value}
                  onEstimateToggle={() =>
                    updatePension(pension.id, {
                      is_estimated: {
                        ...pension.is_estimated,
                        scottish_relevant_date_value: !pension.is_estimated.scottish_relevant_date_value,
                      },
                    })
                  }
                />
              ) : null}

              <Toggle
                label="Matrimonial?"
                value={pension.is_matrimonial}
                onChange={(value) => updatePension(pension.id, { is_matrimonial: value })}
              />
            </ItemCard>
          );
        })}
      </div>

      <button
        type="button"
        className="onboarding-add-another"
        onClick={() => setPensions([...pensions, createDefaultPension(pensions.length + 1)])}
      >
        + Add another pension
      </button>

      <ContinueButton />
    </div>
  );
}

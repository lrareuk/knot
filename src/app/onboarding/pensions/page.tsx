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

  useEffect(() => {
    if (position && position.pensions.length === 0) {
      setPensions([createDefaultPension(1)]);
    }
  }, [position, setPensions]);

  if (!position) {
    return null;
  }

  const pensions = position.pensions;

  const updatePensionAt = (index: number, updates: Partial<PensionItem>) => {
    const next = [...pensions];
    next[index] = { ...next[index], ...updates };
    setPensions(next);
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
              key={`pension-${index}`}
              title="Pension"
              index={index}
              canDelete={canDelete}
              onDelete={() => {
                if (!canDelete) {
                  return;
                }
                setPensions(pensions.filter((_, pensionIndex) => pensionIndex !== index));
              }}
            >
              <TextInput
                label="What would you call this pension?"
                value={pension.label}
                onChange={(value) => updatePensionAt(index, { label: value })}
              />

              <div className="onboarding-two-col-grid">
                <SelectInput
                  label="Whose pension?"
                  value={pension.holder}
                  onChange={(value) => updatePensionAt(index, { holder: value as PensionItem["holder"] })}
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
                    updatePensionAt(index, {
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
                  onChange={(value) => updatePensionAt(index, { current_value: value })}
                  showEstimate
                  isEstimated={pension.is_estimated.current_value}
                  onEstimateToggle={() =>
                    updatePensionAt(index, {
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
                  label="Annual amount"
                  value={pension.annual_amount}
                  onChange={(value) => updatePensionAt(index, { annual_amount: value })}
                  showEstimate
                  isEstimated={pension.is_estimated.annual_amount}
                  onEstimateToggle={() =>
                    updatePensionAt(index, {
                      is_estimated: {
                        ...pension.is_estimated,
                        annual_amount: !pension.is_estimated.annual_amount,
                      },
                    })
                  }
                />
                {pension.pension_type === "state" && jurisdiction === "GB-SCT" ? (
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

              <Toggle
                label="Matrimonial?"
                value={pension.is_matrimonial}
                onChange={(value) => updatePensionAt(index, { is_matrimonial: value })}
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

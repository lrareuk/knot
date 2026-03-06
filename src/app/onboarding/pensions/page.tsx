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
const MONEYHELPER_PENSIONS_DIVORCE_URL = "https://www.moneyhelper.org.uk/en/family-and-care/divorce-and-separation/pensions-and-divorce";
const MONEYHELPER_PODE_APPOINTMENT_URL =
  "https://www.moneyhelper.org.uk/en/family-and-care/divorce-and-separation/book-your-pensions-and-divorce-appointment";
const GOV_UK_PENSION_INQUIRY_FORM_URL = "https://www.gov.uk/government/publications/pension-inquiry-form-br20";
const FCA_REGISTER_URL = "https://register.fca.org.uk/s/";

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
      {jurisdiction === "GB-EAW" ? (
        <p className="onboarding-field-help">
          In England and Wales, pension and property trade-offs can look balanced in capital but diverge in retirement income.
          Add realistic projected annual pension income where possible.
        </p>
      ) : null}
      {isUnitedKingdomJurisdiction ? (
        <section className="onboarding-pension-guidance-card" role="note" aria-label="Pension guidance">
          <header className="onboarding-pension-guidance-head">
            <p className="onboarding-pension-guidance-kicker">Pension guidance</p>
            <h2 className="onboarding-pension-guidance-title">Before you set pension shares</h2>
          </header>
          <p className="onboarding-pension-guidance-copy">
            Divorce pension outcomes can be built through pension sharing, offsetting, or pension attachment arrangements. Model each
            scenario carefully before relying on a settlement position.
          </p>
          <ul className="onboarding-pension-guidance-list">
            <li>Gather the latest value and income information for each scheme before setting shares.</li>
            <li>Check retirement income impact, not only capital totals, when offsetting pension against property.</li>
            <li>If needed, request state pension details via BR20 and check your forecast on GOV.UK.</li>
          </ul>
          <p className="onboarding-pension-guidance-links-title">Guidance and advice</p>
          <div className="onboarding-pension-guidance-links">
            <a href={MONEYHELPER_PENSIONS_DIVORCE_URL} target="_blank" rel="noreferrer" className="onboarding-pension-guidance-link">
              MoneyHelper pensions and divorce
            </a>
            <a href={MONEYHELPER_PODE_APPOINTMENT_URL} target="_blank" rel="noreferrer" className="onboarding-pension-guidance-link">
              Book pensions-on-divorce appointment
            </a>
            <a href={GOV_UK_PENSION_INQUIRY_FORM_URL} target="_blank" rel="noreferrer" className="onboarding-pension-guidance-link">
              GOV.UK BR20
            </a>
            <a href={FCA_REGISTER_URL} target="_blank" rel="noreferrer" className="onboarding-pension-guidance-link">
              FCA Register
            </a>
          </div>
        </section>
      ) : null}

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
                    State pension rates change each tax year. Check your personal forecast at{" "}
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

      {jurisdiction === "GB-EAW" ? (
        <p className="onboarding-field-help">
          Untie provides modelling only, not legal or regulated financial advice. Before committing to pension sharing or offsetting
          terms, seek legal advice and specialist pensions advice where appropriate.
        </p>
      ) : null}

      <ContinueButton />
    </div>
  );
}

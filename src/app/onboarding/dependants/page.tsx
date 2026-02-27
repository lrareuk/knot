"use client";

import { useEffect } from "react";
import ContinueButton from "@/components/onboarding/ContinueButton";
import CurrencyInput from "@/components/onboarding/CurrencyInput";
import ItemCard from "@/components/onboarding/ItemCard";
import ModuleHeader from "@/components/onboarding/ModuleHeader";
import SelectInput from "@/components/onboarding/SelectInput";
import Toggle from "@/components/onboarding/Toggle";
import { createDefaultDependant } from "@/lib/onboarding/defaults";
import { formatPounds, toNumber } from "@/lib/onboarding/currency";
import { EXPENDITURE_FIELDS, MODULES } from "@/types/financial";
import { useFinancialStore } from "@/stores/financial-position";
import type { DependantItem, ExpenditureData } from "@/types/financial";

const DEPENDANTS_MODULE = MODULES.find((module) => module.name === "dependants")!;

const EXPENDITURE_LABELS: Record<keyof ExpenditureData, string> = {
  housing: "Housing",
  utilities: "Utilities",
  council_tax: "Council tax",
  food: "Food",
  transport: "Transport",
  childcare: "Childcare",
  insurance: "Insurance",
  personal: "Personal",
  other: "Other",
};

export default function OnboardingDependantsPage() {
  const position = useFinancialStore((state) => state.position);
  const setDependants = useFinancialStore((state) => state.setDependants);
  const setExpenditure = useFinancialStore((state) => state.setExpenditure);
  const setHasNoDependants = useFinancialStore((state) => state.setHasNoDependants);

  useEffect(() => {
    if (!position) {
      return;
    }

    if (!position.has_no_dependants && position.dependants.length === 0) {
      setDependants([createDefaultDependant()]);
    }
  }, [position, setDependants]);

  if (!position) {
    return null;
  }

  const dependants = position.dependants;
  const hasDependantChildren = !position.has_no_dependants;
  const expenditure = position.expenditure;

  const updateDependantAt = (index: number, updates: Partial<DependantItem>) => {
    const next = [...dependants];
    next[index] = { ...next[index], ...updates };
    setDependants(next);
  };

  const monthlyExpenditureTotal = EXPENDITURE_FIELDS.reduce((total, field) => total + toNumber(expenditure[field]), 0);

  return (
    <div className="onboarding-module-body">
      <ModuleHeader title={DEPENDANTS_MODULE.title} description={DEPENDANTS_MODULE.description} />

      <section className="onboarding-stack-md">
        <Toggle
          label="Do you have dependant children?"
          value={hasDependantChildren}
          onChange={(value) => {
            setHasNoDependants(!value);
            if (value && dependants.length === 0) {
              setDependants([createDefaultDependant()]);
            }
          }}
        />

        {hasDependantChildren ? (
          <div className="onboarding-card-list">
            {dependants.map((dependant, index) => {
              const canDelete = dependants.length > 1;

              return (
                <ItemCard
                  key={`dependant-${index}`}
                  title="Child"
                  index={index}
                  canDelete={canDelete}
                  onDelete={() => {
                    if (!canDelete) {
                      return;
                    }
                    setDependants(dependants.filter((_, dependantIndex) => dependantIndex !== index));
                  }}
                >
                  <div className="onboarding-field">
                    <label className="onboarding-field-label">Age</label>
                    <input
                      type="number"
                      min={0}
                      max={17}
                      value={dependant.age ?? ""}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (!raw.trim()) {
                          updateDependantAt(index, { age: null });
                          return;
                        }
                        const parsed = Number(raw);
                        const safeAge = Number.isFinite(parsed) ? Math.max(0, Math.min(17, Math.trunc(parsed))) : null;
                        updateDependantAt(index, { age: safeAge });
                      }}
                      className="onboarding-field-input"
                    />
                  </div>

                  <SelectInput
                    label="Lives with"
                    value={dependant.lives_with}
                    onChange={(value) => updateDependantAt(index, { lives_with: value as DependantItem["lives_with"] })}
                    options={[
                      { value: "shared", label: "Shared" },
                      { value: "user", label: "You" },
                      { value: "partner", label: "Your partner" },
                    ]}
                  />
                </ItemCard>
              );
            })}

            <button
              type="button"
              className="onboarding-add-another"
              onClick={() => setDependants([...dependants, createDefaultDependant()])}
            >
              + Add another child
            </button>
          </div>
        ) : null}
      </section>

      <section className="onboarding-expenditure-section">
        <h3 className="onboarding-expenditure-heading">Monthly expenditure</h3>
        <div className="onboarding-two-col-grid">
          {EXPENDITURE_FIELDS.map((field) => (
            <CurrencyInput
              key={field}
              label={EXPENDITURE_LABELS[field]}
              value={expenditure[field]}
              onChange={(value) =>
                setExpenditure({
                  ...expenditure,
                  [field]: value,
                })
              }
            />
          ))}
        </div>

        <div className="onboarding-expenditure-total">
          <span>Total monthly expenditure</span>
          <span>{formatPounds(monthlyExpenditureTotal)}</span>
        </div>
      </section>

      <ContinueButton />
    </div>
  );
}

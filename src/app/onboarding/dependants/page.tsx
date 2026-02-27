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
    <div>
      <ModuleHeader title={DEPENDANTS_MODULE.title} description={DEPENDANTS_MODULE.description} />

      <section className="space-y-4">
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
          <div className="space-y-3">
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
                  <div className="w-full">
                    <label className="mb-2 block text-[13px] font-medium tracking-[0.3px] text-[#9A9590]">Age</label>
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
                      className="h-12 w-full rounded-none border border-[#2A2A2A] bg-[#1E1E1E] px-4 py-0 font-['Manrope'] text-base text-[#F4F1EA] outline-none transition-colors duration-200 placeholder:text-[#555555] focus:border-[#C2185B]"
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
              className="rounded-none border border-[#2A2A2A] bg-[#1E1E1E] px-5 py-3 text-sm font-medium text-[#9A9590] transition-colors hover:text-[#F4F1EA]"
              onClick={() => setDependants([...dependants, createDefaultDependant()])}
            >
              + Add another child
            </button>
          </div>
        ) : null}
      </section>

      <section className="mt-10">
        <h3 className="mb-4 font-['Space_Grotesk'] text-base font-semibold text-[#F4F1EA]">Monthly expenditure</h3>
        <div className="grid gap-4 md:grid-cols-2">
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

        <div className="mt-6 flex items-center justify-between border-t border-[#2A2A2A] pt-4">
          <span className="text-sm text-[#9A9590]">Total monthly expenditure</span>
          <span className="font-['Space_Grotesk'] text-lg font-semibold text-[#F4F1EA]">{formatPounds(monthlyExpenditureTotal)}</span>
        </div>
      </section>

      <ContinueButton />
    </div>
  );
}

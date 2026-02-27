"use client";

import { useEffect } from "react";
import ContinueButton from "@/components/onboarding/ContinueButton";
import CurrencyInput from "@/components/onboarding/CurrencyInput";
import ItemCard from "@/components/onboarding/ItemCard";
import ModuleHeader from "@/components/onboarding/ModuleHeader";
import SelectInput from "@/components/onboarding/SelectInput";
import TextInput from "@/components/onboarding/TextInput";
import Toggle from "@/components/onboarding/Toggle";
import { createDefaultSavings } from "@/lib/onboarding/defaults";
import { useFinancialStore } from "@/stores/financial-position";
import type { SavingsItem } from "@/types/financial";
import { MODULES } from "@/types/financial";

const SAVINGS_MODULE = MODULES.find((module) => module.name === "savings")!;

export default function OnboardingSavingsPage() {
  const position = useFinancialStore((state) => state.position);
  const setSavings = useFinancialStore((state) => state.setSavings);

  useEffect(() => {
    if (position && position.savings.length === 0) {
      setSavings([createDefaultSavings(1)]);
    }
  }, [position, setSavings]);

  if (!position) {
    return null;
  }

  const savingsItems = position.savings;

  const updateSavingsAt = (index: number, updates: Partial<SavingsItem>) => {
    const next = [...savingsItems];
    next[index] = { ...next[index], ...updates };
    setSavings(next);
  };

  return (
    <div>
      <ModuleHeader title={SAVINGS_MODULE.title} description={SAVINGS_MODULE.description} />

      <div className="space-y-3">
        {savingsItems.map((savings, index) => {
          const canDelete = savingsItems.length > 1;

          return (
            <ItemCard
              key={`savings-${index}`}
              title="Account"
              index={index}
              canDelete={canDelete}
              onDelete={() => {
                if (!canDelete) {
                  return;
                }
                setSavings(savingsItems.filter((_, savingsIndex) => savingsIndex !== index));
              }}
            >
              <TextInput label="Label" value={savings.label} onChange={(value) => updateSavingsAt(index, { label: value })} />

              <div className="grid gap-4 md:grid-cols-2">
                <SelectInput
                  label="Type"
                  value={savings.type}
                  onChange={(value) => updateSavingsAt(index, { type: value as SavingsItem["type"] })}
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "isa", label: "ISA" },
                    { value: "investment", label: "Investment" },
                    { value: "crypto", label: "Crypto" },
                    { value: "other", label: "Other" },
                  ]}
                />
                <SelectInput
                  label="Whose?"
                  value={savings.holder}
                  onChange={(value) => updateSavingsAt(index, { holder: value as SavingsItem["holder"] })}
                  options={[
                    { value: "user", label: "Yours" },
                    { value: "partner", label: "Your partner's" },
                    { value: "joint", label: "Joint" },
                  ]}
                />
              </div>

              <CurrencyInput
                label="Value"
                value={savings.current_value}
                onChange={(value) => updateSavingsAt(index, { current_value: value })}
                showEstimate
                isEstimated={savings.is_estimated.current_value}
                onEstimateToggle={() =>
                  updateSavingsAt(index, {
                    is_estimated: {
                      ...savings.is_estimated,
                      current_value: !savings.is_estimated.current_value,
                    },
                  })
                }
              />

              <Toggle
                label="Matrimonial?"
                value={savings.is_matrimonial}
                onChange={(value) => updateSavingsAt(index, { is_matrimonial: value })}
              />
            </ItemCard>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-4 rounded-none border border-[#2A2A2A] bg-[#1E1E1E] px-5 py-3 text-sm font-medium text-[#9A9590] transition-colors hover:text-[#F4F1EA]"
        onClick={() => setSavings([...savingsItems, createDefaultSavings(savingsItems.length + 1)])}
      >
        + Add another account
      </button>

      <ContinueButton />
    </div>
  );
}

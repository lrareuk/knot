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
    <div className="onboarding-module-body">
      <ModuleHeader title={SAVINGS_MODULE.title} description={SAVINGS_MODULE.description} />

      <div className="onboarding-card-list">
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
              <TextInput
                label="What would you call this account?"
                value={savings.label}
                onChange={(value) => updateSavingsAt(index, { label: value })}
              />

              <div className="onboarding-two-col-grid">
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
        className="onboarding-add-another"
        onClick={() => setSavings([...savingsItems, createDefaultSavings(savingsItems.length + 1)])}
      >
        + Add another account
      </button>

      <ContinueButton />
    </div>
  );
}

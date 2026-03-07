"use client";

import { useEffect } from "react";
import ContinueButton from "@/components/onboarding/ContinueButton";
import CurrencyInput from "@/components/onboarding/CurrencyInput";
import ItemCard from "@/components/onboarding/ItemCard";
import ModuleHeader from "@/components/onboarding/ModuleHeader";
import ModuleSection from "@/components/onboarding/ModuleSection";
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

  const updateSavings = (savingsId: string, updates: Partial<SavingsItem>) => {
    setSavings(savingsItems.map((entry) => (entry.id === savingsId ? { ...entry, ...updates } : entry)));
  };

  return (
    <div className="onboarding-module-body">
      <ModuleHeader title={SAVINGS_MODULE.title} description={SAVINGS_MODULE.description} />
      <ModuleSection title="Accounts and investments" description="List each account or investment and who holds it.">
        <div className="onboarding-card-list">
          {savingsItems.map((savings, index) => {
            const canDelete = savingsItems.length > 1;

            return (
              <ItemCard
                key={savings.id}
                title="Account"
                index={index}
                canDelete={canDelete}
                onDelete={() => {
                  if (!canDelete) {
                    return;
                  }
                  setSavings(savingsItems.filter((entry) => entry.id !== savings.id));
                }}
              >
                <TextInput
                  label="What would you call this account?"
                  value={savings.label}
                  onChange={(value) => updateSavings(savings.id, { label: value })}
                />

                <div className="onboarding-two-col-grid">
                  <SelectInput
                    label="Type"
                    value={savings.type}
                    onChange={(value) => updateSavings(savings.id, { type: value as SavingsItem["type"] })}
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
                    onChange={(value) => updateSavings(savings.id, { holder: value as SavingsItem["holder"] })}
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
                  onChange={(value) => updateSavings(savings.id, { current_value: value })}
                  showEstimate
                  isEstimated={savings.is_estimated.current_value}
                  onEstimateToggle={() =>
                    updateSavings(savings.id, {
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
                  onChange={(value) => updateSavings(savings.id, { is_matrimonial: value })}
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
      </ModuleSection>

      <ContinueButton />
    </div>
  );
}

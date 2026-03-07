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
import { createDefaultDebt } from "@/lib/onboarding/defaults";
import { useFinancialStore } from "@/stores/financial-position";
import type { DebtItem } from "@/types/financial";
import { MODULES } from "@/types/financial";

const DEBTS_MODULE = MODULES.find((module) => module.name === "debts")!;

export default function OnboardingDebtsPage() {
  const position = useFinancialStore((state) => state.position);
  const setDebts = useFinancialStore((state) => state.setDebts);

  useEffect(() => {
    if (position && position.debts.length === 0) {
      setDebts([createDefaultDebt(1)]);
    }
  }, [position, setDebts]);

  if (!position) {
    return null;
  }

  const debts = position.debts;

  const updateDebt = (debtId: string, updates: Partial<DebtItem>) => {
    setDebts(debts.map((entry) => (entry.id === debtId ? { ...entry, ...updates } : entry)));
  };

  return (
    <div className="onboarding-module-body">
      <ModuleHeader title={DEBTS_MODULE.title} description={DEBTS_MODULE.description} />
      <ModuleSection title="Debt entries" description="Capture every liability and the ongoing monthly commitment.">
        <div className="onboarding-card-list">
          {debts.map((debt, index) => {
            const canDelete = debts.length > 1;

            return (
              <ItemCard
                key={debt.id}
                title="Debt"
                index={index}
                canDelete={canDelete}
                onDelete={() => {
                  if (!canDelete) {
                    return;
                  }
                  setDebts(debts.filter((entry) => entry.id !== debt.id));
                }}
              >
                <TextInput
                  label="What would you call this debt?"
                  value={debt.label}
                  onChange={(value) => updateDebt(debt.id, { label: value })}
                />

                <SelectInput
                  label="Whose?"
                  value={debt.holder}
                  onChange={(value) => updateDebt(debt.id, { holder: value as DebtItem["holder"] })}
                  options={[
                    { value: "user", label: "Yours" },
                    { value: "partner", label: "Your partner's" },
                    { value: "joint", label: "Joint" },
                  ]}
                />

                <div className="onboarding-two-col-grid">
                  <CurrencyInput
                    label="Outstanding"
                    value={debt.outstanding}
                    onChange={(value) => updateDebt(debt.id, { outstanding: value })}
                  />
                  <CurrencyInput
                    label="Monthly payment"
                    value={debt.monthly_payment}
                    onChange={(value) => updateDebt(debt.id, { monthly_payment: value })}
                  />
                </div>

                <Toggle
                  label="Matrimonial?"
                  value={debt.is_matrimonial}
                  onChange={(value) => updateDebt(debt.id, { is_matrimonial: value })}
                />
              </ItemCard>
            );
          })}
        </div>

        <button
          type="button"
          className="onboarding-add-another"
          onClick={() => setDebts([...debts, createDefaultDebt(debts.length + 1)])}
        >
          + Add another debt
        </button>
      </ModuleSection>

      <ContinueButton />
    </div>
  );
}

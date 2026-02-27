"use client";

import { useEffect } from "react";
import ContinueButton from "@/components/onboarding/ContinueButton";
import CurrencyInput from "@/components/onboarding/CurrencyInput";
import ItemCard from "@/components/onboarding/ItemCard";
import ModuleHeader from "@/components/onboarding/ModuleHeader";
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

  const updateDebtAt = (index: number, updates: Partial<DebtItem>) => {
    const next = [...debts];
    next[index] = { ...next[index], ...updates };
    setDebts(next);
  };

  return (
    <div>
      <ModuleHeader title={DEBTS_MODULE.title} description={DEBTS_MODULE.description} />

      <div className="space-y-3">
        {debts.map((debt, index) => {
          const canDelete = debts.length > 1;

          return (
            <ItemCard
              key={`debt-${index}`}
              title="Debt"
              index={index}
              canDelete={canDelete}
              onDelete={() => {
                if (!canDelete) {
                  return;
                }
                setDebts(debts.filter((_, debtIndex) => debtIndex !== index));
              }}
            >
              <TextInput label="Label" value={debt.label} onChange={(value) => updateDebtAt(index, { label: value })} />

              <SelectInput
                label="Whose?"
                value={debt.holder}
                onChange={(value) => updateDebtAt(index, { holder: value as DebtItem["holder"] })}
                options={[
                  { value: "user", label: "Yours" },
                  { value: "partner", label: "Your partner's" },
                  { value: "joint", label: "Joint" },
                ]}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <CurrencyInput
                  label="Outstanding"
                  value={debt.outstanding}
                  onChange={(value) => updateDebtAt(index, { outstanding: value })}
                />
                <CurrencyInput
                  label="Monthly payment"
                  value={debt.monthly_payment}
                  onChange={(value) => updateDebtAt(index, { monthly_payment: value })}
                />
              </div>

              <Toggle
                label="Matrimonial?"
                value={debt.is_matrimonial}
                onChange={(value) => updateDebtAt(index, { is_matrimonial: value })}
              />
            </ItemCard>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-4 rounded-none border border-[#2A2A2A] bg-[#1E1E1E] px-5 py-3 text-sm font-medium text-[#9A9590] transition-colors hover:text-[#F4F1EA]"
        onClick={() => setDebts([...debts, createDefaultDebt(debts.length + 1)])}
      >
        + Add another debt
      </button>

      <ContinueButton />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import ContinueButton from "@/components/onboarding/ContinueButton";
import CurrencyInput from "@/components/onboarding/CurrencyInput";
import ItemCard from "@/components/onboarding/ItemCard";
import ModuleHeader from "@/components/onboarding/ModuleHeader";
import SelectInput from "@/components/onboarding/SelectInput";
import TextInput from "@/components/onboarding/TextInput";
import Toggle from "@/components/onboarding/Toggle";
import { createDefaultProperty } from "@/lib/onboarding/defaults";
import { formatPounds, toNumber } from "@/lib/onboarding/currency";
import { useFinancialStore } from "@/stores/financial-position";
import type { PropertyItem } from "@/types/financial";
import { MODULES } from "@/types/financial";

const PROPERTY_MODULE = MODULES.find((module) => module.name === "property")!;

function nextProperty(current: PropertyItem, updates: Partial<PropertyItem>): PropertyItem {
  const withUpdates = { ...current, ...updates };
  const equity = toNumber(withUpdates.current_value) - toNumber(withUpdates.mortgage_outstanding);
  return {
    ...withUpdates,
    equity,
  };
}

export default function OnboardingPropertyPage() {
  const position = useFinancialStore((state) => state.position);
  const setProperties = useFinancialStore((state) => state.setProperties);

  useEffect(() => {
    if (position && position.properties.length === 0) {
      setProperties([createDefaultProperty(1)]);
    }
  }, [position, setProperties]);

  if (!position) {
    return null;
  }

  const properties = position.properties;

  return (
    <div>
      <ModuleHeader title={PROPERTY_MODULE.title} description={PROPERTY_MODULE.description} />

      <div className="space-y-3">
        {properties.map((property, index) => {
          const canDelete = properties.length > 1;

          return (
            <ItemCard
              key={`property-${index}`}
              title="Property"
              index={index}
              canDelete={canDelete}
              onDelete={() => {
                if (!canDelete) {
                  return;
                }
                setProperties(properties.filter((_, propertyIndex) => propertyIndex !== index));
              }}
            >
              <TextInput
                label="Label"
                value={property.label}
                onChange={(value) => {
                  const next = [...properties];
                  next[index] = nextProperty(property, { label: value });
                  setProperties(next);
                }}
                placeholder="e.g. Family home"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <CurrencyInput
                  label="Current value"
                  value={property.current_value}
                  onChange={(value) => {
                    const next = [...properties];
                    next[index] = nextProperty(property, { current_value: value });
                    setProperties(next);
                  }}
                  showEstimate
                  isEstimated={property.is_estimated.current_value}
                  onEstimateToggle={() => {
                    const next = [...properties];
                    next[index] = nextProperty(property, {
                      is_estimated: {
                        ...property.is_estimated,
                        current_value: !property.is_estimated.current_value,
                      },
                    });
                    setProperties(next);
                  }}
                />

                <CurrencyInput
                  label="Mortgage"
                  value={property.mortgage_outstanding}
                  onChange={(value) => {
                    const next = [...properties];
                    next[index] = nextProperty(property, { mortgage_outstanding: value });
                    setProperties(next);
                  }}
                  help="The remaining balance."
                  showEstimate
                  isEstimated={property.is_estimated.mortgage_outstanding}
                  onEstimateToggle={() => {
                    const next = [...properties];
                    next[index] = nextProperty(property, {
                      is_estimated: {
                        ...property.is_estimated,
                        mortgage_outstanding: !property.is_estimated.mortgage_outstanding,
                      },
                    });
                    setProperties(next);
                  }}
                />
              </div>

              <div className="flex items-center justify-between border border-[#2A2A2A] bg-[#121212] p-3.5">
                <span className="text-[13px] text-[#9A9590]">Equity</span>
                <span
                  className={`font-['Space_Grotesk'] text-lg font-semibold ${
                    toNumber(property.equity) < 0 ? "text-[#C46A5E]" : "text-[#F4F1EA]"
                  }`}
                >
                  {formatPounds(property.equity)}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectInput
                  label="Ownership"
                  value={property.ownership}
                  onChange={(value) => {
                    const next = [...properties];
                    next[index] = nextProperty(property, {
                      ownership: value as PropertyItem["ownership"],
                    });
                    setProperties(next);
                  }}
                  options={[
                    { value: "joint", label: "Joint" },
                    { value: "sole_user", label: "Solely yours" },
                    { value: "sole_partner", label: "Solely your partner's" },
                  ]}
                />

                <Toggle
                  label="Matrimonial?"
                  value={property.is_matrimonial}
                  onChange={(value) => {
                    const next = [...properties];
                    next[index] = nextProperty(property, { is_matrimonial: value });
                    setProperties(next);
                  }}
                />
              </div>

              <CurrencyInput
                label="Monthly cost"
                value={property.monthly_cost}
                onChange={(value) => {
                  const next = [...properties];
                  next[index] = nextProperty(property, { monthly_cost: value });
                  setProperties(next);
                }}
                help="Total monthly: mortgage, insurance, upkeep."
                showEstimate
                isEstimated={property.is_estimated.monthly_cost}
                onEstimateToggle={() => {
                  const next = [...properties];
                  next[index] = nextProperty(property, {
                    is_estimated: {
                      ...property.is_estimated,
                      monthly_cost: !property.is_estimated.monthly_cost,
                    },
                  });
                  setProperties(next);
                }}
              />
            </ItemCard>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-4 rounded-none border border-[#2A2A2A] bg-[#1E1E1E] px-5 py-3 text-sm font-medium text-[#9A9590] transition-colors hover:text-[#F4F1EA]"
        onClick={() => {
          setProperties([...properties, createDefaultProperty(properties.length + 1)]);
        }}
      >
        + Add another property
      </button>

      <ContinueButton />
    </div>
  );
}

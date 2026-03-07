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
import { useOnboardingUI } from "@/components/onboarding/OnboardingUIContext";
import { formatMoney, toNumber } from "@/lib/onboarding/currency";
import { createDefaultProperty } from "@/lib/onboarding/defaults";
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
  const { currencyCode } = useOnboardingUI();
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
  const updateProperty = (propertyId: string, updates: Partial<PropertyItem>) => {
    setProperties(properties.map((current) => (current.id === propertyId ? nextProperty(current, updates) : current)));
  };

  return (
    <div className="onboarding-module-body">
      <ModuleHeader title={PROPERTY_MODULE.title} description={PROPERTY_MODULE.description} />

      <ModuleSection title="Property entries" description="Add each property and its current equity position.">
        <div className="onboarding-card-list">
          {properties.map((property, index) => {
            const canDelete = properties.length > 1;

            return (
              <ItemCard
                key={property.id}
                title="Property"
                index={index}
                canDelete={canDelete}
                onDelete={() => {
                  if (!canDelete) {
                    return;
                  }
                  setProperties(properties.filter((entry) => entry.id !== property.id));
                }}
              >
                <TextInput
                  label="What would you call this property?"
                  value={property.label}
                  onChange={(value) => updateProperty(property.id, { label: value })}
                  placeholder="e.g. Family home"
                />

                <div className="onboarding-two-col-grid">
                  <CurrencyInput
                    label="What is it worth today?"
                    value={property.current_value}
                    onChange={(value) => updateProperty(property.id, { current_value: value })}
                    placeholder="e.g. 350,000"
                    showEstimate
                    isEstimated={property.is_estimated.current_value}
                    onEstimateToggle={() =>
                      updateProperty(property.id, {
                        is_estimated: {
                          ...property.is_estimated,
                          current_value: !property.is_estimated.current_value,
                        },
                      })
                    }
                  />

                  <CurrencyInput
                    label="Outstanding mortgage?"
                    value={property.mortgage_outstanding}
                    onChange={(value) => updateProperty(property.id, { mortgage_outstanding: value })}
                    placeholder="e.g. 180,000"
                    help="The remaining balance."
                    showEstimate
                    isEstimated={property.is_estimated.mortgage_outstanding}
                    onEstimateToggle={() =>
                      updateProperty(property.id, {
                        is_estimated: {
                          ...property.is_estimated,
                          mortgage_outstanding: !property.is_estimated.mortgage_outstanding,
                        },
                      })
                    }
                  />
                </div>

                <div className="onboarding-computed-field">
                  <span className="onboarding-computed-label">Equity</span>
                  <span className={`onboarding-computed-value ${toNumber(property.equity) < 0 ? "is-negative" : ""}`}>
                    {formatMoney(property.equity, currencyCode)}
                  </span>
                </div>

                <div className="onboarding-two-col-grid">
                  <SelectInput
                    label="Who owns this property?"
                    value={property.ownership}
                    onChange={(value) =>
                      updateProperty(property.id, {
                        ownership: value as PropertyItem["ownership"],
                      })
                    }
                    options={[
                      { value: "joint", label: "Joint" },
                      { value: "sole_user", label: "Solely yours" },
                      { value: "sole_partner", label: "Solely your partner's" },
                    ]}
                  />

                  <Toggle
                    label="Was this acquired during the marriage?"
                    value={property.is_matrimonial}
                    onChange={(value) => updateProperty(property.id, { is_matrimonial: value })}
                  />
                </div>

                <CurrencyInput
                  label="Monthly housing cost"
                  value={property.monthly_cost}
                  onChange={(value) => updateProperty(property.id, { monthly_cost: value })}
                  help="Total monthly: mortgage, insurance, upkeep."
                  showEstimate
                  isEstimated={property.is_estimated.monthly_cost}
                  onEstimateToggle={() =>
                    updateProperty(property.id, {
                      is_estimated: {
                        ...property.is_estimated,
                        monthly_cost: !property.is_estimated.monthly_cost,
                      },
                    })
                  }
                />
              </ItemCard>
            );
          })}
        </div>

        <button
          type="button"
          className="onboarding-add-another"
          onClick={() => {
            setProperties([...properties, createDefaultProperty(properties.length + 1)]);
          }}
        >
          + Add another property
        </button>
      </ModuleSection>

      <ContinueButton />
    </div>
  );
}

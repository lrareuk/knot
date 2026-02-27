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
import { createDefaultProperty } from "@/lib/onboarding/defaults";
import { formatMoney, toNumber } from "@/lib/onboarding/currency";
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

  return (
    <div className="onboarding-module-body">
      <ModuleHeader title={PROPERTY_MODULE.title} description={PROPERTY_MODULE.description} />

      <div className="onboarding-card-list">
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
                label="What would you call this property?"
                value={property.label}
                onChange={(value) => {
                  const next = [...properties];
                  next[index] = nextProperty(property, { label: value });
                  setProperties(next);
                }}
                placeholder="e.g. Family home"
              />

              <div className="onboarding-two-col-grid">
                <CurrencyInput
                  label="What is it worth today?"
                  value={property.current_value}
                  onChange={(value) => {
                    const next = [...properties];
                    next[index] = nextProperty(property, { current_value: value });
                    setProperties(next);
                  }}
                  placeholder="e.g. 350,000"
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
                  label="Outstanding mortgage?"
                  value={property.mortgage_outstanding}
                  onChange={(value) => {
                    const next = [...properties];
                    next[index] = nextProperty(property, { mortgage_outstanding: value });
                    setProperties(next);
                  }}
                  placeholder="e.g. 180,000"
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
                  label="Was this acquired during the marriage?"
                  value={property.is_matrimonial}
                  onChange={(value) => {
                    const next = [...properties];
                    next[index] = nextProperty(property, { is_matrimonial: value });
                    setProperties(next);
                  }}
                />
              </div>

              <CurrencyInput
                label="Monthly housing cost"
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
        className="onboarding-add-another"
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

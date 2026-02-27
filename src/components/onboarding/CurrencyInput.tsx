"use client";

import { useEffect, useMemo, useState } from "react";
import { useOnboardingUI } from "@/components/onboarding/OnboardingUIContext";
import { currencySymbol } from "@/lib/onboarding/currency";

type CurrencyInputProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  help?: string;
  showEstimate?: boolean;
  isEstimated?: boolean;
  onEstimateToggle?: () => void;
};

function sanitizeCurrencyInput(rawValue: string, symbol: string): string {
  const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withoutSymbols = rawValue.replace(new RegExp(`[\\s,${escapedSymbol}]`, "g"), "");
  const onlyNumeric = withoutSymbols.replace(/[^0-9.-]/g, "");
  const unsigned = onlyNumeric.replace(/-/g, "");
  const firstDotIndex = unsigned.indexOf(".");

  if (firstDotIndex === -1) {
    return unsigned;
  }

  return `${unsigned.slice(0, firstDotIndex + 1)}${unsigned.slice(firstDotIndex + 1).replace(/\./g, "")}`;
}

function parseCurrency(rawValue: string, symbol: string): number | null {
  const normalized = sanitizeCurrencyInput(rawValue, symbol);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.abs(parsed);
}

function formatForEdit(value: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }
  return `${value}`;
}

function formatForDisplay(value: number | null, locale: string): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export default function CurrencyInput({
  label,
  value,
  onChange,
  placeholder,
  help,
  showEstimate,
  isEstimated,
  onEstimateToggle,
}: CurrencyInputProps) {
  const { currencyCode } = useOnboardingUI();
  const symbol = currencySymbol(currencyCode);
  const locale = currencyCode === "USD" ? "en-US" : currencyCode === "CAD" ? "en-CA" : "en-GB";
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const displayValue = useMemo(() => {
    return isFocused ? formatForEdit(value) : formatForDisplay(value, locale);
  }, [isFocused, locale, value]);

  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  return (
    <div className="onboarding-field">
      <label className="onboarding-field-label">{label}</label>
      <div className="onboarding-currency-wrap">
        <span className="onboarding-currency-prefix">{symbol}</span>
        <input
          type="text"
          inputMode="decimal"
          className="onboarding-field-input onboarding-field-input-with-prefix"
          value={inputValue}
          placeholder={placeholder}
          onFocus={() => {
            setIsFocused(true);
            setInputValue(formatForEdit(value));
          }}
          onBlur={() => {
            setIsFocused(false);
            setInputValue(formatForDisplay(value, locale));
          }}
          onChange={(event) => {
            const nextRawValue = event.target.value;
            setInputValue(nextRawValue);
            onChange(parseCurrency(nextRawValue, symbol));
          }}
        />
      </div>
      {help ? <p className="onboarding-field-help">{help}</p> : null}
      {showEstimate && onEstimateToggle ? (
        <button
          type="button"
          className={`onboarding-estimate-toggle ${isEstimated ? "is-active" : ""}`}
          onClick={onEstimateToggle}
        >
          {isEstimated ? "Marked as estimate" : "I'm not sure about this figure"}
        </button>
      ) : null}
    </div>
  );
}

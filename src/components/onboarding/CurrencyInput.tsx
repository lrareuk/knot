"use client";

import { useEffect, useMemo, useState } from "react";

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

const displayFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
});

function sanitizeCurrencyInput(rawValue: string): string {
  const withoutSymbols = rawValue.replace(/[\s,£]/g, "");
  const onlyNumeric = withoutSymbols.replace(/[^0-9.-]/g, "");
  const unsigned = onlyNumeric.replace(/-/g, "");
  const firstDotIndex = unsigned.indexOf(".");

  if (firstDotIndex === -1) {
    return unsigned;
  }

  return `${unsigned.slice(0, firstDotIndex + 1)}${unsigned.slice(firstDotIndex + 1).replace(/\./g, "")}`;
}

function parseCurrency(rawValue: string): number | null {
  const normalized = sanitizeCurrencyInput(rawValue);
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
  return Number.isInteger(value) ? `${value}` : `${value}`;
}

function formatForDisplay(value: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }
  return displayFormatter.format(value);
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
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const displayValue = useMemo(() => {
    return isFocused ? formatForEdit(value) : formatForDisplay(value);
  }, [isFocused, value]);

  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  return (
    <div className="w-full">
      <label className="mb-2 block text-[13px] font-medium tracking-[0.3px] text-[#9A9590]">{label}</label>
      <div className="relative w-full">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-base font-medium text-[#555555]">£</span>
        <input
          type="text"
          inputMode="decimal"
          className="h-12 w-full rounded-none border border-[#2A2A2A] bg-[#1E1E1E] py-0 pl-8 pr-4 font-['Manrope'] text-base text-[#F4F1EA] outline-none transition-colors duration-200 placeholder:text-[#555555] focus:border-[#C2185B]"
          value={inputValue}
          placeholder={placeholder}
          onFocus={() => {
            setIsFocused(true);
            setInputValue(formatForEdit(value));
          }}
          onBlur={() => {
            setIsFocused(false);
            setInputValue(formatForDisplay(value));
          }}
          onChange={(event) => {
            const nextRawValue = event.target.value;
            setInputValue(nextRawValue);
            onChange(parseCurrency(nextRawValue));
          }}
        />
      </div>
      {help ? <p className="mt-1.5 text-xs leading-relaxed text-[#555555]">{help}</p> : null}
      {showEstimate && onEstimateToggle ? (
        <button
          type="button"
          className={`mt-1.5 border-0 bg-transparent text-xs ${
            isEstimated ? "italic text-[#9A9590]" : "text-[#555555] hover:text-[#9A9590]"
          }`}
          onClick={onEstimateToggle}
        >
          {isEstimated ? "Marked as estimate" : "I'm not sure about this figure"}
        </button>
      ) : null}
    </div>
  );
}

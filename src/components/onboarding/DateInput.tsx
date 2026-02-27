"use client";

import { useEffect, useState } from "react";

type DateInputProps = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  help?: string;
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function isoToDisplay(isoValue: string | null): string {
  if (!isoValue) {
    return "";
  }

  const parts = isoValue.split("-");
  if (parts.length !== 3) {
    return "";
  }

  const [year, month, day] = parts;
  if (!year || !month || !day) {
    return "";
  }

  return `${day} / ${month} / ${year}`;
}

function digitsToDisplay(digits: string): string {
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return day;
  }

  if (digits.length <= 4) {
    return `${day} / ${month}`;
  }

  return `${day} / ${month} / ${year}`;
}

function parseDisplayDate(displayValue: string): string | null {
  const digits = displayValue.replace(/\D/g, "");
  if (digits.length !== 8) {
    return null;
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (candidate.getTime() > today.getTime()) {
    return null;
  }

  return `${year}-${pad(month)}-${pad(day)}`;
}

export default function DateInput({ label, value, onChange, help }: DateInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(isoToDisplay(value));
  }, [value]);

  return (
    <div className="w-full">
      <label className="mb-2 block text-[13px] font-medium tracking-[0.3px] text-[#9A9590]">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        className="h-12 w-full rounded-none border border-[#2A2A2A] bg-[#1E1E1E] px-4 py-0 font-['Manrope'] text-base text-[#F4F1EA] outline-none transition-colors duration-200 placeholder:text-[#555555] focus:border-[#C2185B]"
        value={inputValue}
        placeholder="DD / MM / YYYY"
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
          setInputValue(digitsToDisplay(digits));
          setError(null);
          if (!digits.length) {
            onChange(null);
          }
        }}
        onBlur={() => {
          if (!inputValue.trim()) {
            setError(null);
            onChange(null);
            return;
          }

          const parsedIso = parseDisplayDate(inputValue);
          if (!parsedIso) {
            setError("Please enter a valid date");
            onChange(null);
            return;
          }

          setError(null);
          onChange(parsedIso);
          setInputValue(isoToDisplay(parsedIso));
        }}
      />
      {help ? <p className="mt-1.5 text-xs leading-relaxed text-[#555555]">{help}</p> : null}
      {error ? <p className="mt-1 text-xs text-[#C46A5E]">{error}</p> : null}
    </div>
  );
}

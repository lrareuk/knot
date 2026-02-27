"use client";

type SelectInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

export default function SelectInput({ label, value, onChange, options }: SelectInputProps) {
  return (
    <div className="onboarding-field">
      <label className="onboarding-field-label">{label}</label>
      <div className="onboarding-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="onboarding-select">
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg aria-hidden className="onboarding-select-chevron" viewBox="0 0 16 16" fill="none">
          <path d="M3.5 6.25 8 10.75l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </div>
    </div>
  );
}

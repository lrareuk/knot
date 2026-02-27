"use client";

type ToggleProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
};

export default function Toggle({
  label,
  value,
  onChange,
  trueLabel = "Yes",
  falseLabel = "No",
}: ToggleProps) {
  return (
    <div className="onboarding-field">
      <p className="onboarding-field-label">{label}</p>
      <div className="onboarding-toggle-group">
        <button
          type="button"
          className={`onboarding-toggle-option ${value ? "is-active" : ""}`}
          onClick={() => onChange(true)}
        >
          {trueLabel}
        </button>
        <button
          type="button"
          className={`onboarding-toggle-option ${!value ? "is-active" : ""}`}
          onClick={() => onChange(false)}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  );
}

"use client";

type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
};

export default function TextInput({ label, value, onChange, placeholder, help }: TextInputProps) {
  return (
    <div className="onboarding-field">
      <label className="onboarding-field-label">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="onboarding-field-input"
      />
      {help ? <p className="onboarding-field-help">{help}</p> : null}
    </div>
  );
}

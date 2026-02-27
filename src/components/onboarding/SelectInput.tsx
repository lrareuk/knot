"use client";

type SelectInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

export default function SelectInput({ label, value, onChange, options }: SelectInputProps) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-[13px] font-medium tracking-[0.3px] text-[#9A9590]">{label}</label>
      <div className="relative w-full">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-none border border-[#2A2A2A] bg-[#1E1E1E] px-4 pr-10 font-['Manrope'] text-base text-[#F4F1EA] outline-none transition-colors duration-200 focus:border-[#C2185B]"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#1E1E1E] text-[#F4F1EA]">
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[#9A9590]"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M3.5 6.25 8 10.75l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </div>
    </div>
  );
}

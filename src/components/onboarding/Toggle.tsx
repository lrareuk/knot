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
    <div className="w-full">
      <p className="mb-2 block text-[13px] font-medium tracking-[0.3px] text-[#9A9590]">{label}</p>
      <div className="flex w-fit overflow-hidden rounded-none border border-[#2A2A2A]">
        <button
          type="button"
          className={`border-r border-[#2A2A2A] px-6 py-2.5 text-sm font-medium transition-colors duration-200 ${
            value ? "bg-[#C2185B] text-[#F4F1EA]" : "bg-[#1E1E1E] text-[#9A9590]"
          }`}
          onClick={() => onChange(true)}
        >
          {trueLabel}
        </button>
        <button
          type="button"
          className={`px-6 py-2.5 text-sm font-medium transition-colors duration-200 ${
            value ? "bg-[#1E1E1E] text-[#9A9590]" : "bg-[#C2185B] text-[#F4F1EA]"
          }`}
          onClick={() => onChange(false)}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  );
}

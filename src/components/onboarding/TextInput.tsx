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
    <div className="w-full">
      <label className="mb-2 block text-[13px] font-medium tracking-[0.3px] text-[#9A9590]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-none border border-[#2A2A2A] bg-[#1E1E1E] px-4 py-0 font-['Manrope'] text-base text-[#F4F1EA] outline-none transition-colors duration-200 placeholder:text-[#555555] focus:border-[#C2185B]"
      />
      {help ? <p className="mt-1.5 text-xs leading-relaxed text-[#555555]">{help}</p> : null}
    </div>
  );
}

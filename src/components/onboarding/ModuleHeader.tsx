"use client";

import SaveIndicator from "@/components/onboarding/SaveIndicator";
import { useOnboardingUI } from "@/components/onboarding/OnboardingUIContext";

type ModuleHeaderProps = {
  title: string;
  description: string;
};

export default function ModuleHeader({ title, description }: ModuleHeaderProps) {
  const { openGuidance } = useOnboardingUI();

  return (
    <div className="relative mb-10">
      <div className="absolute top-0 right-0 flex items-center gap-3">
        <SaveIndicator />
        <button
          type="button"
          className="block h-7 w-7 border border-[#2A2A2A] bg-[#1E1E1E] text-sm font-semibold text-[#9A9590] transition-colors hover:text-[#F4F1EA] lg:hidden"
          onClick={openGuidance}
          aria-label="Open guidance"
        >
          ?
        </button>
      </div>
      <h1 className="font-['Space_Grotesk'] text-[28px] font-bold tracking-tight text-[#F4F1EA]">{title}</h1>
      <p className="mt-3 max-w-[540px] text-[15px] leading-relaxed text-[#9A9590]">{description}</p>
    </div>
  );
}

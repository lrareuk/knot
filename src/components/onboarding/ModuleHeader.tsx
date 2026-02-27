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
    <header className="onboarding-module-header">
      <div className="onboarding-module-header-top">
        <h1 className="onboarding-module-title">{title}</h1>
        <div className="onboarding-module-header-actions">
          <SaveIndicator />
          <button
            type="button"
            className="onboarding-guidance-trigger"
            onClick={openGuidance}
            aria-label="Open guidance"
          >
            ?
          </button>
        </div>
      </div>
      <p className="onboarding-module-description">{description}</p>
    </header>
  );
}

"use client";

import { usePathname } from "next/navigation";
import SaveIndicator from "@/components/onboarding/SaveIndicator";
import { useOnboardingUI } from "@/components/onboarding/OnboardingUIContext";
import { moduleFromPathname } from "@/lib/onboarding/progress";
import { MODULES } from "@/types/financial";

type ModuleHeaderProps = {
  title: string;
  description: string;
};

export default function ModuleHeader({ title, description }: ModuleHeaderProps) {
  const pathname = usePathname();
  const { openGuidance } = useOnboardingUI();
  const moduleName = moduleFromPathname(pathname);
  const moduleIndex = moduleName ? MODULES.findIndex((module) => module.name === moduleName) : -1;
  const stepLabel = moduleIndex >= 0 ? `Step ${moduleIndex + 1} of ${MODULES.length}` : null;

  return (
    <header className="onboarding-module-header">
      {stepLabel ? <p className="onboarding-module-kicker">{stepLabel}</p> : null}
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

"use client";

import ContinueButton from "@/components/onboarding/ContinueButton";
import DateInput from "@/components/onboarding/DateInput";
import ModuleHeader from "@/components/onboarding/ModuleHeader";
import ModuleSection from "@/components/onboarding/ModuleSection";
import { useFinancialStore } from "@/stores/financial-position";
import { MODULES } from "@/types/financial";

const DATES_MODULE = MODULES.find((module) => module.name === "dates")!;

export default function OnboardingDatesPage() {
  const position = useFinancialStore((state) => state.position);
  const updateDates = useFinancialStore((state) => state.updateDates);

  if (!position) {
    return null;
  }

  return (
    <div className="onboarding-module-body">
      <ModuleHeader title={DATES_MODULE.title} description={DATES_MODULE.description} />
      <ModuleSection title="Relationship timeline" description="Use key dates to anchor what counts as matrimonial property.">
        <div className="onboarding-two-col-grid">
          <DateInput
            label="When did you get married?"
            value={position.date_of_marriage}
            onChange={(value) => updateDates({ date_of_marriage: value })}
            help="This marks the start of the matrimonial property period."
          />
          <DateInput
            label="When did you separate?"
            value={position.date_of_separation}
            onChange={(value) => updateDates({ date_of_separation: value })}
            help="If not yet separated, leave blank or use today's date."
          />
        </div>
      </ModuleSection>
      <ContinueButton />
    </div>
  );
}

"use client";

import { useFinancialStore } from "@/stores/financial-position";

export default function SaveIndicator() {
  const saveStatus = useFinancialStore((state) => state.saveStatus);

  if (saveStatus === "idle") {
    return <div className="onboarding-save-indicator" aria-hidden />;
  }

  if (saveStatus === "saving") {
    return (
      <div className="onboarding-save-indicator is-visible is-saving" role="status" aria-live="polite">
        <span className="dot" />
        <span>Saving...</span>
      </div>
    );
  }

  if (saveStatus === "saved") {
    return (
      <div className="onboarding-save-indicator is-visible is-saved" role="status" aria-live="polite">
        <span aria-hidden>✓</span>
        <span>Saved</span>
      </div>
    );
  }

  return (
    <div className="onboarding-save-indicator is-visible is-error" role="status" aria-live="polite">
      Could not save - retrying
    </div>
  );
}

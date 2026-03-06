"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import ContextPanel from "@/components/onboarding/ContextPanel";
import MobileProgressBar from "@/components/onboarding/MobileProgressBar";
import Sidebar from "@/components/onboarding/Sidebar";
import { OnboardingUIProvider } from "@/components/onboarding/OnboardingUIContext";
import { moduleFromPathname } from "@/lib/onboarding/progress";
import { MODULES } from "@/types/financial";
import { useFinancialStore } from "@/stores/financial-position";

type OnboardingShellProps = {
  userId: string;
  firstName: string | null;
  currencyCode: "GBP" | "USD" | "CAD";
  jurisdiction: string;
  children: ReactNode;
};

function LoadingShell({ firstName }: { firstName: string | null }) {
  return (
    <div className="onboarding-theme onboarding-shell">
      <div className="onboarding-grid">
        <Sidebar firstName={firstName} />
        <main className="onboarding-main">
          <div className="onboarding-main-inner onboarding-loading" aria-hidden>
            <div className="onboarding-loading-line onboarding-loading-line-title" />
            <div className="onboarding-loading-line" />
            <div className="onboarding-loading-line onboarding-loading-line-short" />
            <div className="onboarding-loading-block" />
          </div>
        </main>
        <ContextPanel guidance="Loading guidance..." />
      </div>
    </div>
  );
}

export default function OnboardingShell({ userId, firstName, currencyCode, jurisdiction, children }: OnboardingShellProps) {
  const pathname = usePathname();
  const fetchPosition = useFinancialStore((state) => state.fetch);
  const isLoading = useFinancialStore((state) => state.isLoading);
  const position = useFinancialStore((state) => state.position);
  const [isGuidanceOpen, setGuidanceOpen] = useState(false);

  const isStandalonePage = pathname === "/onboarding/review" || pathname === "/onboarding/safety";

  useEffect(() => {
    void fetchPosition(userId);
  }, [fetchPosition, userId]);

  const currentModuleName = moduleFromPathname(pathname);
  const currentGuidance = useMemo(() => {
    if (!currentModuleName) {
      return "";
    }
    return MODULES.find((module) => module.name === currentModuleName)?.guidance ?? "";
  }, [currentModuleName]);

  if (isLoading || !position) {
    return <LoadingShell firstName={firstName} />;
  }

  if (isStandalonePage) {
    return (
      <OnboardingUIProvider value={{ openGuidance: () => setGuidanceOpen(true), currencyCode, jurisdiction }}>
        <div className="onboarding-theme onboarding-shell">{children}</div>
      </OnboardingUIProvider>
    );
  }

  return (
    <OnboardingUIProvider value={{ openGuidance: () => setGuidanceOpen(true), currencyCode, jurisdiction }}>
      <div className="onboarding-theme onboarding-shell">
        <MobileProgressBar />
        <div className="onboarding-grid">
          <Sidebar firstName={firstName} />

          <main className="onboarding-main">
            <div className="onboarding-main-inner onboarding-module">{children}</div>
          </main>

          <ContextPanel guidance={currentGuidance} />
        </div>

        <div className={`onboarding-guidance-overlay ${isGuidanceOpen ? "is-open" : ""}`}>
          <button
            type="button"
            className="onboarding-guidance-backdrop"
            aria-label="Close guidance"
            onClick={() => setGuidanceOpen(false)}
          />
          <aside className="onboarding-guidance-drawer" aria-label="Guidance panel">
            <div className="onboarding-guidance-drawer-head">
              <p className="onboarding-context-title">Guidance</p>
              <button
                type="button"
                className="onboarding-guidance-close"
                onClick={() => setGuidanceOpen(false)}
                aria-label="Close guidance"
              >
                ×
              </button>
            </div>
            <p className="onboarding-context-guidance">{currentGuidance}</p>
          </aside>
        </div>
      </div>
    </OnboardingUIProvider>
  );
}

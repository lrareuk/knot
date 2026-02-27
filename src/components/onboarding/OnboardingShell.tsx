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
  children: ReactNode;
};

function LoadingShell({ firstName }: { firstName: string | null }) {
  return (
    <div className="onboarding-theme min-h-screen bg-[#121212] text-[#F4F1EA]">
      <Sidebar firstName={firstName} />
      <main className="px-5 py-6 md:ml-[280px] md:max-w-[740px] md:px-14 md:py-12 lg:mr-[300px]">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-2/3 bg-[#1E1E1E]" />
          <div className="h-5 w-full bg-[#1E1E1E]" />
          <div className="h-5 w-4/5 bg-[#1E1E1E]" />
          <div className="mt-10 h-64 w-full bg-[#1E1E1E]" />
        </div>
      </main>
      <ContextPanel guidance="Loading guidance..." />
    </div>
  );
}

export default function OnboardingShell({ userId, firstName, children }: OnboardingShellProps) {
  const pathname = usePathname();
  const fetchPosition = useFinancialStore((state) => state.fetch);
  const isLoading = useFinancialStore((state) => state.isLoading);
  const position = useFinancialStore((state) => state.position);
  const [isGuidanceOpen, setGuidanceOpen] = useState(false);

  const isReviewPage = pathname === "/onboarding/review";

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

  if (isReviewPage) {
    return <div className="onboarding-theme min-h-screen bg-[#121212] text-[#F4F1EA]">{children}</div>;
  }

  if (isLoading || !position) {
    return <LoadingShell firstName={firstName} />;
  }

  return (
    <OnboardingUIProvider value={{ openGuidance: () => setGuidanceOpen(true) }}>
      <div className="onboarding-theme min-h-screen bg-[#121212] text-[#F4F1EA]">
        <Sidebar firstName={firstName} />
        <MobileProgressBar />

        <main className="px-5 py-6 md:ml-[280px] md:max-w-[740px] md:px-14 md:py-12 lg:mr-[300px]">{children}</main>

        <ContextPanel guidance={currentGuidance} />

        <div className={`fixed inset-0 z-40 transition-opacity lg:hidden ${isGuidanceOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close guidance"
            onClick={() => setGuidanceOpen(false)}
          />
          <aside
            className={`absolute top-0 right-0 h-full w-[300px] border-l border-[#2A2A2A] bg-[#1E1E1E] p-8 transition-transform duration-300 ${
              isGuidanceOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="font-['Space_Grotesk'] text-[13px] font-semibold tracking-[3px] text-[#9A9590] uppercase">Guidance</p>
              <button
                type="button"
                className="h-7 w-7 border border-[#2A2A2A] bg-[#121212] text-sm text-[#9A9590]"
                onClick={() => setGuidanceOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="text-sm leading-relaxed text-[#9A9590]">{currentGuidance}</p>
          </aside>
        </div>
      </div>
    </OnboardingUIProvider>
  );
}

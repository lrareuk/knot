"use client";

import { usePathname } from "next/navigation";
import { getModuleStatus, moduleFromPathname } from "@/lib/onboarding/progress";
import { MODULES } from "@/types/financial";
import { useFinancialStore } from "@/stores/financial-position";

export default function MobileProgressBar() {
  const pathname = usePathname();
  const position = useFinancialStore((state) => state.position);
  const activeModule = moduleFromPathname(pathname);

  if (!position) {
    return null;
  }

  return (
    <div className="onboarding-mobile-progress" aria-hidden>
      {MODULES.map((module) => {
        const status = getModuleStatus(module.name, position);
        const isActive = module.name === activeModule;

        const colorClass =
          status === "complete"
            ? "is-complete"
            : status === "partial"
              ? "is-partial"
              : isActive
                ? "is-active"
                : "is-empty";

        return <span key={module.name} className={`onboarding-mobile-progress-segment ${colorClass}`} />;
      })}
    </div>
  );
}

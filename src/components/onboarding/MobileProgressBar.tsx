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
    <div className="sticky top-0 z-30 flex w-full gap-1 border-b border-[#2A2A2A] bg-[#121212] px-5 py-4 md:hidden">
      {MODULES.map((module) => {
        const status = getModuleStatus(module.name, position);
        const isActive = module.name === activeModule;

        const color =
          status === "complete"
            ? "bg-[#7CAA8E]"
            : status === "partial"
              ? "bg-[#D4A843]"
              : isActive
                ? "bg-[#C2185B]"
                : "bg-[#2A2A2A]";

        return <span key={module.name} className={`h-1.5 flex-1 ${color}`} />;
      })}
    </div>
  );
}

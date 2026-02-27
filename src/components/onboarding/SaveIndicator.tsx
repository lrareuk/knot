"use client";

import { useFinancialStore } from "@/stores/financial-position";

export default function SaveIndicator() {
  const saveStatus = useFinancialStore((state) => state.saveStatus);

  if (saveStatus === "idle") {
    return <div className="pointer-events-none text-xs opacity-0">Saved</div>;
  }

  if (saveStatus === "saving") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#9A9590]">
        <span className="inline-block h-1.5 w-1.5 animate-pulse bg-[#9A9590]" />
        <span>Saving...</span>
      </div>
    );
  }

  if (saveStatus === "saved") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#7CAA8E] transition-opacity duration-200">
        <span aria-hidden>✓</span>
        <span>Saved</span>
      </div>
    );
  }

  return <div className="text-xs text-[#C46A5E]">Could not save - retrying</div>;
}

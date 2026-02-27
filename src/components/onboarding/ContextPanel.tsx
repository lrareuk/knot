"use client";

import RunningTotals from "@/components/onboarding/RunningTotals";

type ContextPanelProps = {
  guidance: string;
};

export default function ContextPanel({ guidance }: ContextPanelProps) {
  return (
    <aside className="fixed top-0 right-0 hidden h-screen w-[300px] flex-col border-l border-[#2A2A2A] bg-[#1E1E1E] p-12 lg:flex">
      <section>
        <p className="font-['Space_Grotesk'] text-[13px] font-semibold tracking-[3px] text-[#9A9590] uppercase">Guidance</p>
        <p className="mt-4 text-sm leading-relaxed text-[#9A9590]">{guidance}</p>
      </section>

      <RunningTotals />

      <p className="mt-auto text-xs leading-relaxed text-[#555555]">
        Everything you enter is private. Nothing is shared. You can change any figure at any time.
      </p>
    </aside>
  );
}

"use client";

import RunningTotals from "@/components/onboarding/RunningTotals";

type ContextPanelProps = {
  guidance: string;
};

export default function ContextPanel({ guidance }: ContextPanelProps) {
  return (
    <aside className="onboarding-context" aria-label="Context panel">
      <section className="onboarding-context-guidance-wrap">
        <p className="onboarding-context-title">Guidance</p>
        <p className="onboarding-context-guidance">{guidance}</p>
      </section>

      <RunningTotals />

      <p className="onboarding-context-reassurance">
        Everything you enter is private. Nothing is shared. You can change any figure at any time.
      </p>
    </aside>
  );
}

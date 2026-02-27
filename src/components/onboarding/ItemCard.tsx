"use client";

import { useState, type ReactNode } from "react";

type ItemCardProps = {
  title: string;
  index: number;
  canDelete: boolean;
  onDelete: () => void;
  children: ReactNode;
};

export default function ItemCard({ title, index, canDelete, onDelete, children }: ItemCardProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <article className="mb-3 animate-[onboarding-item-enter_0.3s_ease-out] border border-[#2A2A2A] bg-[#1E1E1E] p-7">
      <header className="mb-6 flex items-center justify-between border-b border-[#2A2A2A] pb-4">
        <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#F4F1EA]">
          {title} {index + 1}
        </h3>
        {canDelete ? (
          <button
            type="button"
            className="text-sm font-medium text-[#9A9590] transition-colors hover:text-[#C46A5E]"
            onClick={() => setConfirming((current) => !current)}
          >
            Delete
          </button>
        ) : null}
      </header>

      {confirming && canDelete ? (
        <div className="mb-5 flex items-center gap-4 border border-[#2A2A2A] bg-[#121212] px-4 py-3 text-sm text-[#9A9590]">
          <span className="mr-auto">Remove this entry?</span>
          <button type="button" className="text-[#9A9590] hover:text-[#F4F1EA]" onClick={() => setConfirming(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="text-[#C46A5E] hover:text-[#F4F1EA]"
            onClick={() => {
              setConfirming(false);
              onDelete();
            }}
          >
            Remove
          </button>
        </div>
      ) : null}

      <div className="space-y-5">{children}</div>
    </article>
  );
}

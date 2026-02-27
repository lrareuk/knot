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
    <article className="onboarding-item-card">
      <header className="onboarding-item-card-head">
        <h3 className="onboarding-item-card-title">
          {title} {index + 1}
        </h3>
        {canDelete ? (
          <button
            type="button"
            className="onboarding-item-card-delete"
            onClick={() => setConfirming((current) => !current)}
          >
            Delete
          </button>
        ) : null}
      </header>

      {confirming && canDelete ? (
        <div className="onboarding-item-card-confirm">
          <span className="onboarding-item-card-confirm-copy">Remove this entry?</span>
          <button type="button" className="onboarding-item-card-confirm-cancel" onClick={() => setConfirming(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="onboarding-item-card-confirm-remove"
            onClick={() => {
              setConfirming(false);
              onDelete();
            }}
          >
            Remove
          </button>
        </div>
      ) : null}

      <div className="onboarding-item-card-body">{children}</div>
    </article>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  disabled?: boolean;
  label?: string;
  className?: string;
  redirectToEditor?: boolean;
  title?: string;
};

export default function CreateScenarioButton({
  disabled,
  label = "Create scenario",
  className = "ui-btn-primary",
  redirectToEditor = true,
  title,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createScenario = async () => {
    if (loading || disabled) {
      return;
    }

    setLoading(true);

    const response = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const payload = (await response.json().catch(() => ({}))) as { scenario?: { id: string } };
    setLoading(false);

    if (!response.ok || !payload.scenario?.id) {
      return;
    }

    if (redirectToEditor) {
      router.push(`/dashboard/scenario/${payload.scenario.id}`);
      return;
    }

    router.refresh();
  };

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || loading}
      onClick={createScenario}
      title={title}
      aria-busy={loading}
    >
      {loading ? "Creating..." : label}
    </button>
  );
}

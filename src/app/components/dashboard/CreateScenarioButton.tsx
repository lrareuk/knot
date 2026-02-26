"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  disabled?: boolean;
};

export default function CreateScenarioButton({ disabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createScenario = async () => {
    setLoading(true);
    const response = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setLoading(false);

    if (!response.ok) {
      return;
    }

    router.refresh();
  };

  return (
    <button type="button" className="btn-primary" disabled={disabled || loading} onClick={createScenario}>
      {loading ? "Creating..." : "Create scenario"}
    </button>
  );
}

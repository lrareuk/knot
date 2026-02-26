"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
    });

    const payload = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !payload.url) {
      setLoading(false);
      setError(payload.error ?? "Unable to start checkout.");
      return;
    }

    window.location.href = payload.url;
  };

  return (
    <div className="stack-sm">
      <button type="button" onClick={startCheckout} className="btn-primary" disabled={loading}>
        {loading ? "Redirecting..." : "Continue to Stripe Checkout"}
      </button>
      {error ? <p className="muted">{error}</p> : null}
    </div>
  );
}

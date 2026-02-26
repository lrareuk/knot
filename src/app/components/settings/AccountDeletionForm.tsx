"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

const REQUIRED_TEXT = "DELETE MY ACCOUNT";

export default function AccountDeletionForm() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const deleteAccount = async () => {
    setLoading(true);
    setStatus(null);

    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });

    const payload = (await response.json()) as { ok?: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setLoading(false);
      setStatus(payload.error ?? "Unable to delete account");
      return;
    }

    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h2 className="dashboard-scenario-name">Delete account</h2>
      <p className="dashboard-help">
        This is permanent and irreversible. Type <strong>{REQUIRED_TEXT}</strong> to confirm.
      </p>
      <input className="dashboard-input" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
      <button
        type="button"
        className="dashboard-btn-danger"
        disabled={loading || confirmation !== REQUIRED_TEXT}
        onClick={deleteAccount}
      >
        {loading ? "Deleting..." : "Delete my account permanently"}
      </button>
      {status ? <p className="dashboard-status">{status}</p> : null}
    </div>
  );
}

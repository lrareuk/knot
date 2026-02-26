"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

const HOLD_TO_CONFIRM_MS = 1200;

export default function AccountDeletionForm() {
  const router = useRouter();
  const holdTimeoutRef = useRef<number | null>(null);
  const [armed, setArmed] = useState(false);
  const [holding, setHolding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        window.clearTimeout(holdTimeoutRef.current);
      }
    };
  }, []);

  const triggerPanicMode = async () => {
    setLoading(true);
    setHolding(false);
    setStatus(null);

    const response = await fetch("/api/account/panic", { method: "POST" });

    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setLoading(false);
      setArmed(false);
      setStatus(payload.error ?? "Unable to hide account");
      return;
    }

    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  };

  const startHold = () => {
    if (!armed || loading || holdTimeoutRef.current) {
      return;
    }

    setHolding(true);
    holdTimeoutRef.current = window.setTimeout(() => {
      holdTimeoutRef.current = null;
      triggerPanicMode();
    }, HOLD_TO_CONFIRM_MS);
  };

  const cancelHold = () => {
    setHolding(false);
    if (!holdTimeoutRef.current) {
      return;
    }

    window.clearTimeout(holdTimeoutRef.current);
    holdTimeoutRef.current = null;
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h2 className="dashboard-scenario-name">Panic mode</h2>
      <p className="dashboard-help">
        Hides this account immediately, removes stored account data, and blocks sign-in. Recovery requires support and your
        recovery key.
      </p>

      {!armed ? (
        <button type="button" className="dashboard-btn-danger" disabled={loading} onClick={() => setArmed(true)}>
          Arm panic mode
        </button>
      ) : (
        <>
          <p className="dashboard-help">Hold to confirm.</p>
          <button
            type="button"
            className="dashboard-btn-danger"
            disabled={loading}
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
          >
            {loading ? "Hiding..." : holding ? "Keep holding..." : "Hold to hide account"}
          </button>
          <button type="button" className="dashboard-btn-ghost" disabled={loading} onClick={() => setArmed(false)}>
            Cancel
          </button>
        </>
      )}

      {status ? <p className="dashboard-status">{status}</p> : null}
    </div>
  );
}

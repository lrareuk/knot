"use client";

import { FormEvent, useState } from "react";

type Props = {
  adminEmail: string;
};

type Status = {
  tone: "neutral" | "success" | "error";
  message: string;
} | null;

export default function PanicRecoveryAdminForm({ adminEmail }: Props) {
  const [masterKey, setMasterKey] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [sendingMasterKey, setSendingMasterKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [masterKeySent, setMasterKeySent] = useState(false);

  async function requestMasterKey() {
    setSendingMasterKey(true);
    setStatus(null);

    try {
      const response = await fetch("/api/internal/admin/reinstate/master-key", {
        method: "POST",
      });

      if (!response.ok) {
        setStatus({
          tone: "error",
          message: "Unable to send master key email right now.",
        });
        return;
      }

      setMasterKeySent(true);
      setStatus({
        tone: "success",
        message: `Master key sent to ${adminEmail}.`,
      });
    } catch {
      setStatus({
        tone: "error",
        message: "Unable to send master key email right now.",
      });
    } finally {
      setSendingMasterKey(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/internal/admin/reinstate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          master_key: masterKey,
          account_email: accountEmail,
          recovery_key: recoveryKey,
        }),
      });

      const payload = (await response.json()) as { error?: string; restored_empty?: boolean };

      if (!response.ok) {
        setStatus({
          tone: "error",
          message: payload.error ?? "Reinstatement failed.",
        });
        return;
      }

      setMasterKey("");
      setRecoveryKey("");
      setMasterKeySent(false);
      setStatus({
        tone: "success",
        message: payload.restored_empty
          ? "Account reinstated as empty (snapshot unavailable). Password reset email sent."
          : "Account reinstated from snapshot. Password reset email sent.",
      });
    } catch {
      setStatus({
        tone: "error",
        message: "Reinstatement failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const statusColor = status?.tone === "error" ? "#c53030" : status?.tone === "success" ? "#166534" : "#334155";

  return (
    <section
      style={{
        width: "min(640px, 100%)",
        margin: "2rem auto",
        padding: "1.25rem",
        border: "1px solid #d1d5db",
        borderRadius: "0.75rem",
        background: "#ffffff",
      }}
    >
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Panic Mode Recovery (Admin)</h1>
      <p style={{ margin: "0 0 1rem", color: "#334155" }}>
        Send a one-time master key to {adminEmail}, then submit the user email and recovery key.
      </p>

      <button
        type="button"
        onClick={requestMasterKey}
        disabled={sendingMasterKey}
        style={{
          border: "none",
          borderRadius: "0.5rem",
          padding: "0.65rem 1rem",
          background: "#111827",
          color: "#ffffff",
          cursor: sendingMasterKey ? "not-allowed" : "pointer",
        }}
      >
        {sendingMasterKey ? "Sending master key..." : "Send master key"}
      </button>

      <form onSubmit={onSubmit} style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Master key</span>
          <input
            type="text"
            required
            value={masterKey}
            onChange={(event) => setMasterKey(event.target.value)}
            placeholder="6-digit key from email"
            autoComplete="one-time-code"
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>User email</span>
          <input
            type="email"
            required
            value={accountEmail}
            onChange={(event) => setAccountEmail(event.target.value)}
            placeholder="user@example.com"
            autoComplete="email"
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>User recovery key</span>
          <input
            type="text"
            required
            value={recoveryKey}
            onChange={(event) => setRecoveryKey(event.target.value)}
            placeholder="cedar wave stone"
            style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #d1d5db" }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting || !masterKeySent}
          style={{
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.65rem 1rem",
            background: "#2563eb",
            color: "#ffffff",
            cursor: submitting || !masterKeySent ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Restoring access..." : "Restore access"}
        </button>
      </form>

      {status ? (
        <p style={{ marginTop: "0.75rem", color: statusColor }} role="status">
          {status.message}
        </p>
      ) : null}
    </section>
  );
}

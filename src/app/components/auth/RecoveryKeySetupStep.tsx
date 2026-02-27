"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AuthFlow.module.css";

type Props = {
  firstName: string;
};

function sanitizeName(firstName: string) {
  const normalized = firstName.trim();
  return normalized || "there";
}

export default function RecoveryKeySetupStep({ firstName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);

  const generateRecoveryKey = async () => {
    setLoading(true);
    setStatus(null);

    const response = await fetch("/api/account/recovery-key", { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; recovery_key?: string };
    setLoading(false);

    if (!response.ok || !payload.recovery_key) {
      setStatus(payload.error ?? "Unable to generate recovery key.");
      return;
    }

    setRecoveryKey(payload.recovery_key);
    setStatus("Recovery key generated.");
  };

  const copyRecoveryKey = async () => {
    if (!recoveryKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(recoveryKey);
      setStatus("Recovery key copied.");
    } catch {
      setStatus("Unable to copy recovery key.");
    }
  };

  const downloadRecoveryKey = () => {
    if (!recoveryKey) {
      return;
    }

    const blob = new Blob([`${recoveryKey}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus("Recovery key downloaded.");
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Before you continue, {sanitizeName(firstName)}.</h1>
      <p className={styles.supporting}>
        Save this three-word recovery key now. You will need it with your account email to request reinstatement if panic mode
        is ever triggered.
      </p>

      <button
        type="button"
        className={`${styles.primaryButton} ${loading ? styles.loading : ""}`.trim()}
        onClick={generateRecoveryKey}
        disabled={loading}
      >
        {loading ? "Generating..." : recoveryKey ? "Regenerate key" : "Generate recovery key"}
      </button>

      {recoveryKey ? (
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="recovery-key">
            Recovery key
          </label>
          <input id="recovery-key" className={styles.input} value={recoveryKey} readOnly />

          <div className={styles.actionsRow}>
            <button type="button" className={`${styles.primaryButton} ${styles.primaryButtonCompact}`} onClick={copyRecoveryKey}>
              Copy key
            </button>
            <button
              type="button"
              className={`${styles.primaryButton} ${styles.primaryButtonCompact}`}
              onClick={downloadRecoveryKey}
            >
              Download key
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className={`${styles.primaryButton} ${styles.continueButton}`}
        onClick={() => {
          router.push("/dashboard");
          router.refresh();
        }}
        disabled={!recoveryKey}
      >
        Continue
      </button>

      {status ? <p className={styles.tertiaryText}>{status}</p> : null}
    </div>
  );
}

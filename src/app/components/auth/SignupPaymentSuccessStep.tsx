"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AuthFlow.module.css";

type Props = {
  firstName: string;
  initialPaid: boolean;
};

type PollState = "checking" | "slow" | "timeout" | "confirmed";

const POLL_INTERVAL_MS = 2000;
const SLOW_THRESHOLD_MS = 30_000;
const TIMEOUT_MS = 60_000;

export default function SignupPaymentSuccessStep({ firstName, initialPaid }: Props) {
  const router = useRouter();
  const [paid, setPaid] = useState(initialPaid);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (initialPaid) {
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    let timeoutId: number | null = null;

    const poll = async () => {
      const nextElapsed = Date.now() - startedAt;
      if (cancelled) {
        return;
      }

      setElapsedMs(nextElapsed);
      if (nextElapsed >= TIMEOUT_MS) {
        return;
      }

      try {
        const response = await fetch("/api/signup/payment-status", { cache: "no-store" });
        if (response.ok) {
          const payload = (await response.json()) as { paid?: boolean };
          if (payload.paid) {
            if (!cancelled) {
              setPaid(true);
            }
            return;
          }
        }
      } catch {
        // Continue polling on transient failures.
      }

      timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS);
    };

    timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [initialPaid]);

  const pollState: PollState = useMemo(() => {
    if (paid) {
      return "confirmed";
    }
    if (elapsedMs >= TIMEOUT_MS) {
      return "timeout";
    }
    if (elapsedMs >= SLOW_THRESHOLD_MS) {
      return "slow";
    }
    return "checking";
  }, [elapsedMs, paid]);

  const supportingCopy =
    pollState === "confirmed"
      ? "Your payment is confirmed. Let's set up your financial position."
      : "We're finalizing your payment. This usually takes a few seconds.";

  return (
    <div className={styles.screen}>
      <h1 className={styles.successLineOne}>You&apos;re in,</h1>
      <h2 className={styles.successLineTwo}>{firstName}.</h2>
      <p className={styles.successSupporting}>{supportingCopy}</p>

      <button type="button" className={styles.primaryButton} onClick={() => router.push("/onboarding/dates")} disabled={!paid}>
        Begin
      </button>

      {pollState === "checking" ? <p className={styles.statusMessage}>Finalizing payment now.</p> : null}
      {pollState === "slow" ? <p className={styles.statusMessage}>We&apos;re still finalizing your payment. This usually takes a few seconds.</p> : null}
      {pollState === "timeout" ? (
        <p className={styles.statusMessage}>
          Payment confirmation is taking longer than expected. You can close this page and log back in - your access will be ready.
        </p>
      ) : null}

      <p className={styles.tertiaryText}>This takes about 10–15 minutes. You can save and return at any time.</p>
    </div>
  );
}

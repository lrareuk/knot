"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import styles from "./AuthFlow.module.css";

const REDIRECT_DELAY_MS = 3000;

export default function LoginResetStep() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"request" | "update">("request");
  const [loading, setLoading] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => emailRef.current?.focus(), 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sent && !updated) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.push(updated ? "/login?reset=success" : "/login");
      router.refresh();
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [router, sent, updated]);

  useEffect(() => {
    let active = true;
    const supabase = supabaseBrowser();

    async function initializeRecoveryFlow() {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const code = params.get("code");
      const modeParam = params.get("mode");
      const type = params.get("type") ?? hash.get("type");
      const hasAccessToken = Boolean(hash.get("access_token"));
      const isRecoveryLink = modeParam === "update" || type === "recovery" || hasAccessToken || Boolean(code);

      if (isRecoveryLink) {
        await Promise.resolve();
        if (!active) {
          return;
        }
        setMode("update");
      }

      if (!code) {
        return;
      }

      setLoading(true);
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!active) {
        return;
      }

      setLoading(false);

      if (exchangeError) {
        setError("This reset link is invalid or has expired. Please request a new one.");
      }
    }

    void initializeRecoveryFlow();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=%2Flogin%2Freset%3Fmode%3Dupdate`,
    });

    setLoading(false);

    if (resetError) {
      const message = resetError.message.toLowerCase();
      if (resetError.code === "over_email_send_rate_limit" || message.includes("rate limit")) {
        setError("Too many reset attempts. Please wait a minute and try again.");
        return;
      }
      if (resetError.code === "unexpected_failure" && message.includes("email")) {
        setError("We couldn't send a reset email right now. Please try again shortly.");
        return;
      }
      setError("Unable to send reset email right now. Please try again.");
      return;
    }

    setSent(true);
  };

  const submitNewPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    const { error: updateError } = await supabaseBrowser().auth.updateUser({ password: newPassword });
    if (updateError) {
      setUpdatingPassword(false);
      setError("Unable to update password. Please request a new reset link.");
      return;
    }

    await supabaseBrowser().auth.signOut();
    setUpdatingPassword(false);
    setUpdated(true);
  };

  if (mode === "update") {
    return (
      <div className={styles.screen}>
        <h1 className={styles.heading}>Set a new password.</h1>
        <p className={styles.supporting}>Choose a new password for your account.</p>

        <form onSubmit={submitNewPassword}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              className={styles.input}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="••••••••••••"
              minLength={8}
              disabled={loading || updatingPassword || updated}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="••••••••••••"
              minLength={8}
              disabled={loading || updatingPassword || updated}
              required
            />
          </div>

          <button
            type="submit"
            className={`${styles.primaryButton} ${updatingPassword ? styles.loading : ""}`.trim()}
            disabled={loading || updatingPassword || updated}
          >
            Update password
          </button>
        </form>

        {passwordError ? <p className={styles.inlineError}>{passwordError}</p> : null}
        {error ? <p className={styles.inlineError}>{error}</p> : null}
        {updated ? <p className={styles.statusMessage}>Password updated. Redirecting to sign in…</p> : null}
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Reset your password.</h1>
      <p className={styles.supporting}>Enter your email address to receive a password reset link.</p>

      <form onSubmit={submit}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="reset-email">
            Email address
          </label>
          <input
            id="reset-email"
            ref={emailRef}
            className={styles.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            disabled={loading || sent}
            required
          />
        </div>

        <button type="submit" className={`${styles.primaryButton} ${loading ? styles.loading : ""}`.trim()} disabled={loading || sent}>
          Send reset link
        </button>
      </form>

      {error ? <p className={styles.inlineError}>{error}</p> : null}
      {sent ? <p className={styles.statusMessage}>If an account exists with that email, we&apos;ve sent a reset link.</p> : null}

      <p className={styles.secondaryLink}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}

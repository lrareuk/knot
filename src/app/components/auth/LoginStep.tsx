"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import styles from "./AuthFlow.module.css";

function normalizeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/start";
  }
  return next;
}

export default function LoginStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email")?.trim() ?? "";
  const resetSucceeded = searchParams.get("reset") === "success";
  const callbackError = searchParams.get("error");
  const callbackErrorMessage =
    callbackError === "invalid_or_expired_link"
      ? "This email link is invalid or has expired. Request a new one."
      : callbackError === "invalid_link"
        ? "This email link is invalid."
        : null;
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      emailRef.current?.focus();
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setShowResendConfirmation(false);
    setResendStatus(null);

    const supabase = supabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (authError) {
      const message = authError.message.toLowerCase();
      if (authError.code === "email_not_confirmed" || message.includes("email not confirmed")) {
        setError("Please confirm your email before signing in.");
        setShowResendConfirmation(true);
        return;
      }
      if (authError.code === "invalid_credentials") {
        setError("Email or password is incorrect.");
        return;
      }
      setError("Unable to sign in right now. Please try again.");
      return;
    }

    const next = normalizeNextPath(searchParams.get("next"));
    router.push(next);
    router.refresh();
  };

  const resendConfirmationEmail = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setResendStatus("Enter your email address first.");
      return;
    }

    setResendingConfirmation(true);
    setResendStatus(null);

    const { error: resendError } = await supabaseBrowser().auth.resend({
      type: "signup",
      email: targetEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Fstart`,
      },
    });

    setResendingConfirmation(false);

    if (resendError) {
      const message = resendError.message.toLowerCase();
      if (resendError.code === "over_email_send_rate_limit" || message.includes("rate limit")) {
        setResendStatus("Please wait a minute before requesting another confirmation email.");
        return;
      }
      setResendStatus("Unable to resend confirmation email right now.");
      return;
    }

    setResendStatus("Confirmation email sent. Please check your inbox.");
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Welcome back.</h1>
      <p className={styles.supporting}>Sign in to your account.</p>
      {resetSucceeded ? <p className={styles.statusMessage}>Password updated. Sign in with your new password.</p> : null}
      {callbackErrorMessage ? <p className={styles.inlineError}>{callbackErrorMessage}</p> : null}

      <form onSubmit={submit}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            ref={emailRef}
            className={styles.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            disabled={loading}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="login-password">
            Password
          </label>
          <div className={styles.inputWrap}>
            <input
              id="login-password"
              className={styles.input}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••••••"
              minLength={8}
              disabled={loading}
              required
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                {showPassword ? (
                  <>
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 102.84 2.84" />
                    <path d="M9.88 5.09A10.94 10.94 0 0112 5c5.52 0 10 7 10 7a17.31 17.31 0 01-4.2 4.86" />
                    <path d="M6.53 6.53A17.04 17.04 0 002 12s4.48 7 10 7a9.77 9.77 0 004.2-.96" />
                  </>
                ) : (
                  <>
                    <path d="M2 12s4.48-7 10-7 10 7 10 7-4.48 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" className={`${styles.primaryButton} ${loading ? styles.loading : ""}`.trim()} disabled={loading}>
          Sign in
        </button>
        {error ? <p className={styles.inlineError}>{error}</p> : null}
        {showResendConfirmation ? (
          <button
            type="button"
            className={`${styles.primaryButton} ${resendingConfirmation ? styles.loading : ""}`.trim()}
            onClick={resendConfirmationEmail}
            disabled={loading || resendingConfirmation}
          >
            {resendingConfirmation ? "Resending confirmation..." : "Resend confirmation email"}
          </button>
        ) : null}
        {resendStatus ? <p className={styles.statusMessage}>{resendStatus}</p> : null}
      </form>

      <p className={styles.secondaryLink}>
        Don&apos;t have an account? <Link href="/signup">Get started</Link>
      </p>
      <p className={styles.tertiaryText}>
        <Link href="/login/reset" className={styles.backLink}>
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import styles from "./AuthFlow.module.css";

type Props = {
  firstName: string;
  jurisdiction: string;
};

const EXIT_ANIMATION_MS = 200;

export default function SignupEmailStep({ firstName, jurisdiction }: Props) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      emailRef.current?.focus();
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    const normalizedEmail = email.trim();
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Fstart`,
        data: {
          first_name: firstName,
          jurisdiction,
        },
      },
    });

    if (error) {
      setLoading(false);
      const message = error.message.toLowerCase();
      if (error.code === "over_email_send_rate_limit" || message.includes("rate limit")) {
        setGeneralError("Too many signup attempts. Please wait a minute and try again.");
        return;
      }
      if (error.code === "unexpected_failure" && message.includes("confirmation email")) {
        setGeneralError("We couldn't send the confirmation email right now. Please try again in a minute.");
        return;
      }
      if (message.includes("already registered") || message.includes("already exists")) {
        setEmailError("An account with this email already exists. Sign in instead?");
        return;
      }
      if (error.code === "weak_password" || message.includes("weak")) {
        setPasswordError("Use a stronger password with uppercase, lowercase, a number, and a symbol.");
        return;
      }
      if (message.includes("password")) {
        setPasswordError("Please check your password and try again.");
        return;
      }
      setGeneralError("Something went wrong. Please try again.");
      return;
    }

    const user = data.user;
    if (!user) {
      setLoading(false);
      setGeneralError("Something went wrong. Please try again.");
      return;
    }

    // Email confirmation mode returns no session; avoid auth-only writes in that state.
    if (!data.session) {
      setLoading(false);
      await fetch("/api/signup/state", { method: "DELETE" });
      setConfirmationEmail(normalizedEmail);
      return;
    }

    const { error: upsertError } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: normalizedEmail,
        first_name: firstName,
        jurisdiction,
        paid: false,
        onboarding_done: false,
      },
      { onConflict: "id", ignoreDuplicates: false }
    );

    if (upsertError) {
      console.error("Profile upsert failed after signup", upsertError);
    }

    await fetch("/api/signup/state", { method: "DELETE" });

    setExiting(true);
    window.setTimeout(() => {
      router.push("/signup/payment");
    }, EXIT_ANIMATION_MS);
  };

  if (confirmationEmail) {
    return (
      <div className={styles.screen}>
        <h1 className={styles.heading}>Check your email to continue.</h1>
        <p className={styles.supporting}>
          We sent a confirmation link to {confirmationEmail}. Confirm your email, then sign in to continue setup.
        </p>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => router.push(`/login?email=${encodeURIComponent(confirmationEmail)}`)}
        >
          Go to sign in
        </button>
        <p className={styles.secondaryLink}>If you did not get an email, wait a minute and try again.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.screen} ${exiting ? styles.screenExiting : ""}`.trim()}>
      <h1 className={styles.heading}>Hi {firstName}. Set up your account.</h1>
      <p className={styles.supporting}>
        Use any email address. We&apos;ll never contact you unless you ask us to. Alias emails work perfectly.
      </p>

      <form onSubmit={submit}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            ref={emailRef}
            className={styles.input}
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) {
                setEmailError(null);
              }
            }}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            required
          />
          {emailError ? (
            <p className={styles.inlineError}>
              {emailError.includes("Sign in instead?") ? (
                <>
                  An account with this email already exists. <Link href="/login">Sign in instead?</Link>
                </>
              ) : (
                emailError
              )}
            </p>
          ) : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="signup-password">
            Create a password
          </label>
          <div className={styles.inputWrap}>
            <input
              id="signup-password"
              className={styles.input}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) {
                  setPasswordError(null);
                }
              }}
              placeholder="••••••••••••"
              autoComplete="new-password"
              disabled={loading}
              minLength={8}
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
          {passwordError ? <p className={styles.inlineError}>{passwordError}</p> : null}
        </div>

        <p className={styles.aliasNote}>Privacy-first: we encourage alias email addresses. Your data stays yours.</p>

        <button type="submit" className={`${styles.primaryButton} ${loading ? styles.loading : ""}`.trim()} disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
        {generalError ? <p className={styles.inlineError}>{generalError}</p> : null}
      </form>

      <p className={styles.secondaryLink}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}

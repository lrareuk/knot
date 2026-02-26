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
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      emailRef.current?.focus();
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sent) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [router, sent]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await supabaseBrowser().auth.resetPasswordForEmail(email.trim());
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

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

      {sent ? (
        <p className={styles.statusMessage}>If an account exists with that email, we&apos;ve sent a reset link.</p>
      ) : null}

      <p className={styles.secondaryLink}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}


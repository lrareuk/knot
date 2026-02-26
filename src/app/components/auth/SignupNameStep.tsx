"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeSignupFirstName } from "@/lib/auth/signup-state";
import styles from "./AuthFlow.module.css";

const EXIT_ANIMATION_MS = 200;

export default function SignupNameStep() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const normalized = normalizeSignupFirstName(firstName);
    if (!normalized) {
      setError("We need a name to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/signup/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: normalized }),
    });

    if (!response.ok) {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    setExiting(true);
    window.setTimeout(() => {
      router.push("/signup/email");
    }, EXIT_ANIMATION_MS);
  };

  return (
    <div className={`${styles.screen} ${exiting ? styles.screenExiting : ""}`.trim()}>
      <h1 className={styles.heading}>What should we call you?</h1>
      <p className={styles.supporting}>Just your first name. This is how we&apos;ll address you inside the platform.</p>

      <form onSubmit={submit}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="first-name">
            First name
          </label>
          <input
            id="first-name"
            ref={inputRef}
            className={styles.input}
            type="text"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="e.g. Sarah"
            maxLength={50}
            autoComplete="given-name"
            disabled={submitting}
            required
          />
          {error ? <p className={styles.inlineError}>{error}</p> : null}
        </div>

        <button type="submit" className={`${styles.primaryButton} ${submitting ? styles.loading : ""}`.trim()} disabled={submitting}>
          Continue
        </button>
      </form>

      <p className={styles.secondaryLink}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}


"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type AuthMode = "sign-in" | "sign-up";

type Props = {
  mode: AuthMode;
};

function normalizeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/start";
  }

  return next;
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nextPath = normalizeNextPath(
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next")
  );
  const switchPath = mode === "sign-up" ? "/login" : "/signup";
  const switchHref = `${switchPath}?next=${encodeURIComponent(nextPath)}`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    const supabase = supabaseBrowser();
    const next = normalizeNextPath(new URLSearchParams(window.location.search).get("next"));

    const response =
      mode === "sign-up"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (response.error) {
      setStatus(response.error.message);
      return;
    }

    router.push(next);
    router.refresh();
  };

  const sendMagicLink = async () => {
    setLoading(true);
    setStatus(null);

    if (!email) {
      setLoading(false);
      setStatus("Enter an email before sending a magic link.");
      return;
    }

    const supabase = supabaseBrowser();
    const next = normalizeNextPath(new URLSearchParams(window.location.search).get("next"));
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "sign-up",
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    });

    setLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Magic link sent. Check your inbox.");
  };

  return (
    <div className="auth-card">
      <h1>{mode === "sign-up" ? "Create your Untie account" : "Sign in to Untie"}</h1>
      <p className="muted">Email aliases are supported. This is a private modelling workspace.</p>

      <form onSubmit={submit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            required
            minLength={8}
          />
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Working..." : mode === "sign-up" ? "Create account" : "Sign in"}
        </button>
      </form>

      <button type="button" className="btn-secondary" onClick={sendMagicLink} disabled={loading}>
        Send magic link instead
      </button>

      {status ? <p className="muted auth-status">{status}</p> : null}

      <p className="muted auth-switch">
        {mode === "sign-up" ? "Already have an account? " : "Need an account? "}
        <Link href={switchHref}>{mode === "sign-up" ? "Sign in" : "Sign up"}</Link>
      </p>
    </div>
  );
}

"use client";

import { FormEvent, useId, useMemo, useState } from "react";

const REGION_OPTIONS = [
  { value: "UK", label: "United Kingdom" },
  { value: "Ireland", label: "Ireland" },
  { value: "US/Canada", label: "US/Canada" },
  { value: "EU", label: "EU" },
  { value: "Other", label: "Other" },
] as const;
const STAGE_OPTIONS = ["Exploring", "Planning", "In progress", "Prefer not to say"] as const;

type FormStatus = "idle" | "success" | "error";

type WaitlistApiResponse = {
  ok?: boolean;
  message?: string;
};

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState<(typeof REGION_OPTIONS)[number]["value"]>("UK");
  const [stage, setStage] = useState<(typeof STAGE_OPTIONS)[number]>("Prefer not to say");
  const [honey, setHoney] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const emailId = useId();
  const regionId = useId();
  const stageId = useId();
  const honeyId = useId();

  const emailInvalid = useMemo(
    () => status === "error" && message.toLowerCase().includes("email"),
    [message, status]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          region,
          stage,
          honey,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as WaitlistApiResponse;

      if (response.ok && data.ok) {
        setStatus("success");
        setMessage(data.message ?? "You're on the shortlist.");
        setEmail("");
        setHoney("");
        return;
      }

      setStatus("error");
      setMessage(data.message ?? "Something went wrong. Please try again.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="card card-soft card-hover relative p-5 md:p-6"
    >
      <p className="mb-4 text-sm text-muted">Share your email and we&apos;ll send early access updates.</p>

      <div className="space-y-4">
        <div>
          <label htmlFor={emailId} className="text-[11px] font-semibold tracking-[0.12em] text-muted">
            Email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={emailInvalid}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-md border border-divider bg-background px-3 py-2.5 text-base text-text placeholder:text-faint transition-colors focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor={regionId} className="text-[11px] font-semibold tracking-[0.12em] text-muted">
            Where are you based?
          </label>
          <select
            id={regionId}
            name="region"
            value={region}
            onChange={(event) =>
              setRegion(event.target.value as (typeof REGION_OPTIONS)[number]["value"])
            }
            className="mt-2 w-full rounded-md border border-divider bg-background px-3 py-2.5 text-base text-text transition-colors focus:border-accent focus:outline-none"
          >
            {REGION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={stageId} className="text-[11px] font-semibold tracking-[0.12em] text-muted">
            Stage
          </label>
          <select
            id={stageId}
            name="stage"
            value={stage}
            onChange={(event) => setStage(event.target.value as (typeof STAGE_OPTIONS)[number])}
            className="mt-2 w-full rounded-md border border-divider bg-background px-3 py-2.5 text-base text-text transition-colors focus:border-accent focus:outline-none"
          >
            {STAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
        >
          <label htmlFor={honeyId}>Company</label>
          <input
            id={honeyId}
            name="honey"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honey}
            onChange={(event) => setHoney(event.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-button-text transition-all hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Request early access"}
      </button>

      {message ? (
        <p
          aria-live="polite"
          className={`mt-4 text-sm ${status === "success" ? "text-success" : "text-danger"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

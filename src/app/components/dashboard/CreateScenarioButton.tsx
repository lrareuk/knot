"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioTemplateKey } from "@/lib/domain/scenario-templates";

type Props = {
  disabled?: boolean;
  label?: string;
  className?: string;
  redirectToEditor?: boolean;
  title?: string;
  defaultTemplate?: ScenarioTemplateKey;
};

type TemplateOption = {
  key: ScenarioTemplateKey;
  label: string;
  description: string;
};

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    key: "balanced",
    label: "Balanced split",
    description: "Uses ownership and account holder defaults as the starting point.",
  },
  {
    key: "user_keeps_home",
    label: "You keep the home",
    description: "Assigns the highest-equity property to you, with balanced defaults elsewhere.",
  },
  {
    key: "partner_keeps_home",
    label: "Partner keeps the home",
    description: "Assigns the highest-equity property to your partner, with balanced defaults elsewhere.",
  },
  {
    key: "clean_break_sale",
    label: "Clean-break sale",
    description: "Starts from a full sale and 50/50 split baseline across all assets and liabilities.",
  },
];

export default function CreateScenarioButton({
  disabled,
  label = "Create scenario",
  className = "btn-primary",
  redirectToEditor = true,
  title,
  defaultTemplate = "balanced",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<ScenarioTemplateKey>(defaultTemplate);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading]);

  const selectedTemplate = useMemo(
    () => TEMPLATE_OPTIONS.find((option) => option.key === template) ?? TEMPLATE_OPTIONS[0],
    [template]
  );

  const openModal = () => {
    setError(null);
    setName("");
    setTemplate(defaultTemplate);
    setOpen(true);
  };

  const closeModal = () => {
    if (loading) {
      return;
    }
    setOpen(false);
    setError(null);
    window.setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  const createScenario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    const trimmedName = name.trim().slice(0, 40);
    const response = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(trimmedName ? { name: trimmedName } : {}),
        template,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { scenario?: { id: string }; error?: string };
    setLoading(false);

    if (!response.ok || !payload.scenario?.id) {
      setError(payload.error ?? "Unable to create scenario. Please try again.");
      return;
    }

    setOpen(false);

    if (redirectToEditor) {
      router.push(`/dashboard/scenarios/${payload.scenario.id}`);
      return;
    }

    router.refresh();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        disabled={disabled || loading}
        onClick={openModal}
        title={title}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {loading ? "Creating..." : label}
      </button>

      {open ? (
        <div className="dashboard-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <form className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} onSubmit={createScenario}>
            <header className="dashboard-modal-header">
              <div>
                <h2 id={dialogTitleId} className="dashboard-modal-title">
                  Create scenario
                </h2>
                <p className="dashboard-modal-subtitle">Start from a template, then fine-tune in the editor.</p>
              </div>
              <button type="button" className="dashboard-modal-close" onClick={closeModal} aria-label="Close scenario creator">
                ×
              </button>
            </header>

            <label className="dashboard-modal-field" htmlFor="scenario-name-input">
              <span className="dashboard-modal-label">Scenario name (optional)</span>
              <input
                id="scenario-name-input"
                className="dashboard-input dashboard-modal-input"
                maxLength={40}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={selectedTemplate.label}
                autoFocus
              />
            </label>

            <fieldset className="dashboard-template-fieldset">
              <legend className="dashboard-modal-label">Starter template</legend>
              <div className="dashboard-template-grid" role="radiogroup" aria-label="Scenario starter template">
                {TEMPLATE_OPTIONS.map((option) => {
                  const active = option.key === template;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`dashboard-template-card${active ? " is-selected" : ""}`}
                      onClick={() => setTemplate(option.key)}
                      aria-pressed={active}
                    >
                      <span className="dashboard-template-title">{option.label}</span>
                      <span className="dashboard-template-desc">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {error ? <p className="dashboard-status dashboard-modal-error">{error}</p> : null}

            <div className="dashboard-modal-actions">
              <button type="button" className="dashboard-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="dashboard-btn" disabled={loading}>
                {loading ? "Creating scenario..." : "Create scenario"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

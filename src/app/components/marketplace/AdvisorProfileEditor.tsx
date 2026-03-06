"use client";

import { FormEvent, useMemo, useState } from "react";
import type { MarketplaceProfile } from "@/lib/marketplace/types";

type Props = {
  initialProfile: MarketplaceProfile | null;
};

function parseList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function AdvisorProfileEditor({ initialProfile }: Props) {
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "");
  const [professionalType, setProfessionalType] = useState(initialProfile?.professional_type ?? "solicitor");
  const [firmName, setFirmName] = useState(initialProfile?.firm_name ?? "");
  const [headline, setHeadline] = useState(initialProfile?.headline ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [jurisdictions, setJurisdictions] = useState((initialProfile?.jurisdiction_codes ?? []).join(", "));
  const [specialisms, setSpecialisms] = useState((initialProfile?.specialisms ?? []).join(", "));
  const [languages, setLanguages] = useState((initialProfile?.languages ?? ["en"]).join(", "));
  const [contactEmail, setContactEmail] = useState(initialProfile?.contact_email ?? "");
  const [contactUrl, setContactUrl] = useState(initialProfile?.contact_url ?? "");
  const [accepting, setAccepting] = useState(initialProfile?.is_accepting_new_clients ?? true);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isCreate = useMemo(() => !initialProfile, [initialProfile]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const payload = {
      professional_type: professionalType,
      display_name: displayName,
      firm_name: firmName || null,
      headline: headline || null,
      bio: bio || null,
      jurisdiction_codes: parseList(jurisdictions),
      specialisms: parseList(specialisms),
      service_modes: ["remote"],
      languages: parseList(languages),
      years_experience: null,
      hourly_rate_min: null,
      hourly_rate_max: null,
      currency_code: "GBP",
      contact_email: contactEmail || null,
      contact_url: contactUrl || null,
      is_accepting_new_clients: accepting,
    };

    try {
      const response = await fetch("/api/marketplace/advisor/profile", {
        method: isCreate ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { profile?: MarketplaceProfile; error?: string };
      if (!response.ok || !result.profile) {
        setStatus(result.error ?? "Unable to save profile");
        return;
      }

      setStatus("Saved");
      if (isCreate) {
        window.location.reload();
      }
    } catch {
      setStatus("Unable to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="marketplace-editor" onSubmit={onSubmit}>
      <label>
        Professional type
        <select value={professionalType} onChange={(event) => setProfessionalType(event.target.value as "solicitor" | "financial_adviser")}> 
          <option value="solicitor">Solicitor</option>
          <option value="financial_adviser">Financial adviser</option>
        </select>
      </label>

      <label>
        Display name
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} maxLength={120} />
      </label>

      <label>
        Firm name
        <input value={firmName} onChange={(event) => setFirmName(event.target.value)} maxLength={160} />
      </label>

      <label>
        Headline
        <input value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={200} />
      </label>

      <label>
        Bio
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={4000} />
      </label>

      <label>
        Jurisdictions (comma separated)
        <input value={jurisdictions} onChange={(event) => setJurisdictions(event.target.value)} />
      </label>

      <label>
        Specialisms (comma separated)
        <input value={specialisms} onChange={(event) => setSpecialisms(event.target.value)} />
      </label>

      <label>
        Languages (comma separated)
        <input value={languages} onChange={(event) => setLanguages(event.target.value)} />
      </label>

      <label>
        Contact email
        <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
      </label>

      <label>
        Contact URL
        <input type="url" value={contactUrl} onChange={(event) => setContactUrl(event.target.value)} />
      </label>

      <label className="marketplace-toggle-row">
        <input type="checkbox" checked={accepting} onChange={(event) => setAccepting(event.target.checked)} />
        Accepting new clients
      </label>

      <button className="dashboard-btn-ghost" disabled={saving} type="submit">
        {saving ? "Saving..." : "Save profile"}
      </button>

      {status ? <p className="dashboard-status">{status}</p> : null}
    </form>
  );
}

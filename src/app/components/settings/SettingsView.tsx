"use client";

import Link from "next/link";
import { useState } from "react";
import AccountDeletionForm from "@/app/components/settings/AccountDeletionForm";
import AgreementManager from "@/app/components/settings/AgreementManager";
import { jurisdictionGroupsForApi } from "@/lib/legal/jurisdictions";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = {
  firstName: string | null;
  email: string;
  jurisdiction: string;
  currencyCode: "GBP" | "USD" | "CAD";
  currencyOverridden: boolean;
  hasRelevantAgreements: boolean | null;
};

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return email;
  }

  if (local.length <= 2) {
    return `${local[0] ?? ""}***@${domain}`;
  }

  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export default function SettingsView({
  firstName,
  email,
  jurisdiction,
  currencyCode,
  currencyOverridden,
  hasRelevantAgreements,
}: Props) {
  const [nameInput, setNameInput] = useState(firstName ?? "");
  const [jurisdictionInput, setJurisdictionInput] = useState(jurisdiction);
  const [currencyCodeInput, setCurrencyCodeInput] = useState<"GBP" | "USD" | "CAD">(currencyCode);
  const [currencyOverriddenInput, setCurrencyOverriddenInput] = useState(currencyOverridden);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const jurisdictionOptions = jurisdictionGroupsForApi().flatMap((country) =>
    country.subdivisions.map((subdivision) => ({
      code: subdivision.code,
      label: `${country.label} · ${subdivision.display_name}`,
      defaultCurrency: subdivision.default_currency,
    }))
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const [exportLoading, setExportLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileStatus(null);

    const response = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: nameInput,
        jurisdiction: jurisdictionInput,
        currency_code: currencyCodeInput,
        currency_overridden: currencyOverriddenInput,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setProfileSaving(false);

    if (!response.ok) {
      setProfileStatus(payload.error ?? "Unable to save profile.");
      return;
    }

    setProfileStatus("Profile updated.");
  };

  const updatePassword = async () => {
    setPasswordStatus(null);

    if (!currentPassword.trim()) {
      setPasswordStatus("Enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordStatus("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus("New password and confirmation must match.");
      return;
    }

    setPasswordSaving(true);
    const supabase = supabaseBrowser();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setPasswordSaving(false);
      setPasswordStatus("Unable to verify your current password right now.");
      return;
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      setPasswordSaving(false);
      if (verifyError.message.toLowerCase().includes("invalid login credentials")) {
        setPasswordStatus("Current password is incorrect.");
        return;
      }
      setPasswordStatus("Unable to verify your current password right now.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (error) {
      setPasswordStatus(error.message || "Unable to update password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordStatus("Password updated.");
  };

  const downloadData = async () => {
    setExportLoading(true);
    setExportStatus(null);

    const response = await fetch("/api/account/export");
    const payload = (await response.json().catch(() => ({}))) as { error?: string; exported_at?: string };
    setExportLoading(false);

    if (!response.ok) {
      setExportStatus(payload.error ?? "Unable to export account data.");
      return;
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const datePart = (payload.exported_at ?? new Date().toISOString()).slice(0, 10);
    a.href = url;
    a.download = `untie-data-export-${datePart}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportStatus("Export downloaded.");
  };

  const generateRecoveryKey = async () => {
    setRecoveryLoading(true);
    setRecoveryStatus(null);

    const response = await fetch("/api/account/recovery-key", { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; recovery_key?: string };
    setRecoveryLoading(false);

    if (!response.ok || !payload.recovery_key) {
      setRecoveryStatus(payload.error ?? "Unable to generate recovery key.");
      return;
    }

    setRecoveryKey(payload.recovery_key);
    setRecoveryStatus("Recovery key rotated.");
  };

  const copyRecoveryKey = async () => {
    if (!recoveryKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(recoveryKey);
      setRecoveryStatus("Recovery key copied.");
    } catch {
      setRecoveryStatus("Unable to copy recovery key.");
    }
  };

  const downloadRecoveryKey = () => {
    if (!recoveryKey) {
      return;
    }

    const blob = new Blob([`${recoveryKey}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setRecoveryStatus("Recovery key downloaded.");
  };

  return (
    <div className="dashboard-page dashboard-settings">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">Settings</h1>
          <p className="dashboard-page-subtitle">Manage your profile, security, and account data controls.</p>
        </div>
      </header>

      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Profile</h2>
        <label>
          First name
          <input className="dashboard-input" value={nameInput} maxLength={60} onChange={(event) => setNameInput(event.target.value)} />
        </label>
        <label>
          Email
          <input className="dashboard-input" value={maskEmail(email)} readOnly />
        </label>
        <label>
          Jurisdiction
          <select className="dashboard-select" value={jurisdictionInput} onChange={(event) => setJurisdictionInput(event.target.value)}>
            {jurisdictionOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-control">
          <input
            type="checkbox"
            checked={currencyOverriddenInput}
            onChange={(event) => {
              const nextOverridden = event.target.checked;
              setCurrencyOverriddenInput(nextOverridden);

              if (!nextOverridden) {
                const jurisdictionOption = jurisdictionOptions.find((option) => option.code === jurisdictionInput);
                setCurrencyCodeInput((jurisdictionOption?.defaultCurrency as "GBP" | "USD" | "CAD" | undefined) ?? "GBP");
              }
            }}
          />
          Override currency
        </label>
        <label>
          Currency
          <select
            className="dashboard-select"
            value={currencyCodeInput}
            onChange={(event) => setCurrencyCodeInput(event.target.value as "GBP" | "USD" | "CAD")}
            disabled={!currencyOverriddenInput}
          >
            <option value="GBP">GBP</option>
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
          </select>
        </label>
        <div>
          <button type="button" className="dashboard-btn" onClick={saveProfile} disabled={profileSaving}>
            {profileSaving ? "Saving..." : "Save profile"}
          </button>
        </div>
        {profileStatus ? <p className="dashboard-status">{profileStatus}</p> : null}
      </section>

      <AgreementManager initialDisclosure={hasRelevantAgreements} defaultJurisdiction={jurisdiction} />

      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Password</h2>
        <label>
          Current password
          <input
            className="dashboard-input"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label>
          New password
          <input className="dashboard-input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </label>
        <label>
          Confirm new password
          <input
            className="dashboard-input"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        <div>
          <button type="button" className="dashboard-btn" onClick={updatePassword} disabled={passwordSaving}>
            {passwordSaving ? "Updating..." : "Change password"}
          </button>
        </div>
        {passwordStatus ? <p className="dashboard-status">{passwordStatus}</p> : null}
      </section>

      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Data</h2>
        <div className="dashboard-inline-actions">
          <Link href="/onboarding/review" className="dashboard-btn-ghost">
            Edit your financial position
          </Link>
          <button type="button" className="dashboard-btn-ghost" onClick={downloadData} disabled={exportLoading}>
            {exportLoading ? "Preparing export..." : "Download my data"}
          </button>
        </div>
        {exportStatus ? <p className="dashboard-status">{exportStatus}</p> : null}
      </section>

      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Recovery key</h2>
        <p className="dashboard-help">
          Keep this key offline. Support will require it with your account email if you need reinstatement after panic mode.
        </p>
        <div className="dashboard-inline-actions">
          <button type="button" className="dashboard-btn-ghost" onClick={generateRecoveryKey} disabled={recoveryLoading}>
            {recoveryLoading ? "Generating..." : "Regenerate recovery key"}
          </button>
          {recoveryKey ? (
            <>
              <button type="button" className="dashboard-btn-ghost" onClick={copyRecoveryKey}>
                Copy key
              </button>
              <button type="button" className="dashboard-btn-ghost" onClick={downloadRecoveryKey}>
                Download key
              </button>
            </>
          ) : null}
        </div>
        {recoveryKey ? <input className="dashboard-input" value={recoveryKey} readOnly /> : null}
        {recoveryStatus ? <p className="dashboard-status">{recoveryStatus}</p> : null}
      </section>

      <section className="dashboard-settings-section dashboard-danger-zone">
        <AccountDeletionForm />
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import AccountDeletionForm from "@/app/components/settings/AccountDeletionForm";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = {
  firstName: string | null;
  email: string;
  jurisdiction: string;
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

export default function SettingsView({ firstName, email, jurisdiction }: Props) {
  const [nameInput, setNameInput] = useState(firstName ?? "");
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const [exportLoading, setExportLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileStatus(null);

    const response = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name: nameInput }),
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
    const { error } = await supabaseBrowser().auth.updateUser({ password: newPassword });
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
          <select className="dashboard-select" value={jurisdiction} disabled>
            <option value="scotland">Scotland</option>
          </select>
        </label>
        <div>
          <button type="button" className="dashboard-btn" onClick={saveProfile} disabled={profileSaving}>
            {profileSaving ? "Saving..." : "Save profile"}
          </button>
        </div>
        {profileStatus ? <p className="dashboard-status">{profileStatus}</p> : null}
      </section>

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

      <section className="dashboard-settings-section dashboard-danger-zone">
        <AccountDeletionForm />
      </section>
    </div>
  );
}

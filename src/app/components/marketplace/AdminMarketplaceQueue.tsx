"use client";

import { useState } from "react";
import type { MarketplaceProfile, MarketplaceVerificationStatus } from "@/lib/marketplace/types";

type Props = {
  initialProfiles: MarketplaceProfile[];
};

export default function AdminMarketplaceQueue({ initialProfiles }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);

  async function reload(nextStatus = statusFilter) {
    const query = nextStatus ? `?status=${encodeURIComponent(nextStatus)}` : "";
    const response = await fetch(`/api/internal/admin/marketplace/profiles${query}`);
    if (!response.ok) {
      setStatus("Unable to load profiles");
      return;
    }

    const payload = (await response.json()) as { profiles?: MarketplaceProfile[] };
    setProfiles(payload.profiles ?? []);
  }

  async function updateProfile(profileId: string, patch: Partial<Pick<MarketplaceProfile, "verification_status" | "is_visible" | "is_accepting_new_clients">>) {
    setStatus(null);

    const response = await fetch(`/api/internal/admin/marketplace/profiles/${profileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setStatus(payload.error ?? "Unable to update profile");
      return;
    }

    await reload();
  }

  return (
    <div>
      <div className="marketplace-admin-controls">
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              void reload(event.target.value);
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
      </div>

      {status ? <p className="dashboard-status">{status}</p> : null}

      <div className="marketplace-grid">
        {profiles.length === 0 ? <p className="dashboard-status">No profiles found.</p> : null}

        {profiles.map((profile) => (
          <article key={profile.id} className="marketplace-card">
            <p className="marketplace-pill">{profile.professional_type}</p>
            <h3>{profile.display_name}</h3>
            <p className="dashboard-status">Verification: {profile.verification_status}</p>
            <p className="dashboard-status">Visible: {profile.is_visible ? "yes" : "no"}</p>

            <div className="marketplace-status-actions">
              <button
                type="button"
                className="dashboard-btn-ghost"
                onClick={() => updateProfile(profile.id, { verification_status: "verified" as MarketplaceVerificationStatus, is_visible: true })}
              >
                Verify + show
              </button>
              <button
                type="button"
                className="dashboard-btn-ghost"
                onClick={() => updateProfile(profile.id, { verification_status: "pending" as MarketplaceVerificationStatus, is_visible: false })}
              >
                Set pending
              </button>
              <button
                type="button"
                className="dashboard-btn-ghost"
                onClick={() => updateProfile(profile.id, { verification_status: "suspended" as MarketplaceVerificationStatus, is_visible: false })}
              >
                Suspend
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

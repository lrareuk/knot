import DashboardShell from "@/app/components/dashboard/DashboardShell";
import SettingsView from "@/app/components/settings/SettingsView";
import { requireDashboardAccess } from "@/lib/server/auth";

export default async function SettingsPage() {
  const { profile } = await requireDashboardAccess();

  return (
    <DashboardShell firstName={profile.first_name} hasRelevantAgreements={profile.has_relevant_agreements}>
      <SettingsView
        firstName={profile.first_name}
        email={profile.email}
        jurisdiction={profile.jurisdiction}
        currencyCode={profile.currency_code}
        currencyOverridden={profile.currency_overridden}
        hasRelevantAgreements={profile.has_relevant_agreements}
      />
    </DashboardShell>
  );
}

import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { requireDashboardAccess } from "@/lib/server/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireDashboardAccess();

  return (
    <DashboardShell firstName={profile.first_name} hasRelevantAgreements={profile.has_relevant_agreements}>
      {children}
    </DashboardShell>
  );
}

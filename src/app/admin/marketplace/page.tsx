import { redirect } from "next/navigation";
import AdminMarketplaceQueue from "@/app/components/marketplace/AdminMarketplaceQueue";
import { requireActiveAuthContext } from "@/lib/server/auth";
import { isMarketplaceAdminEmail } from "@/lib/server/marketplace-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { adminListMarketplaceProfiles } from "@/lib/server/marketplace-profiles";

export default async function AdminMarketplacePage() {
  const { user } = await requireActiveAuthContext();
  const userEmail = user.email?.trim().toLowerCase();

  if (!userEmail || !isMarketplaceAdminEmail(userEmail)) {
    redirect("/dashboard");
  }

  const { profiles } = await adminListMarketplaceProfiles(supabaseAdmin(), "pending");

  return (
    <main className="dashboard-page">
      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Marketplace verification queue</h2>
        <p className="dashboard-status">Review advisor profiles and control listing visibility.</p>

        <AdminMarketplaceQueue initialProfiles={profiles} />
      </section>
    </main>
  );
}

import AdvisorProfileEditor from "@/app/components/marketplace/AdvisorProfileEditor";
import { requireActiveAuthContext } from "@/lib/server/auth";
import { getOwnMarketplaceProfile } from "@/lib/server/marketplace-profiles";

export default async function AdvisorMarketplaceProfilePage() {
  const { user, supabase } = await requireActiveAuthContext();
  const { profile } = await getOwnMarketplaceProfile(supabase, user.id);

  return (
    <div className="dashboard-page">
      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Advisor marketplace profile</h2>
        <p className="dashboard-status">
          Verification: {profile?.verification_status ?? "not created"}. Visible: {profile?.is_visible ? "yes" : "no"}.
        </p>

        <AdvisorProfileEditor initialProfile={profile} />
      </section>
    </div>
  );
}

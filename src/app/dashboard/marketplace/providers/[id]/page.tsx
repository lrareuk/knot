import { notFound } from "next/navigation";
import InquiryComposer from "@/app/components/marketplace/InquiryComposer";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { getVisibleMarketplaceProfileById } from "@/lib/server/marketplace-profiles";
import { listScenarios } from "@/lib/server/scenarios";

export default async function MarketplaceProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, profile: userProfile, supabase } = await requireDashboardAccess();
  const { id } = await params;
  const position = await getOrCreateFinancialPosition(supabase, user.id);

  const [{ profile }, scenarios] = await Promise.all([
    getVisibleMarketplaceProfileById(supabase, id),
    listScenarios(supabase, user.id, {
      position,
      jurisdictionCode: userProfile.jurisdiction,
    }),
  ]);
  if (!profile) {
    notFound();
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-settings-section">
        <p className="marketplace-pill">{profile.professional_type === "solicitor" ? "Solicitor" : "Financial adviser"}</p>
        <h2 className="dashboard-scenario-name">{profile.display_name}</h2>
        {profile.firm_name ? <p className="dashboard-status">{profile.firm_name}</p> : null}
        {profile.headline ? <p>{profile.headline}</p> : null}
        {profile.bio ? <p>{profile.bio}</p> : null}

        <div className="marketplace-metadata-grid">
          <div>
            <h3>Jurisdictions</h3>
            <p>{profile.jurisdiction_codes.join(", ") || "None listed"}</p>
          </div>
          <div>
            <h3>Specialisms</h3>
            <p>{profile.specialisms.join(", ") || "None listed"}</p>
          </div>
          <div>
            <h3>Service modes</h3>
            <p>{profile.service_modes.join(", ")}</p>
          </div>
          <div>
            <h3>Languages</h3>
            <p>{profile.languages.join(", ")}</p>
          </div>
        </div>

        <InquiryComposer profileId={profile.id} scenarios={scenarios} jurisdictionCode={userProfile.jurisdiction ?? ""} />
      </section>
    </div>
  );
}

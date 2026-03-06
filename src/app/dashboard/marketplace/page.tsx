import Link from "next/link";
import { requireDashboardAccess } from "@/lib/server/auth";
import { listVisibleMarketplaceProfiles } from "@/lib/server/marketplace-profiles";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requireDashboardAccess();

  const type = typeof params.type === "string" ? params.type : undefined;
  const jurisdiction = typeof params.jurisdiction === "string" ? params.jurisdiction : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const accepting = typeof params.accepting === "string" ? params.accepting === "true" : undefined;

  const { profiles } = await listVisibleMarketplaceProfiles(supabase, {
    type: type === "solicitor" || type === "financial_adviser" ? type : undefined,
    jurisdiction,
    q,
    accepting,
  });

  return (
    <div className="dashboard-page">
      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Marketplace</h2>
        <p className="dashboard-status">Find verified solicitors and financial advisers.</p>

        <form method="get" className="marketplace-filter-grid">
          <label>
            Type
            <select name="type" defaultValue={type ?? ""}>
              <option value="">Any</option>
              <option value="solicitor">Solicitor</option>
              <option value="financial_adviser">Financial adviser</option>
            </select>
          </label>

          <label>
            Jurisdiction
            <input name="jurisdiction" defaultValue={jurisdiction ?? ""} placeholder="GB-EAW" />
          </label>

          <label>
            Search
            <input name="q" defaultValue={q ?? ""} placeholder="family law, pensions" />
          </label>

          <label>
            Accepting
            <select name="accepting" defaultValue={typeof accepting === "boolean" ? String(accepting) : ""}>
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>

          <button type="submit" className="dashboard-btn-ghost marketplace-filter-submit">
            Filter
          </button>
        </form>
      </section>

      <section className="dashboard-settings-section">
        <div className="marketplace-grid">
          {profiles.length === 0 ? <p className="dashboard-status">No providers match this filter yet.</p> : null}

          {profiles.map((profile) => (
            <article key={profile.id} className="marketplace-card">
              <p className="marketplace-pill">{profile.professional_type === "solicitor" ? "Solicitor" : "Financial adviser"}</p>
              <h3>{profile.display_name}</h3>
              {profile.firm_name ? <p className="dashboard-status">{profile.firm_name}</p> : null}
              {profile.headline ? <p>{profile.headline}</p> : null}
              <p className="dashboard-status">{profile.jurisdiction_codes.join(", ") || "No jurisdiction listed"}</p>
              <Link href={`/dashboard/marketplace/providers/${profile.id}`} className="dashboard-btn-ghost">
                View profile
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

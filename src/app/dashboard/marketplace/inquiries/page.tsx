import Link from "next/link";
import { requireDashboardAccess } from "@/lib/server/auth";
import { listRequesterInquiries } from "@/lib/server/marketplace-inquiries";

export default async function MarketplaceInquiriesPage() {
  const { user, supabase } = await requireDashboardAccess();
  const { inquiries } = await listRequesterInquiries(supabase, user.id);

  return (
    <div className="dashboard-page">
      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">My marketplace inquiries</h2>
        <p className="dashboard-status">Track advisor responses and continue conversations.</p>

        <div className="marketplace-grid">
          {inquiries.length === 0 ? <p className="dashboard-status">No inquiries yet.</p> : null}
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} className="marketplace-card">
              <p className="marketplace-pill">{inquiry.status}</p>
              <p>{inquiry.message}</p>
              <p className="dashboard-status">{new Date(inquiry.created_at).toLocaleString()}</p>
              <Link href={`/dashboard/marketplace/inquiries/${inquiry.id}`} className="dashboard-btn-ghost">
                Open thread
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

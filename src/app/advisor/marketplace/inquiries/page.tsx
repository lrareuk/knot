import Link from "next/link";
import { requireActiveAuthContext } from "@/lib/server/auth";
import { listAdvisorInquiries } from "@/lib/server/marketplace-inquiries";

export default async function AdvisorMarketplaceInquiriesPage() {
  const { user, supabase } = await requireActiveAuthContext();
  const { inquiries } = await listAdvisorInquiries(supabase, user.id);

  return (
    <div className="dashboard-page">
      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Advisor inquiries</h2>
        <p className="dashboard-status">Manage incoming conversations from marketplace clients.</p>

        <div className="marketplace-grid">
          {inquiries.length === 0 ? <p className="dashboard-status">No inquiries yet.</p> : null}
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} className="marketplace-card">
              <h3>{inquiry.status.toUpperCase()}</h3>
              <p>{inquiry.message}</p>
              <p className="dashboard-status">{new Date(inquiry.created_at).toLocaleString()}</p>
              <Link href={`/advisor/marketplace/inquiries/${inquiry.id}`} className="dashboard-btn-ghost">
                Open thread
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

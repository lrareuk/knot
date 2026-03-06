import { notFound } from "next/navigation";
import ChatThread from "@/app/components/marketplace/ChatThread";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getInquiryById, getInquiryParticipant } from "@/lib/server/marketplace-inquiries";

export default async function MarketplaceInquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase } = await requireDashboardAccess();

  const [{ inquiry }, { participant }] = await Promise.all([
    getInquiryById(supabase, id),
    getInquiryParticipant(supabase, id, user.id),
  ]);

  if (!inquiry || !participant) {
    notFound();
  }

  const snapshot = (inquiry.context_snapshot ?? {}) as Record<string, unknown>;
  const snapshotScenarios = Array.isArray(snapshot.scenarios)
    ? snapshot.scenarios.filter((item): item is { id: string; name: string } => {
        if (typeof item !== "object" || item === null) return false;
        const record = item as Record<string, unknown>;
        return typeof record.id === "string" && typeof record.name === "string";
      })
    : [];
  const snapshotCreatedAt = typeof snapshot.created_at === "string" ? snapshot.created_at : null;
  const snapshotJurisdiction = typeof snapshot.jurisdiction === "string" ? snapshot.jurisdiction : null;

  return (
    <div className="dashboard-page">
      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Inquiry thread</h2>
        <p className="dashboard-status">Inquiry id: {inquiry.id}</p>
        <div className="dashboard-status">
          <p>
            Shared snapshot: {snapshotCreatedAt ? new Date(snapshotCreatedAt).toLocaleString() : "Unknown time"}
            {snapshotJurisdiction ? ` · ${snapshotJurisdiction}` : ""}
          </p>
          <p>
            Scenarios shared:{" "}
            {snapshotScenarios.length > 0 ? snapshotScenarios.map((scenario) => scenario.name).join(", ") : "None listed"}
          </p>
        </div>

        <ChatThread inquiryId={inquiry.id} currentUserId={user.id} initialStatus={inquiry.status} mode="client" />
      </section>
    </div>
  );
}

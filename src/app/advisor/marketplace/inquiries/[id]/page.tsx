import { notFound } from "next/navigation";
import ChatThread from "@/app/components/marketplace/ChatThread";
import { requireActiveAuthContext } from "@/lib/server/auth";
import { getInquiryById } from "@/lib/server/marketplace-inquiries";
import { getOwnMarketplaceProfile } from "@/lib/server/marketplace-profiles";

export default async function AdvisorMarketplaceInquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase } = await requireActiveAuthContext();

  const [{ inquiry }, { profile }] = await Promise.all([
    getInquiryById(supabase, id),
    getOwnMarketplaceProfile(supabase, user.id),
  ]);

  if (!inquiry || !profile || inquiry.profile_id !== profile.id) {
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
  const offsettingRiskAcknowledged = snapshot.offsetting_risk_acknowledged === true;
  const offsettingRiskSummary = Array.isArray(snapshot.offsetting_risk_summary)
    ? snapshot.offsetting_risk_summary.filter((item): item is {
        scenario_name: string;
        offsetting_tradeoff_detected: boolean;
        specialist_advice_recommended: boolean;
        offsetting_tradeoff_strength: "none" | "moderate" | "strong";
      } => {
        if (typeof item !== "object" || item === null) return false;
        const record = item as Record<string, unknown>;
        return (
          typeof record.scenario_name === "string" &&
          typeof record.offsetting_tradeoff_detected === "boolean" &&
          typeof record.specialist_advice_recommended === "boolean" &&
          typeof record.offsetting_tradeoff_strength === "string"
        );
      })
    : [];

  return (
    <div className="dashboard-page">
      <section className="dashboard-settings-section">
        <h2 className="dashboard-scenario-name">Advisor conversation</h2>
        <p className="dashboard-status">Inquiry id: {inquiry.id}</p>
        <div className="marketplace-snapshot-card">
          <p className="dashboard-panel-eyebrow">Client Snapshot</p>
          <div className="marketplace-snapshot-grid">
            <p>
              <span>Shared at</span>
              <strong>{snapshotCreatedAt ? new Date(snapshotCreatedAt).toLocaleString() : "Unknown time"}</strong>
            </p>
            <p>
              <span>Jurisdiction</span>
              <strong>{snapshotJurisdiction ?? "Unknown"}</strong>
            </p>
            <p>
              <span>Scenarios shared</span>
              <strong>{snapshotScenarios.length > 0 ? snapshotScenarios.map((scenario) => scenario.name).join(", ") : "None listed"}</strong>
            </p>
          </div>
          {offsettingRiskSummary.length > 0 ? (
            <div className="marketplace-snapshot-risk">
              <p>
                Pension offsetting risk acknowledgement: <strong>{offsettingRiskAcknowledged ? "Yes" : "No"}</strong>
              </p>
              {offsettingRiskSummary.map((summary) => (
                <p key={summary.scenario_name}>
                  {summary.scenario_name}: trade-off {summary.offsetting_tradeoff_detected ? "detected" : "not detected"} (
                  {summary.offsetting_tradeoff_strength}), specialist advice{" "}
                  {summary.specialist_advice_recommended ? "recommended" : "not flagged"}.
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <ChatThread inquiryId={inquiry.id} currentUserId={user.id} initialStatus={inquiry.status} mode="advisor" />
      </section>
    </div>
  );
}

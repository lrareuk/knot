import Link from "next/link";
import { redirect } from "next/navigation";
import CreateScenarioButton from "@/app/components/dashboard/CreateScenarioButton";
import { computeBaseline } from "@/lib/domain/compute-scenario";
import { formatCurrency } from "@/lib/domain/currency";
import { requireDashboardAccess } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { ensureFirstScenario, listScenarios } from "@/lib/server/scenarios";

export default async function DashboardPage() {
  const { user, supabase } = await requireDashboardAccess();

  if (!user) {
    redirect("/login");
  }

  const position = await getOrCreateFinancialPosition(supabase, user.id);
  const baseline = computeBaseline(position);

  await ensureFirstScenario(supabase, user.id, position);
  const scenarios = await listScenarios(supabase, user.id);

  return (
    <main className="page-shell stack-lg">
      <section className="panel stack-md">
        <h1>Dashboard</h1>
        <p className="muted">This is your current combined position. Create a scenario to see what changes.</p>
        <div className="metrics-grid">
          <Metric label="Total net position" value={formatCurrency(baseline.user_net_position + baseline.partner_net_position)} />
          <Metric label="Property equity" value={formatCurrency(baseline.user_property_equity + baseline.partner_property_equity)} />
          <Metric label="Pensions" value={formatCurrency(baseline.user_total_pensions + baseline.partner_total_pensions)} />
          <Metric label="Savings" value={formatCurrency(baseline.user_total_savings + baseline.partner_total_savings)} />
          <Metric label="Debts" value={formatCurrency(baseline.user_total_debts + baseline.partner_total_debts)} />
          <Metric
            label="Monthly surplus/deficit"
            value={formatCurrency(baseline.user_monthly_surplus_deficit + baseline.partner_monthly_surplus_deficit)}
          />
        </div>
      </section>

      <section className="panel stack-md">
        <div className="row-between">
          <h2>Scenarios</h2>
          <CreateScenarioButton disabled={scenarios.length >= 5} />
        </div>

        <div className="cards-grid">
          {scenarios.map((scenario) => (
            <Link key={scenario.id} href={`/dashboard/scenario/${scenario.id}`} className="panel scenario-card">
              <h3>{scenario.name}</h3>
              <p className="muted">Net position: {formatCurrency(scenario.results.user_net_position)}</p>
              <p className="muted">Monthly: {formatCurrency(scenario.results.user_monthly_surplus_deficit)}</p>
              <p className={scenario.results.delta_user_net_position >= 0 ? "delta-positive" : "delta-negative"}>
                {scenario.results.delta_user_net_position >= 0 ? "+" : ""}
                {formatCurrency(scenario.results.delta_user_net_position)} from baseline
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel row-wrap">
        <Link href="/dashboard/compare" className="btn-secondary">
          Compare scenarios
        </Link>
        <Link href="/dashboard/report" className="btn-secondary">
          Generate report
        </Link>
        <Link href="/settings" className="btn-secondary">
          Settings
        </Link>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <p className="muted">{label}</p>
      <p>{value}</p>
    </div>
  );
}

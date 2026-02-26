"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Reveal from "@/app/components/Reveal";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader, { HOME_NAV_ITEMS } from "@/app/components/SiteHeader";

type ScenarioKey = "A" | "B";

type ScenarioRow = {
  label: string;
  value: string;
  change: string;
  type: "negative" | "positive";
};

const scenarioData: Record<ScenarioKey, ScenarioRow[]> = {
  A: [
    { label: "Housing equity", value: "£285,000", change: "−£142,500", type: "negative" },
    { label: "Pension value", value: "£124,000", change: "−£38,400", type: "negative" },
    { label: "Monthly income", value: "£4,200", change: "−£1,100", type: "negative" },
    { label: "Savings retained", value: "£42,000", change: "+£6,000", type: "positive" },
  ],
  B: [
    { label: "Housing equity", value: "£285,000", change: "−£185,000", type: "negative" },
    { label: "Pension value", value: "£124,000", change: "−£12,000", type: "negative" },
    { label: "Monthly income", value: "£4,200", change: "−£600", type: "positive" },
    { label: "Savings retained", value: "£42,000", change: "−£8,000", type: "negative" },
  ],
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scenario, setScenario] = useState<ScenarioKey>("A");

  useEffect(() => {
    if (!searchParams.get("code")) {
      return;
    }

    const query = searchParams.toString();
    router.replace(query ? `/auth/callback?${query}` : "/auth/callback");
  }, [router, searchParams]);

  return (
    <>
      <SiteHeader navItems={HOME_NAV_ITEMS} ctaHref="/start" ctaLabel="Get started" />

      <section className="hero">
        <div className="hero-eyebrow">Financial scenario platform</div>
        <h1>
          Clarity before
          <br />
          <em>change.</em>
        </h1>
        <p className="hero-sub">
          Private financial scenario modelling for people considering separation. Understand what
          changes — before anything escalates.
        </p>
        <div className="hero-actions">
          <a href="/start" className="btn-primary">
            Start with clarity
          </a>
          <a href="#how" className="btn-secondary">
            How it works
          </a>
        </div>
      </section>

      <div className="divider" />

      <section>
        <Reveal className="what-section">
          <div className="what-block">
            <h3 className="is-label">What Untie is</h3>
            <ul className="is-list">
              <li>Structured financial visibility for separation decisions</li>
              <li>Scenario comparison across assets, income, and housing</li>
              <li>A private space to model your position with numbers</li>
              <li>Clarity that helps you think — not react</li>
            </ul>
          </div>
          <div className="what-block">
            <h3 className="isnt-label">What Untie is not</h3>
            <ul className="isnt-list">
              <li>Not legal advice</li>
              <li>Not therapy or emotional support</li>
              <li>Not adversarial strategy or asset shielding</li>
              <li>Not designed to escalate conflict</li>
            </ul>
          </div>
        </Reveal>
      </section>

      <div className="divider" />

      <section id="how">
        <Reveal>
          <div className="section-label">How it works</div>
          <div className="section-heading">Three steps to financial clarity.</div>
          <p className="section-body">
            No accounts to connect. No advisors to schedule. Input your figures, model scenarios, and
            download a structured clarity report.
          </p>
        </Reveal>

        <Reveal className="steps-grid">
          <div className="step">
            <div className="step-number">01</div>
            <h3>Input your position</h3>
            <p>
              Enter your financial details — assets, income, property, pensions, debts. Everything
              stays private. Nothing is shared.
            </p>
          </div>
          <div className="step">
            <div className="step-number">02</div>
            <h3>Model scenarios</h3>
            <p>
              Compare outcomes side by side. Adjust variables. See what changes across different
              separation structures.
            </p>
          </div>
          <div className="step">
            <div className="step-number">03</div>
            <h3>Download your report</h3>
            <p>
              Receive a structured clarity report — clear, private, and ready to inform your next
              conversation, whether that&apos;s with a solicitor, mediator, or yourself.
            </p>
          </div>
        </Reveal>
      </section>

      <div className="divider" />

      <section id="clarity">
        <Reveal className="scenario-section">
          <div>
            <div className="section-label">Scenario modelling</div>
            <div className="section-heading">See what changes. In numbers.</div>
            <p className="section-body">
              Model different separation scenarios and compare financial outcomes across housing,
              income, pensions, and assets. Replace assumptions with structured visibility.
            </p>
          </div>
          <div className="scenario-visual">
            <div className="scenario-header">
              <span>Scenario comparison</span>
              <div className="scenario-tabs">
                <button
                  type="button"
                  className={`scenario-tab ${scenario === "A" ? "active" : ""}`}
                  onClick={() => setScenario("A")}
                >
                  A
                </button>
                <button
                  type="button"
                  className={`scenario-tab ${scenario === "B" ? "active" : ""}`}
                  onClick={() => setScenario("B")}
                >
                  B
                </button>
              </div>
            </div>

            <div className="scenario-rows">
              {scenarioData[scenario].map((row) => (
                <div key={row.label} className="scenario-row">
                  <div className="scenario-cell label">{row.label}</div>
                  <div className="scenario-cell value">{row.value}</div>
                  <div className={`scenario-cell change ${row.type}`}>{row.change}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <div className="divider" />

      <section id="trust" className="trust-section">
        <Reveal>
          <div className="section-label">Trust architecture</div>
          <div className="section-heading">Built on structural honesty.</div>
          <p className="section-body">
            Untie earns trust through transparency — not marketing. Every financial relationship we
            have is disclosed. Every limitation is stated.
          </p>
        </Reveal>

        <Reveal className="trust-grid">
          <div className="trust-item">
            <h3>No earnings from escalation</h3>
            <p>
              Untie does not receive referral fees from solicitors. We have no financial incentive to
              push you toward legal action. Clarity should never have a hidden motive.
            </p>
          </div>
          <div className="trust-item">
            <h3>Transparent referrals</h3>
            <p>
              If you choose to speak with a solicitor, our optional referral network is fully
              disclosed. You&apos;ll know exactly how it works, who benefits, and what it costs.
              Always opt-in, never steered.
            </p>
          </div>
          <div className="trust-item">
            <h3>Your data stays yours</h3>
            <p>
              Financial information entered into Untie is never shared, sold, or used for any purpose
              beyond your own modelling. We don&apos;t build profiles. We build clarity.
            </p>
          </div>
        </Reveal>
      </section>

      <section id="pricing" className="pricing-section">
        <Reveal>
          <div className="section-label">Pricing</div>
          <div className="section-heading">One price. Full clarity.</div>
          <p className="section-body pricing-section-body">
            No subscription. No trial that pressures you into upgrading. One payment for the full
            platform.
          </p>
        </Reveal>

        <Reveal className="pricing-card">
          <div className="pricing-name">Untie Clarity</div>
          <div className="pricing-amount">£449</div>
          <div className="pricing-note">One-time payment · Full access</div>
          <ul className="pricing-features">
            <li>Complete financial scenario modelling</li>
            <li>Side-by-side outcome comparison</li>
            <li>Downloadable structured clarity report</li>
            <li>Private — no data sharing, no accounts linked</li>
            <li>Optional solicitor referral directory (fully disclosed)</li>
          </ul>
          <a href="/start" className="pricing-cta">
            Get clarity now
          </a>
        </Reveal>
      </section>

      <div className="divider" />

      <section className="referral-section">
        <Reveal>
          <div className="referral-badge">Our position on referrals</div>
          <div className="section-heading referral-heading">Untie never earns from escalation.</div>
          <p className="section-body referral-body">
            Our optional solicitor directory exists for people who decide — on their own terms — that
            legal advice is their next step. We do not receive referral fees. We do not steer
            outcomes. Every relationship in our network is explicitly disclosed. Clarity means
            honesty about how the platform works, not just how your finances work.
          </p>
        </Reveal>
      </section>

      <div className="divider" />
      <SiteFooter />
    </>
  );
}

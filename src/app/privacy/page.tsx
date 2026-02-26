import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <nav>
        <Link href="/" className="nav-logo-link" aria-label="Untie home">
          <span className="logo-wordmark nav-logo-image" aria-hidden="true" />
          <span className="sr-only">Untie</span>
        </Link>
        <ul className="nav-links">
          <li>
            <Link href="/#how">How it works</Link>
          </li>
          <li>
            <Link href="/#clarity">Clarity</Link>
          </li>
          <li>
            <Link href="/#trust">Trust</Link>
          </li>
          <li>
            <Link href="/#pricing">Pricing</Link>
          </li>
        </ul>
        <Link href="/#pricing" className="nav-cta">
          Get started
        </Link>
      </nav>

      <section className="policy-hero">
        <p className="section-label">Privacy Policy</p>
        <h1 className="section-heading">Privacy Policy</h1>
        <p className="policy-meta">Untie</p>
        <p className="policy-meta">Operated by LRARE Holdings Ltd</p>
        <p className="policy-meta">Last updated: February 26, 2026</p>
      </section>

      <div className="divider" />

      <section className="policy-content-wrap">
        <article className="policy-card">
          <section className="policy-block">
            <h2>1. Introduction</h2>
            <p>
              Untie is a private financial modelling platform operated by LRARE Holdings Ltd (&ldquo;Untie&rdquo;,
              &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
            </p>
            <p>
              We are committed to operating with strict discretion and data minimisation. This Privacy
              Policy explains how we collect, use, store, and protect personal data when you use our
              website and services.
            </p>
            <p>
              Untie is designed to provide structured financial modelling before legal escalation. It
              does not provide legal advice.
            </p>
          </section>

          <section className="policy-block">
            <h2>2. Data Controller</h2>
            <p>The data controller responsible for your personal data is:</p>
            <p>LRARE Holdings Ltd</p>
            <p>The Stamp Exchange, Newcastle-upon-Tyne, NE1 1SA </p>
            <p>United Kingdom</p>
            <p>
              Email: <a href="mailto:privacy@untie.co">privacy@untie.co</a>
            </p>
            <p>LRARE Holdings Ltd operates Untie.</p>
          </section>

          <section className="policy-block">
            <h2>3. What Data We Collect</h2>
            <p>We collect the minimum personal data necessary to operate the platform.</p>

            <h3>3.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Email address</li>
              <li>Account ID</li>
              <li>Authentication credentials (managed securely via Supabase)</li>
            </ul>
            <p>We do not require social login providers.</p>

            <h3>3.2 Financial Modelling Data</h3>
            <p>If you use the modelling features, we collect:</p>
            <ul>
              <li>Financial inputs you provide</li>
              <li>Scenario selections</li>
              <li>Calculated outputs</li>
            </ul>
            <p>This data is used solely to generate modelling results within your account.</p>

            <h3>3.3 Payment Information</h3>
            <p>Payments are processed securely by Stripe.</p>
            <p>Untie does not store:</p>
            <ul>
              <li>Full card numbers</li>
              <li>Card security codes</li>
            </ul>
            <p>Stripe may store:</p>
            <ul>
              <li>Billing name</li>
              <li>Billing email</li>
              <li>Payment method details</li>
            </ul>
            <p>Charges may appear on statements under our parent company name:</p>
            <p>LRARE</p>

            <h3>3.4 Analytics Data</h3>
            <p>We use Google Analytics for limited performance measurement.</p>
            <p>We have configured analytics to:</p>
            <ul>
              <li>Anonymise IP addresses</li>
              <li>Disable advertising features</li>
              <li>Disable remarketing</li>
              <li>Avoid cross-site tracking</li>
              <li>Avoid demographic profiling</li>
            </ul>
            <p>Analytics are used only for:</p>
            <ul>
              <li>Page views</li>
              <li>Conversion measurement</li>
              <li>General product performance</li>
            </ul>
            <p>We do not use behavioural advertising tools.</p>

            <h3>3.5 Referral Data (If Applicable)</h3>
            <p>If you explicitly request an introduction to a professional firm:</p>
            <ul>
              <li>We will ask for your explicit consent before sharing information.</li>
              <li>Only the information necessary to facilitate the introduction will be shared.</li>
              <li>We may receive a referral fee. This will always be disclosed clearly.</li>
            </ul>
            <p>We do not share user data without explicit opt-in.</p>
          </section>

          <section className="policy-block">
            <h2>4. How We Use Your Data</h2>
            <p>We use your data to:</p>
            <ul>
              <li>Provide and operate the Untie platform</li>
              <li>Authenticate your account</li>
              <li>Generate financial modelling outputs</li>
              <li>Process payments</li>
              <li>Improve platform performance</li>
              <li>Respond to support requests</li>
            </ul>
            <p>We do not sell personal data.</p>
            <p>We do not share your activity with third parties.</p>
            <p>We do not disclose that you have used Untie.</p>
          </section>

          <section className="policy-block">
            <h2>5. Legal Basis for Processing (UK GDPR / EU GDPR)</h2>
            <p>We process your data under the following lawful bases:</p>
            <ul>
              <li>Contractual necessity — to provide the Untie service you request</li>
              <li>Legitimate interests — to improve platform performance and security</li>
              <li>Consent — where you opt-in to communications or referrals</li>
            </ul>
            <p>You may withdraw consent at any time.</p>
          </section>

          <section className="policy-block">
            <h2>6. Data Storage and Location</h2>
            <h3>Authentication &amp; Database</h3>
            <p>Provider: Supabase</p>
            <p>Infrastructure: Amazon Web Services (AWS)</p>
            <p>Primary region: Frankfurt (EU)</p>
            <p>Data is encrypted:</p>
            <ul>
              <li>In transit (TLS)</li>
              <li>At rest</li>
            </ul>
            <h3>Payments</h3>
            <p>Provider: Stripe</p>
            <p>Data handled in accordance with Stripe&rsquo;s security standards.</p>
          </section>

          <section className="policy-block">
            <h2>7. Data Sharing</h2>
            <p>Untie does not:</p>
            <ul>
              <li>Sell personal information</li>
              <li>Share user activity</li>
              <li>Share modelling data with third parties</li>
              <li>Provide user lists to law firms or partners</li>
            </ul>
            <p>We will only share data where:</p>
            <ul>
              <li>You explicitly request a referral</li>
              <li>We are legally required to do so</li>
            </ul>
          </section>

          <section className="policy-block">
            <h2>8. Data Retention</h2>
            <p>
              We retain personal data only as long as necessary to provide the service and comply
              with legal obligations.
            </p>
            <ul>
              <li>Account data remains until you delete your account.</li>
              <li>Financial modelling data is removed upon account deletion.</li>
              <li>
                Payment records may be retained by Stripe and by us as required for accounting and
                regulatory compliance.
              </li>
            </ul>
            <p>You may request deletion at any time (see Section 10).</p>
          </section>

          <section className="policy-block">
            <h2>9. Security Measures</h2>
            <p>
              We implement appropriate technical and organisational safeguards, including:
            </p>
            <ul>
              <li>HTTPS-only communication</li>
              <li>Encrypted data storage</li>
              <li>Restricted internal access</li>
              <li>Role-based access controls</li>
              <li>Minimal logging of sensitive data</li>
            </ul>
            <p>Access to user financial data is strictly limited.</p>
          </section>

          <section className="policy-block">
            <h2>10. Your Rights</h2>
            <p>Under UK GDPR and EU GDPR, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request erasure (&ldquo;right to be forgotten&rdquo;)</li>
              <li>Restrict processing</li>
              <li>Object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
            <p>
              To exercise these rights, contact:{" "}
              <a href="mailto:privacy@untie.co">privacy@untie.co</a>
            </p>
            <p>
              You also have the right to lodge a complaint with the UK Information Commissioner&rsquo;s
              Office (ICO) or your local supervisory authority.
            </p>
          </section>

          <section className="policy-block">
            <h2>11. Account Deletion</h2>
            <p>You may request account deletion at any time.</p>
            <p>Upon deletion:</p>
            <ul>
              <li>Account and modelling data will be removed from active systems.</li>
              <li>
                Some financial records may be retained for legal/accounting obligations.
              </li>
            </ul>
          </section>

          <section className="policy-block">
            <h2>12. Discretion &amp; User Guidance</h2>
            <p>Untie is designed for discretion.</p>
            <p>We encourage:</p>
            <ul>
              <li>Use of private browsing where appropriate</li>
              <li>Use of one-time or secondary email addresses if practical</li>
            </ul>
            <p>
              Untie does not send unnecessary notifications or promotional emails without consent.
            </p>
          </section>

          <section className="policy-block">
            <h2>13. Children</h2>
            <p>
              Untie is not intended for individuals under 18 years of age. We do not knowingly
              collect data from minors.
            </p>
          </section>

          <section className="policy-block">
            <h2>14. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time.</p>
            <p>Updates will be posted on this page with a revised date.</p>
          </section>

          <section className="policy-block policy-block-last">
            <h2>15. Contact</h2>
            <p>For privacy-related inquiries:</p>
            <p>
              <a href="mailto:privacy@untie.co">privacy@untie.co</a>
            </p>
            <p>LRARE Holdings Ltd</p>
            <p>The Stamp Exchange, Newcastle-upon-Tyne, NE1 1SA </p>
          </section>
        </article>
      </section>

      <div className="divider" />

      <footer>
        <div>
          <div className="footer-logo">Untie</div>
          <div className="footer-tagline">Clarity before change.</div>
        </div>
        <ul className="footer-links">
          <li>
            <Link href="/privacy">Privacy</Link>
          </li>
          <li>
            <Link href="/terms">Terms</Link>
          </li>
          <li>
            <a href="mailto:hello@untie.app">Contact</a>
          </li>
        </ul>
      </footer>
    </main>
  );
}

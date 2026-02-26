import type { AccordionItem } from "@/app/components/PolicyAccordion";

export const privacySections: AccordionItem[] = [
  {
    id: "privacy-1-introduction",
    title: "1. Introduction",
    content: (
      <>
        <p>
          Untie is a private financial modelling platform operated by LRARE Holdings Ltd
          (&ldquo;Untie&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
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
      </>
    ),
  },
  {
    id: "privacy-2-controller",
    title: "2. Data Controller",
    content: (
      <>
        <p>The data controller responsible for your personal data is:</p>
        <p>LRARE Holdings Ltd</p>
        <p>The Stamp Exchange, Newcastle-upon-Tyne, NE1 1SA</p>
        <p>United Kingdom</p>
        <p>
          Email: <a href="mailto:privacy@untie.co">privacy@untie.co</a>
        </p>
        <p>LRARE Holdings Ltd operates Untie.</p>
      </>
    ),
  },
  {
    id: "privacy-3-data-we-collect",
    title: "3. What Data We Collect",
    content: <p>We collect the minimum personal data necessary to operate the platform.</p>,
    children: [
      {
        id: "privacy-3-1-account-information",
        title: "3.1 Account Information",
        content: (
          <>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Email address</li>
              <li>Account ID</li>
              <li>Authentication credentials (managed securely via Supabase)</li>
            </ul>
            <p>We do not require social login providers.</p>
          </>
        ),
      },
      {
        id: "privacy-3-2-financial-modelling-data",
        title: "3.2 Financial Modelling Data",
        content: (
          <>
            <p>If you use the modelling features, we collect:</p>
            <ul>
              <li>Financial inputs you provide</li>
              <li>Scenario selections</li>
              <li>Calculated outputs</li>
            </ul>
            <p>This data is used solely to generate modelling results within your account.</p>
          </>
        ),
      },
      {
        id: "privacy-3-3-payment-information",
        title: "3.3 Payment Information",
        content: (
          <>
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
            <p>Charges may appear on statements under our parent company name: LRARE.</p>
          </>
        ),
      },
      {
        id: "privacy-3-4-analytics-data",
        title: "3.4 Analytics Data",
        content: (
          <>
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
          </>
        ),
      },
      {
        id: "privacy-3-5-referral-data",
        title: "3.5 Referral Data (If Applicable)",
        content: (
          <>
            <p>If you explicitly request an introduction to a professional firm:</p>
            <ul>
              <li>We will ask for your explicit consent before sharing information.</li>
              <li>Only the information necessary to facilitate the introduction will be shared.</li>
              <li>We may receive a referral fee. This will always be disclosed clearly.</li>
            </ul>
            <p>We do not share user data without explicit opt-in.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "privacy-4-how-we-use-data",
    title: "4. How We Use Your Data",
    content: (
      <>
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
      </>
    ),
  },
  {
    id: "privacy-5-legal-basis",
    title: "5. Legal Basis for Processing (UK GDPR / EU GDPR)",
    content: (
      <>
        <p>We process your data under the following lawful bases:</p>
        <ul>
          <li>Contractual necessity — to provide the Untie service you request</li>
          <li>Legitimate interests — to improve platform performance and security</li>
          <li>Consent — where you opt-in to communications or referrals</li>
        </ul>
        <p>You may withdraw consent at any time.</p>
      </>
    ),
  },
  {
    id: "privacy-6-storage-location",
    title: "6. Data Storage and Location",
    content: (
      <p>
        Untie uses established infrastructure partners and applies encryption controls for data in
        transit and at rest.
      </p>
    ),
    children: [
      {
        id: "privacy-6-1-auth-db",
        title: "6.1 Authentication and Database",
        content: (
          <>
            <p>Provider: Supabase</p>
            <p>Infrastructure: Amazon Web Services (AWS)</p>
            <p>Primary region: Frankfurt (EU)</p>
            <p>Data is encrypted:</p>
            <ul>
              <li>In transit (TLS)</li>
              <li>At rest</li>
            </ul>
          </>
        ),
      },
      {
        id: "privacy-6-2-payments",
        title: "6.2 Payments",
        content: (
          <>
            <p>Provider: Stripe</p>
            <p>Data handled in accordance with Stripe&rsquo;s security standards.</p>
          </>
        ),
      },
    ],
  },
  {
    id: "privacy-7-data-sharing",
    title: "7. Data Sharing",
    content: (
      <>
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
      </>
    ),
  },
  {
    id: "privacy-8-retention",
    title: "8. Data Retention",
    content: (
      <>
        <p>
          We retain personal data only as long as necessary to provide the service and comply with
          legal obligations.
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
      </>
    ),
  },
  {
    id: "privacy-9-security",
    title: "9. Security Measures",
    content: (
      <>
        <p>We implement appropriate technical and organisational safeguards, including:</p>
        <ul>
          <li>HTTPS-only communication</li>
          <li>Encrypted data storage</li>
          <li>Restricted internal access</li>
          <li>Role-based access controls</li>
          <li>Minimal logging of sensitive data</li>
        </ul>
        <p>Access to user financial data is strictly limited.</p>
      </>
    ),
  },
  {
    id: "privacy-10-rights",
    title: "10. Your Rights",
    content: (
      <>
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
          To exercise these rights, contact: <a href="mailto:privacy@untie.co">privacy@untie.co</a>
        </p>
        <p>
          You also have the right to lodge a complaint with the UK Information Commissioner&rsquo;s
          Office (ICO) or your local supervisory authority.
        </p>
      </>
    ),
  },
  {
    id: "privacy-11-account-deletion",
    title: "11. Account Deletion",
    content: (
      <>
        <p>You may request account deletion at any time.</p>
        <p>Upon deletion:</p>
        <ul>
          <li>Account and modelling data will be removed from active systems.</li>
          <li>Some financial records may be retained for legal/accounting obligations.</li>
        </ul>
      </>
    ),
  },
  {
    id: "privacy-12-discretion-guidance",
    title: "12. Discretion and User Guidance",
    content: (
      <>
        <p>Untie is designed for discretion.</p>
        <p>We encourage:</p>
        <ul>
          <li>Use of private browsing where appropriate</li>
          <li>Use of one-time or secondary email addresses if practical</li>
        </ul>
        <p>Untie does not send unnecessary notifications or promotional emails without consent.</p>
      </>
    ),
  },
  {
    id: "privacy-13-children",
    title: "13. Children",
    content: (
      <p>
        Untie is not intended for individuals under 18 years of age. We do not knowingly collect
        data from minors.
      </p>
    ),
  },
  {
    id: "privacy-14-changes",
    title: "14. Changes to This Policy",
    content: (
      <>
        <p>We may update this Privacy Policy from time to time.</p>
        <p>Updates will be posted on this page with a revised date.</p>
      </>
    ),
  },
  {
    id: "privacy-15-contact",
    title: "15. Contact",
    content: (
      <>
        <p>For privacy-related inquiries:</p>
        <p>
          <a href="mailto:privacy@untie.co">privacy@untie.co</a>
        </p>
        <p>LRARE Holdings Ltd</p>
        <p>The Stamp Exchange, Newcastle-upon-Tyne, NE1 1SA</p>
      </>
    ),
  },
];

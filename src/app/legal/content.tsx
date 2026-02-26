import Link from "next/link";
import type { ReactNode } from "react";
import type { LegalDocKey } from "@/app/legal/model";

const COMPANY_NAME = "LRARE Holdings Ltd";
const STATEMENT_DESCRIPTOR = "LRARE";
const COMPANY_ADDRESS = "The Stamp Exchange, Newcastle-upon-Tyne, NE1 1SA";
const PRIVACY_EMAIL = "privacy@untie.lrare.co.uk";
const LEGAL_EMAIL = "legal@untie.lrare.co.uk";
const EFFECTIVE_DATE = "February 26, 2026";
const LAST_UPDATED = "February 26, 2026";

export type LegalDocument = {
  tabLabel: string;
  title: string;
  effectiveDate: ReactNode;
  lastUpdated: ReactNode;
  content: ReactNode;
};

export const LEGAL_DOCUMENTS: Record<LegalDocKey, LegalDocument> = {
  privacy: {
    tabLabel: "Privacy Policy",
    title: "Privacy Policy",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    content: (
      <>
        <h2>1. Introduction</h2>
        <p>
          Untie is a private financial scenario platform operated by {COMPANY_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;). We provide structured financial modelling tools for individuals considering
          separation.
        </p>
        <p>
          We understand the sensitivity of this subject. This policy explains what data we collect,
          why we collect it, how we protect it, and your rights. We have designed our platform with
          privacy as a foundational principle, not an afterthought.
        </p>
        <p>
          Untie operates in the United Kingdom and follows the UK General Data Protection Regulation
          (UK GDPR) and the Data Protection Act 2018.
        </p>

        <h2>2. Our Privacy Commitment</h2>
        <h3>2.1 Discretion by design</h3>
        <p>
          All payment transactions appear on bank and credit card statements under the name
          <strong> {STATEMENT_DESCRIPTOR}</strong>. The name Untie does not appear on any financial
          statement. We do not send marketing emails, promotional materials, or any communication
          that identifies the nature of the platform unless you explicitly request it.
        </p>

        <h3>2.2 We do not disclose your use of the platform</h3>
        <p>
          We will never confirm or deny that any individual has used Untie. This includes to
          partners, legal representatives, employers, family members, or any third party. We will
          not respond to informal enquiries about whether a specific individual holds an account.
        </p>

        <h3>2.3 One-time email addresses</h3>
        <p>
          We encourage the use of one-time or alias email addresses where practical. Our
          authentication system is compatible with email alias services. You do not need to provide
          a primary personal email address to use Untie.
        </p>

        <h2>3. Data We Collect</h2>
        <h3>3.1 Account data</h3>
        <p>
          When you create an account, we collect an email address, a first name (used for
          personalisation only), and an authentication credential. Authentication is handled by
          Supabase, which operates on Amazon Web Services (AWS) infrastructure. We do not require
          your legal name, home address, phone number, or any other identifying information to
          create an account.
        </p>

        <h3>3.2 Financial modelling data</h3>
        <p>
          When you use the platform, you may enter financial information including property values,
          income figures, pension values, savings, debts, dependant information (ages only, no
          names), and monthly expenditure. This data is stored in our database hosted on Supabase
          (AWS) and is associated with your account. It is used solely to power the scenario
          modelling tools and generate your clarity report. We do not analyse, aggregate, profile,
          or use this data for any other purpose.
        </p>

        <h3>3.3 Payment data</h3>
        <p>
          Payments are processed by Stripe. We do not store your full card number, CVV, or bank
          account details on our servers. Stripe processes and stores payment credentials in
          accordance with PCI DSS Level 1 standards. The billing descriptor on your statement will
          read <strong>{STATEMENT_DESCRIPTOR}</strong>. We receive only a payment confirmation and a
          truncated card reference from Stripe for our transaction records.
        </p>

        <h3>3.4 Analytics data</h3>
        <p>
          We use Google Analytics to understand how the platform is used in aggregate. This includes
          page views, session duration, device type, and general geographic region. We have
          configured Google Analytics with the following privacy protections:
        </p>
        <ul>
          <li>IP anonymisation is enabled</li>
          <li>User-ID tracking is disabled</li>
          <li>Data sharing with Google advertising products is disabled</li>
          <li>Data retention is set to 2 months</li>
          <li>Granular location and demographic reporting is disabled</li>
        </ul>
        <p>
          Analytics data cannot be linked to individual user accounts or financial modelling data.
          Analytics cookies are only loaded after you provide consent via our cookie banner.
        </p>

        <h3>3.5 Data we do not collect</h3>
        <p>
          We do not collect: your legal name (unless you choose to provide it as your first name),
          home address, phone number, date of birth, national insurance number, employment details,
          information about your partner or spouse (beyond the financial figures you choose to enter
          for modelling purposes), names of your children, or any biometric data. We do not require
          identity verification to use the platform.
        </p>

        <h2>4. How We Use Your Data</h2>
        <p>We use your data for the following purposes only:</p>
        <ul>
          <li>To provide account authentication (Supabase / AWS)</li>
          <li>To personalise the platform experience using your first name</li>
          <li>To power the financial scenario modelling tools you use</li>
          <li>To generate and deliver your downloadable clarity report</li>
          <li>To process your payment (Stripe)</li>
          <li>To understand platform usage in aggregate (Google Analytics)</li>
        </ul>
        <p>
          We do not use your data for marketing, profiling, behavioural targeting, credit scoring, or
          sale to third parties. We do not build user profiles. We do not use your financial
          modelling data to train algorithms, models, or any form of artificial intelligence.
        </p>

        <h2>5. Legal Basis for Processing</h2>
        <p>Under UK GDPR, we process your data on the following legal bases:</p>
        <p>
          <strong>Contract performance (Article 6(1)(b)):</strong> Account data and financial
          modelling data are processed to deliver the service you have purchased.
        </p>
        <p>
          <strong>Legitimate interest (Article 6(1)(f)):</strong> Anonymised analytics data is
          processed to improve the platform. We have conducted a legitimate interest assessment and
          concluded that this processing does not override your rights, given the anonymisation
          measures in place.
        </p>
        <p>
          <strong>Consent (Article 6(1)(a)):</strong> Where we use cookies beyond those strictly
          necessary for platform operation, we obtain your consent via a cookie banner. You may
          withdraw consent at any time.
        </p>

        <h2>6. Data Sharing and Third Parties</h2>
        <p>
          We share data with the following third-party processors, and only to the extent necessary
          to operate the platform.
        </p>

        <h3>6.1 Supabase (authentication and database)</h3>
        <p>
          Supabase provides our authentication infrastructure and database hosting. Data is stored on
          Amazon Web Services (AWS) infrastructure. Supabase acts as a data processor under a Data
          Processing Agreement. Our database is hosted in the AWS Frankfurt region
          (eu-central-1).
        </p>

        <h3>6.2 Stripe (payment processing)</h3>
        <p>
          Stripe processes payment transactions. Stripe is certified to PCI DSS Level 1 and acts as
          an independent data controller for payment data it processes. Stripe&apos;s privacy policy
          governs its handling of card data. We receive only a payment confirmation and truncated
          card reference.
        </p>

        <h3>6.3 Google Analytics (anonymised usage analytics)</h3>
        <p>
          Google Analytics receives anonymised usage data as described in Section 3.4. Google acts
          as a data processor. <span data-legal-insert>[INSERT: Confirm Google Analytics Data Processing Terms are accepted in GA admin settings.]</span>
        </p>

        <h3>6.4 No other sharing</h3>
        <p>
          We do not share, sell, rent, or disclose your personal data or financial modelling data to
          any other third party. This includes solicitors, mediators, financial advisors, advertising
          networks, data brokers, or any other commercial entity.
        </p>
        <p>
          If you choose to use our optional solicitor referral directory in future, any contact you
          initiate with a listed solicitor is between you and that solicitor directly. We do not
          share your account data, financial modelling data, or any platform activity with referral
          partners. Untie does not receive referral fees from solicitors. We have no financial
          incentive to encourage legal escalation.
        </p>

        <h2>7. Data Storage and Security</h2>
        <p>
          Your data is stored on AWS infrastructure via Supabase in Frankfurt (eu-central-1).
        </p>
        <p>We implement the following security measures:</p>
        <ul>
          <li>Encryption at rest and in transit (TLS 1.2+)</li>
          <li>
            Row-level security on database tables via Supabase, ensuring no user can access another
            user&apos;s data at the database level
          </li>
          <li>Authentication tokens with appropriate expiry periods</li>
          <li>No server-side logging of financial modelling inputs or outputs</li>
          <li>No personal data (including email addresses) in application logs</li>
          <li>Content Security Policy (CSP) headers to prevent cross-site scripting</li>
          <li>
            Access to production data restricted to <span data-legal-insert>[INSERT: number]</span>{" "}
            authorised personnel
          </li>
        </ul>
        <p>
          <span data-legal-insert>[INSERT: Confirm whether Untie/LRARE has completed or is pursuing any security certifications, e.g. Cyber Essentials.]</span>
        </p>

        <h2>8. Data Retention</h2>
        <p>
          <strong>Account data:</strong> Retained for the duration of your account. Deleted within 30
          days of account deletion request.
        </p>
        <p>
          <strong>Financial modelling data:</strong> Retained for the duration of your account.
          Permanently deleted within 30 days of account deletion request. You may also delete
          individual scenarios at any time from within the platform.
        </p>
        <p>
          <strong>Clarity reports:</strong> Generated on demand as downloadable PDFs. Stored
          temporarily with signed URLs that expire after 24 hours. Reports are not permanently stored
          on our servers.
        </p>
        <p>
          <strong>Payment records:</strong> Retained for 7 years as required by UK tax and accounting
          regulations (HMRC). These records are held by Stripe and contain no financial modelling
          data.
        </p>
        <p>
          <strong>Analytics data:</strong> Retained by Google Analytics for 2 months from the date
          of collection.
        </p>
        <p>
          <strong>Inactive accounts:</strong> Accounts inactive for 12 months receive an email
          notification. Accounts inactive for 13 months are automatically deleted along with all
          associated data.
        </p>

        <h2>9. Your Rights</h2>
        <p>Under UK GDPR, you have the following rights:</p>
        <ul>
          <li>
            <strong>Right of access:</strong> Request a copy of the personal data we hold about you
          </li>
          <li>
            <strong>Right to rectification:</strong> Request correction of inaccurate data
          </li>
          <li>
            <strong>Right to erasure:</strong> Request deletion of your account and all associated
            data. We will comply within 30 days, subject to any legal retention obligations.
          </li>
          <li>
            <strong>Right to data portability:</strong> Request your financial modelling data in a
            structured, machine-readable format (JSON export available from your Settings page)
          </li>
          <li>
            <strong>Right to restrict processing:</strong> Request that we limit how we use your data
          </li>
          <li>
            <strong>Right to object:</strong> Object to processing based on legitimate interest (e.g.
            analytics)
          </li>
          <li>
            <strong>Right to withdraw consent:</strong> Where processing is based on consent (e.g.
            non-essential cookies), withdraw consent at any time via the cookie banner
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
          We will respond within one calendar month.
        </p>
        <p>
          If you are not satisfied with our response, you have the right to lodge a complaint with
          the Information Commissioner&apos;s Office (ICO) at <a href="https://ico.org.uk">ico.org.uk</a>.
        </p>

        <h2>10. Cookies</h2>
        <p>
          <strong>Strictly necessary cookies:</strong> Required for authentication and platform
          operation. These do not require consent.
        </p>
        <p>
          <strong>Analytics cookies:</strong> Used by Google Analytics to collect anonymised usage
          data. These require your consent and can be declined or withdrawn via the cookie banner.
        </p>
        <p>
          We do not use advertising cookies, tracking pixels, social media cookies, or any third-
          party marketing technology.
        </p>

        <h2>11. International Data Transfers</h2>
        <p>
          Core account and modelling data is hosted in AWS Frankfurt (eu-central-1) via Supabase.
          Some processors we use, including Stripe and Google Analytics, may process limited data
          in other jurisdictions under their applicable cross-border transfer safeguards.
        </p>

        <h2>12. Children</h2>
        <p>
          Untie is not designed for, marketed to, or intended for use by individuals under the age of
          18. We do not knowingly collect data from children. If we become aware that data has been
          collected from a person under 18, we will delete it promptly.
        </p>

        <h2>13. Law Enforcement and Legal Requests</h2>
        <p>
          We will not voluntarily disclose your data to any third party, including law enforcement,
          unless legally compelled to do so by a valid UK court order or statutory obligation. In the
          event that we receive a legally binding request, we will disclose only the minimum data
          required to comply with the specific order. Where legally permitted, we will notify you
          before any disclosure.
        </p>
        <p>
          We will not respond to informal requests, solicitor letters, or subject access requests
          made by third parties on behalf of your partner, spouse, or any other individual. Your data
          is yours.
        </p>

        <h2>14. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. If we make material changes, we will
          notify you via the email address associated with your account before the changes take
          effect. The effective date at the top of this document will always reflect the most recent
          version.
        </p>

        <h2>15. Contact</h2>
        <p>If you have any questions about this privacy policy or your data, contact us at:</p>
        <p>
          <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
          <br />
          {COMPANY_NAME}
          <br />
          {COMPANY_ADDRESS}
          <br />
          <span data-legal-insert>[INSERT: ICO registration number]</span>
        </p>
      </>
    ),
  },
  terms: {
    tabLabel: "Terms of Service",
    title: "Terms of Service",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    content: (
      <>
        <h2>1. Agreement</h2>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Untie platform (&ldquo;Platform&rdquo;,
          &ldquo;Service&rdquo;) operated by {COMPANY_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;, &ldquo;LRARE&rdquo;).
        </p>
        <p>
          By creating an account and making payment, you agree to be bound by these Terms. If you do
          not agree, do not use the Platform.
        </p>

        <h2>2. What Untie Is</h2>
        <p>
          Untie is a private financial scenario modelling platform. It allows you to enter financial
          information, model different separation scenarios, compare outcomes, and generate a
          structured clarity report.
        </p>

        <aside data-legal-highlight>
          <strong>Important:</strong> Untie is a financial modelling tool. It is not and does not
          provide legal advice, financial advice, tax advice, mediation, counselling, or therapy.
          The outputs of the Platform are modelled scenarios based on the figures you provide. They
          are not predictions, entitlements, or court outcomes. You should consult a qualified
          solicitor, financial advisor, or other professional before making any decisions based on
          information from the Platform.
        </aside>

        <h2>3. Eligibility</h2>
        <p>
          You must be at least 18 years old to use the Platform. By creating an account, you confirm
          that you are 18 or older and that you have the legal capacity to enter into a binding
          agreement.
        </p>

        <h2>4. Your Account</h2>
        <h3>4.1 Account creation</h3>
        <p>
          You must provide a valid email address and create a password to register. You may use an
          alias or one-time email address. You are responsible for maintaining the confidentiality of
          your login credentials and for all activity under your account.
        </p>

        <h3>4.2 Account security</h3>
        <p>
          You agree to notify us immediately if you become aware of any unauthorised access to your
          account. We are not liable for any loss arising from unauthorised use of your account where
          you have failed to maintain the security of your credentials.
        </p>

        <h3>4.3 One account per person</h3>
        <p>
          Each account is for a single individual. You may not create multiple accounts, share your
          account with others, or transfer your account. The Platform is designed for single-user
          modelling. We do not offer joint or multi-party accounts.
        </p>

        <h2>5. Payment</h2>
        <h3>5.1 Pricing</h3>
        <p>
          Access to the Platform requires a one-time payment of £449 (inclusive of VAT where
          applicable). This payment grants you 12 months of access from the date of purchase.
        </p>

        <h3>5.2 Payment processing</h3>
        <p>
          Payments are processed by Stripe. The charge will appear on your bank or credit card
          statement as <strong>{STATEMENT_DESCRIPTOR}</strong>. The name Untie will not appear on any
          financial statement. By making a payment, you agree to Stripe&apos;s terms of service.
        </p>

        <h3>5.3 No subscription</h3>
        <p>
          There is no recurring subscription. You will not be charged again unless you choose to
          repurchase access after your 12-month period expires.
        </p>

        <h3>5.4 Refund policy</h3>
        <p>
          You are entitled to a full refund within 14 days of purchase under the Consumer Contracts
          Regulations 2013, provided you have not generated and downloaded a clarity report. If you
          have downloaded a clarity report, you acknowledge that the digital content has been fully
          delivered and you waive your right to the 14-day cooling-off period in respect of that
          content.
        </p>
        <p>
          To request a refund, contact us at <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
          Refunds will be processed to the original payment method within 10 business days.
        </p>

        <h2>6. Access Period</h2>
        <h3>6.1 Duration</h3>
        <p>
          Your access to the Platform is valid for 12 months from the date of payment. During this
          period, you may use all Platform features including scenario modelling, comparison, and
          report generation.
        </p>

        <h3>6.2 Expiry</h3>
        <p>
          We will notify you by email 30 days before your access period expires. After expiry, you
          will no longer be able to access the Platform or your data. You should download any reports
          and export your data before your access period ends.
        </p>

        <h3>6.3 Data after expiry</h3>
        <p>
          If you do not renew access, your account and all associated data will be deleted 30 days
          after your access period expires. We will notify you before deletion. Once deleted, data
          cannot be recovered.
        </p>

        <h2>7. Your Data and Content</h2>
        <h3>7.1 Ownership</h3>
        <p>
          You retain full ownership of all data you enter into the Platform, including financial
          figures, scenario configurations, and any other content you provide. We do not claim any
          ownership or licence over your data beyond what is necessary to operate the Platform.
        </p>

        <h3>7.2 How we use your data</h3>
        <p>
          We use your data solely to provide the Platform&apos;s functionality to you. Full details are
          set out in our <Link href="/legal?doc=privacy">Privacy Policy</Link>. In summary: we do not
          share, sell, or use your data for any purpose other than delivering the service you have
          paid for.
        </p>

        <h3>7.3 Data export</h3>
        <p>
          You may export your financial data at any time from the Settings page. The export is
          provided in JSON format. You may also download clarity reports in PDF format at any time
          during your access period.
        </p>

        <h3>7.4 Data deletion</h3>
        <p>
          You may delete your account and all associated data at any time from the Settings page.
          Deletion is permanent and irreversible. Certain records (such as payment transaction
          records held by Stripe) are retained in accordance with legal obligations as described in
          our Privacy Policy.
        </p>

        <h2>8. Acceptable Use</h2>
        <p>
          You agree to use the Platform only for its intended purpose: personal financial scenario
          modelling related to separation. You agree not to:
        </p>
        <ul>
          <li>
            Use the Platform for any unlawful purpose, including fraud, money laundering, or asset
            concealment
          </li>
          <li>
            Enter deliberately false information with the intent to mislead a court, mediator,
            solicitor, or any other party
          </li>
          <li>Attempt to access another user&apos;s data or account</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
          <li>Use automated tools (bots, scrapers) to access or interact with the Platform</li>
          <li>Resell, sublicense, or commercially redistribute access to the Platform or its outputs</li>
          <li>Use the Platform on behalf of another person without their knowledge and consent</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate your account if we reasonably believe you are
          in breach of these terms.
        </p>

        <h2>9. Platform Disclaimers</h2>
        <h3>9.1 Not legal or financial advice</h3>
        <p>
          The Platform provides financial modelling tools. It does not provide legal advice,
          financial advice, tax advice, or any form of professional counsel. The outputs of the
          Platform (including scenario results, comparison tables, and clarity reports) are
          illustrative models based on the figures you enter. They are not legal entitlements, court
          predictions, or guaranteed outcomes.
        </p>

        <h3>9.2 Accuracy of your data</h3>
        <p>
          The quality and accuracy of the Platform&apos;s outputs depend entirely on the accuracy of the
          data you enter. We do not verify, validate, or cross-reference your financial information
          against any external source. You are solely responsible for ensuring the information you
          enter is as accurate as possible.
        </p>

        <h3>9.3 Jurisdiction-specific limitations</h3>
        <p>
          The Platform is configured for UK separation planning. Family law differs across
          jurisdictions, and the Platform&apos;s default assumptions may not apply to your circumstances
          if your matter is subject to a different legal framework.
        </p>

        <h3>9.4 No guarantee of outcomes</h3>
        <p>
          Family law outcomes are discretionary. Courts have wide discretion to depart from any
          starting-point position. The Platform cannot and does not predict what a court would order
          in your specific circumstances. Any scenario modelled on the Platform is an illustrative
          calculation, not a forecast.
        </p>

        <h3>9.5 Maintenance calculations</h3>
        <p>
          Spousal maintenance figures on the Platform are entirely illustrative. Child maintenance
          figures are also illustrative. For an official child maintenance estimate, use the Child
          Maintenance Service calculator at <a href="https://www.gov.uk/calculate-child-maintenance" target="_blank" rel="noreferrer">gov.uk/calculate-child-maintenance</a>.
        </p>

        <h2>10. Intellectual Property</h2>
        <p>
          The Platform, including its design, code, branding, visual identity, and documentation, is
          the intellectual property of {COMPANY_NAME}. You may not reproduce, distribute, modify, or
          create derivative works from any part of the Platform without our prior written consent.
        </p>
        <p>
          The clarity reports generated by the Platform are yours to use, share, and reproduce as you
          see fit for personal or professional purposes (for example, sharing with a solicitor or
          mediator). We retain no rights over the content of your reports beyond the Untie branding
          and formatting.
        </p>

        <h2>11. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law:</p>
        <ul>
          <li>
            {COMPANY_NAME} is not liable for any loss, damage, cost, or expense arising from your use
            of the Platform or reliance on its outputs, including but not limited to financial loss,
            loss of opportunity, or any consequential, indirect, or special damages
          </li>
          <li>
            Our total aggregate liability to you for any claim arising from or related to the
            Platform shall not exceed the amount you paid for access (£449)
          </li>
          <li>
            We are not liable for any decisions you make, or fail to make, based on information
            obtained from the Platform
          </li>
        </ul>
        <p>
          Nothing in these Terms excludes or limits our liability for death or personal injury caused
          by our negligence, fraud or fraudulent misrepresentation, or any other liability that
          cannot be excluded by law.
        </p>

        <h2>12. Availability and Modifications</h2>
        <h3>12.1 Platform availability</h3>
        <p>
          We aim to keep the Platform available at all times but do not guarantee uninterrupted
          access. We may occasionally need to suspend access for maintenance, updates, or for reasons
          beyond our control. Where possible, we will provide advance notice of planned downtime.
        </p>

        <h3>12.2 Changes to the Platform</h3>
        <p>
          We may update, modify, or improve the Platform from time to time. We will not remove core
          functionality (scenario modelling, comparison, report generation) during your active access
          period without providing a reasonable alternative or a pro-rata refund.
        </p>

        <h3>12.3 Changes to these Terms</h3>
        <p>
          We may update these Terms from time to time. If we make material changes, we will notify
          you via the email address associated with your account at least 30 days before the changes
          take effect. Your continued use of the Platform after the effective date constitutes
          acceptance of the updated Terms.
        </p>

        <h2>13. Termination</h2>
        <h3>13.1 By you</h3>
        <p>
          You may terminate your account at any time by deleting it from the Settings page. If you
          terminate within the 14-day refund period and have not downloaded a clarity report, you are
          entitled to a full refund. After the refund period, no refund is provided on termination.
        </p>

        <h3>13.2 By us</h3>
        <p>
          We may terminate or suspend your account if we reasonably believe you have breached these
          Terms, or if required to do so by law. In the event of termination for breach, no refund is
          provided. We will notify you of termination by email and provide you with a reasonable
          opportunity to export your data before deletion, unless prohibited by law.
        </p>

        <h2>14. Solicitor Referral Directory</h2>
        <p>
          If and when an optional solicitor referral directory is made available on the Platform, the
          following terms will apply:
        </p>
        <ul>
          <li>
            The directory is informational only. Inclusion of a solicitor does not constitute an
            endorsement or recommendation by {COMPANY_NAME}
          </li>
          <li>
            Any engagement between you and a solicitor you contact through the directory is a separate
            legal relationship governed by separate terms
          </li>
          <li>
            {COMPANY_NAME} does not receive referral fees from any listed solicitor. We have no
            financial incentive relating to your decision to engage a solicitor
          </li>
          <li>
            We do not share any of your account data, financial modelling data, or platform activity
            with listed solicitors
          </li>
        </ul>

        <h2>15. Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of England and Wales.
          Any disputes arising from or in connection with these Terms or your use of the Platform
          shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>

        <h2>16. Severability</h2>
        <p>
          If any provision of these Terms is found to be invalid or unenforceable by a court of
          competent jurisdiction, that provision shall be severed and the remaining provisions shall
          continue in full force and effect.
        </p>

        <h2>17. Entire Agreement</h2>
        <p>
          These Terms, together with our <Link href="/legal?doc=privacy">Privacy Policy</Link>,
          constitute the entire agreement between you and {COMPANY_NAME} regarding your use of the
          Platform. They supersede all prior agreements, representations, and understandings.
        </p>

        <h2>18. Contact</h2>
        <p>For any questions about these Terms, contact us at:</p>
        <p>
          {COMPANY_NAME}
          <br />
          {COMPANY_ADDRESS}
          <br />
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
          <br />
          <span data-legal-insert>[INSERT: Companies House registration number]</span>
        </p>
      </>
    ),
  },
};

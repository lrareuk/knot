import type { AccordionItem } from "@/app/components/PolicyAccordion";

export const termsSections: AccordionItem[] = [
  {
    id: "terms-1-introduction",
    title: "1. Introduction and Acceptance",
    content: (
      <>
        <p>
          These Terms of Service govern your access to and use of Untie, operated by LRARE Holdings
          Ltd (&ldquo;Untie&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
        </p>
        <p>
          By creating an account or using the platform, you agree to these Terms. If you do not
          agree, do not use the service.
        </p>
        <p>
          Untie provides financial modelling tools. It does not provide legal advice, legal
          representation, or regulated financial advice.
        </p>
      </>
    ),
  },
  {
    id: "terms-2-eligibility",
    title: "2. Eligibility and Account Registration",
    content: <p>You are responsible for ensuring your use of Untie is lawful in your jurisdiction.</p>,
    children: [
      {
        id: "terms-2-1-eligibility",
        title: "2.1 Eligibility",
        content: (
          <>
            <p>You must be at least 18 years old to use Untie.</p>
            <p>You must provide accurate registration information and keep it updated.</p>
          </>
        ),
      },
      {
        id: "terms-2-2-account-security",
        title: "2.2 Account Security",
        content: (
          <>
            <p>You are responsible for safeguarding your login credentials.</p>
            <p>
              You are responsible for activity that occurs through your account unless caused by our
              breach of security obligations.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "terms-3-service-scope",
    title: "3. Service Description and Scope",
    content: (
      <p>
        Untie is designed to help users model potential financial outcomes privately before formal
        legal escalation.
      </p>
    ),
    children: [
      {
        id: "terms-3-1-included",
        title: "3.1 What the Service Includes",
        content: (
          <ul>
            <li>Structured financial input workflows</li>
            <li>Scenario modelling tools and output summaries</li>
            <li>Private account-based access to saved modelling work</li>
          </ul>
        ),
      },
      {
        id: "terms-3-2-not-included",
        title: "3.2 What the Service Does Not Include",
        content: (
          <ul>
            <li>Legal advice or legal representation</li>
            <li>Court strategy or legal outcome predictions</li>
            <li>Emotional counselling or therapeutic services</li>
          </ul>
        ),
      },
    ],
  },
  {
    id: "terms-4-no-legal-advice",
    title: "4. No Legal Advice or Professional Representation",
    content: (
      <>
        <p>
          Untie is an information and modelling platform. Outputs are designed to support private
          planning and understanding.
        </p>
        <p>
          Nothing on Untie should be interpreted as legal advice. Where legal advice is needed,
          consult a qualified legal professional.
        </p>
      </>
    ),
  },
  {
    id: "terms-5-modelling-limitations",
    title: "5. Financial Modelling Limitations and User Responsibility",
    content: (
      <p>
        Any modelling output depends on assumptions and information provided by the user. Outcomes in
        practice may differ materially.
      </p>
    ),
    children: [
      {
        id: "terms-5-1-estimates",
        title: "5.1 Estimates, Not Guarantees",
        content: (
          <p>
            Outputs are indicative only and do not guarantee legal, financial, or personal outcomes.
          </p>
        ),
      },
      {
        id: "terms-5-2-user-inputs",
        title: "5.2 Responsibility for Inputs",
        content: (
          <>
            <p>You are responsible for accuracy and completeness of the data you enter.</p>
            <p>
              Inaccurate or incomplete inputs can materially affect scenario outputs and comparisons.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "terms-6-pricing-billing",
    title: "6. Pricing, Billing, and Stripe Processing",
    content: (
      <p>
        Pricing, billing cadence, and plan terms are presented at checkout or in your account area at
        the time of purchase.
      </p>
    ),
    children: [
      {
        id: "terms-6-1-payments",
        title: "6.1 Payment Processing",
        content: (
          <p>
            Payments are processed by Stripe. Untie does not store full card numbers or card security
            codes.
          </p>
        ),
      },
      {
        id: "terms-6-2-fees-refunds",
        title: "6.2 Fees and Refunds",
        content: (
          <>
            <p>
              Fees are stated clearly before payment. Unless required by law, payments are
              non-refundable once access is granted.
            </p>
            <p>
              Any exception will be handled at our discretion and in line with applicable consumer
              protection obligations.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "terms-7-referrals",
    title: "7. Referrals and Disclosure (If Applicable)",
    content: (
      <>
        <p>
          If you request an introduction to a professional firm, any referral basis and any referral
          fee arrangement will be disclosed clearly.
        </p>
        <p>No referral information is shared without your explicit opt-in.</p>
      </>
    ),
  },
  {
    id: "terms-8-acceptable-use",
    title: "8. Acceptable Use and Prohibited Conduct",
    content: (
      <>
        <p>You agree not to use Untie to:</p>
        <ul>
          <li>Upload unlawful, fraudulent, or intentionally misleading information</li>
          <li>Attempt to gain unauthorized access to any account, data, or system</li>
          <li>Interfere with platform operation, reliability, or security</li>
          <li>Use the service to harass, exploit, or unlawfully target others</li>
          <li>Reverse engineer or misuse platform code, models, or outputs</li>
        </ul>
      </>
    ),
  },
  {
    id: "terms-9-ip-license",
    title: "9. Intellectual Property and License",
    content: (
      <>
        <p>
          Untie and its underlying software, branding, and materials are owned by LRARE Holdings Ltd
          or its licensors.
        </p>
        <p>
          We grant you a limited, non-exclusive, non-transferable license to access and use the
          service for personal, lawful use in accordance with these Terms.
        </p>
      </>
    ),
  },
  {
    id: "terms-10-privacy-reference",
    title: "10. Privacy and Data Handling Reference",
    content: (
      <>
        <p>
          Your use of Untie is also governed by our Privacy Policy, which explains how personal data
          is collected, used, stored, and protected.
        </p>
        <p>
          If there is a direct conflict between these Terms and the Privacy Policy regarding privacy
          rights, the Privacy Policy governs that specific issue.
        </p>
      </>
    ),
  },
  {
    id: "terms-11-disclaimer",
    title: "11. Disclaimers of Warranties",
    content: (
      <>
        <p>
          Untie is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the maximum extent
          permitted by law, we disclaim all warranties not expressly stated in these Terms.
        </p>
        <p>
          We do not warrant uninterrupted availability, error-free operation, or that outputs will
          meet every user expectation.
        </p>
      </>
    ),
  },
  {
    id: "terms-12-limitation-liability",
    title: "12. Limitation of Liability",
    content: (
      <>
        <p>
          To the fullest extent permitted by law, Untie will not be liable for indirect,
          consequential, special, or incidental loss, including loss of opportunity, data, goodwill,
          or profit.
        </p>
        <p>
          Our total liability for claims arising out of or related to the service is limited to the
          amount paid by you to Untie in the 12 months before the event giving rise to the claim.
        </p>
        <p>
          Nothing in these Terms excludes liability that cannot be limited or excluded by law,
          including liability for fraud or fraudulent misrepresentation.
        </p>
      </>
    ),
  },
  {
    id: "terms-13-indemnity",
    title: "13. Indemnity",
    content: (
      <p>
        You agree to indemnify and hold harmless LRARE Holdings Ltd from claims, losses, and costs
        arising from your unlawful use of Untie or your breach of these Terms.
      </p>
    ),
  },
  {
    id: "terms-14-suspension-termination",
    title: "14. Suspension and Termination",
    content: (
      <>
        <p>
          We may suspend or terminate access where necessary to protect users, enforce these Terms,
          comply with legal obligations, or maintain service integrity.
        </p>
        <p>
          You may stop using the service at any time. You may also request account deletion in line
          with the Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "terms-15-governing-law-contact",
    title: "15. Governing Law, Updates, and Contact",
    content: (
      <>
        <p>
          These Terms are governed by the laws of England and Wales, and disputes are subject to the
          jurisdiction of the courts of England and Wales, unless mandatory local law provides
          otherwise.
        </p>
        <p>We may update these Terms from time to time. Updates will be posted on this page.</p>
        <p>
          Contact: <a href="mailto:privacy@untie.co">privacy@untie.co</a>
        </p>
        <p>LRARE Holdings Ltd</p>
        <p>The Stamp Exchange, Newcastle-upon-Tyne, NE1 1SA</p>
      </>
    ),
  },
];

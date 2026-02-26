import PolicyLayout from "@/app/components/PolicyLayout";
import { privacySections } from "./content";

export default function PrivacyPage() {
  return (
    <PolicyLayout
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      lede="A clear view of how Untie handles personal data, with discretion and data minimisation as core principles."
      meta={[
        { label: "Product", value: "Untie" },
        { label: "Operator", value: "LRARE Holdings Ltd" },
        { label: "Last updated", value: "February 26, 2026" },
      ]}
      tocAriaLabel="Privacy policy table of contents"
      sections={privacySections}
      defaultOpenId="privacy-1-introduction"
    />
  );
}

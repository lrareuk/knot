import PolicyLayout from "@/app/components/PolicyLayout";
import { termsSections } from "./content";

export default function TermsPage() {
  return (
    <PolicyLayout
      eyebrow="Terms of Service"
      title="Terms of Service"
      lede="The operating terms for using Untie, written to be clear, restrained, and practical at an early stage."
      meta={[
        { label: "Product", value: "Untie" },
        { label: "Operator", value: "LRARE Holdings Ltd" },
        { label: "Last updated", value: "February 26, 2026" },
      ]}
      tocAriaLabel="Terms table of contents"
      sections={termsSections}
      defaultOpenId="terms-1-introduction"
    />
  );
}

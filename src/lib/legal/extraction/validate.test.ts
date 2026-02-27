import { describe, expect, it } from "vitest";
import { citationQuoteExistsInSource, filterCitationBackedTerms } from "@/lib/legal/extraction/validate";
import type { ExtractedTerm } from "@/lib/legal/schemas";

describe("citation validation", () => {
  it("matches citation quotes against source text", () => {
    const source = "The parties waive all claims to ongoing spousal support unless both agree in writing.";
    expect(citationQuoteExistsInSource("waive all claims to ongoing spousal support", source)).toBe(true);
    expect(citationQuoteExistsInSource("not in source", source)).toBe(false);
  });

  it("filters terms that lack a matching citation quote", () => {
    const source = "Spousal support is capped at $2000 per month.";
    const terms: ExtractedTerm[] = [
      {
        term_type: "spousal_support_cap",
        term_payload: { cap_monthly_amount: 2000 },
        impact_direction: "weakens_user",
        confidence: 0.9,
        citation: { quote: "capped at $2000 per month" },
      },
      {
        term_type: "other_material_term",
        term_payload: {},
        impact_direction: "unknown",
        confidence: 0.5,
        citation: { quote: "missing quote" },
      },
    ];

    const filtered = filterCitationBackedTerms(terms, source);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.term_type).toBe("spousal_support_cap");
  });
});

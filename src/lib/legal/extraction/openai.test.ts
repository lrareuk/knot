import { parseExtractedTermsFromModelContent } from "@/lib/legal/extraction/openai";

describe("parseExtractedTermsFromModelContent", () => {
  it("parses strict schema output", () => {
    const terms = parseExtractedTermsFromModelContent(
      JSON.stringify({
        terms: [
          {
            term_type: "spousal_support_waiver",
            term_payload: {},
            impact_direction: "weakens_user",
            confidence: 0.92,
            citation: {
              quote: "Both parties waive spousal maintenance.",
              page: 3,
            },
          },
        ],
      })
    );

    expect(terms).toHaveLength(1);
    expect(terms[0]?.term_type).toBe("spousal_support_waiver");
    expect(terms[0]?.impact_direction).toBe("weakens_user");
    expect(terms[0]?.confidence).toBeCloseTo(0.92, 5);
    expect(terms[0]?.citation.page).toBe(3);
  });

  it("normalizes aliased field names and percentages", () => {
    const terms = parseExtractedTermsFromModelContent(
      JSON.stringify({
        extracted_terms: [
          {
            type: "spousal maintenance waiver",
            payload: { applies_to: "both_parties" },
            impact: "harms_user",
            confidence: "85%",
            citation: {
              text: "Neither party shall seek maintenance from the other.",
              page: "7",
            },
          },
        ],
      })
    );

    expect(terms).toHaveLength(1);
    expect(terms[0]?.term_type).toBe("spousal_support_waiver");
    expect(terms[0]?.impact_direction).toBe("weakens_user");
    expect(terms[0]?.confidence).toBeCloseTo(0.85, 5);
    expect(terms[0]?.citation.quote).toContain("Neither party shall seek maintenance");
    expect(terms[0]?.citation.page).toBe(7);
  });

  it("parses fenced json and defaults unknown values safely", () => {
    const terms = parseExtractedTermsFromModelContent(`\`\`\`json
{
  "terms": [
    {
      "type": "custom clause",
      "confidence": "n/a",
      "citation": { "quote": "Each party retains property in their own name." }
    }
  ]
}
\`\`\``);

    expect(terms).toHaveLength(1);
    expect(terms[0]?.term_type).toBe("other_material_term");
    expect(terms[0]?.impact_direction).toBe("unknown");
    expect(terms[0]?.confidence).toBeCloseTo(0.5, 5);
  });

  it("returns an empty list for non-json content", () => {
    const terms = parseExtractedTermsFromModelContent("No structured terms found.");
    expect(terms).toEqual([]);
  });
});

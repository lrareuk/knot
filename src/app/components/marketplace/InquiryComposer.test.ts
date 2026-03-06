import { describe, expect, it } from "vitest";
import { requiresMarketplaceOffsettingRiskAcknowledgement } from "@/app/components/marketplace/InquiryComposer";
import type { ScenarioRecord } from "@/lib/domain/types";

describe("requiresMarketplaceOffsettingRiskAcknowledgement", () => {
  it("returns true for selected flagged E&W scenarios", () => {
    const scenarios: Array<Pick<ScenarioRecord, "id" | "results">> = [
      {
        id: "s1",
        results: {
          offsetting_tradeoff_detected: true,
          specialist_advice_recommended: false,
        } as ScenarioRecord["results"],
      },
    ];

    expect(requiresMarketplaceOffsettingRiskAcknowledgement(scenarios, ["s1"], "GB-EAW")).toBe(true);
  });

  it("returns false for non-E&W jurisdictions", () => {
    const scenarios: Array<Pick<ScenarioRecord, "id" | "results">> = [
      {
        id: "s1",
        results: {
          offsetting_tradeoff_detected: true,
          specialist_advice_recommended: true,
        } as ScenarioRecord["results"],
      },
    ];

    expect(requiresMarketplaceOffsettingRiskAcknowledgement(scenarios, ["s1"], "GB-SCT")).toBe(false);
  });
});

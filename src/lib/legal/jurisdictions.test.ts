import { describe, expect, it } from "vitest";
import { JURISDICTIONS, JURISDICTION_BY_CODE } from "@/lib/legal/jurisdictions";

describe("jurisdictions matrix", () => {
  it("covers US, Canada, and UK counts", () => {
    const us = JURISDICTIONS.filter((entry) => entry.country === "US");
    const ca = JURISDICTIONS.filter((entry) => entry.country === "CA");
    const gb = JURISDICTIONS.filter((entry) => entry.country === "GB");

    expect(us).toHaveLength(51);
    expect(ca).toHaveLength(13);
    expect(gb).toHaveLength(2);
    expect(gb.map((entry) => entry.code)).toEqual(expect.arrayContaining(["GB-EAW", "GB-SCT"]));
  });

  it("has unique codes", () => {
    expect(JURISDICTION_BY_CODE.size).toBe(JURISDICTIONS.length);
  });

  it("has non-empty caveats and reviewed date", () => {
    for (const entry of JURISDICTIONS) {
      expect(["GBP", "USD", "CAD"]).toContain(entry.default_currency);
      expect(entry.last_reviewed_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.key_caveats.length).toBeGreaterThan(0);
      for (const caveat of entry.key_caveats) {
        expect(caveat.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

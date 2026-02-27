import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/jurisdictions/route";

type JurisdictionsResponse = {
  countries: Array<{
    code: string;
    label: string;
    subdivisions: Array<{ code: string; display_name: string; default_currency: "GBP" | "USD" | "CAD" }>;
  }>;
};

describe("GET /api/jurisdictions", () => {
  it("returns grouped country/subdivision options", async () => {
    const response = await GET();
    const payload = (await response.json()) as JurisdictionsResponse;

    expect(response.status).toBe(200);
    expect(payload.countries).toHaveLength(3);

    const gb = payload.countries.find((country) => country.code === "GB");
    const us = payload.countries.find((country) => country.code === "US");
    const ca = payload.countries.find((country) => country.code === "CA");

    expect(gb?.subdivisions).toHaveLength(2);
    expect(gb?.subdivisions.map((entry) => entry.code)).toEqual(expect.arrayContaining(["GB-EAW", "GB-SCT"]));
    expect(us?.subdivisions).toHaveLength(51);
    expect(ca?.subdivisions).toHaveLength(13);
  });
});

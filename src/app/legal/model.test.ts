import { describe, expect, it } from "vitest";
import { resolveLegalDocKey } from "@/app/legal/model";

describe("resolveLegalDocKey", () => {
  it("defaults to privacy when value is undefined", () => {
    expect(resolveLegalDocKey(undefined)).toBe("privacy");
  });

  it("resolves privacy", () => {
    expect(resolveLegalDocKey("privacy")).toBe("privacy");
  });

  it("resolves terms", () => {
    expect(resolveLegalDocKey("terms")).toBe("terms");
  });

  it("defaults to privacy for invalid values", () => {
    expect(resolveLegalDocKey("unknown")).toBe("privacy");
  });
});

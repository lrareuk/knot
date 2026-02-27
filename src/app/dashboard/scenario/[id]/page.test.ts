import { describe, expect, it, vi } from "vitest";

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import LegacyScenarioPage from "@/app/dashboard/scenarios/[id]/page";

describe("Legacy scenario route redirect", () => {
  it("redirects plural scenario URL to canonical singular URL", async () => {
    await LegacyScenarioPage({ params: Promise.resolve({ id: "abc-123" }) });
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/scenario/abc-123");
  });
});

import { describe, expect, it, vi } from "vitest";

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import LegacyScenarioPage from "@/app/dashboard/scenario/[id]/page";

describe("Legacy scenario route redirect", () => {
  it("redirects old scenario URL to new scenarios URL", async () => {
    await LegacyScenarioPage({ params: Promise.resolve({ id: "abc-123" }) });
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/scenarios/abc-123");
  });
});

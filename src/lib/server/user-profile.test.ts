import { describe, expect, it, vi } from "vitest";
import { ensureAndFetchUserProfile } from "@/lib/server/user-profile";

function createMaybeSingleResult<T>(result: { data: T | null; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  return { eq };
}

describe("ensureAndFetchUserProfile", () => {
  it("returns full profile when new columns are available", async () => {
    const fullProfile = {
      id: "user-1",
      email: "alex@example.com",
      first_name: "Alex",
      paid: true,
      onboarding_done: true,
      jurisdiction: "US-CA",
      currency_code: "USD",
      currency_overridden: true,
      has_relevant_agreements: true,
      financial_abuse_acknowledged_at: "2026-03-06T00:00:00.000Z",
      financial_abuse_ack_version: "2026-03-06",
      account_state: "active" as const,
      recovery_key_required: false,
      recovery_key_generated_at: null,
      recovery_key_version: 1,
    };

    const from = vi.fn(() => ({
      select: vi.fn(() => createMaybeSingleResult({ data: fullProfile, error: null })),
      insert: vi.fn(),
    }));

    const profile = await ensureAndFetchUserProfile(
      { from } as unknown as Parameters<typeof ensureAndFetchUserProfile>[0],
      { id: "user-1", email: "alex@example.com", user_metadata: {} } as Parameters<typeof ensureAndFetchUserProfile>[1]
    );

    expect(profile).toEqual(fullProfile);
  });

  it("falls back to legacy select if new columns do not exist", async () => {
    const legacyProfile = {
      id: "user-1",
      email: "alex@example.com",
      first_name: "Alex",
      paid: true,
      onboarding_done: true,
      jurisdiction: "scotland",
      financial_abuse_acknowledged_at: null,
      financial_abuse_ack_version: null,
      account_state: "active" as const,
      recovery_key_required: false,
      recovery_key_generated_at: null,
      recovery_key_version: 1,
    };

    const select = vi.fn((columns: string) => {
      if (columns.includes("currency_code")) {
        return createMaybeSingleResult({
          data: null,
          error: { code: "42703", message: 'column "currency_code" does not exist' },
        });
      }

      return createMaybeSingleResult({ data: legacyProfile, error: null });
    });

    const from = vi.fn(() => ({
      select,
      insert: vi.fn(),
    }));

    const profile = await ensureAndFetchUserProfile(
      { from } as unknown as Parameters<typeof ensureAndFetchUserProfile>[0],
      { id: "user-1", email: "alex@example.com", user_metadata: {} } as Parameters<typeof ensureAndFetchUserProfile>[1]
    );

    expect(profile).toMatchObject({
      id: "user-1",
      jurisdiction: "scotland",
      currency_code: "GBP",
      currency_overridden: false,
      has_relevant_agreements: null,
      financial_abuse_acknowledged_at: null,
      financial_abuse_ack_version: null,
    });
  });

  it("backfills first_name from auth metadata when profile exists without a name", async () => {
    const fullProfile = {
      id: "user-1",
      email: "alex@example.com",
      first_name: null,
      paid: true,
      onboarding_done: true,
      jurisdiction: "US-CA",
      currency_code: "USD",
      currency_overridden: true,
      has_relevant_agreements: true,
      financial_abuse_acknowledged_at: "2026-03-06T00:00:00.000Z",
      financial_abuse_ack_version: "2026-03-06",
      account_state: "active" as const,
      recovery_key_required: false,
      recovery_key_generated_at: null,
      recovery_key_version: 1,
    };

    const eqForUpdate = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: eqForUpdate });
    const from = vi.fn(() => ({
      select: vi.fn(() => createMaybeSingleResult({ data: fullProfile, error: null })),
      update,
      insert: vi.fn(),
    }));

    const profile = await ensureAndFetchUserProfile(
      { from } as unknown as Parameters<typeof ensureAndFetchUserProfile>[0],
      { id: "user-1", email: "alex@example.com", user_metadata: { first_name: "Alex" } } as Parameters<
        typeof ensureAndFetchUserProfile
      >[1]
    );

    expect(update).toHaveBeenCalledWith({ first_name: "Alex" });
    expect(profile?.first_name).toBe("Alex");
  });
});

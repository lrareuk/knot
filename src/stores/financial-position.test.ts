import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultExpenditure, defaultIncome } from "@/lib/onboarding/defaults";
import type { FinancialPosition, IncomeData } from "@/types/financial";

const { mockCreateClient, updateRequests } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  updateRequests: [] as Array<{
    payload: Record<string, unknown>;
    resolve: (result: { error: { message: string } | null }) => void;
  }>,
}));

vi.mock("@/lib/supabase", () => ({
  createClient: mockCreateClient,
}));

import { useFinancialStore } from "@/stores/financial-position";

function createPosition(overrides?: Partial<FinancialPosition>): FinancialPosition {
  return {
    id: "position-1",
    user_id: "user-1",
    date_of_marriage: null,
    date_of_separation: null,
    properties: [],
    pensions: [],
    savings: [],
    debts: [],
    income: { ...defaultIncome },
    dependants: [],
    expenditure: { ...defaultExpenditure },
    has_no_dependants: false,
    updated_at: "2026-02-27T00:00:00.000Z",
    ...overrides,
  };
}

function configureSupabaseMock() {
  mockCreateClient.mockImplementation(() => ({
    from: () => ({
      update: (payload: Record<string, unknown>) => ({
        eq: () =>
          new Promise<{ error: { message: string } | null }>((resolve) => {
            updateRequests.push({ payload, resolve });
          }),
      }),
    }),
  }));
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("financial-position store autosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    updateRequests.length = 0;
    configureSupabaseMock();

    useFinancialStore.setState({
      position: createPosition(),
      isLoading: false,
      saveStatus: "idle",
      lastError: null,
    });
  });

  afterEach(async () => {
    await vi.runOnlyPendingTimersAsync();
    vi.useRealTimers();
  });

  it("persists the newest queued value when an older request resolves first", async () => {
    const firstIncome: IncomeData = { ...defaultIncome, user_net_monthly: 1800 };
    const latestIncome: IncomeData = { ...defaultIncome, user_net_monthly: 2200 };

    useFinancialStore.getState().setIncome(firstIncome);
    await vi.advanceTimersByTimeAsync(500);

    expect(updateRequests).toHaveLength(1);
    expect(updateRequests[0]?.payload).toMatchObject({ income: firstIncome });

    useFinancialStore.getState().setIncome(latestIncome);
    await vi.advanceTimersByTimeAsync(500);

    expect(updateRequests).toHaveLength(1);

    updateRequests[0]?.resolve({ error: null });
    await flushPromises();

    expect(updateRequests).toHaveLength(2);
    expect(updateRequests[1]?.payload).toMatchObject({ income: latestIncome });

    updateRequests[1]?.resolve({ error: null });
    await flushPromises();

    expect(useFinancialStore.getState().saveStatus).toBe("saved");
  });

  it("retries immediately with the newest value when an older in-flight request fails", async () => {
    const firstIncome: IncomeData = { ...defaultIncome, user_net_monthly: 1300 };
    const latestIncome: IncomeData = { ...defaultIncome, user_net_monthly: 2600 };

    useFinancialStore.getState().setIncome(firstIncome);
    await vi.advanceTimersByTimeAsync(500);
    expect(updateRequests).toHaveLength(1);

    useFinancialStore.getState().setIncome(latestIncome);
    await vi.advanceTimersByTimeAsync(500);
    expect(updateRequests).toHaveLength(1);

    updateRequests[0]?.resolve({ error: { message: "temporary failure" } });
    await flushPromises();

    expect(updateRequests).toHaveLength(2);
    expect(updateRequests[1]?.payload).toMatchObject({ income: latestIncome });

    updateRequests[1]?.resolve({ error: null });
    await flushPromises();

    expect(useFinancialStore.getState().saveStatus).toBe("saved");
    expect(useFinancialStore.getState().lastError).toBeNull();
  });
});

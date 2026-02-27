"use client";

import { create } from "zustand";
import type {
  DebtItem,
  DependantItem,
  ExpenditureData,
  FinancialPosition,
  IncomeData,
  PensionItem,
  PropertyItem,
  SavingsItem,
} from "@/types/financial";
import { createClient } from "@/lib/supabase";
import { defaultExpenditure, defaultIncome } from "@/lib/onboarding/defaults";
import { normalizeFinancialPosition } from "@/lib/onboarding/normalize";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type SavePayload = {
  userId: string;
  column: string;
  value: unknown;
  attempt: number;
};

interface FinancialStore {
  position: FinancialPosition | null;
  isLoading: boolean;
  saveStatus: SaveStatus;
  lastError: string | null;
  fetch: (userId: string) => Promise<void>;
  updateField: (column: string, value: unknown) => void;
  updateDates: (dates: { date_of_marriage?: string | null; date_of_separation?: string | null }) => void;
  setProperties: (items: PropertyItem[]) => void;
  setPensions: (items: PensionItem[]) => void;
  setSavings: (items: SavingsItem[]) => void;
  setDebts: (items: DebtItem[]) => void;
  setIncome: (data: IncomeData) => void;
  setDependants: (items: DependantItem[]) => void;
  setExpenditure: (data: ExpenditureData) => void;
  setHasNoDependants: (value: boolean) => void;
}

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingSaves = new Map<string, SavePayload>();

function createInsertPayload(userId: string) {
  return {
    user_id: userId,
    date_of_marriage: null,
    date_of_separation: null,
    properties: [],
    pensions: [],
    savings: [],
    debts: [],
    income: defaultIncome,
    dependants: [],
    expenditure: defaultExpenditure,
    has_no_dependants: false,
  };
}

function clearTimer(map: Map<string, ReturnType<typeof setTimeout>>, key: string) {
  const existing = map.get(key);
  if (existing) {
    clearTimeout(existing);
    map.delete(key);
  }
}

function markSaved(set: (partial: Partial<FinancialStore> | ((state: FinancialStore) => Partial<FinancialStore>)) => void) {
  set({ saveStatus: "saved", lastError: null });
  setTimeout(() => {
    set((state) => (state.saveStatus === "saved" ? { saveStatus: "idle" } : {}));
  }, 2000);
}

async function persistPending(
  key: string,
  set: (partial: Partial<FinancialStore> | ((state: FinancialStore) => Partial<FinancialStore>)) => void
) {
  const pending = pendingSaves.get(key);
  if (!pending) {
    return;
  }

  clearTimer(saveTimers, key);
  set({ saveStatus: "saving", lastError: null });

  const supabase = createClient();
  const { error } = await supabase
    .from("financial_position")
    .update({ [pending.column]: pending.value, updated_at: new Date().toISOString() })
    .eq("user_id", pending.userId);

  if (!error) {
    pendingSaves.delete(key);
    clearTimer(retryTimers, key);
    markSaved(set);
    return;
  }

  const nextAttempt = pending.attempt + 1;
  pendingSaves.set(key, { ...pending, attempt: nextAttempt });
  set({ saveStatus: "error", lastError: error.message });

  clearTimer(retryTimers, key);
  const retryDelayMs = Math.min(5000, 1000 * nextAttempt);
  retryTimers.set(
    key,
    setTimeout(() => {
      void persistPending(key, set);
    }, retryDelayMs)
  );
}

function debouncedSave(
  userId: string,
  column: string,
  value: unknown,
  set: (partial: Partial<FinancialStore> | ((state: FinancialStore) => Partial<FinancialStore>)) => void
) {
  const key = `${userId}:${column}`;
  pendingSaves.set(key, {
    userId,
    column,
    value,
    attempt: 0,
  });

  clearTimer(saveTimers, key);
  clearTimer(retryTimers, key);

  saveTimers.set(
    key,
    setTimeout(() => {
      void persistPending(key, set);
    }, 500)
  );
}

export const useFinancialStore = create<FinancialStore>((set, get) => ({
  position: null,
  isLoading: true,
  saveStatus: "idle",
  lastError: null,

  fetch: async (userId) => {
    set({ isLoading: true, lastError: null });

    const supabase = createClient();
    const { data, error } = await supabase.from("financial_position").select("*").eq("user_id", userId).maybeSingle();

    if (error) {
      set({
        position: normalizeFinancialPosition(createInsertPayload(userId), userId),
        isLoading: false,
        lastError: error.message,
        saveStatus: "error",
      });
      return;
    }

    if (data) {
      set({ position: normalizeFinancialPosition(data, userId), isLoading: false, lastError: null });
      return;
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from("financial_position")
      .insert(createInsertPayload(userId))
      .select("*")
      .single();

    if (insertError) {
      set({
        position: normalizeFinancialPosition(createInsertPayload(userId), userId),
        isLoading: false,
        lastError: insertError.message,
        saveStatus: "error",
      });
      return;
    }

    set({ position: normalizeFinancialPosition(insertedRow, userId), isLoading: false, lastError: null });
  },

  updateDates: (dates) => {
    const position = get().position;
    if (!position) {
      return;
    }

    const updatedPosition: FinancialPosition = {
      ...position,
      ...dates,
    };

    set({ position: updatedPosition });

    if (dates.date_of_marriage !== undefined) {
      debouncedSave(position.user_id, "date_of_marriage", dates.date_of_marriage, set);
    }
    if (dates.date_of_separation !== undefined) {
      debouncedSave(position.user_id, "date_of_separation", dates.date_of_separation, set);
    }
  },

  updateField: (column, value) => {
    const position = get().position;
    if (!position) {
      return;
    }

    const updatedPosition = {
      ...position,
      [column]: value,
    } as FinancialPosition;

    set({ position: updatedPosition });
    debouncedSave(position.user_id, column, value, set);
  },

  setProperties: (items) => get().updateField("properties", items),
  setPensions: (items) => get().updateField("pensions", items),
  setSavings: (items) => get().updateField("savings", items),
  setDebts: (items) => get().updateField("debts", items),
  setIncome: (data) => get().updateField("income", data),
  setDependants: (items) => get().updateField("dependants", items),
  setExpenditure: (data) => get().updateField("expenditure", data),
  setHasNoDependants: (value) => get().updateField("has_no_dependants", value),
}));

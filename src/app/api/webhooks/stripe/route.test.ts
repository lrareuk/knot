import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeaders, mockConstructEvent, mockSupabaseAdmin } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
  mockConstructEvent: vi.fn(),
  mockSupabaseAdmin: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

type AdminMockConfig = {
  insertError?: { code?: string } | null;
};

function createAdminMock(config: AdminMockConfig = {}) {
  const insert = vi.fn().mockResolvedValue({
    error: config.insertError ?? null,
  });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn((table: string) => {
    if (table === "stripe_webhook_events") {
      return { insert };
    }
    if (table === "users") {
      return { upsert };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    admin: { from },
    insert,
    upsert,
  };
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    mockHeaders.mockResolvedValue({
      get: (name: string) => (name === "stripe-signature" ? "sig_test" : null),
    });
  });

  it("returns 400 for invalid webhook signatures", async () => {
    const { admin } = createAdminMock();
    mockSupabaseAdmin.mockReturnValue(admin);
    mockConstructEvent.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const response = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}" }));
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid signature");
  });

  it("ignores duplicate events by event id", async () => {
    const { admin, upsert } = createAdminMock({ insertError: { code: "23505" } });
    mockSupabaseAdmin.mockReturnValue(admin);
    mockConstructEvent.mockReturnValue({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          mode: "payment",
          status: "complete",
          payment_status: "paid",
          metadata: { supabase_user_id: "user_123" },
        },
      },
    });

    const response = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}" }));
    const payload = (await response.json()) as { duplicate?: boolean };

    expect(response.status).toBe(200);
    expect(payload.duplicate).toBe(true);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("marks users paid for completed and paid checkout sessions", async () => {
    const { admin, upsert } = createAdminMock();
    mockSupabaseAdmin.mockReturnValue(admin);
    mockConstructEvent.mockReturnValue({
      id: "evt_valid",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          mode: "payment",
          status: "complete",
          payment_status: "paid",
          metadata: { supabase_user_id: "user_123" },
          customer_details: { email: "client@example.com" },
        },
      },
    });

    const response = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}" }));
    const payload = (await response.json()) as { received?: boolean };

    expect(response.status).toBe(200);
    expect(payload.received).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      {
        id: "user_123",
        email: "client@example.com",
        paid: true,
        stripe_session: "cs_test_123",
      },
      { onConflict: "id", ignoreDuplicates: false }
    );
  });
});

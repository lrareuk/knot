import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateSession, mockSupabaseServer } = vi.hoisted(() => ({
  mockCreateSession: vi.fn(),
  mockSupabaseServer: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: mockCreateSession,
      },
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: mockSupabaseServer,
}));

import { POST } from "@/app/api/stripe/checkout/route";

type SupabaseMockConfig = {
  user: { id: string; email?: string | null } | null;
  paid?: boolean;
};

function createSupabaseMock(config: SupabaseMockConfig) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const maybeSingle = vi.fn().mockResolvedValue({
    data: config.user ? { paid: config.paid ?? false } : null,
    error: null,
  });
  const selectEq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq: selectEq });
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: updateEq });

  const from = vi.fn((table: string) => {
    if (table === "users") {
      return { upsert, select, update };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: config.user,
          },
        }),
      },
      from,
    },
    upsert,
    update,
    updateEq,
  };
}

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.STRIPE_PRICE_ID = "price_test_123";
  });

  it("returns 401 when the user is not authenticated", async () => {
    const { supabase } = createSupabaseMock({ user: null });
    mockSupabaseServer.mockResolvedValue(supabase);

    const response = await POST();
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("returns 500 when site URL is missing", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";
    const { supabase } = createSupabaseMock({
      user: {
        id: "user_123",
        email: "client@example.com",
      },
    });
    mockSupabaseServer.mockResolvedValue(supabase);

    const response = await POST();
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Missing Stripe configuration");
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it("returns client secret and session id for custom checkout", async () => {
    const { supabase, update } = createSupabaseMock({
      user: {
        id: "user_123",
        email: "client@example.com",
      },
    });
    mockSupabaseServer.mockResolvedValue(supabase);
    mockCreateSession.mockResolvedValue({
      id: "cs_test_123",
      client_secret: "cs_test_secret_123",
      amount_total: 44900,
      currency: "gbp",
    });

    const response = await POST();
    const payload = (await response.json()) as {
      clientSecret?: string;
      sessionId?: string;
      display?: {
        amount: number;
        currency: string;
        formatted_total: string;
      };
    };

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      clientSecret: "cs_test_secret_123",
      sessionId: "cs_test_123",
      display: {
        amount: 44900,
        currency: "GBP",
        formatted_total: expect.stringContaining("449"),
      },
    });
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_mode: "custom",
        mode: "payment",
        allow_promotion_codes: true,
        line_items: [{ price: "price_test_123", quantity: 1 }],
        payment_method_types: ["card"],
        return_url: "http://localhost:3000/signup/payment/success?session_id={CHECKOUT_SESSION_ID}",
        client_reference_id: "user_123",
        metadata: {
          supabase_user_id: "user_123",
          user_id: "user_123",
        },
      })
    );
    expect(update).toHaveBeenCalledWith({ stripe_session: "cs_test_123" });
  });
});

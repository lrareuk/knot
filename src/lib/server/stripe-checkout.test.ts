import { describe, expect, it } from "vitest";
import {
  buildStripeCheckoutSessionParams,
  isPaidCheckoutSession,
  mapStripeCheckoutRouteError,
} from "@/lib/server/stripe-checkout";

describe("buildStripeCheckoutSessionParams", () => {
  it("builds a custom checkout session payload for card payments", () => {
    const params = buildStripeCheckoutSessionParams({
      siteUrl: "https://untie.example",
      userId: "user_123",
      email: "client@example.com",
    });

    expect(params.ui_mode).toBe("custom");
    expect(params.mode).toBe("payment");
    expect(params.allow_promotion_codes).toBe(true);
    expect(params.payment_method_types).toEqual(["card"]);
    expect(params.return_url).toBe("https://untie.example/signup/payment/success?session_id={CHECKOUT_SESSION_ID}");
    expect(params.client_reference_id).toBe("user_123");
    expect(params.metadata).toEqual({
      supabase_user_id: "user_123",
      user_id: "user_123",
    });
  });
});

describe("mapStripeCheckoutRouteError", () => {
  it("maps Stripe invalid request errors to safe client responses", () => {
    const mapped = mapStripeCheckoutRouteError({
      type: "StripeInvalidRequestError",
      statusCode: 400,
    });

    expect(mapped).toEqual({
      status: 400,
      message: "Unable to initialize checkout right now.",
    });
  });

  it("maps Stripe auth errors to configuration responses", () => {
    const mapped = mapStripeCheckoutRouteError({
      type: "StripeAuthenticationError",
      statusCode: 401,
    });

    expect(mapped).toEqual({
      status: 500,
      message: "Payment provider configuration error.",
    });
  });
});

describe("isPaidCheckoutSession", () => {
  it("returns true for paid and completed payment-mode sessions", () => {
    expect(
      isPaidCheckoutSession({
        mode: "payment",
        status: "complete",
        payment_status: "paid",
      } as never)
    ).toBe(true);
  });

  it("returns false for incomplete payment sessions", () => {
    expect(
      isPaidCheckoutSession({
        mode: "payment",
        status: "open",
        payment_status: "unpaid",
      } as never)
    ).toBe(false);
  });
});

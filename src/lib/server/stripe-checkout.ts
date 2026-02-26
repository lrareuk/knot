import type Stripe from "stripe";

const ONE_TIME_PRICE_PENCE = 44_900;
const PRODUCT_NAME = "Untie Clarity";
const PRODUCT_DESCRIPTION = "Financial scenario platform - 12 months access";

export type BuildStripeCheckoutSessionParamsInput = {
  siteUrl: string;
  userId: string;
  email?: string | null;
};

export function buildStripeCheckoutSessionParams(
  input: BuildStripeCheckoutSessionParamsInput
): Stripe.Checkout.SessionCreateParams {
  return {
    ui_mode: "custom",
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: input.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: PRODUCT_NAME,
            description: PRODUCT_DESCRIPTION,
          },
          unit_amount: ONE_TIME_PRICE_PENCE,
        },
        quantity: 1,
      },
    ],
    return_url: buildCheckoutReturnUrl(input.siteUrl),
    payment_intent_data: {
      statement_descriptor: "LRARE",
      statement_descriptor_suffix: "CLARITY",
    },
    client_reference_id: input.userId,
    metadata: {
      supabase_user_id: input.userId,
      user_id: input.userId,
    },
  };
}

function buildCheckoutReturnUrl(siteUrl: string) {
  const baseUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return `${baseUrl}/signup/payment/success?session_id={CHECKOUT_SESSION_ID}`;
}

type StripeErrorLike = {
  type?: string;
  message?: string;
  statusCode?: number;
};

export function mapStripeCheckoutRouteError(error: unknown) {
  const stripeError = error as StripeErrorLike | undefined;
  const errorType = stripeError?.type ?? "";
  const statusCode = stripeError?.statusCode ?? 500;

  if (errorType === "StripeAuthenticationError" || errorType === "StripePermissionError") {
    return {
      status: 500,
      message: "Payment provider configuration error.",
    };
  }

  if (errorType === "StripeRateLimitError") {
    return {
      status: 503,
      message: "Payment service is temporarily unavailable. Please try again.",
    };
  }

  if (errorType === "StripeInvalidRequestError") {
    return {
      status: 400,
      message: "Unable to initialize checkout right now.",
    };
  }

  if (statusCode >= 500) {
    return {
      status: 502,
      message: "Payment service is temporarily unavailable. Please try again.",
    };
  }

  return {
    status: 500,
    message: "Unable to initialize checkout right now.",
  };
}

export function isPaidCheckoutSession(session: Stripe.Checkout.Session) {
  return session.mode === "payment" && session.status === "complete" && session.payment_status === "paid";
}

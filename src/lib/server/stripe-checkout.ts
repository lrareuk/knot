import type Stripe from "stripe";

const ONE_TIME_PRICE_PENCE = 44_900;
const PRODUCT_NAME = "Untie Clarity";
const PRODUCT_DESCRIPTION = "Financial scenario platform - 12 months access";
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

export type StripeCheckoutDisplayAmount = {
  amount: number;
  currency: string;
  formatted_total: string;
};

export type BuildStripeCheckoutSessionParamsInput = {
  siteUrl: string;
  userId: string;
  email?: string | null;
  priceId?: string | null;
};

export function buildStripeCheckoutSessionParams(
  input: BuildStripeCheckoutSessionParamsInput
): Stripe.Checkout.SessionCreateParams {
  return {
    ui_mode: "custom",
    mode: "payment",
    allow_promotion_codes: true,
    payment_method_types: ["card"],
    customer_email: input.email ?? undefined,
    line_items: buildCheckoutLineItems(input.priceId),
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

function buildCheckoutLineItems(priceId?: string | null): Stripe.Checkout.SessionCreateParams.LineItem[] {
  if (priceId) {
    return [
      {
        price: priceId,
        quantity: 1,
      },
    ];
  }

  return [
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
  ];
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

function minorUnitDivisor(currencyCode: string) {
  return ZERO_DECIMAL_CURRENCIES.has(currencyCode.toUpperCase()) ? 1 : 100;
}

function formatCheckoutAmount(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / minorUnitDivisor(currencyCode));
  } catch {
    return `${(amount / minorUnitDivisor(currencyCode)).toFixed(2)} ${currencyCode}`;
  }
}

export function getStripeCheckoutDisplayAmount(
  session: Pick<Stripe.Checkout.Session, "amount_total" | "currency">
): StripeCheckoutDisplayAmount {
  const amount = typeof session.amount_total === "number" ? session.amount_total : ONE_TIME_PRICE_PENCE;
  const currency = (session.currency ?? "gbp").toUpperCase();
  return {
    amount,
    currency,
    formatted_total: formatCheckoutAmount(amount, currency),
  };
}

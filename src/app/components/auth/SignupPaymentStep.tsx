"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Appearance, StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutProvider, ExpressCheckoutElement, PaymentElement, useCheckout } from "@stripe/react-stripe-js/checkout";
import { useRouter } from "next/navigation";
import styles from "./AuthFlow.module.css";

type Props = {
  firstName: string;
};

const INCLUDED_ITEMS = [
  "Structured financial scenario modelling",
  "Side-by-side outcome comparison",
  "Downloadable clarity report",
  "12 months of platform access",
  "Full data privacy - nothing shared, ever",
];

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

const checkoutAppearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#c2185b",
    colorBackground: "#1e1e1e",
    colorText: "#f4f1ea",
    colorDanger: "#c46a5e",
    colorTextSecondary: "#9a9590",
    borderRadius: "0px",
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      backgroundColor: "#1e1e1e",
      borderColor: "#2a2a2a",
      color: "#f4f1ea",
      boxShadow: "none",
    },
    ".Input:focus": {
      borderColor: "#c2185b",
      boxShadow: "0 0 0 1px #c2185b",
    },
    ".Tab, .Block": {
      backgroundColor: "#1e1e1e",
      borderColor: "#2a2a2a",
    },
    ".Label": {
      color: "#9a9590",
    },
  },
};

async function createCheckoutClientSecret() {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
  });

  const payload = (await response.json()) as { clientSecret?: string; error?: string };
  if (!response.ok || !payload.clientSecret) {
    throw new Error(payload.error ?? "Could not connect to payment provider. Please try again.");
  }

  return payload.clientSecret;
}

export default function SignupPaymentStep({ firstName }: Props) {
  const clientSecret = useMemo(() => createCheckoutClientSecret(), []);

  const missingPublishableKey = !STRIPE_PUBLISHABLE_KEY || !stripePromise;

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>One step left, {firstName}.</h1>
      <p className={styles.supporting}>
        Untie Clarity gives you full access to the financial scenario platform. One payment, no subscription.
      </p>

      <div className={styles.priceBlock}>
        <p className={styles.priceAmount}>£449</p>
        <p className={styles.priceSubtext}>One-time payment · Full access</p>
      </div>

      <section className={styles.includesPanel}>
        <p className={styles.includesTitle}>What&apos;s included</p>
        <ul className={styles.includesList}>
          {INCLUDED_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {missingPublishableKey ? (
        <p className={styles.inlineError}>Payment is unavailable due to missing Stripe publishable key.</p>
      ) : (
        <CheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret,
            elementsOptions: {
              appearance: checkoutAppearance,
            },
          }}
        >
          <CheckoutExperience />
        </CheckoutProvider>
      )}

      <p className={styles.billingNote}>Billed discreetly as LRARE. Untie will not appear on your statement.</p>
      <p className={styles.securityNote}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="3" y="7" width="10" height="7" />
          <path d="M5 7V5a3 3 0 016 0v2" />
        </svg>
        Secure payment via Stripe. Card is enabled by default, with Apple Pay and Google Pay shown when available.
      </p>
    </div>
  );
}

function CheckoutExperience() {
  const router = useRouter();
  const checkoutState = useCheckout();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmCheckout = async (expressEvent?: StripeExpressCheckoutElementConfirmEvent) => {
    if (checkoutState.type !== "success" || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const confirmResult = await checkoutState.checkout.confirm(
      expressEvent
        ? {
            expressCheckoutConfirmEvent: expressEvent,
            redirect: "if_required",
          }
        : {
            redirect: "if_required",
          }
    );

    if (confirmResult.type === "error") {
      setSubmitting(false);
      setError(confirmResult.error.message ?? "Unable to confirm payment. Please review your details and try again.");
      return;
    }

    router.push("/signup/payment/success");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await confirmCheckout();
  };

  const onExpressConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    await confirmCheckout(event);
  };

  if (checkoutState.type === "loading") {
    return (
      <div className={styles.checkoutPanel}>
        <p className={styles.statusMessage}>Loading secure checkout...</p>
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <div className={styles.checkoutPanel}>
        <p className={styles.inlineError}>{checkoutState.error.message}</p>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPanel}>
      <section className={styles.walletPanel}>
        <p className={styles.walletTitle}>Fast checkout</p>
        <ExpressCheckoutElement onConfirm={onExpressConfirm} />
      </section>

      <div className={styles.checkoutDivider}>
        <span>or pay by card</span>
      </div>

      <form className={styles.cardForm} onSubmit={onSubmit}>
        <div className={styles.cardElementPanel}>
          <PaymentElement />
        </div>
        <button type="submit" className={`${styles.primaryButton} ${submitting ? styles.loading : ""}`.trim()} disabled={submitting}>
          {submitting ? "Finalizing payment..." : "Pay £449"}
        </button>
      </form>

      {error ? <p className={styles.inlineError}>{error}</p> : null}
    </div>
  );
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown webhook signature error";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  // Use service role to update DB
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

    if (userId) {
      await supabaseAdmin.from("user_billing").upsert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        plan: session.mode === "subscription" ? "sub" : "one_time",
        status: "active",
        updated_at: new Date().toISOString(),
      });
    }
  }

  // (If subscription) also handle invoice.paid, customer.subscription.updated, etc.

  return NextResponse.json({ received: true });
}

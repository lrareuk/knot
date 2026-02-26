import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { isPaidCheckoutSession } from "@/lib/server/stripe-checkout";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { error: idempotencyError } = await admin.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
  });

  if (idempotencyError?.code === "23505") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (idempotencyError) {
    return NextResponse.json({ error: "Unable to process event" }, { status: 500 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id ?? session.metadata?.user_id ?? session.client_reference_id;

    if (!isPaidCheckoutSession(session)) {
      return NextResponse.json({ received: true, ignored: "session_not_paid" });
    }

    if (userId) {
      await admin.from("users").upsert(
        {
          id: userId,
          email: session.customer_details?.email ?? "",
          paid: true,
          stripe_session: session.id,
        },
        { onConflict: "id", ignoreDuplicates: false }
      );
    }
  }

  return NextResponse.json({ received: true });
}

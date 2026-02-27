import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { buildStripeCheckoutSessionParams, getStripeCheckoutDisplayAmount, mapStripeCheckoutRouteError } from "@/lib/server/stripe-checkout";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  const { data: profile } = await supabase
    .from("users")
    .select("paid")
    .eq("id", user.id)
    .maybeSingle<{ paid: boolean }>();

  if (profile?.paid) {
    return NextResponse.json({ error: "Payment already completed" }, { status: 409 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return NextResponse.json({ error: "Missing Stripe configuration" }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.create(
      buildStripeCheckoutSessionParams({
        siteUrl,
        userId: user.id,
        email: user.email,
        priceId: process.env.STRIPE_PRICE_ID,
      })
    );

    if (!session.client_secret) {
      return NextResponse.json({ error: "Unable to initialize checkout right now." }, { status: 500 });
    }

    await supabase
      .from("users")
      .update({ stripe_session: session.id })
      .eq("id", user.id);

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      display: getStripeCheckoutDisplayAmount(session),
    });
  } catch (error) {
    const mappedError = mapStripeCheckoutRouteError(error);
    return NextResponse.json({ error: mappedError.message }, { status: mappedError.status });
  }
}

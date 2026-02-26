import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!siteUrl || !priceId) {
    return NextResponse.json({ error: "Missing Stripe configuration" }, { status: 500 });
  }

  const { data: billing } = await supabase
    .from("user_billing")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  let customerId = billing?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase.from("user_billing").upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "inactive",
      },
      { onConflict: "user_id", ignoreDuplicates: false }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/onboarding?checkout=success`,
    cancel_url: `${siteUrl}/payment?checkout=cancel`,
    metadata: { supabase_user_id: user.id },
  });

  await supabase
    .from("users")
    .update({ stripe_session: session.id })
    .eq("id", user.id);

  return NextResponse.json({ url: session.url });
}

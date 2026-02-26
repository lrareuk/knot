import { redirect } from "next/navigation";
import CheckoutButton from "@/app/components/dashboard/CheckoutButton";
import { getAuthContext } from "@/lib/server/auth";

export default async function PaymentPage() {
  const { user, profile } = await getAuthContext();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.paid && profile.onboarding_done) {
    redirect("/dashboard");
  }

  if (profile.paid) {
    redirect("/onboarding");
  }

  return (
    <main className="page-shell narrow">
      <section className="panel stack-md">
        <h1>Payment required</h1>
        <p className="muted">
          Untie is a one-time payment of £449. Billing descriptor is <strong>LRARE</strong>.
        </p>
        <CheckoutButton />
      </section>
    </main>
  );
}

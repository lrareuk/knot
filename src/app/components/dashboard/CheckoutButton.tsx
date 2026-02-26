"use client";

import { useRouter } from "next/navigation";

export default function CheckoutButton() {
  const router = useRouter();

  return (
    <div className="stack-sm">
      <button type="button" onClick={() => router.push("/signup/payment")} className="btn-primary">
        Continue to secure payment
      </button>
    </div>
  );
}

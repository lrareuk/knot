import { redirect } from "next/navigation";

export default async function LegacyPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolved)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry));
      continue;
    }
    if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const suffix = query.toString();
  redirect(suffix ? `/signup/payment?${suffix}` : "/signup/payment");
}

import { NextResponse } from "next/server";
import { requireApiUser, serverError } from "@/lib/server/api";

export async function POST() {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  if (context.profile?.has_relevant_agreements === null) {
    return NextResponse.json({ error: "Agreement disclosure is required before completing onboarding" }, { status: 400 });
  }

  const { error } = await context.supabase
    .from("users")
    .update({ onboarding_done: true })
    .eq("id", context.user.id);

  if (error) {
    return serverError("Unable to complete onboarding");
  }

  return NextResponse.json({ ok: true });
}

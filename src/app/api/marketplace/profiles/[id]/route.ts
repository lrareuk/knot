import { NextResponse } from "next/server";
import { requirePaidApiUser, serverError } from "@/lib/server/api";
import { getVisibleMarketplaceProfileById } from "@/lib/server/marketplace-profiles";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requirePaidApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;
  const { profile, error } = await getVisibleMarketplaceProfileById(context.supabase, id);

  if (error) {
    return serverError("Unable to load marketplace profile");
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

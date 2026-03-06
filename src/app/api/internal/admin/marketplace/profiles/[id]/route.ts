import { NextResponse } from "next/server";
import { badRequest, unauthorized } from "@/lib/server/api";
import { marketplaceProfileAdminPatchSchema } from "@/lib/marketplace/schemas";
import { isMarketplaceAdminEmail } from "@/lib/server/marketplace-admin";
import { adminPatchMarketplaceProfile } from "@/lib/server/marketplace-profiles";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email?.trim().toLowerCase();
  if (!userEmail || !isMarketplaceAdminEmail(userEmail)) {
    return unauthorized();
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = marketplaceProfileAdminPatchSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid admin profile patch");
  }

  const { id } = await params;
  const { profile, error } = await adminPatchMarketplaceProfile(supabaseAdmin(), id, parsed.data);

  if (error || !profile) {
    return NextResponse.json({ error: "Unable to update marketplace profile" }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

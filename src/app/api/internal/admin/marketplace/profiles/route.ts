import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { unauthorized } from "@/lib/server/api";
import { isMarketplaceAdminEmail } from "@/lib/server/marketplace-admin";
import { adminListMarketplaceProfiles } from "@/lib/server/marketplace-profiles";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email?.trim().toLowerCase();
  if (!userEmail || !isMarketplaceAdminEmail(userEmail)) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const { profiles, error } = await adminListMarketplaceProfiles(supabaseAdmin(), status);
  if (error) {
    return NextResponse.json({ error: "Unable to list marketplace profiles" }, { status: 500 });
  }

  return NextResponse.json({ profiles });
}

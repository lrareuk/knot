import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { ensureAndFetchUserProfile } from "@/lib/server/user-profile";

export async function requireApiUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const profile = await ensureAndFetchUserProfile(supabase, user);
  if (!profile || profile.account_state !== "active") {
    return {
      supabase,
      user: null,
      profile: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    supabase,
    user,
    profile,
    response: null,
  };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message = "Server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

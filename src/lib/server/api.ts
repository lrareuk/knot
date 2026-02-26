import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function requireApiUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  return {
    supabase,
    user,
    response: null,
  };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message = "Server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

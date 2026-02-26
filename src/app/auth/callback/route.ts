import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function normalizeNextPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function loginErrorRedirect(req: NextRequest, code: string) {
  const destination = new URL("/login", req.nextUrl.origin);
  destination.searchParams.set("error", code);
  return NextResponse.redirect(destination);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return loginErrorRedirect(req, "invalid_link");
  }

  const typeParam = req.nextUrl.searchParams.get("type");
  const fallbackNext = typeParam === "recovery" ? "/login/reset?mode=update" : "/start";
  const nextPath = normalizeNextPath(req.nextUrl.searchParams.get("next"), fallbackNext);
  const destination = new URL(nextPath, req.nextUrl.origin);
  const response = NextResponse.redirect(destination);

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return loginErrorRedirect(req, "invalid_or_expired_link");
  }

  return response;
}

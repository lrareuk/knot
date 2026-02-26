import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

function isOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && OTP_TYPES.includes(value as EmailOtpType));
}

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
  const tokenHash = req.nextUrl.searchParams.get("token_hash");
  const typeParam = req.nextUrl.searchParams.get("type");

  if (!tokenHash || !isOtpType(typeParam)) {
    return loginErrorRedirect(req, "invalid_link");
  }

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

  const { error } = await supabase.auth.verifyOtp({
    type: typeParam,
    token_hash: tokenHash,
  });

  if (error) {
    return loginErrorRedirect(req, "invalid_or_expired_link");
  }

  return response;
}

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
  const code = req.nextUrl.searchParams.get("code");
  const tokenHash = req.nextUrl.searchParams.get("token_hash") ?? req.nextUrl.searchParams.get("token");
  const typeParam = req.nextUrl.searchParams.get("type");

  if (!code && (!tokenHash || !isOtpType(typeParam))) {
    return loginErrorRedirect(req, "invalid_link");
  }

  const resolvedType = isOtpType(typeParam) ? typeParam : null;
  const fallbackNext = resolvedType === "recovery" ? "/login/reset?mode=update" : "/start";
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return loginErrorRedirect(req, "invalid_or_expired_link");
    }
    return response;
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash!,
    type: resolvedType!,
  });

  if (error) {
    return loginErrorRedirect(req, "invalid_or_expired_link");
  }

  return response;
}

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { deserializeSignupState, SIGNUP_STATE_COOKIE } from "@/lib/auth/signup-state";
import { resolveAccessRedirect } from "@/lib/server/access-guard";
import { ensureAndFetchUserProfile } from "@/lib/server/user-profile";

const PUBLIC_PATHS = new Set(["/", "/legal", "/login", "/login/reset", "/signup", "/signup/email"]);

function isStaticPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".webp")
  );
}

function isAuthOnlyPath(pathname: string) {
  return (
    pathname.startsWith("/settings") ||
    pathname.startsWith("/signup/payment") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/recovery-key") ||
    pathname.startsWith("/admin")
  );
}

function redirectTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

function redirectToLegalDoc(req: NextRequest, doc: "privacy" | "terms") {
  const url = req.nextUrl.clone();
  url.pathname = "/legal";
  url.searchParams.set("doc", doc);
  return NextResponse.redirect(url, 308);
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const hasCodeParam = req.nextUrl.searchParams.has("code");
  const isPasswordRecoveryUpdatePath = pathname === "/login/reset" && req.nextUrl.searchParams.get("mode") === "update";

  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  // Legacy confirmation/recovery links can still land on "/?code=...".
  // Handle them server-side so auth doesn't depend on homepage client hydration.
  if (pathname === "/" && hasCodeParam) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Password recovery links intentionally sign the user in temporarily.
  // Skip normal onboarding/paywall routing so they can set a new password.
  if (isPasswordRecoveryUpdatePath) {
    return NextResponse.next();
  }

  if (pathname === "/sign-in") {
    return redirectTo(req, "/login");
  }

  if (pathname === "/sign-up") {
    return redirectTo(req, "/signup");
  }

  if (pathname === "/payment") {
    return redirectTo(req, "/signup/payment");
  }

  if (pathname === "/privacy") {
    return redirectToLegalDoc(req, "privacy");
  }

  if (pathname === "/terms") {
    return redirectToLegalDoc(req, "terms");
  }

  if (pathname === "/onboarding/key-dates") {
    return redirectTo(req, "/onboarding/dates");
  }

  if (pathname === "/onboarding/savings-investments") {
    return redirectTo(req, "/onboarding/savings");
  }

  if (pathname === "/onboarding/dependants-expenditure") {
    return redirectTo(req, "/onboarding/dependants");
  }

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace("/app", "/dashboard") || "/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/api/webhooks/stripe") || pathname.startsWith("/api/stripe/webhook")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isApi = pathname.startsWith("/api");
  const hasSignupName = Boolean(deserializeSignupState(req.cookies.get(SIGNUP_STATE_COOKIE)?.value)?.firstName);

  if (!user) {
    const redirectPath = resolveAccessRedirect({
      pathname,
      isAuthenticated: false,
      paid: false,
      onboardingDone: false,
      accountState: "active",
      recoveryKeyRequired: false,
      hasSignupName,
    });

    if (redirectPath) {
      const url = req.nextUrl.clone();
      url.pathname = redirectPath;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const profile = await ensureAndFetchUserProfile(supabase, user);
  if (!profile) {
    return redirectTo(req, "/login");
  }
  const paid = profile.paid;
  const onboardingDone = profile.onboarding_done;
  const accountState = profile.account_state;
  const recoveryKeyRequired = profile.recovery_key_required;

  const redirectPath = resolveAccessRedirect({
    pathname,
    isAuthenticated: true,
    paid,
    onboardingDone,
    accountState,
    recoveryKeyRequired,
    hasSignupName,
  });

  if (redirectPath) {
    return redirectTo(req, redirectPath);
  }

  if (isApi) {
    return res;
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return res;
  }

  if (isAuthOnlyPath(pathname)) {
    return res;
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

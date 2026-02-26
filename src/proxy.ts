import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { deserializeSignupFirstName, SIGNUP_STATE_COOKIE } from "@/lib/auth/signup-state";
import { resolveAccessRedirect } from "@/lib/server/access-guard";

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
    pathname.startsWith("/dashboard")
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

  if (isStaticPath(pathname)) {
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

  if (pathname === "/onboarding/dates") {
    return redirectTo(req, "/onboarding/key-dates");
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
  const hasSignupName = Boolean(deserializeSignupFirstName(req.cookies.get(SIGNUP_STATE_COOKIE)?.value));

  if (!user) {
    const redirectPath = resolveAccessRedirect({
      pathname,
      isAuthenticated: false,
      paid: false,
      onboardingDone: false,
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

  const metadataFirstName =
    typeof user.user_metadata?.first_name === "string" && user.user_metadata.first_name.trim()
      ? user.user_metadata.first_name.trim()
      : null;

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      ...(metadataFirstName ? { first_name: metadataFirstName } : {}),
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  const { data: profile } = await supabase
    .from("users")
    .select("paid,onboarding_done")
    .eq("id", user.id)
    .single<{ paid: boolean; onboarding_done: boolean }>();

  const paid = profile?.paid ?? false;
  const onboardingDone = profile?.onboarding_done ?? false;

  const redirectPath = resolveAccessRedirect({
    pathname,
    isAuthenticated: true,
    paid,
    onboardingDone,
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

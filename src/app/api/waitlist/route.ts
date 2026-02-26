import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const REGION_OPTIONS = ["UK", "Ireland", "US/Canada", "EU", "Other"] as const;
const STAGE_OPTIONS = ["Exploring", "Planning", "In progress", "Prefer not to say"] as const;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __waitlistRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalForRateLimit.__waitlistRateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalForRateLimit.__waitlistRateLimitStore) {
  globalForRateLimit.__waitlistRateLimitStore = rateLimitStore;
}

const stageSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.enum(STAGE_OPTIONS).optional()
);

const regionSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.enum(REGION_OPTIONS).optional()
);

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  stage: stageSchema,
  region: regionSchema,
  honey: z.preprocess((value) => (typeof value === "string" ? value.trim() : ""), z.string()),
});

const successPayload = {
  ok: true,
  message: "You're on the shortlist.",
};

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  const existingEntry = rateLimitStore.get(ip);

  if (!existingEntry) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (existingEntry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  existingEntry.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Too many requests. Please wait a minute and try again.",
      },
      { status: 429 }
    );
  }

  let rawPayload: unknown;

  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid request payload.",
      },
      { status: 400 }
    );
  }

  const parsed = waitlistSchema.safeParse(rawPayload);

  if (!parsed.success) {
    const hasEmailIssue = parsed.error.issues.some((issue) => issue.path[0] === "email");

    return NextResponse.json(
      {
        ok: false,
        message: hasEmailIssue
          ? "Please enter a valid email address."
          : "Please check your entries and try again.",
      },
      { status: 400 }
    );
  }

  const { email, stage, region, honey } = parsed.data;

  if (honey) {
    return NextResponse.json(successPayload, { status: 200 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase environment variables for /api/waitlist.");

    return NextResponse.json(
      {
        ok: false,
        message: "We couldn't process your request right now. Please try again shortly.",
      },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabaseAdmin.from("waitlist_signups").insert({
    email,
    stage: stage ?? null,
    region: region ?? null,
    source: "landing_page",
  });

  if (error && error.code !== "23505") {
    console.error("Failed to insert waitlist signup:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "We couldn't process your request right now. Please try again shortly.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(successPayload, { status: 200 });
}

import { NextResponse } from "next/server";
import {
  SIGNUP_STATE_COOKIE,
  normalizeSignupState,
  serializeSignupState,
} from "@/lib/auth/signup-state";
import { isSupportedJurisdiction } from "@/lib/legal/jurisdictions";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { firstName?: string; jurisdiction?: string } | null;
  const state = normalizeSignupState(payload);

  if (!state) {
    return NextResponse.json({ error: "Invalid signup details" }, { status: 400 });
  }

  if (!isSupportedJurisdiction(state.jurisdiction)) {
    return NextResponse.json({ error: "Invalid jurisdiction" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SIGNUP_STATE_COOKIE,
    value: serializeSignupState(state),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SIGNUP_STATE_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

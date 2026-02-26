import { NextResponse } from "next/server";
import {
  SIGNUP_STATE_COOKIE,
  normalizeSignupFirstName,
  serializeSignupFirstName,
} from "@/lib/auth/signup-state";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { firstName?: string } | null;
  const firstName = normalizeSignupFirstName(payload?.firstName);

  if (!firstName) {
    return NextResponse.json({ error: "Invalid first name" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SIGNUP_STATE_COOKIE,
    value: serializeSignupFirstName(firstName),
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


import { cookies } from "next/headers";
import { SIGNUP_STATE_COOKIE, deserializeSignupState } from "@/lib/auth/signup-state";

export async function readSignupStateCookie() {
  const cookieStore = await cookies();
  return deserializeSignupState(cookieStore.get(SIGNUP_STATE_COOKIE)?.value);
}

export async function readSignupFirstNameCookie() {
  const state = await readSignupStateCookie();
  return state?.firstName ?? null;
}
